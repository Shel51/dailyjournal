import serverless from "serverless-http";
import { createApp } from "../server/app.ts"; // <-- NOTE: .ts here is intentional

let cachedHandler;

export default async function handler(req, res) {
  if (!cachedHandler) {
    const app = await createApp();
    cachedHandler = serverless(app);
  }
  return cachedHandler(req, res);
}
