#!/usr/bin/env node
import assert from "node:assert/strict";
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
