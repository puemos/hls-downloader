#!/usr/bin/env node

import "dotenv/config";
import { execSync } from "node:child_process";
import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const required = ["AMO_JWT_ISSUER", "AMO_JWT_SECRET", "AMO_ADDON_ID"];
const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error(`
Set them in .env or export before running:
  AMO_JWT_ISSUER=<your API key>
  AMO_JWT_SECRET=<your API secret>
  AMO_ADDON_ID=<your addon GUID, e.g. {xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}>

Get your API credentials at: https://addons.mozilla.org/developers/addon/api/key/
`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const sourceDir = resolve(root, "dist/mv2");
const sourceArchive = resolve(root, "source-code.zip");

if (!existsSync(sourceDir)) {
  console.error("dist/mv2 not found. Run `pnpm run build:mv2` first.");
  process.exit(1);
}

console.log(`Submitting HLS Downloader v${pkg.version || "?"} to Firefox Add-ons...`);

// Inject gecko addon ID into the built manifest (keeps it out of committed source)
const manifestPath = resolve(sourceDir, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
let addonId = process.env.AMO_ADDON_ID;
// Gecko ID must be in {uuid} format
if (!addonId.startsWith("{")) addonId = `{${addonId}}`;
manifest.browser_specific_settings = {
  gecko: {
    id: addonId,
    data_collection_permissions: {
      required: ["none"],
    },
  },
};
const { writeFileSync } = await import("node:fs");
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// Create source code archive for AMO review using git archive (respects .gitignore)
console.log("Creating source code archive for reviewer...");
try {
  if (existsSync(sourceArchive)) unlinkSync(sourceArchive);
  execSync(`git archive --format=zip -o "${sourceArchive}" HEAD`, {
    stdio: "inherit",
    cwd: root,
  });
} catch (err) {
  console.error("Failed to create source code archive.");
  process.exit(1);
}

// Submit to AMO
console.log("Uploading to AMO...");
try {
  execSync(
    [
      "npx web-ext sign",
      `--source-dir "${sourceDir}"`,
      "--channel listed",
      `--api-key "${process.env.AMO_JWT_ISSUER}"`,
      `--api-secret "${process.env.AMO_JWT_SECRET}"`,
      `--upload-source-code "${sourceArchive}"`,
    ].join(" "),
    { stdio: "inherit", cwd: root }
  );
  console.log("Submission complete! Check AMO for review status.");
} catch (err) {
  console.error("Submission failed.");
  process.exit(1);
} finally {
  // Clean up source archive
  if (existsSync(sourceArchive)) unlinkSync(sourceArchive);
}
