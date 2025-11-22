import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const outDirName = process.env.DIST_DIR ?? "dist";
const outDir = resolve(
  __dirname,
  "../../",
  outDirName,
); /* default shared dist */

export default defineConfig({
  build: {
    target: "es2022",
    minify: false,
    outDir,
    rollupOptions: {
      output: {
        entryFileNames: `popup.js`,
        chunkFileNames: `popup.js`,
        assetFileNames: `popup.[ext]`,
      },
      input: {
        app: "./popup.html",
      },
    },
    emptyOutDir: false,
  },
  sourcemap: true,
  plugins: [react()],
});
