#!/usr/bin/env node
import assert from "node:assert/strict";
import fs, { readFileSync, readdirSync } from "node:fs";
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

// Test the exact dependency used by Firefox's linter, rather than a stale
// package left in the pnpm store. GHSA-gcqx-w48m-w2h4 has no upstream fix.
const webExtRequire = createRequire(require.resolve("web-ext"));
const linterRequire = createRequire(webExtRequire.resolve("addons-linter"));
const merge = linterRequire("deepmerge");
const payload = JSON.parse('{"__proto__":{"injected":true}}');

for (const result of [
  merge(Object.create(null), payload),
  merge(payload, {}),
  merge(payload, payload),
  merge({ session: null }, { session: payload }).session,
  merge({ session: 0 }, { session: payload }).session,
  merge({}, { entries: [payload] }).entries[0],
]) {
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(result.injected, undefined);
}
assert.equal(Object.prototype.injected, undefined);

// Preserve the merge behavior needed by the linter's JSON schemas.
assert.deepEqual(
  merge({ nested: { a: 1 }, items: [1] }, { nested: { b: 2 }, items: [2] }),
  { nested: { a: 1, b: 2 }, items: [1, 2] },
);
assert.deepEqual(merge.all([{ a: 1 }, { b: 2 }]), { a: 1, b: 2 });
assert.deepEqual(
  merge({ items: [1] }, { items: [2] }, { arrayMerge: (_, source) => source }),
  { items: [2] },
);
const symbol = Symbol("schema");
const mergedSymbols = merge({}, { [symbol]: { valid: true } });
assert.deepEqual(mergedSymbols[symbol], { valid: true });
assert.equal(
  Object.getOwnPropertyDescriptor(mergedSymbols, symbol).enumerable,
  true,
);

console.log(
  "Verified deepmerge prototype-poisoning patch and merge compatibility",
);

// GHSA-g3hv-75wg-m249 affects optimizationLevel >= 2 preprocessing, introduced
// in minimatch 7. The advisory's broad <11.0.1 range also flags legacy v3,
// which has no first/second-phase preprocessing. Keep that exception fail-closed:
// only this inspected legacy branch and the patched modern release may resolve.
const minimatchVersions = new Set(
  [
    ...readFileSync("pnpm-lock.yaml", "utf8").matchAll(
      /^  minimatch@([^:]+):$/gm,
    ),
  ].map((match) => match[1]),
);
assert.deepEqual([...minimatchVersions].sort(), ["11.0.3", "3.1.5"]);
const legacyMatch = require(
  resolve(pnpmStore, "minimatch@3.1.5/node_modules/minimatch"),
);
assert.equal(typeof legacyMatch, "function");
assert.equal(legacyMatch.Minimatch.prototype.firstPhasePreProcess, undefined);
assert.equal(legacyMatch.Minimatch.prototype.secondPhasePreProcess, undefined);
const legacyPattern = new legacyMatch.Minimatch("a/**/../".repeat(12) + "b", {
  optimizationLevel: 2,
});
assert.equal(legacyPattern.globParts.length, 1);
assert(legacyMatch("src/example.ts", "src/**/*.ts"));
assert(!legacyMatch("src/example.js", "src/**/*.ts"));
const modernMatch = require(
  resolve(pnpmStore, "minimatch@11.0.3/node_modules/minimatch"),
);
assert(modernMatch.minimatch("@scope/package", "@scope/*"));
assert(!modernMatch.minimatch("other/package", "@scope/*"));
console.log(
  "Verified patched modern minimatch and unaffected legacy CommonJS branch",
);

// Exercise the exact glob resolved by the build cleanup tool, not an old copy
// left in pnpm's store. Pre-aborted traversal must not read any directory.
const rimrafRequire = createRequire(require.resolve("rimraf"));
assert.equal(rimrafRequire("glob/package.json").version, "14.0.2");
const { glob } = rimrafRequire("glob");
const aborted = new AbortController();
aborted.abort(new Error("Security check: traversal cancelled"));
let directoryReads = 0;
await assert.rejects(
  glob("*", {
    cwd: process.cwd(),
    signal: aborted.signal,
    fs: {
      ...fs,
      readdir(...args) {
        directoryReads++;
        return fs.readdir(...args);
      },
    },
  }),
  /traversal cancelled/,
);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(directoryReads, 0);
console.log("Verified glob cancellation stops filesystem traversal");
