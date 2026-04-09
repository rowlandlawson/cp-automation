import { createServer } from "node:http";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { cwd, exit } from "node:process";

const rootDir = cwd();
const host = process.env.PLAYWRIGHT_WEB_HOST || "127.0.0.1";
const port = Number(process.env.PLAYWRIGHT_WEB_PORT || 4173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

// Mirror key Vercel rewrites so local Playwright runs can catch route-regression issues.
const rewriteTargets = new Map([
  ["/about", path.join("about", "index.html")],
  ["/contact", "index.html"],
  ["/custom", "index.html"],
  ["/home", "index.html"],
  ["/products", "index.html"],
  ["/projects", path.join("projects", "index.html")],
  ["/services", "index.html"],
  ["/testimonials", "index.html"],
  ["/admin", path.join("admin", "index.html")],
]);

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function safeResolve(relativePath) {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolutePath = path.resolve(rootDir, normalized);
  const relativeFromRoot = path.relative(rootDir, absolutePath);

  if (relativeFromRoot.startsWith("..") || path.isAbsolute(relativeFromRoot)) {
    return null;
  }

  return absolutePath;
}

async function resolveFilePath(requestPath) {
  const pathname = decodeURIComponent(new URL(requestPath, "http://localhost").pathname);
  const candidatePaths = [];

  if (pathname === "/") {
    candidatePaths.push("index.html");
  } else if (rewriteTargets.has(pathname)) {
    candidatePaths.push(rewriteTargets.get(pathname));
  } else {
    const trimmed = pathname.replace(/^\/+/, "");
    candidatePaths.push(trimmed);

    if (!path.extname(trimmed)) {
      candidatePaths.push(`${trimmed}.html`);
      candidatePaths.push(path.join(trimmed, "index.html"));
    }
  }

  for (const candidate of candidatePaths) {
    const resolved = safeResolve(candidate);
    if (resolved && (await exists(resolved))) {
      return resolved;
    }
  }

  return null;
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    send(res, 400, "Bad Request");
    return;
  }

  const filePath = await resolveFilePath(req.url);
  if (!filePath) {
    send(res, 404, "Not Found");
    return;
  }

  try {
    const file = await readFile(filePath);
    const contentType =
      mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";

    send(res, 200, file, {
      "Content-Type": contentType,
    });
  } catch (error) {
    send(
      res,
      500,
      `Unable to read ${path.relative(rootDir, filePath)}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { "Content-Type": "text/plain; charset=utf-8" },
    );
  }
});

server.listen(port, host, () => {
  console.log(`[playwright-static] serving ${rootDir} at http://${host}:${port}`);
});

const shutdown = () => {
  server.close(() => {
    exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
