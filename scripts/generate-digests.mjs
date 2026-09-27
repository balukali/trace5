/**
 * Build-time generator: converts scripts/flags.json (authoring source) into
 * src/lib/data/flag-digests.json, which is what the application ships.
 *
 * The digest function is duplicated here exactly as in src/lib/flag-digest.ts
 * so the generated file matches runtime verification.
 *
 * Run with:  node scripts/generate-digests.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function fnv1a64(input) {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (h2 + c) >>> 0;
    h2 = Math.imul(h2 ^ (h2 >>> 13), 0x85ebca6b) >>> 0;
    h2 = (h2 ^ (h2 >>> 16)) >>> 0;
  }
  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
}

function normalizeFlag(input) {
  return input
    .trim()
    .replace(/\r?\n/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

const flags = JSON.parse(readFileSync(join(root, "scripts/flags.json"), "utf8"));
const digests = {};
for (const [id, flag] of Object.entries(flags)) {
  digests[id] = fnv1a64(`${id}::${normalizeFlag(flag)}`);
}

writeFileSync(
  join(root, "src/lib/data/flag-digests.json"),
  `${JSON.stringify(digests, null, 2)}\n`,
  "utf8",
);

console.log(`Wrote ${Object.keys(digests).length} flag digests.`);
