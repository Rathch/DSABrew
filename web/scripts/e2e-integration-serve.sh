#!/usr/bin/env bash
# Startet Fastify (SQLite) + wartet auf /api/health, danach vite preview.
# Voraussetzung: `web/dist` existiert und wurde mit derselben VITE_PUBLIC_API_BASE gebaut
# (z. B. http://127.0.0.1:3001), damit das Frontend die API erreicht.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p "$REPO_ROOT/tmp"
export SQLITE_PATH="$REPO_ROOT/tmp/e2e-integration.db"
rm -f "$SQLITE_PATH"
export PORT="${PORT:-3001}"

cd "$REPO_ROOT/server"
npm run start &
SERVER_PID=$!
cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
if ! curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
  echo "e2e-integration-serve: Server nicht erreichbar (http://127.0.0.1:${PORT}/api/health)" >&2
  exit 1
fi

cd "$REPO_ROOT/web"
# Kein exec: Vorschau als Kindprozess, damit der im Skript gestartete API-Server nicht mit dem Shell-Ersetzen verloren geht.
npx vite preview --host 127.0.0.1 --port 4173 --strictPort
