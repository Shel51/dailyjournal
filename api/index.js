import serverless from "serverless-http";
import { createApp } from "../server/app.js"; // will import the TypeScript-compiled JS

let cachedHandler;

export default async function handler(req, res) {
  if (!cachedHandler) {
    const app = await createApp();
    cachedHandler = serverless(app);
  }
  return cachedHandler(req, res);
}
