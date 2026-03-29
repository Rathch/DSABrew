#!/usr/bin/env node
/**
 * ESLint immer vom Repository-Root aus ausführen (relative Pfade web/, shared/, server/).
 * Verhindert stille oder verwirrende Fehler, wenn npm das Skript mit anderem cwd startet.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const eslintJs = path.join(repoRoot, "node_modules", "eslint", "bin", "eslint.js");

const passthrough = process.argv.slice(2);

const result = spawnSync(
	process.execPath,
	[
		eslintJs,
		"web/src",
		"web/tests",
		"web/vite.config.ts",
		"shared",
		"server",
		...passthrough,
	],
	{
		cwd: repoRoot,
		stdio: "inherit",
		env: process.env,
	},
);

process.exit(result.status === null ? 1 : result.status);
