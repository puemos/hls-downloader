import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const target = process.env.MV_TARGET === "mv3" ? "mv3" : "mv2";
  const isMv3 = target === "mv3";
  const outDirName = process.env.DIST_DIR ?? "dist";
  const outDir = resolve(
    __dirname,
    "../../",
    outDirName
  ); /* default shared dist */

  return {
    build: {
      lib: {
        entry: isMv3
          ? {
              background: resolve(__dirname, "src/index.ts"),
              offscreen: resolve(__dirname, "src/offscreen.ts"),
            }
          : resolve(__dirname, "src/index.ts"),
        name: "HlsDownloaderBackground",
        fileName: (_format, entryName) =>
          entryName === "offscreen" ? "offscreen.js" : "background.js",
        formats: isMv3 ? ["es"] : ["umd"],
      },
      target: "es2022",
      sourcemap: true,
      minify: false,
      outDir,
      emptyOutDir: false,
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
    },
  };
});
