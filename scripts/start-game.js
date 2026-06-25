const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { ROOT, createDiskCharacter, writeGeneratedCharacters } = require("./character-tools");

const HOST = "127.0.0.1";
const PORT = 8765;
const MAX_BODY_SIZE = 16 * 1024 * 1024;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error("Request too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function serveFile(request, response) {
  const url = new URL(request.url, `http://${HOST}:${PORT}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const file = path.resolve(ROOT, `.${pathname}`);
  if (file !== ROOT && !file.startsWith(`${ROOT}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  fs.stat(file, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    fs.createReadStream(file).pipe(response);
  });
}

writeGeneratedCharacters();

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/api/status") {
    sendJson(response, 200, { localCharacterService: true });
    return;
  }
  if (request.method === "POST" && request.url === "/api/characters") {
    try {
      const payload = JSON.parse(await readBody(request));
      const result = createDiskCharacter(payload);
      sendJson(response, 201, result);
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405);
    response.end("Method not allowed");
    return;
  }
  serveFile(request, response);
});

server.on("error", error => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
    console.error(`Open http://${HOST}:${PORT} or close the existing process and try again.`);
  } else {
    console.error(error.stack || error.message);
  }
  process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log(`Vocabulary Galgame is running at ${url}`);
  console.log("Close this window to stop the game server.");
  execFile("cmd.exe", ["/d", "/c", "start", "", url], { windowsHide: true }, error => {
    if (error) {
      console.log(`The browser could not be opened automatically. Open ${url} manually.`);
    }
  });
});
