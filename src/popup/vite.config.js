import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  build: {
    target: "es2022",
    minify: false,
    outDir: resolve(__dirname, "../../dist"),
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
