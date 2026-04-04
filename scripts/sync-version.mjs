#!/usr/bin/env node
/**
 * Synchronisiert `version` in web/ und server/ mit der Root-package.json
 * (wird von semantic-release/@semantic-release/exec nach dem Version-Bump aufgerufen).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const rootPkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const v = rootPkg.version;
if (typeof v !== "string" || !v) {
  console.error("[sync-version] Root package.json hat keine gültige version.");
  process.exit(1);
}
for (const sub of ["web", "server"]) {
  const p = resolve(root, sub, "package.json");
  const j = JSON.parse(readFileSync(p, "utf8"));
  j.version = v;
  writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`);
}
console.log(`[sync-version] web + server → ${v}`);
