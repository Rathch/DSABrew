#!/usr/bin/env node
/**
 * Aktualisiert server/package-lock.json passend zu server/package.json (nach Dependency-Änderungen).
 * Ausführung im Repo-Root: node scripts/update-server-lock.mjs
 */
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = path.join(root, "server");

execSync("npm install --no-audit --no-fund", {
  cwd: server,
  stdio: "inherit",
  env: process.env
});
