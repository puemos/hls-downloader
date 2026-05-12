#!/usr/bin/env node

import "dotenv/config";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const required = ["AMO_JWT_ISSUER", "AMO_JWT_SECRET"];
const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error(`
Set them in .env or export before running:
  AMO_JWT_ISSUER=<your API key>
  AMO_JWT_SECRET=<your API secret>

Get your API credentials at: https://addons.mozilla.org/developers/addon/api/key/
`);
  process.exit(1);
}

const sourceDir = resolve(root, "dist/mv2");

function run(command, args, options = {}) {
  execFileSync(command, args, { cwd: root, stdio: "inherit", ...options });
}

function getOutput(command, args) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
}

function assertCleanWorktree() {
  const workingTreeStatus = getOutput("git", ["status", "--porcelain"]);

  if (workingTreeStatus) {
    console.error(
      "Refusing to publish with uncommitted or untracked non-ignored changes. Commit or stash changes first so the uploaded source archive matches HEAD."
    );
    console.error(workingTreeStatus);
    process.exit(1);
  }
}

assertCleanWorktree();

console.log("Building Firefox MV2 package...");
run("pnpm", ["run", "build:mv2"]);
assertCleanWorktree();

if (!existsSync(sourceDir)) {
  console.error("dist/mv2 was not created by `pnpm run build:mv2`.");
  process.exit(1);
}

const manifest = JSON.parse(
  readFileSync(resolve(sourceDir, "manifest.json"), "utf8")
);
const version = manifest.version;
const gecko = manifest.browser_specific_settings?.gecko;

if (
  !version ||
  !gecko?.id ||
  gecko.data_collection_permissions?.required?.[0] !== "none"
) {
  console.error(
    "Built manifest is missing version, Gecko ID, or data_collection_permissions.required."
  );
  process.exit(1);
}

const sourceArchive = resolve(root, `source-code-${version}.zip`);

console.log(`Submitting HLS Downloader v${version} to Firefox Add-ons...`);

// Create source code archive for AMO review from committed files.
console.log("Creating source code archive for reviewer...");
try {
  if (existsSync(sourceArchive)) unlinkSync(sourceArchive);
  run("git", ["archive", "--format=zip", "-o", sourceArchive, "HEAD"]);
} catch (err) {
  console.error("Failed to create source code archive.");
  process.exit(1);
}

// Submit to AMO
console.log("Uploading to AMO...");
try {
  run(
    "pnpm",
    [
      "exec",
      "web-ext",
      "sign",
      "--source-dir",
      sourceDir,
      "--channel listed",
      "--api-key",
      process.env.AMO_JWT_ISSUER,
      "--api-secret",
      process.env.AMO_JWT_SECRET,
      "--upload-source-code",
      sourceArchive,
    ]
  );
  console.log("Submission complete! Check AMO for review status.");
} catch (err) {
  console.error("Submission failed.");
  process.exit(1);
} finally {
  // Clean up source archive
  if (existsSync(sourceArchive)) unlinkSync(sourceArchive);
}
