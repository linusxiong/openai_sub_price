import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, normalize } from "node:path";
import { handleApiProxyRequest } from "./proxy.js";

const PORT = Number(process.env.PORT ?? 8787);
const DIST_DIR = join(process.cwd(), "dist");

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function getRequestUrl(request: IncomingMessage) {
  return new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
}

async function writeWebResponse(response: ServerResponse, webResponse: Response) {
  response.writeHead(
    webResponse.status,
    Object.fromEntries(webResponse.headers.entries())
  );
  if (!webResponse.body) {
    response.end();
    return;
  }

  const reader = webResponse.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      response.write(value);
    }
  } finally {
    response.end();
  }
}

function getStaticPath(pathname: string) {
  const decodedPath = decodeURIComponent(pathname);
  const normalizedPath = normalize(decodedPath).replace(/^(\.\.(\/|\\|$))+/, "");
  return join(DIST_DIR, normalizedPath === "/" ? "index.html" : normalizedPath);
}

async function serveStatic(request: IncomingMessage, response: ServerResponse) {
  const url = getRequestUrl(request);
  let filePath = getStaticPath(url.pathname);
  let fileStat = await stat(filePath).catch(() => null);

  if (fileStat?.isDirectory()) {
    filePath = join(filePath, "index.html");
    fileStat = await stat(filePath).catch(() => null);
  }

  if (!fileStat?.isFile()) {
    filePath = join(DIST_DIR, "index.html");
    fileStat = await stat(filePath).catch(() => null);
  }

  if (!fileStat?.isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Build output not found. Run npm run build first.");
    return;
  }

  const contentType =
    MIME_TYPES[extname(filePath)] ?? "application/octet-stream";
  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": filePath.endsWith("index.html")
      ? "no-cache"
      : "public, max-age=31536000, immutable",
  });
  createReadStream(filePath).pipe(response);
}

const server = createServer(async (request, response) => {
  try {
    const url = getRequestUrl(request);
    if (url.pathname.startsWith("/api/proxy")) {
      const webRequest = new Request(url, { method: request.method });
      const webResponse = await handleApiProxyRequest(webRequest);
      await writeWebResponse(response, webResponse);
      return;
    }

    await serveStatic(request, response);
  } catch {
    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Internal server error" }));
  }
});

server.listen(PORT, () => {
  console.log(`OpenAI subscription price server listening on :${PORT}`);
});
