import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { Transform } from "node:stream";

export const PUBLIC_HOST = "desktop-9v90afb.tail40a158.ts.net";
const MAX_BODY = 21 * 1024 * 1024;
const READ_PATHS = [
  /^\/health\/ready$/,
  /^\/v1\/(session|snapshot|events|models|capabilities|conversations|tasks)$/,
  /^\/v1\/attachments\/[A-Za-z0-9_-]{1,128}\/content$/,
  /^\/v1\/conversations\/[A-Za-z0-9_-]{1,128}\/messages$/,
  /^\/v1\/tasks\/[A-Za-z0-9_-]{1,128}(?:\/actions)?$/,
  /^\/auth\/methods$/,
];
const WRITE_PATHS = [
  /^\/v1\/(messages|logout|conversations)$/,
  /^\/v1\/attachments$/,
  /^\/v1\/conversations\/[A-Za-z0-9_-]{1,128}\/select$/,
  /^\/v1\/tasks\/[A-Za-z0-9_-]{1,128}\/commands$/,
  /^\/auth\/owner\/login$/,
];

export function publicRoute(method, path) {
  if (method === "GET") return READ_PATHS.some(r => r.test(path));
  if (method === "POST") return WRITE_PATHS.some(r => r.test(path));
  if (method === "OPTIONS") return READ_PATHS.some(r => r.test(path)) || WRITE_PATHS.some(r => r.test(path));
  return false;
}

export function publicFile(root, pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  if (decoded.includes("\\") || decoded.includes("\0") || decoded.split("/").some(p => p === ".." || p.startsWith("."))) return null;
  const target = resolve(root, "." + decoded, decoded.endsWith("/") ? "index.html" : "");
  return target.startsWith(resolve(root) + sep) ? target : null;
}

function json(res, code, data) {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
  res.end(JSON.stringify(data));
}

export function createGateway({ root = resolve("dist"), host = PUBLIC_HOST, target = "http://127.0.0.1:4320" } = {}) {
  return http.createServer((req, res) => {
    const address = req.socket.remoteAddress;
    if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address)) return json(res, 403, { error: { code: "loopback_required" } });
    const authority = req.headers.host || "";
    if (![host, "127.0.0.1:4322", "localhost:4322"].includes(authority)) return json(res, 421, { error: { code: "host_rejected" } });
    let url;
    try { url = new URL(req.url || "/", "https://" + host); } catch { return json(res, 400, { error: { code: "invalid_url" } }); }
    if (url.origin !== "https://" + host || /%2f|%5c|%00/i.test(url.pathname)) return json(res, 400, { error: { code: "invalid_path" } });
    if (req.method === "GET" && url.pathname === "/health/live") return json(res, 200, { status: "ok", service: "faust-web-gateway" });
    if (req.method === "GET" && url.pathname === "/faust/config.json") {
      return json(res, 200, { enabled: true, apiBase: "https://" + host, devLogin: false, authMode: "owner_password", label: "远程连接" });
    }
    // Public traffic never reaches bot callbacks, development login or management aliases.
    if (url.pathname.startsWith("/v1/") || url.pathname.startsWith("/auth/") || url.pathname === "/health/ready") {
      if (!publicRoute(req.method, url.pathname)) return json(res, 404, { error: { code: "route_unavailable" } });
      const size = Number(req.headers["content-length"] || 0);
      if (!Number.isFinite(size) || size < 0 || size > MAX_BODY) return json(res, 413, { error: { code: "body_too_large" } });
      const headers = { host: new URL(target).host, "accept-encoding": "identity",
        "x-forwarded-proto": "https", "x-forwarded-host": host };
      for (const key of ["accept", "content-type", "content-length", "authorization", "cookie", "origin", "x-csrf-token", "idempotency-key", "if-match", "access-control-request-method", "access-control-request-headers"]) {
        if (req.headers[key]) headers[key] = req.headers[key];
      }
      const upstream = http.request(target + url.pathname + url.search, { method: req.method, headers }, response => {
        const outgoing = { "cache-control": "no-store", "x-content-type-options": "nosniff" };
        for (const key of ["content-type", "set-cookie", "content-disposition", "retry-after", "x-request-id", "access-control-allow-origin", "access-control-allow-credentials", "access-control-allow-methods", "access-control-allow-headers", "access-control-expose-headers", "vary"]) {
          if (response.headers[key]) outgoing[key] = response.headers[key];
        }
        res.writeHead(response.statusCode || 502, outgoing);
        response.pipe(res);
        response.on("error", () => res.destroy());
      });
      upstream.setTimeout(url.pathname === "/v1/events" ? 650_000 : 90_000, () => upstream.destroy(new Error("timeout")));
      upstream.on("error", () => { if (!res.headersSent) json(res, 503, { error: { code: "service_offline", message: "浮士德服务暂时离线" } }); else res.destroy(); });
      let bytes = 0;
      const limiter = new Transform({ transform(chunk, encoding, callback) {
        bytes += chunk.length;
        if (bytes > MAX_BODY) {
          if (!res.headersSent) json(res, 413, { error: { code: "body_too_large" } });
          upstream.destroy(); callback(new Error("body_too_large"));
        } else callback(null, chunk);
      } });
      limiter.on("error", () => req.unpipe(limiter));
      req.on("aborted", () => upstream.destroy());
      res.on("close", () => upstream.destroy());
      req.pipe(limiter).pipe(upstream);
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) return json(res, 404, { error: { code: "route_unavailable" } });
    const file = publicFile(root, url.pathname);
    if (!file || !existsSync(file) || !statSync(file).isFile()) return json(res, 404, { error: { code: "not_found" } });
    const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".pdf": "application/pdf" };
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream", "cache-control": "no-cache", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" });
    if (req.method === "HEAD") res.end(); else createReadStream(file).on("error", () => res.destroy()).pipe(res);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
  if (!existsSync(resolve(root, "faust/index.html"))) throw new Error("Run npm run build before starting the gateway.");
  createGateway({ root }).listen(4322, "127.0.0.1", () => console.log("Faust gateway listening at 127.0.0.1:4322; public host " + PUBLIC_HOST));
}
