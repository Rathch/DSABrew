#!/usr/bin/env node
/**
 * Erzwingt fast-uri@3.1.9 im Lockfile (GHSA-q3j6, GHSA-v39h; betrifft ajv / @fastify/ajv-compiler).
 * Nach package.json overrides oder wenn `npm audit` noch <=3.1.8 meldet:
 *   node scripts/patch-fast-uri-lock.mjs
 *   cd web && rm -rf node_modules && npm ci && npm audit --audit-level=high
 *   cd ../server && rm -rf node_modules && npm ci && npm audit --audit-level=high
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const FAST_URI = {
  version: "3.1.9",
  resolved: "https://registry.npmjs.org/fast-uri/-/fast-uri-3.1.9.tgz",
  integrity:
    "sha512-hS/0Wt3Ya043oKXs0sIxrMpKQITXhMLIrVAKKXi4gozGC9v7YRWVnXIZzjNPTO02M9BdxLCWqK1yRXgNziVyJQ==",
  funding: [
    {
      type: "github",
      url: "https://github.com/sponsors/fastify"
    },
    {
      type: "opencollective",
      url: "https://opencollective.com/fastify"
    }
  ],
  license: "BSD-3-Clause"
};

const TARGETS = [
  { rel: "web/package-lock.json", dev: true },
  { rel: "server/package-lock.json", dev: false }
];

let changed = 0;

for (const { rel, dev } of TARGETS) {
  const lockPath = resolve(root, rel);
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  const key = "node_modules/fast-uri";
  const prev = lock.packages[key];
  const next = { ...FAST_URI, ...(dev ? { dev: true } : {}) };
  const prevVer = prev?.version;
  lock.packages[key] = next;
  if (prevVer !== next.version) {
    console.log(`${rel}: fast-uri ${prevVer ?? "(missing)"} -> ${next.version}`);
    changed++;
  } else {
    console.log(`${rel}: fast-uri already ${next.version}`);
  }
  writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

if (changed === 0) {
  console.log("patch-fast-uri-lock: no version changes (locks already pinned).");
} else {
  console.log(`patch-fast-uri-lock: updated ${changed} lockfile(s).`);
}
