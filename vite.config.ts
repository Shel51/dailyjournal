import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // the React app is in /client
  root: "client",
  plugins: [react()],
  build: {
    // build to /dist/public so Vercel serves it
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared")   // <-- add this
    }
  }
});
