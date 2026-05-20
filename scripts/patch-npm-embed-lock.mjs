#!/usr/bin/env node
/**
 * `@semantic-release/npm` hängt `npm` (CLI) an; darin liegen brace-expansion/picomatch
 * als gebündelte (`inBundle`) Versionen, die npm audit meldet und die `npm audit fix`
 * nicht ersetzen kann. Dieses Skript schreibt im package-lock.json feste Registry-Einträge
 * für die betroffenen Pfade (GHSA-f886, GHSA-3v7f / GHSA-c2c7), inkl. `node_modules/npm/node_modules/…`.
 *
 * Nach `npm install`, falls audit wieder alte Versionen zeigt: ausführen, dann `rm -rf node_modules && npm ci`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const lockPath = resolve(root, "package-lock.json");

const PATCH = {
  "node_modules/@semantic-release/npm/node_modules/npm/node_modules/brace-expansion": {
    version: "5.0.6",
    resolved: "https://registry.npmjs.org/brace-expansion/-/brace-expansion-5.0.6.tgz",
    integrity:
      "sha512-kLpxurY4Z4r9sgMsyG0Z9uzsBlgiU/EFKhj/h91/8yHu0edo7XuixOIH3VcJ8kkxs6/jPzoI6U9Vj3WqbMQ94g==",
    dev: true,
    license: "MIT",
    dependencies: {
      "balanced-match": "^4.0.2"
    },
    engines: {
      node: "18 || 20 || >=22"
    }
  },
  "node_modules/@semantic-release/npm/node_modules/npm/node_modules/picomatch": {
    version: "4.0.4",
    resolved: "https://registry.npmjs.org/picomatch/-/picomatch-4.0.4.tgz",
    integrity:
      "sha512-QP88BAKvMam/3NxH6vj2o21R6MjxZUAd6nlwAS/pnGvN9IVLocLHxGYIzFhg6fUQ+5th6P4dv4eW9jX3DSIj7A==",
    dev: true,
    license: "MIT",
    engines: {
      node: ">=12"
    },
    funding: {
      url: "https://github.com/sponsors/jonschlinkert"
    }
  },
  "node_modules/npm/node_modules/brace-expansion": {
    version: "5.0.6",
    resolved: "https://registry.npmjs.org/brace-expansion/-/brace-expansion-5.0.6.tgz",
    integrity:
      "sha512-kLpxurY4Z4r9sgMsyG0Z9uzsBlgiU/EFKhj/h91/8yHu0edo7XuixOIH3VcJ8kkxs6/jPzoI6U9Vj3WqbMQ94g==",
    dev: true,
    license: "MIT",
    dependencies: {
      "balanced-match": "^4.0.2"
    },
    engines: {
      node: "18 || 20 || >=22"
    }
  },
  "node_modules/npm/node_modules/tinyglobby/node_modules/picomatch": {
    version: "4.0.4",
    resolved: "https://registry.npmjs.org/picomatch/-/picomatch-4.0.4.tgz",
    integrity:
      "sha512-QP88BAKvMam/3NxH6vj2o21R6MjxZUAd6nlwAS/pnGvN9IVLocLHxGYIzFhg6fUQ+5th6P4dv4eW9jX3DSIj7A==",
    dev: true,
    license: "MIT",
    engines: {
      node: ">=12"
    },
    funding: {
      url: "https://github.com/sponsors/jonschlinkert"
    }
  },
  "node_modules/npm/node_modules/ip-address": {
    version: "10.2.0",
    resolved: "https://registry.npmjs.org/ip-address/-/ip-address-10.2.0.tgz",
    integrity:
      "sha512-/+S6j4E9AHvW9SWMSEY9Xfy66O5PWvVEJ08O0y5JGyEKQpojb0K0GKpz/v5HJ/G0vi3D2sjGK78119oXZeE0qA==",
    dev: true,
    license: "MIT",
    engines: {
      node: ">= 12"
    }
  },
};

const raw = readFileSync(lockPath, "utf8");
const lock = JSON.parse(raw);
if (!lock.packages) {
  console.error("[patch-npm-embed-lock] Kein packages-Feld in package-lock.json.");
  process.exit(1);
}

let changed = false;
for (const [path, entry] of Object.entries(PATCH)) {
  const cur = lock.packages[path];
  const need =
    !cur ||
    cur.version !== entry.version ||
    cur.inBundle === true ||
    !cur.resolved;
  if (need) {
    lock.packages[path] = { ...entry };
    changed = true;
  }
}

if (!changed) {
  console.log("[patch-npm-embed-lock] package-lock.json bereits mit sicheren Embed-Versionen.");
  process.exit(0);
}

writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
console.log(
  "[patch-npm-embed-lock] package-lock.json aktualisiert. Bitte: rm -rf node_modules && npm ci"
);
