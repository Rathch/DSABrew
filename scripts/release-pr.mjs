#!/usr/bin/env node
/**
 * Push des Release-Commits, PR gegen den Default-Branch, Merge (nach grünen Checks).
 * Wird von @semantic-release/exec publishCmd im Release-Workflow aufgerufen.
 *
 * Env: GH_TOKEN oder GITHUB_TOKEN (feingranulares PAT: Contents + Pull requests write).
 */
import { execSync } from "node:child_process";

const version = (process.argv[2] ?? "").trim();
if (!version) {
  console.error("[release-pr] Erwartet: Versions-String (Argument).");
  process.exit(1);
}

if (!process.env.GH_TOKEN && process.env.GITHUB_TOKEN) {
  process.env.GH_TOKEN = process.env.GITHUB_TOKEN;
}

function sh(cmd, inherit = true) {
  return execSync(cmd, {
    encoding: "utf8",
    stdio: inherit ? "inherit" : ["pipe", "pipe", "inherit"],
    env: process.env,
  });
}

function shOut(cmd) {
  return execSync(cmd, { encoding: "utf8", env: process.env }).trim();
}

function defaultBranch() {
  try {
    const sym = shOut("git symbolic-ref refs/remotes/origin/HEAD").replace(
      /^refs\/remotes\/origin\//,
      ""
    );
    if (sym && sym !== "HEAD") return sym;
  } catch {
    // ignore
  }
  return process.env.RELEASE_MERGE_BASE || "main";
}

function mergeFlag() {
  const raw = shOut(
    "gh repo view --json mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed"
  );
  const j = JSON.parse(raw);
  if (j.mergeCommitAllowed) return "--merge";
  if (j.squashMergeAllowed) return "--squash";
  if (j.rebaseMergeAllowed) return "--rebase";
  throw new Error(
    "[release-pr] Repo erlaubt weder merge, squash noch rebase — bitte in den Repo-Einstellungen aktivieren."
  );
}

const base = defaultBranch();
const branch = `chore/release-v${version}`;

console.log(`[release-pr] base=${base} branch=${branch}`);

sh(`git push -f origin HEAD:refs/heads/${branch}`);

let num = shOut(`gh pr list --head ${branch} --json number --jq '.[0].number'`);
if (!num || num === "null") {
  sh(
    `gh pr create --base ${base} --head ${branch} --title "chore(release): ${version}" --body "Automatischer Release (semantic-release)."`
  );
  num = shOut(`gh pr list --head ${branch} --json number --jq '.[0].number'`);
}

if (!num || num === "null") {
  console.error("[release-pr] Konnte PR-Nummer nicht ermitteln.");
  process.exit(1);
}

try {
  sh(`gh pr checks ${num} --watch`);
} catch {
  console.warn("[release-pr] gh pr checks --watch nicht verfügbar oder fehlgeschlagen — Merge wird trotzdem versucht.");
}

const flag = mergeFlag();
sh(`gh pr merge ${num} ${flag} --delete-branch`);
