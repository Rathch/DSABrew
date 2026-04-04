#!/usr/bin/env node
/**
 * Push des Release-Commits, PR gegen den Default-Branch, Merge (nach grünen Checks).
 * Wird von @semantic-release/exec publishCmd im Release-Workflow aufgerufen.
 *
 * Env: GH_TOKEN oder GITHUB_TOKEN (feingranulares PAT: Contents + Pull requests write).
 */
import { execFileSync, execSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const version = (process.argv[2] ?? "").trim();
if (!version) {
  console.error("[release-pr] Erwartet: Versions-String (Argument).");
  process.exit(1);
}

if (!process.env.GH_TOKEN && process.env.GITHUB_TOKEN) {
  process.env.GH_TOKEN = process.env.GITHUB_TOKEN;
}

function sh(cmd) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

function shOut(cmd) {
  return execSync(cmd, { encoding: "utf8", env: process.env }).trim();
}

function ghJson(args) {
  const out = execFileSync("gh", args, {
    encoding: "utf8",
    env: process.env,
  }).trim();
  return out ? JSON.parse(out) : null;
}

function defaultBranch() {
  try {
    const j = ghJson(["repo", "view", "--json", "defaultBranchRef"]);
    const name = j?.defaultBranchRef?.name;
    if (name) return name;
  } catch {
    // ignore
  }
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
  const j = ghJson([
    "repo",
    "view",
    "--json",
    "mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed",
  ]);
  if (j.mergeCommitAllowed) return "--merge";
  if (j.squashMergeAllowed) return "--squash";
  if (j.rebaseMergeAllowed) return "--rebase";
  throw new Error(
    "[release-pr] Repo erlaubt weder merge, squash noch rebase — bitte in den Repo-Einstellungen aktivieren."
  );
}

function headSpec(branch) {
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const owner = repo.split("/")[0];
  return owner ? `${owner}:${branch}` : branch;
}

/** Erste PR-Nummer zu diesem Head, sonst leer. */
function prListNumber(branch) {
  for (const h of [headSpec(branch), branch]) {
    try {
      const out = execFileSync(
        "gh",
        ["pr", "list", "--head", h, "--json", "number", "--jq", ".[0].number"],
        { encoding: "utf8", env: process.env }
      ).trim();
      if (out && out !== "null") return out;
    } catch {
      // ignore
    }
  }
  return "";
}

async function prCreateWithRetry(base, branch, version) {
  const title = `chore(release): ${version}`;
  const body = "Automatischer Release (semantic-release).";
  const attempts = 8;
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) {
      const ms = 2000 + i * 1500;
      console.warn(`[release-pr] PR create Wiederholung ${i + 1}/${attempts} nach ${ms}ms …`);
      await delay(ms);
    }
    sh("git fetch origin");
    try {
      shOut(`git rev-parse origin/${branch}`);
    } catch {
      console.warn(`[release-pr] Remote-Branch origin/${branch} noch nicht sichtbar — warte …`);
      continue;
    }
    const heads = [headSpec(branch), branch];
    for (const head of heads) {
      try {
        execFileSync(
          "gh",
          ["pr", "create", "--base", base, "--head", head, "--title", title, "--body", body],
          { stdio: "inherit", env: process.env }
        );
        return;
      } catch (e) {
        lastErr = e;
        console.warn(
          `[release-pr] gh pr create (--head ${head}) fehlgeschlagen: ${e?.message ?? e}`
        );
      }
    }
  }
  throw lastErr ?? new Error("[release-pr] gh pr create ist nach mehreren Versuchen fehlgeschlagen.");
}

async function main() {
  const base = defaultBranch();
  const branch = `chore/release-v${version}`;

  console.log(`[release-pr] base=${base} branch=${branch}`);

  sh(`git fetch origin ${base}`);
  const baseBefore = shOut(`git rev-parse origin/${base}`).trim();
  const headBefore = shOut("git rev-parse HEAD").trim();
  console.log(`[release-pr] HEAD=${headBefore} origin/${base}=${baseBefore}`);

  if (headBefore === baseBefore) {
    console.error(
      `[release-pr] HEAD (${headBefore}) ist identisch mit origin/${base} — es fehlt der Release-Commit. Prüfe prepareCmd (git add / git commit).`
    );
    process.exit(1);
  }

  sh(`git push -f origin HEAD:refs/heads/${branch}`);
  sh("git fetch origin");

  let num = prListNumber(branch);
  if (!num || num === "null") {
    await prCreateWithRetry(base, branch, version);
    num = prListNumber(branch);
  }

  if (!num || num === "null") {
    console.error("[release-pr] Konnte PR-Nummer nicht ermitteln.");
    process.exit(1);
  }

  // Kein try/catch: gh pr checks --watch exitiert mit ≠0 bei fehlgeschlagenen Checks —
  // sonst würde trotzdem gemerged (kaputter Release auf main).
  console.log(`[release-pr] Warte auf abgeschlossene PR-Checks (PR #${num}) …`);
  sh(`gh pr checks ${num} --watch`);

  const flag = mergeFlag();
  sh(`gh pr merge ${num} ${flag} --delete-branch`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
