#!/usr/bin/env node
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const pnpmStore = resolve("node_modules/.pnpm");
const branches = ["1.1.21"];
const pattern = "{a,b}".repeat(50);
const maxLength = 100_000;

for (const version of branches) {
  const prefix = `brace-expansion@${version}`;
  const matches = readdirSync(pnpmStore).filter((entry) => entry === prefix);

  if (matches.length !== 1) {
    throw new Error(
      `Expected one fixed brace-expansion@${version}, found ${matches.length}`,
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

  if (
    output.length === 0 ||
    output.length > 10_000 ||
    totalLength > maxLength
  ) {
    throw new Error(
      `brace-expansion@${version} produced an unexpected bounded result: ${output.length}/${totalLength}`,
    );
  }

  if (JSON.stringify(expand("a{b,c}")) !== JSON.stringify(["ab", "ac"])) {
    throw new Error(`brace-expansion@${version} broke the CommonJS API`);
  }
}

console.log("Verified fixed brace-expansion compatibility branches");
