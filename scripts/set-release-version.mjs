#!/usr/bin/env node
/**
 * Setzt `version` in der Root-package.json (Ersatz für @semantic-release/npm bei npmPublish: false).
 * Aufruf: node scripts/set-release-version.mjs <semver>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const v = (process.argv[2] ?? "").trim();
if (!v) {
  console.error("[set-release-version] Erwartet: Versions-String (z. B. 1.2.3 oder 2.0.0-beta.1).");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const pkgPath = resolve(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.version = v;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`[set-release-version] Root ${pkg.name ?? "dsabrew"} → ${v}`);
