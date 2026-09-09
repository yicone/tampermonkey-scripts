#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 17373;
const HOST = "127.0.0.1";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROBE = "/scripts/multi-model-answer/script.user.js";

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".js" || ext === ".mjs" || ext === ".user.js" || filePath.endsWith(".user.js")) {
    return "application/javascript; charset=utf-8";
  }
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".md") return "text/markdown; charset=utf-8";
  if (ext === ".html") return "text/html; charset=utf-8";
  return "application/octet-stream";
}

function resolveSafe(urlPath) {
  const decoded = decodeURIComponent((urlPath || "/").split("?")[0]);
  const rel = decoded.replace(/^\/+/, "");
  const abs = path.resolve(ROOT, rel);
  const relToRoot = path.relative(ROOT, abs);
  if (relToRoot.startsWith("..") || path.isAbsolute(relToRoot)) return null;
  return abs;
}

async function fileMatchesProbe() {
  const url = `http://${HOST}:${PORT}${PROBE}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const remote = await res.text();
    const local = await fs.readFile(path.join(ROOT, PROBE.slice(1)), "utf8");
    return remote === local;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  const abs = resolveSafe(req.url || "/");
  const noStore = {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
  };
  if (!abs) {
    res.writeHead(403, noStore);
    res.end("forbidden");
    return;
  }
  try {
    const st = await fs.stat(abs);
    if (!st.isFile()) {
      res.writeHead(404, noStore);
      res.end("not found");
      return;
    }
    const body = await fs.readFile(abs);
    res.writeHead(200, {
      ...noStore,
      "Content-Type": contentType(abs),
      "Content-Length": body.length,
    });
    res.end(body);
  } catch (err) {
    if (err && err.code === "ENOENT") {
      res.writeHead(404, noStore);
      res.end("not found");
      return;
    }
    res.writeHead(500, noStore);
    res.end("error");
  }
});

server.on("error", async (err) => {
  if (err && err.code === "EADDRINUSE") {
    const ours = await fileMatchesProbe();
    if (ours) {
      console.log(`reusing existing server http://${HOST}:${PORT} (repo root ${ROOT})`);
      process.exit(0);
    }
    console.error(`port ${PORT} is in use by something else; loader URL is fixed, refusing to bind another port`);
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`serving ${ROOT} at http://${HOST}:${PORT}`);
});
