#!/usr/bin/env bash
# Lokal Images bauen, nach GHCR pushen, Compose auf den Server kopieren und den Stack neu starten.
#
#   ./deploy/deploy.sh                bauen, pushen, Server-Update
#   ./deploy/deploy.sh --build-only   nur Images bauen
#   ./deploy/deploy.sh --push         bauen und pushen
#   ./deploy/deploy.sh --remote-only  nur Server (Images liegen schon auf GHCR)
#
# Umgebung:
#   DEPLOY_SSH       SSH-Ziel, Default server_np
#   DEPLOY_DIR       App-Verzeichnis auf dem Server, Default /opt/apps/dsabrew
#   APP_IMAGE_REPO   Default ghcr.io/rathch/dsabrew
#   WEB_IMAGE_REPO   Default ghcr.io/rathch/dsabrew-web
#   GHCR_USER        optional, Server-Login für private Images
#   GHCR_TOKEN       optional, zusammen mit GHCR_USER
#   DEPLOY_ALLOW_DIRTY=1  auch bei uncommitteten Änderungen an getrackten Dateien

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APP_IMAGE_REPO="${APP_IMAGE_REPO:-ghcr.io/rathch/dsabrew}"
WEB_IMAGE_REPO="${WEB_IMAGE_REPO:-ghcr.io/rathch/dsabrew-web}"
DEPLOY_SSH="${DEPLOY_SSH:-server_np}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/apps/dsabrew}"
MODE="all"

usage() {
  cat <<'EOF'
Lokal Images bauen, nach GHCR pushen, auf dem Server pullen und den Stack neu starten.

  ./deploy/deploy.sh                 bauen, pushen, Server-Update
  ./deploy/deploy.sh --build-only    nur Images bauen
  ./deploy/deploy.sh --push          bauen und pushen
  ./deploy/deploy.sh --remote-only   nur Server (Images liegen schon auf GHCR)
EOF
}

for arg in "$@"; do
  case "$arg" in
    --build-only) MODE="build" ;;
    --push) MODE="push" ;;
    --remote-only) MODE="remote" ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unbekanntes Argument: $arg" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ "$MODE" != "remote" ]; then
  if ! git diff --quiet -- || ! git diff --cached --quiet --; then
    if [ "${DEPLOY_ALLOW_DIRTY:-0}" != "1" ]; then
      echo "Getrackte Dateien sind uncommittet. Erst committen oder DEPLOY_ALLOW_DIRTY=1 setzen." >&2
      exit 1
    fi
    echo "Warnung: uncommittete Änderungen gehen ins Image, der Tag bleibt der letzte Commit-SHA." >&2
  fi
fi

SHA="$(git rev-parse HEAD)"
APP_IMAGE="${APP_IMAGE_REPO}:sha-${SHA}"
WEB_IMAGE="${WEB_IMAGE_REPO}:sha-${SHA}"
APP_LATEST="${APP_IMAGE_REPO}:latest"
WEB_LATEST="${WEB_IMAGE_REPO}:latest"

for tag in "$APP_IMAGE" "$WEB_IMAGE" "$APP_LATEST" "$WEB_LATEST"; do
  if [[ ! "$tag" =~ ^[a-zA-Z0-9._/:@-]+$ ]]; then
    echo "Ungültiger Image-Tag: ${tag}" >&2
    exit 1
  fi
done

build_images() {
  echo "Baue ${APP_IMAGE}"
  docker build \
    --file Dockerfile \
    --build-arg VCS_REF="${SHA}" \
    --tag "${APP_IMAGE}" \
    --tag "${APP_LATEST}" \
    .
  echo "Baue ${WEB_IMAGE}"
  docker build \
    --file Dockerfile.web \
    --build-arg VCS_REF="${SHA}" \
    --tag "${WEB_IMAGE}" \
    --tag "${WEB_LATEST}" \
    .
}

push_images() {
  echo "Pushe ${APP_IMAGE} und ${WEB_IMAGE}"
  docker push "${APP_IMAGE}"
  docker push "${APP_LATEST}"
  docker push "${WEB_IMAGE}"
  docker push "${WEB_LATEST}"
  echo "Warte, bis GHCR die sha-Tags ausliefert …"
  ready_app=0
  ready_web=0
  for _ in $(seq 1 20); do
    if [ "$ready_app" -ne 1 ] && docker manifest inspect "${APP_IMAGE}" >/dev/null 2>&1; then
      ready_app=1
    fi
    if [ "$ready_web" -ne 1 ] && docker manifest inspect "${WEB_IMAGE}" >/dev/null 2>&1; then
      ready_web=1
    fi
    if [ "$ready_app" -eq 1 ] && [ "$ready_web" -eq 1 ]; then
      return 0
    fi
    sleep 2
  done
  echo "GHCR liefert ${APP_IMAGE} oder ${WEB_IMAGE} noch nicht." >&2
  exit 1
}

SSH_CTL=""
ssh_cmd() {
  if [ -n "$SSH_CTL" ]; then
    ssh -o ControlPath="$SSH_CTL" "$DEPLOY_SSH" "$@"
  else
    ssh "$DEPLOY_SSH" "$@"
  fi
}

scp_cmd() {
  if [ -n "$SSH_CTL" ]; then
    scp -o ControlPath="$SSH_CTL" "$@"
  else
    scp "$@"
  fi
}

cleanup_ssh() {
  if [ -n "$SSH_CTL" ]; then
    ssh -O exit -o ControlPath="$SSH_CTL" "$DEPLOY_SSH" >/dev/null 2>&1 || true
    rm -f "$SSH_CTL"
  fi
}

remote_up() {
  echo "SSH ${DEPLOY_SSH} (${DEPLOY_DIR}) …"
  SSH_CTL="${XDG_RUNTIME_DIR:-/tmp}/dsabrew-ssh-$$"
  if ssh -fN -o ControlMaster=yes -o ControlPath="$SSH_CTL" -o ControlPersist=20m -o ConnectTimeout=15 "$DEPLOY_SSH"; then
    trap cleanup_ssh EXIT
  else
    SSH_CTL=""
    echo "Kein SSH-Multiplex, jede Remote-Aktion öffnet eine eigene Verbindung." >&2
  fi

  ssh_cmd mkdir -p "$DEPLOY_DIR"
  echo "Kopiere Compose-Datei nach ${DEPLOY_DIR}"
  scp_cmd "${ROOT}/deploy/docker-compose.prod.yml" "${DEPLOY_SSH}:${DEPLOY_DIR}/docker-compose.prod.yml"

  if ! ssh_cmd test -f "${DEPLOY_DIR}/.env"; then
    echo ".env fehlt auf dem Server: ${DEPLOY_DIR}/.env" >&2
    exit 1
  fi

  echo "Server: pull und recreate (${APP_IMAGE})"
  ssh_cmd \
    env IMAGE="$APP_IMAGE" WEB_IMAGE="$WEB_IMAGE" DEPLOY_DIR="$DEPLOY_DIR" \
    GHCR_USER="${GHCR_USER:-}" GHCR_TOKEN="${GHCR_TOKEN:-}" \
    bash -s <<'REMOTE'
set -euo pipefail
cd "$DEPLOY_DIR"

if [ -n "${GHCR_USER}" ] && [ -n "${GHCR_TOKEN}" ]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
fi

wanted_image="$IMAGE"
wanted_web="$WEB_IMAGE"
set -a
# shellcheck disable=SC1091
[ -f .env ] && . ./.env
set +a
IMAGE="$wanted_image"
WEB_IMAGE="$wanted_web"
export IMAGE WEB_IMAGE
edge_net="${TRAEFIK_NETWORK:-proxy}"
if ! docker network inspect "$edge_net" >/dev/null 2>&1; then
  echo "Docker-Netzwerk '$edge_net' fehlt — wird angelegt."
  docker network create "$edge_net"
fi

docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker image prune -f
echo "Stack läuft mit ${IMAGE} und ${WEB_IMAGE}"
REMOTE
}

case "$MODE" in
  build)
    build_images
    ;;
  push)
    build_images
    push_images
    ;;
  remote)
    remote_up
    ;;
  all)
    build_images
    push_images
    remote_up
    ;;
esac
