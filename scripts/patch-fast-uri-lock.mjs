#!/usr/bin/env node
/**
 * Erzwingt fast-uri@3.1.2 im Lockfile (GHSA-q3j6, GHSA-v39h; betrifft ajv / @fastify/ajv-compiler).
 * Nach package.json overrides oder wenn `npm audit` noch <=3.1.1 meldet:
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
  version: "3.1.2",
  resolved: "https://registry.npmjs.org/fast-uri/-/fast-uri-3.1.2.tgz",
  integrity:
    "sha512-rVjf7ArG3LTk+FS6Yw81V1DLuZl1bRbNrev6Tmd/9RaroeeRRJhAt7jg/6YFxbvAQXUCavSoZhPPj6oOx+5KjQ==",
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
