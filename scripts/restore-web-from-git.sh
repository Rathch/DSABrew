#!/usr/bin/env bash
# Stellt getrackte Dateien unter web/ sowie die zuletzt geänderten Spec-/Doc-Dateien
# auf den Stand des letzten Commits zurück (wie vor lokalen Tailwind-/UI-Änderungen).
# Untracked Tailwind-Artefakte werden entfernt.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== Vorher =="
git status -sb

git restore web/ \
  docs/hosting.md \
  specs/001-dsa-brew-renderer/quickstart.md \
  specs/001-dsa-brew-renderer/checklists/requirements.md \
  specs/002-modern-ui-darkmode/contracts/ui-shell.md \
  specs/002-modern-ui-darkmode/plan.md \
  specs/002-modern-ui-darkmode/tasks.md \
  2>/dev/null || git checkout HEAD -- web/ \
  docs/hosting.md \
  specs/001-dsa-brew-renderer/quickstart.md \
  specs/001-dsa-brew-renderer/checklists/requirements.md \
  specs/002-modern-ui-darkmode/contracts/ui-shell.md \
  specs/002-modern-ui-darkmode/plan.md \
  specs/002-modern-ui-darkmode/tasks.md

rm -f web/postcss.config.js web/tailwind.config.js web/src/theme.ts

echo "== Nachher =="
git status -sb

echo ""
echo "Bitte einmal: cd web && npm install  (package-lock.json an package.json anpassen)"
