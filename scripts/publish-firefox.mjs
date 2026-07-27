#!/usr/bin/env node

import "dotenv/config";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const expectedNodeVersion = "v22.12.0";
const expectedPnpmVersion = "10.34.4";
const amoMetadata = resolve(root, "amo-metadata.json");

const required = ["AMO_JWT_ISSUER", "AMO_JWT_SECRET"];
const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
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

function assertToolchain() {
  if (process.version !== expectedNodeVersion) {
    console.error(
      `Firefox publication requires Node.js ${expectedNodeVersion.slice(1)}; current version is ${process.version.slice(1)}.`,
    );
    process.exit(1);
  }

  let pnpmVersion;

  try {
    pnpmVersion = getOutput("pnpm", ["--version"]);
  } catch {
    console.error(
      `pnpm ${expectedPnpmVersion} is required. Install it with \`npm install --global pnpm@${expectedPnpmVersion}\`.`,
    );
    process.exit(1);
  }

  if (pnpmVersion !== expectedPnpmVersion) {
    console.error(
      `Firefox publication requires pnpm ${expectedPnpmVersion}; current version is ${pnpmVersion}.`,
    );
    process.exit(1);
  }

  try {
    getOutput("zip", ["-v"]);
  } catch {
    console.error("Firefox publication requires the `zip` command on PATH.");
    process.exit(1);
  }
}

function assertCleanWorktree() {
  const workingTreeStatus = getOutput("git", ["status", "--porcelain"]);

  if (workingTreeStatus) {
    console.error(
      "Refusing to publish with uncommitted or untracked non-ignored changes. Commit or stash changes first so the uploaded source archive matches HEAD.",
    );
    console.error(workingTreeStatus);
    process.exit(1);
  }
}

assertToolchain();
assertCleanWorktree();

console.log("Building Firefox MV2 package...");
run("pnpm", ["run", "build:mv2"]);
assertCleanWorktree();

if (!existsSync(sourceDir)) {
  console.error("dist/mv2 was not created by `pnpm run build:mv2`.");
  process.exit(1);
}

const manifest = JSON.parse(
  readFileSync(resolve(sourceDir, "manifest.json"), "utf8"),
);
const version = manifest.version;
const gecko = manifest.browser_specific_settings?.gecko;

if (
  !version ||
  !gecko?.id ||
  gecko.data_collection_permissions?.required?.[0] !== "none"
) {
  console.error(
    "Built manifest is missing version, Gecko ID, or data_collection_permissions.required.",
  );
  process.exit(1);
}

if (!existsSync(amoMetadata)) {
  console.error("amo-metadata.json is missing.");
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
let uploadSucceeded = false;

try {
  run("pnpm", [
    "exec",
    "web-ext",
    "sign",
    "--no-input",
    "--source-dir",
    sourceDir,
    "--channel",
    "listed",
    "--approval-timeout",
    "0",
    "--api-key",
    process.env.AMO_JWT_ISSUER,
    "--api-secret",
    process.env.AMO_JWT_SECRET,
    "--amo-metadata",
    amoMetadata,
    "--upload-source-code",
    sourceArchive,
  ]);
  uploadSucceeded = true;
  console.log(
    "Submission accepted by AMO and awaiting review. Check the AMO developer dashboard for status.",
  );
} catch (err) {
  console.error(
    `Submission failed. Source archive preserved for inspection: ${sourceArchive}`,
  );
  process.exitCode = 1;
} finally {
  if (uploadSucceeded && existsSync(sourceArchive)) unlinkSync(sourceArchive);
}
