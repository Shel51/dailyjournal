// api/index.js
import serverless from "serverless-http";
import express from "express";
import cors from "cors";

// ---- If you already have an Express app file (e.g., server.js or app.js) ----
// Prefer to import and reuse it. Example:
// import app from "../server.js"; // if that file `export default app;`
//
// If you *don’t* have a clean export yet, build the app right here:

const app = express();
app.use(cors());
app.use(express.json());

// Example public route to test quickly:
app.get("/api/ping", (req, res) => res.json({ ok: true }));

// ------------------
// TODO: Move your existing routes here.
// For example, if your old file had:
// app.get("/api/journals/:id", ...)
// app.post("/api/journals", ...)
// copy those route handlers right into this file (below).
// ------------------

// Export a handler that Vercel can run
export default function handler(req, res) {
  // Wrap the Express app with serverless-http
  return serverless(app)(req, res);
}
