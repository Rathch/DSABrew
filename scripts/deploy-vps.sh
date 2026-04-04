#!/usr/bin/env bash
# Behelfs-Deploy auf dem VPS: Stand von Git holen, Dependencies, Web-Build, API neu starten.
# Voraussetzungen: Repo-Checkout, git remote „origin“ zeigt auf GitHub, Node/npm, sudoers für systemctl.
#
# Nutzung (als User mit Rechten auf das Repo, z. B. deployer):
#   chmod +x scripts/deploy-vps.sh
#   ./scripts/deploy-vps.sh
#
# Optional (Umgebungsvariablen):
#   DEPLOY_BRANCH=main          — Remote-Branch (Default: master)
#   DEPLOY_SYSTEMD_UNIT=dsabrew-api — systemd-Unit der API (Default: dsabrew-api)
#   DEPLOY_PATH=/pfad/zum/repo  — Repo-Root; wenn unset: ein Verzeichnis über diesem Skript
#
# Hinweis: Entspricht inhaltlich dem SSH-Deploy in .github/workflows/ci.yml.

set -euo pipefail

DEPLOY_BRANCH="${DEPLOY_BRANCH:-master}"
DEPLOY_SYSTEMD_UNIT="${DEPLOY_SYSTEMD_UNIT:-dsabrew-api}"

if [[ -n "${DEPLOY_PATH:-}" ]]; then
  REPO_ROOT="$DEPLOY_PATH"
elif [[ -n "${1:-}" ]]; then
  REPO_ROOT="$1"
else
  REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

cd "$REPO_ROOT"
echo "==> Deploy: $REPO_ROOT (Branch: $DEPLOY_BRANCH)"

echo "==> git fetch + reset --hard origin/$DEPLOY_BRANCH"
git fetch origin
git reset --hard "origin/$DEPLOY_BRANCH"

echo "==> npm ci (root, web, server)"
npm ci
npm ci --prefix web
npm ci --prefix server

echo "==> npm run build --prefix web"
npm run build --prefix web

echo "==> systemctl restart $DEPLOY_SYSTEMD_UNIT"
sudo -n systemctl restart "$DEPLOY_SYSTEMD_UNIT"

echo "==> OK — kurz Status:"
sudo -n systemctl --no-pager status "$DEPLOY_SYSTEMD_UNIT" || true
