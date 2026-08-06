import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const root = join(process.cwd(), "public");
const port = Number(process.env.PORT || 4174);
const host = "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webp": "image/webp"
};

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const safePath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]/, "");
  let filePath = join(root, safePath === "" ? "index.html" : safePath);

  try {
    if (!existsSync(filePath) && !extname(filePath)) {
      const htmlPath = `${filePath}.html`;
      if (existsSync(htmlPath)) {
        filePath = htmlPath;
      }
    }

    if (existsSync(filePath) && (await stat(filePath)).isDirectory()) {
      filePath = join(filePath, "index.html");
    }

    if (!existsSync(filePath)) {
      filePath = join(root, "index.html");
    }

    response.writeHead(200, {
      "Content-Type": types[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Internal Server Error");
  }
}).listen(port, host, () => {
  console.log(`소소타임 dev server: http://${host}:${port}`);
});
