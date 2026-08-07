import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootNodeModules = path.resolve(__dirname, "../node_modules");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.join(rootNodeModules, "react"),
      "react-dom": path.join(rootNodeModules, "react-dom"),
      "react-router-dom": path.join(rootNodeModules, "react-router-dom"),
    },
  },
  publicDir: false,
  css: {
    postcss: {
      plugins: [],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
