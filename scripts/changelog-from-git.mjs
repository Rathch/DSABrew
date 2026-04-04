#!/usr/bin/env node
/**
 * Liest `git log` und schreibt/aktualisiert den Changelog-Block für die Gesamthistorie.
 * Ausführung im Repo-Root: `node scripts/changelog-from-git.mjs`
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const CHANGELOG = resolve(root, "CHANGELOG.md");

function gitLog() {
  return execSync("git log --reverse --pretty=format:%H%x09%s", {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  })
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf("\t");
      const hash = line.slice(0, tab);
      const subject = line.slice(tab + 1);
      return { hash, short: hash.slice(0, 7), subject };
    });
}

/** Konventionelles Präfix ohne vollständigen Parser */
function convoType(subject) {
  const m = subject.match(
    /^(\w+)(?:\([^)]*\))?!?:\s*/
  );
  if (!m) {
    return "other";
  }
  const t = m[1].toLowerCase();
  if (
    [
      "feat",
      "fix",
      "chore",
      "docs",
      "style",
      "refactor",
      "perf",
      "test",
      "build",
      "ci"
    ].includes(t)
  ) {
    return t;
  }
  return "other";
}

function hasBreaking(subject) {
  return (
    /^(\w+)(?:\([^)]*\))!:/.test(subject) ||
    subject.includes("BREAKING CHANGE")
  );
}

/**
 * Versionsnummer aus der Historie (ohne Tags): `0.<minor>.<patch>`
 * - `minor` = Anzahl der Commits mit Typ `feat`
 * - `patch` = Anzahl aller übrigen konventionellen Commits (fix, chore, docs, …) und `other`
 * - mindestens ein Breaking (`!` / BREAKING CHANGE) → `1.0.0` (Major-Sprung, Zähler zurückgesetzt)
 */
function deriveVersion(commits) {
  let breaking = 0;
  let feats = 0;
  let rest = 0;
  for (const { subject } of commits) {
    if (hasBreaking(subject)) {
      breaking++;
      continue;
    }
    if (convoType(subject) === "feat") {
      feats++;
    } else {
      rest++;
    }
  }
  if (breaking > 0) {
    return "1.0.0";
  }
  return `0.${feats}.${rest}`;
}

function renderChangelog(commits, version, dateIso) {
  const byType = new Map();
  for (const t of [
    "feat",
    "fix",
    "chore",
    "docs",
    "style",
    "perf",
    "refactor",
    "test",
    "ci",
    "build",
    "other"
  ]) {
    byType.set(t, []);
  }
  for (const c of commits) {
    const t = convoType(c.subject);
    const list = byType.get(byType.has(t) ? t : "other");
    list.push(c);
  }

  let out = "";
  out += `## [${version}] - ${dateIso}\n\n`;
  out += `Automatisch aus \`git log --reverse\` erzeugt (**${commits.length}** Commits). `;
  out += `Version **${version}**: Minor = Anzahl \`feat\`, Patch = Anzahl aller übrigen konventionellen Commits; bei Breaking → \`1.0.0\`.\n\n`;

  out += `### Nach Typ (gruppiert)\n\n`;
  for (const [type, items] of byType) {
    if (items.length === 0) {
      continue;
    }
    out += `#### ${type}\n\n`;
    for (const { short, subject } of items) {
      out += `- \`${short}\` ${subject}\n`;
    }
    out += "\n";
  }

  out += `### Chronologisch (älteste zuerst, alle Commit-Betreffzeilen)\n\n`;
  let i = 1;
  for (const { short, subject } of commits) {
    out += `${i}. \`${short}\` ${subject}\n`;
    i++;
  }
  out += "\n";
  return out;
}

function main() {
  const commits = gitLog();
  if (commits.length === 0) {
    console.error("[changelog-from-git] Keine Commits gefunden.");
    process.exit(1);
  }
  const version = deriveVersion(commits);
  const dateIso = new Date().toISOString().slice(0, 10);

  const block = renderChangelog(commits, version, dateIso);

  let existing = "";
  try {
    existing = readFileSync(CHANGELOG, "utf8");
  } catch {
    /* neu */
  }

  const header = `# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden in dieser Datei festgehalten.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionsnummern folgen [Semantic Versioning](https://semver.org/lang/de/).

Der Abschnitt **„Gesamthistorie (Git)“** wird mit \`node scripts/changelog-from-git.mjs\` aus dem Git-Verlauf neu geschrieben.

## [Unreleased]

`;

  const marker = "<!-- AUTO:CHANGELOG_GIT_START -->";
  const markerEnd = "<!-- AUTO:CHANGELOG_GIT_END -->";
  const wrapped = `${marker}\n${block}${markerEnd}`;

  let next;
  if (existing.includes(marker)) {
    next = existing.replace(
      new RegExp(
        `${marker}[\\s\\S]*?${markerEnd}`,
        "m"
      ),
      wrapped
    );
  } else {
    next = `${header}\n${wrapped}\n`;
  }

  writeFileSync(CHANGELOG, next, "utf8");
  console.log(
    `[changelog-from-git] ${commits.length} Commits → Version ${version} (ableiten), CHANGELOG.md aktualisiert.`
  );
}

main();
