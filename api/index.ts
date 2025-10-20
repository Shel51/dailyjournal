import serverless from "serverless-http";
import { createApp } from "../server/app";

let cachedHandler: any;

export default async function handler(req: any, res: any) {
  if (!cachedHandler) {
    const app = await createApp();
    cachedHandler = serverless(app);
  }
  return cachedHandler(req, res);
}

