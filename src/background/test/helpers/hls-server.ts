import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
};

export interface HlsServer {
  baseUrl: string;
  port: number;
  close: () => Promise<void>;
}

export function createHlsServer(fixturesDir: string): Promise<HlsServer> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = req.url ?? "/";
      const filePath = path.join(fixturesDir, urlPath);

      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath);
      const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

      res.writeHead(200, { "Content-Type": contentType });
      fs.createReadStream(filePath).pipe(res);
    });

    server.on("error", reject);

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Failed to get server address"));
        return;
      }
      const port = addr.port;
      const baseUrl = `http://127.0.0.1:${port}`;
      resolve({
        baseUrl,
        port,
        close: () =>
          new Promise<void>((res, rej) =>
            server.close((err) => (err ? rej(err) : res()))
          ),
      });
    });
  });
}
