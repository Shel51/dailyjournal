import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // Tell Vite the app lives in /client
  root: "client",

  plugins: [react()],

  // Output goes to /dist/public so Vercel can serve it
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },

  // Optional: make absolute/relative imports happy from /client
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src")
    }
  }
});
