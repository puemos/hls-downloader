import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "@hls-downloader/background",
      fileName: () => "background.js",
      formats: ["umd"],
    },
    target: "es2022",
    sourcemap: true,
    minify: false,
    outDir: resolve(__dirname, "../../dist"),
    emptyOutDir: false,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
}));
