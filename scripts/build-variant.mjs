#!/usr/bin/env node
import { execSync } from "child_process";
import { parseArgs } from "util";

const args = process.argv.slice(2).filter((arg) => arg !== "--");

const { values } = parseArgs({
  args,
  options: {
    mv: { type: "string", default: "mv2" },
    blocklist: { type: "boolean", default: true },
  },
});

const mvVersion = values.mv; // 'mv2' or 'mv3'
const hasBlocklist = values.blocklist;

// Determine output directory and zip basename
const blocklistSuffix = hasBlocklist ? "" : "-no-blocklist";
const distDir = `dist/${mvVersion}${blocklistSuffix}`;
const zipBasename = `extension-${mvVersion}${blocklistSuffix}`;

// Set environment variables
const env = {
  ...process.env,
  DIST_DIR: distDir,
  MV_TARGET: mvVersion,
  ZIP_BASENAME: zipBasename,
  ...(mvVersion === "mv3" && { MAKE_FIREFOX: "false" }),
  ...(!hasBlocklist && { NO_BLOCKLIST: "true", VITE_NO_BLOCKLIST: "true" }),
};

console.log(`Building ${mvVersion}${blocklistSuffix}...`);

// Run the build steps
const steps = [
  "pnpm run copy-assets",
  "pnpm run build:packages",
  "pnpm run build:zip",
];

for (const step of steps) {
  execSync(step, { stdio: "inherit", env });
}

console.log(`✓ Built ${zipBasename}`);
