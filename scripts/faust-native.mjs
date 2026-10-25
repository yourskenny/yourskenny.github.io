import http from "node:http";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { Transform } from "node:stream";

const COOKIE = "__Host-faust-native";
const PREFIX = "/dsh/";
const MAX_BODY = 300 * 1024 * 1024;
const BASE_HEADERS = { "cache-control": "no-store", "referrer-policy": "same-origin", "x-content-type-options": "nosniff" };
function cookie(req) {
  return (req.headers.cookie || "").split(";").map(s => s.trim()).find(s => s.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
}
function send(res, status, body, headers = {}) { res.writeHead(status, { ...BASE_HEADERS, ...headers }); res.end(body); }
function redirect(res, path, headers = {}) { send(res, 303, "", { location: path, ...headers }); }
function sessionCookie(value, seconds = 43200) { return `${COOKIE}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${seconds}`; }
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]); }

function loginPage(res, { message = "", csrf = "", active = false, status = 200 } = {}) {
  send(res, status, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>连接原生浮士德</title>
<style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f8f7f2;color:#252924;font:16px/1.8 system-ui,"Microsoft YaHei",sans-serif}main{max-width:440px;margin:12vh auto;padding:32px}small,a{color:#14594e}h1{font:36px Georgia,"Songti SC",serif;margin:18px 0}p{color:#666b63;font-size:14px}label{display:block;font-size:14px;margin-top:26px}input,button{font:inherit;border-radius:8px;width:100%;padding:12px;border:1px solid #d3d7cd}input{background:white;margin:8px 0 16px}button,.enter{background:#104b41;color:white;border:0;cursor:pointer;text-decoration:none;padding:13px 20px;border-radius:8px;display:block;text-align:center}.links{margin-top:24px;display:flex;justify-content:space-between;font-size:13px}a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid #968356;outline-offset:4px}.error{color:#a03f31}</style>
<main><small>FAUST / NATIVE DSH</small><h1>继续与浮士德对话。</h1><p>连接这台电脑上的原生 DSH，使用已有的人格、工具与会话。</p>${message ? `<p role="alert" class="error">${escapeHtml(message)}</p>` : ""}
${active ? `<a class="enter" href="/dsh/">进入原生 DSH ↗</a><form method="post" action="/dsh-access/logout"><input type="hidden" name="csrf" value="${csrf}"><button style="margin-top:16px;background:#666b63">退出远程登录</button></form>` : `<form method="post" action="/dsh-access/login"><input type="text" name="username" autocomplete="username" value="owner" hidden><label for="password">所有者口令</label><input id="password" type="password" name="password" autocomplete="current-password" required maxlength="512"><button>连接原生 DSH ↗</button></form>`}
<div class="links"><a href="https://yourskenny.top/">返回个人网站</a>${active ? "" : "<span>使用现有登录口令</span>"}</div><p>主机需保持在线。远程登录有效期最多12小时。</p></main></html>`, { "content-type": "text/html; charset=utf-8", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" });
}

async function limitedBody(req, limit) {
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > limit) throw new Error("body_limit"); chunks.push(chunk); }
  return Buffer.concat(chunks).toString("utf8");
}

export function createNativeAccess({ host, authTarget = "http://127.0.0.1:4320", target = "http://127.0.0.1:54002", launchFile = "D:/DSH/faust/data/native-web-launch.txt" }) {
  const origin = "https://" + host;
  const sessions = new Map();
  const sockets = new Set();
  const pending = new Set();
  const purge = id => { const s = sessions.get(id); if (!s) return; for (const close of s.streams) close(); sessions.delete(id); };
  function acceptedRequest(req) {
    return [host, "127.0.0.1:4322", "localhost:4322"].includes(req.headers.host) && ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);
  }
  async function authenticated(req) {
    const id = cookie(req), s = sessions.get(id);
    if (!s) return null;
    if (s.expires <= Date.now()) { purge(id); return null; }
    try {
      const r = await fetch(authTarget + "/v1/session", { headers: { Authorization: "Bearer " + s.bearer, Origin: origin }, signal: AbortSignal.timeout(7000), redirect: "error" });
      if (!r.ok) { purge(id); return null; }
      await r.body?.cancel();
      return { id, ...s };
    } catch { return null; }
  }
  async function nativeCookie() {
    const value = (await readFile(launchFile, "utf8")).trim().replace(/^\uFEFF/, "");
    const launch = new URL(value);
    const token = launch.searchParams.get("token");
    if (!token || !/^[A-Za-z0-9_-]{32,256}$/.test(token)) throw new Error("native_not_ready");
    // Never request a host taken from the credential file or return its URL to a client.
    const response = await new Promise((resolve, reject) => {
      const request = http.get(target + "/?token=" + encodeURIComponent(token), { headers: { Host: host } }, res => { res.resume(); resolve(res); });
      request.setTimeout(7000, () => request.destroy(new Error("timeout")));
      request.on("error", reject);
    });
    const header = response.headers["set-cookie"]?.find(h => h.startsWith("dsh-auth-"));
    if (response.statusCode !== 303 || !header) throw new Error("native_not_ready");
    return header.split(";")[0];
  }
  function isSameOrigin(req) { return req.headers.origin === origin && req.headers["sec-fetch-site"] !== "cross-site"; }
  function headers(req, s) {
    const result = { host, cookie: s.nativeCookie, "accept-encoding": "identity" };
    for (const key of ["accept", "content-type", "content-length", "origin", "sec-fetch-site", "sec-fetch-mode", "sec-fetch-dest", "range", "if-range", "if-none-match", "if-modified-since", "last-event-id", "upgrade", "connection", "sec-websocket-key", "sec-websocket-version", "sec-websocket-protocol", "sec-websocket-extensions"]) if (req.headers[key]) result[key] = req.headers[key];
    return result;
  }
  function admittedUrl(req) {
    const url = new URL(req.url, origin);
    if (url.origin !== origin || !url.pathname.startsWith(PREFIX) || /%2f|%5c|%00|\\/i.test(req.url)) return null;
    let decoded; try { decoded = decodeURIComponent(url.pathname); } catch { return null; }
    if (decoded.split("/").some(p => p === ".." || p === "." || p.includes("\0"))) return null;
    // Launch-token exchange stays strictly server side; API operator creation is not public.
    if (url.searchParams.has("token") || /^\/dsh\/connect(?:\/|$)/.test(url.pathname)) return null;
    return url;
  }
  async function handle(req, res, url) {
    if (!url.pathname.startsWith(PREFIX) && url.pathname !== "/dsh" && !url.pathname.startsWith("/dsh-access/")) return false;
    if (!acceptedRequest(req)) { send(res, 403, "Forbidden"); return true; }
    if (url.pathname === "/dsh") { redirect(res, PREFIX); return true; }
    if (url.pathname.startsWith("/dsh-access/")) {
      if (req.method === "GET" && url.pathname === "/dsh-access/") {
        const s = await authenticated(req); loginPage(res, { active: Boolean(s), csrf: s?.csrf }); return true;
      }
      if (req.method !== "POST" || !isSameOrigin(req) || req.headers["content-type"]?.split(";")[0] !== "application/x-www-form-urlencoded") { send(res, 403, "Forbidden"); return true; }
      let form; try { form = new URLSearchParams(await limitedBody(req, 4096)); } catch { send(res, 413, "Too large"); return true; }
      if (url.pathname === "/dsh-access/login") {
        const password = form.get("password");
        if (!password || password.length > 512) { loginPage(res, { message: "请输入有效口令。", status: 400 }); return true; }
        let auth;
        try {
          const r = await fetch(authTarget + "/auth/owner/login", { method: "POST", headers: { Origin: origin, "content-type": "application/json" }, body: JSON.stringify({ password }), signal: AbortSignal.timeout(10000), redirect: "error" });
          if (!r.ok) { loginPage(res, { message: r.status === 429 ? "尝试次数过多，请稍后重试。" : r.status === 401 ? "口令不正确。" : "登录服务暂不可用，请稍后重试。", status: r.status }); return true; }
          auth = await r.json();
          if (!auth.access_token || !auth.csrf_token || !Number.isFinite(Date.parse(auth.expires_at))) throw new Error("auth_invalid");
          const upstreamCookie = await nativeCookie();
          const id = randomBytes(32).toString("base64url");
          const previous = sessions.get(cookie(req));
          purge(cookie(req));
          if (previous) await revoke({ access_token: previous.bearer, csrf_token: previous.csrf }).catch(() => {});
          sessions.set(id, { bearer: auth.access_token, csrf: auth.csrf_token, nativeCookie: upstreamCookie, expires: Math.min(Date.parse(auth.expires_at), Date.now() + 43200000), streams: new Set() });
          redirect(res, PREFIX, { "set-cookie": sessionCookie(id) });
        } catch {
          if (auth?.access_token) await revoke(auth).catch(() => {});
          loginPage(res, { message: "原生 DSH 尚未就绪，请确认主机服务运行后重试。", status: 503 });
        }
        return true;
      }
      if (url.pathname === "/dsh-access/logout") {
        const s = await authenticated(req);
        if (!s || form.get("csrf") !== s.csrf) { send(res, 403, "Forbidden"); return true; }
        purge(s.id);
        await revoke({ access_token: s.bearer, csrf_token: s.csrf }).catch(() => {});
        redirect(res, "/dsh-access/", { "set-cookie": sessionCookie("", 0) }); return true;
      }
      send(res, 404, "Not found"); return true;
    }
    const path = admittedUrl(req);
    if (!path) { send(res, 404, "Not found"); return true; }
    if ((req.headers.origin && req.headers.origin !== origin) || req.headers["sec-fetch-site"] === "cross-site" && req.headers["sec-fetch-mode"] !== "navigate" || !["GET", "HEAD"].includes(req.method) && !isSameOrigin(req)) { send(res, 403, "Forbidden"); return true; }
    const s = await authenticated(req);
    if (!s) {
      if (req.method === "GET" && req.headers.accept?.includes("text/html")) redirect(res, "/dsh-access/");
      else send(res, 401, "Login required");
      return true;
    }
    proxy(req, res, path, s); return true;
  }
  async function revoke(auth) {
    const r = await fetch(authTarget + "/v1/logout", { method: "POST", headers: { Origin: origin, Authorization: "Bearer " + auth.access_token, "X-CSRF-Token": auth.csrf_token }, signal: AbortSignal.timeout(5000) });
    await r.body?.cancel();
  }
  function proxy(req, res, url, s) {
    if (Number(req.headers["content-length"] || 0) > MAX_BODY) { send(res, 413, "Too large"); return; }
    const upstream = http.request(target + url.pathname.slice(PREFIX.length - 1) + url.search, { method: req.method, headers: headers(req, s) }, response => {
      const outgoing = { ...BASE_HEADERS };
      for (const key of ["content-type", "content-disposition", "content-length", "content-range", "accept-ranges", "etag", "last-modified", "retry-after", "content-security-policy", "x-frame-options"]) if (response.headers[key]) outgoing[key] = response.headers[key];
      if (response.headers.location) {
        const location = response.headers.location;
        if (location.startsWith("/") && !location.startsWith("//")) outgoing.location = PREFIX.slice(0, -1) + location;
        else if (!/^(?:[a-z]+:|\/\/)/i.test(location)) outgoing.location = location;
      }
      res.writeHead(response.statusCode || 502, outgoing); response.pipe(res);
      response.on("error", () => res.destroy());
    });
    pending.add(upstream);
    upstream.on("close", () => pending.delete(upstream));
    upstream.setTimeout(650000, () => upstream.destroy());
    upstream.on("error", () => { if (!res.headersSent) send(res, 503, "Native DSH unavailable"); else res.destroy(); });
    let size = 0;
    const limiter = new Transform({ transform(chunk, encoding, callback) { size += chunk.length; if (size > MAX_BODY) { if (!res.headersSent) send(res, 413, "Too large"); upstream.destroy(); callback(new Error("body_limit")); } else callback(null, chunk); } });
    limiter.on("error", () => req.unpipe(limiter));
    const stop = () => { upstream.destroy(); res.destroy(); };
    s.streams.add(stop);
    const check = setInterval(() => { void authenticated(req).then(current => { if (!current) stop(); }); }, 15000); check.unref();
    res.on("close", () => { clearInterval(check); s.streams.delete(stop); upstream.destroy(); });
    req.on("aborted", () => upstream.destroy());
    req.pipe(limiter).pipe(upstream);
  }
  async function upgrade(req, socket, head) {
    const reject = code => { socket.end(`HTTP/1.1 ${code}\r\nConnection: close\r\n\r\n`); };
    if (!acceptedRequest(req) || !isSameOrigin(req)) return reject("403 Forbidden");
    const url = admittedUrl(req);
    if (!url || !url.pathname.startsWith("/dsh/api/") && url.pathname !== "/dsh/api") return reject("404 Not Found");
    const s = await authenticated(req); if (!s) return reject("401 Unauthorized");
    const upstream = http.request(target + url.pathname.slice(PREFIX.length - 1) + url.search, { headers: headers(req, s) });
    upstream.setTimeout(10000, () => upstream.destroy());
    upstream.on("upgrade", (response, remote, remoteHead) => {
      upstream.setTimeout(0);
      const lines = [`HTTP/1.1 ${response.statusCode} ${response.statusMessage}`];
      for (const key of ["upgrade", "connection", "sec-websocket-accept", "sec-websocket-protocol", "sec-websocket-extensions"]) if (response.headers[key]) lines.push(key + ": " + response.headers[key]);
      socket.write(lines.join("\r\n") + "\r\n\r\n");
      if (remoteHead.length) socket.write(remoteHead);
      if (head.length) remote.write(head);
      socket.pipe(remote).pipe(socket);
      const stop = () => { socket.destroy(); remote.destroy(); };
      s.streams.add(stop); sockets.add(socket);
      const check = setInterval(() => { void authenticated(req).then(current => { if (!current) stop(); }); }, 15000); check.unref();
      socket.on("close", () => { clearInterval(check); s.streams.delete(stop); sockets.delete(socket); remote.destroy(); });
      socket.on("error", stop); remote.on("error", stop); remote.on("close", () => socket.destroy());
    });
    upstream.on("response", response => { response.resume(); reject(response.statusCode === 401 ? "401 Unauthorized" : "502 Bad Gateway"); });
    upstream.on("error", () => reject("503 Service Unavailable")); upstream.end();
  }
  const cleanup = setInterval(() => { for (const [id,s] of sessions) if (s.expires <= Date.now()) purge(id); }, 60000); cleanup.unref();
  function close() { clearInterval(cleanup); for (const id of sessions.keys()) purge(id); for (const req of pending) req.destroy(); for (const socket of sockets) socket.destroy(); }
  return { handle, upgrade, close };
}
