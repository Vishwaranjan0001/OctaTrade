// Static server for this folder + a same-origin proxy to the original OctaTrade backend.
// The backend (OctaTrade/server, port 3000) has no CORS, so the browser must call it
// through this origin. Nothing in the original project is changed.
//   node server.mjs            -> http://localhost:8787
//   PORT=8787 API=http://localhost:3000 node server.mjs
import http from "node:http";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const API = new URL(process.env.API || "http://localhost:3000");

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".mp4": "video/mp4", ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

function isProxied(url) {
  return url.startsWith("/api/") || url.startsWith("/socket.io/") || url === "/health";
}

function proxy(req, res) {
  const upstream = http.request({
    host: API.hostname, port: API.port, method: req.method, path: req.url,
    headers: { ...req.headers, host: API.host }
  }, (up) => {
    res.writeHead(up.statusCode, up.headers);
    up.pipe(res);
  });
  upstream.on("error", () => {
    if (!res.headersSent) res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: "OctaTrade backend is not running on " + API.origin }));
  });
  req.pipe(upstream);
}

function serveStatic(req, res) {
  let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT) || file.includes(path.sep + ".claude")) {
    res.writeHead(403); return res.end();
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end("Not found"); }
    const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
    const cache = /\/frames\//.test(rel) ? "public, max-age=86400" : "no-cache";
    res.writeHead(200, { "content-type": type, "content-length": st.size, "cache-control": cache });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (isProxied(req.url)) return proxy(req, res);
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
  serveStatic(req, res);
});

// WebSocket upgrade for socket.io (realtime order updates)
server.on("upgrade", (req, socket, head) => {
  if (!req.url.startsWith("/socket.io/")) return socket.destroy();
  const up = net.connect(Number(API.port), API.hostname, () => {
    const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const k = req.rawHeaders[i];
      lines.push(`${k}: ${k.toLowerCase() === "host" ? API.host : req.rawHeaders[i + 1]}`);
    }
    up.write(lines.join("\r\n") + "\r\n\r\n");
    if (head && head.length) up.write(head);
    up.pipe(socket); socket.pipe(up);
  });
  up.on("error", () => socket.destroy());
  socket.on("error", () => up.destroy());
});

server.listen(PORT, () => {
  console.log(`OctaTrade film site on http://localhost:${PORT} (API -> ${API.origin})`);
});
