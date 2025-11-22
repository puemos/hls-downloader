import { cp, mkdir, copyFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.resolve(
  repoRoot,
  process.env.DIST_DIR ? process.env.DIST_DIR : "dist"
);
const assetsDir = path.join(repoRoot, "src", "assets");

const target = process.env.MV_TARGET === "mv3" ? "mv3" : "mv2";
const manifestFile =
  target === "mv3" ? "manifest.chrome.json" : "manifest.json";

async function run() {
  await mkdir(distDir, { recursive: true });

  // Copy static assets (icons, fonts, etc)
  await cp(path.join(assetsDir, "assets"), path.join(distDir, "assets"), {
    recursive: true,
  });

  // Copy manifest for the selected target
  await copyFile(
    path.join(assetsDir, manifestFile),
    path.join(distDir, "manifest.json")
  );

  if (target === "mv3") {
    await copyFile(
      path.join(assetsDir, "offscreen.html"),
      path.join(distDir, "offscreen.html")
    );
  }
}

run().catch((error) => {
  console.error("Failed to copy assets:", error);
  process.exitCode = 1;
});
