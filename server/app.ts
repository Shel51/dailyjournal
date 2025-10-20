// server/app.ts
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // static uploads
  app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

  // basic API logging (kept from your original)
  app.use((req, res, next) => {
    const start = Date.now();
    const routePath = req.path;
    let captured: Record<string, any> | undefined;

    const origJson = res.json.bind(res);
    // @ts-ignore
    res.json = (body: any, ...args: any[]) => {
      captured = body;
      // @ts-ignore
      return origJson(body, ...args);
    };

    res.on("finish", () => {
      if (routePath.startsWith("/api")) {
        const duration = Date.now() - start;
        let line = `${req.method} ${routePath} ${res.statusCode} in ${duration}ms`;
        if (captured) line += ` :: ${JSON.stringify(captured)}`;
        if (line.length > 80) line = line.slice(0, 79) + "…";
        log(line);
      }
    });

    next();
  });

  // register routes (your code)
  const server = await registerRoutes(app);

  // error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Error handler caught:", err);
    res.status(status).json({ message });
  });

  // Vite in dev / static in prod
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // IMPORTANT: no app.listen() in serverless
  return app;
}
