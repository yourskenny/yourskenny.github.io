import http from "node:http";

// Development only. The static website never gets a proxy or local-login endpoint.
const PREFIX = "/__faust";
const TARGET = "http://127.0.0.1:4320";
const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const ROUTES = [
  ["GET", /^\/health\/(live|ready)$/],
  ["GET", /^\/v1\/(session|snapshot|events|tasks|channel-bindings)$/],
  ["GET", /^\/v1\/(capabilities|models)$/],
  ["GET", /^\/v1\/attachments\/[a-zA-Z0-9_-]+\/content$/],
  ["GET", /^\/v1\/tasks\/[a-zA-Z0-9_-]+(?:\/actions)?$/],
  ["GET", /^\/v1\/conversations\/[a-zA-Z0-9_-]+\/messages$/],
  ["POST", /^\/v1\/(dev\/session|messages|logout|presence)$/],
  ["POST", /^\/v1\/attachments$/],
  ["POST", /^\/v1\/conversations$/],
  ["POST", /^\/v1\/conversations\/[a-zA-Z0-9_-]+\/select$/],
  ["POST", /^\/v1\/tasks\/[a-zA-Z0-9_-]+\/commands$/],
  ["GET", /^\/v1\/conversations$/],
];

export function previewAllowed({ address, host, origin, site, method }) {
  if (!LOOPBACK.has(address) || !/^(127\.0\.0\.1|localhost):\d+$/.test(host || "")) return false;
  if (origin && origin !== "http://" + host) return false;
  if (site && !["same-origin", "none"].includes(site)) return false;
  return ["GET", "HEAD"].includes(method) || origin === "http://" + host;
}

export function routeAllowed(method, path) {
  return ROUTES.some(([verb, pattern]) => verb === method && pattern.test(path));
}

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

export function faustPreview() {
  return {
    name: "faust-loopback-preview",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const incoming = new URL(req.url || "/", "http://preview.invalid");
        if (!incoming.pathname.startsWith(PREFIX + "/")) return next();
        if (!previewAllowed({ address: req.socket.remoteAddress, host: req.headers.host,
          origin: req.headers.origin, site: req.headers["sec-fetch-site"], method: req.method })) {
          return json(res, 403, { error: { code: "preview_origin_rejected", message: "此入口只接受本机同源预览请求。" } });
        }
        const path = incoming.pathname.slice(PREFIX.length);
        if (path === "/config" && req.method === "GET") {
          return json(res, 200, { enabled: true, apiBase: PREFIX, devLogin: true, label: "本机预览" });
        }
        if (!routeAllowed(req.method, path)) return json(res, 404, { error: { code: "preview_route_unavailable" } });
        // Only forward the handful of headers needed for this local adapter.
        const headers = { host: "127.0.0.1:4320", origin: TARGET, "accept-encoding": "identity" };
        for (const name of ["accept", "content-type", "cookie", "x-csrf-token", "idempotency-key"]) {
          if (req.headers[name]) headers[name] = req.headers[name];
        }
        if (req.headers["content-length"]) headers["content-length"] = req.headers["content-length"];
        const upstream = http.request(TARGET + path + incoming.search, { method: req.method, headers }, (response) => {
          const outgoing = { "cache-control": "no-store" };
          for (const key of ["content-type", "set-cookie", "x-request-id", "x-accel-buffering"]) {
            if (response.headers[key]) outgoing[key] = response.headers[key];
          }
          res.writeHead(response.statusCode || 502, outgoing);
          response.pipe(res);
          response.on("error", () => res.destroy());
        });
        upstream.setTimeout(20_000, () => upstream.destroy(new Error("Service timed out")));
        upstream.on("error", () => {
          if (!res.headersSent) json(res, 503, { error: { code: "service_offline", message: "本机浮士德服务暂时无法连接。" } });
          else res.destroy();
        });
        res.on("close", () => upstream.destroy());
        req.on("aborted", () => upstream.destroy());
        req.pipe(upstream);
      });
    },
  };
}
