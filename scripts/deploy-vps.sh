#!/usr/bin/env bash
# Behelfs-Deploy auf dem VPS: Stand von Git holen, Dependencies, Web-Build, API neu starten.
# Voraussetzungen: Repo-Checkout, git remote „origin“ zeigt auf GitHub, Node/npm, sudoers für systemctl.
#
# Nutzung (als User mit Rechten auf das Repo, z. B. deployer):
#   chmod +x scripts/deploy-vps.sh
#   ./scripts/deploy-vps.sh
#
# Optional (Umgebungsvariablen):
#   DEPLOY_BRANCH=main          — Remote-Branch überschreiben; wenn unset → Default-Branch von origin (wie CI: gepuschter Branch main/master)
#   DEPLOY_SYSTEMD_UNIT=dsabrew-api — systemd-Unit der API (Default: dsabrew-api)
#   DEPLOY_PATH=/pfad/zum/repo  — Repo-Root; wenn unset: ein Verzeichnis über diesem Skript
#
# Hinweis: Entspricht dem SSH-Deploy in .github/workflows/ci.yml (reset auf origin/<Branch>, Branch = Ref des Events bzw. hier Default von origin).

set -euo pipefail

# Wie SSH-Deploy in CI: nicht-interaktive Shells haben oft kein nvm/fnm — vor npm explizit laden
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
fi
if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env)"
fi

DEPLOY_SYSTEMD_UNIT="${DEPLOY_SYSTEMD_UNIT:-dsabrew-api}"

if [[ -n "${DEPLOY_PATH:-}" ]]; then
  REPO_ROOT="$DEPLOY_PATH"
elif [[ -n "${1:-}" ]]; then
  REPO_ROOT="$1"
else
  REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

cd "$REPO_ROOT"

if type nvm >/dev/null 2>&1; then
  nvm install
  nvm use
elif command -v fnm >/dev/null 2>&1; then
  fnm use --install-if-missing 2>/dev/null || fnm use
fi
node_maj="$(node -p 'parseInt(process.versions.node,10)' 2>/dev/null || echo 0)"
if [[ "$node_maj" -lt 24 ]]; then
  echo "Fehler: Node.js 24+ nötig, aktiv: $(node -v 2>/dev/null || echo '?'). nvm/fnm siehe docs/hosting.md." >&2
  exit 1
fi

git fetch origin

# Wie CI (github.ref_name): Branch = main oder master — hier Default-Branch von origin, falls DEPLOY_BRANCH nicht gesetzt.
if [[ -z "${DEPLOY_BRANCH:-}" ]]; then
  DEPLOY_BRANCH="$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')"
  if [[ -z "$DEPLOY_BRANCH" ]]; then
    if git show-ref --verify --quiet refs/remotes/origin/main 2>/dev/null; then
      DEPLOY_BRANCH=main
    elif git show-ref --verify --quiet refs/remotes/origin/master 2>/dev/null; then
      DEPLOY_BRANCH=master
    else
      DEPLOY_BRANCH=main
    fi
  fi
fi

echo "==> Deploy: $REPO_ROOT (Branch: $DEPLOY_BRANCH)"

echo "==> git reset --hard origin/$DEPLOY_BRANCH"
git reset --hard "origin/$DEPLOY_BRANCH"

echo "==> npm ci (root, web, server)"
npm ci
npm ci --prefix web
npm ci --prefix server

echo "==> npm run build --prefix web"
npm run build --prefix web

echo "==> systemctl restart $DEPLOY_SYSTEMD_UNIT"
if ! sudo -n systemctl restart "$DEPLOY_SYSTEMD_UNIT"; then
  echo "Fehler: sudo -n systemctl restart — Passwort nötig oder keine Rechte." >&2
  echo "Auf dem Server NOPASSWD für diesen User und systemctl restart/status dieser Unit einrichten: docs/hosting.md (GitHub Actions / VPS-Deploy)." >&2
  exit 1
fi

echo "==> OK — kurz Status:"
sudo -n systemctl --no-pager status "$DEPLOY_SYSTEMD_UNIT" || true
