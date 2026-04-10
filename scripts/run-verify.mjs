#!/usr/bin/env node
/**
 * One-shot CI-style verify; writes combined stdout/stderr for environments where
 * the agent terminal captures no npm output.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lines = [];

function run(cmd, args, cwd = root) {
  lines.push(`\n$ ${cmd} ${args.join(" ")} (cwd=${cwd})\n`);
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: process.env
  });
  if (r.stdout) lines.push(r.stdout);
  if (r.stderr) lines.push(r.stderr);
  lines.push(`\nexit ${r.status ?? "null"}\n`);
  return r.status ?? 1;
}

let code = 0;
code |= run("npm", ["run", "lint:ts"], root);
code |= run("npm", ["run", "typecheck", "--prefix", "web"], root);
code |= run("npm", ["run", "lint:css", "--prefix", "web"], root);
code |= run("npm", ["run", "test", "--prefix", "web"], root);
code |= run("npm", ["run", "typecheck", "--prefix", "server"], root);
code |= run("npm", ["run", "test", "--prefix", "server"], root);

const out = join(root, "verify-output.txt");
writeFileSync(out, lines.join(""), "utf8");
process.exit(code !== 0 ? 1 : 0);
