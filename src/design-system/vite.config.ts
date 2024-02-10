import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "@hls-downloader/design-system",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    target: "es2022",
    sourcemap: true,
    minify: false,
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: false,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  plugins: [dts()],
}));
