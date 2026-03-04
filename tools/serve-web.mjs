import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { promises as fs } from "node:fs";
import path from "node:path";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function parsePortValue(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return null;
  }
  return parsed;
}

function parseArgs(argv) {
  const envHost = process.env.HOST?.trim();
  const envPort = process.env.PORT ? parsePortValue(process.env.PORT) : null;
  const envRoot = process.env.WEB_ROOT?.trim();
  const args = {
    host: envHost || "127.0.0.1",
    port: envPort || 8080,
    root: envRoot ? path.resolve(envRoot) : process.cwd()
  };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key === "--host" && next) {
      args.host = String(next);
      i += 1;
    } else if (key === "--port" && next) {
      const parsed = parsePortValue(next);
      if (parsed) {
        args.port = parsed;
      }
      i += 1;
    } else if (key === "--root" && next) {
      args.root = path.resolve(String(next));
      i += 1;
    }
  }
  return args;
}

function resolveSafePath(rootDir, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0] || "/");
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const requested = path.resolve(rootDir, relative);
  const normalizedRoot = path.resolve(rootDir) + path.sep;
  if (requested !== path.resolve(rootDir) && !requested.startsWith(normalizedRoot)) {
    return null;
  }
  return requested;
}

function getMime(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function listLocalIps() {
  const nets = networkInterfaces();
  const ips = [];
  for (const key of Object.keys(nets)) {
    const entries = nets[key] || [];
    for (const entry of entries) {
      if (entry.family === "IPv4" && !entry.internal) {
        ips.push(entry.address);
      }
    }
  }
  return Array.from(new Set(ips));
}

const { host, port, root } = parseArgs(process.argv.slice(2));

const server = createServer(async (req, res) => {
  try {
    const method = req.method || "GET";
    if (method !== "GET" && method !== "HEAD") {
      res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Method Not Allowed");
      return;
    }

    const safePath = resolveSafePath(root, req.url || "/");
    if (!safePath) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    let targetPath = safePath;
    const stat = await fs.stat(targetPath).catch(() => null);
    if (stat?.isDirectory()) {
      targetPath = path.join(targetPath, "index.html");
    }

    const data = await fs.readFile(targetPath);
    const headers = {
      "Content-Type": getMime(targetPath)
    };
    if (path.basename(targetPath) === "service-worker.js") {
      headers["Cache-Control"] = "no-store";
    }

    res.writeHead(200, headers);
    if (method === "HEAD") {
      res.end();
      return;
    }
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
});

server.listen(port, host, () => {
  const localUrl = `http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`;
  console.log(`FishOps install server running from: ${root}`);
  console.log(`Local: ${localUrl}`);
  if (host === "0.0.0.0") {
    const ips = listLocalIps();
    for (const ip of ips) {
      console.log(`LAN:   http://${ip}:${port}`);
    }
  }
});
