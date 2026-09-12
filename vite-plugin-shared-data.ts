import fs from "node:fs";
import path from "node:path";
import type { Connect, Plugin, PreviewServer, ViteDevServer } from "vite";

const DATA_FILE = path.resolve(process.cwd(), "data", "app-data.json");

function sendJson(res: Connect.ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function readSharedFile(): { exists: boolean; data: unknown } {
  if (!fs.existsSync(DATA_FILE)) return { exists: false, data: null };
  try {
    return { exists: true, data: JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
  } catch {
    return { exists: false, data: null };
  }
}

function attachSharedDataApi(server: ViteDevServer | PreviewServer) {
  server.middlewares.use("/api/app-data", (req, res, next) => {
    if (req.method === "GET") {
      sendJson(res, 200, readSharedFile());
      return;
    }

    if (req.method === "PUT") {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      req.on("end", () => {
        try {
          const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
          fs.writeFileSync(DATA_FILE, JSON.stringify(parsed));
          res.statusCode = 204;
          res.end();
        } catch {
          sendJson(res, 400, { error: "invalid_json" });
        }
      });
      return;
    }

    if (req.method === "DELETE") {
      if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE);
      res.statusCode = 204;
      res.end();
      return;
    }

    next();
  });
}

export function sharedDataPlugin(): Plugin {
  return {
    name: "dersplus-shared-data",
    configureServer(server) {
      attachSharedDataApi(server);
    },
    configurePreviewServer(server) {
      attachSharedDataApi(server);
    },
  };
}
