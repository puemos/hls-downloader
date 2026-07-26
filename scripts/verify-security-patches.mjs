#!/usr/bin/env node
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const pnpmStore = resolve("node_modules/.pnpm");
const branches = ["1.1.16"];
const pattern = "{a,b}".repeat(50);
const maxLength = 100_000;

for (const version of branches) {
  const prefix = `brace-expansion@${version}_patch_hash=`;
  const matches = readdirSync(pnpmStore).filter((entry) =>
    entry.startsWith(prefix),
  );

  if (matches.length !== 1) {
    throw new Error(
      `Expected one patched brace-expansion@${version}, found ${matches.length}`,
    );
  }

  const packagePath = resolve(
    pnpmStore,
    matches[0],
    "node_modules/brace-expansion",
  );
  const expand = require(packagePath);
  const output = expand(pattern, { max: 10_000, maxLength });
  const totalLength = output.reduce((total, item) => total + item.length, 0);

  if (output.length !== 2_000 || totalLength !== maxLength) {
    throw new Error(
      `brace-expansion@${version} produced an unexpected bounded result: ${output.length}/${totalLength}`,
    );
  }
}

console.log("Verified patched brace-expansion compatibility branches");
