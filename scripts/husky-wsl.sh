# shellcheck shell=sh
# Fallback: Repo liegt unter \\wsl.localhost\…, Hook läuft mit Win-Git → npm nur in WSL.
# Nutzung: nach husky-env.sh, wenn `command -v npm` fehlschlägt:
#   . "$(git rev-parse --show-toplevel)/scripts/husky-wsl.sh"
#   husky_run_in_wsl "npm run ci:precommit"

husky_run_in_wsl() {
  _cmd=$1
  REPO_TOP=$(git rev-parse --show-toplevel)
  WSL_DISTRO="${WSL_DISTRO:-${WSL_DISTRO_NAME:-Ubuntu}}"

  _wsl_bin=""
  if command -v wsl.exe >/dev/null 2>&1; then
    _wsl_bin=wsl.exe
  elif command -v wsl >/dev/null 2>&1; then
    _wsl_bin=wsl
  else
    echo "husky: wsl nicht gefunden — npm nur in WSL? Node für Windows installieren oder PATH setzen." >&2
    exit 127
  fi

  _wsl_cd=""
  case "$REPO_TOP" in
    //wsl.localhost/*/home/* | //wsl.localhost/*/mnt/*)
      _wsl_cd=$(echo "$REPO_TOP" | sed 's|^//wsl\.localhost/[^/]*||')
      ;;
    //wsl.localhost/*)
      _wsl_cd=$(echo "$REPO_TOP" | sed 's|^//wsl\.localhost/[^/]*||')
      ;;
    //wsl\$/*/home/* | //wsl\$/*/mnt/*)
      _wsl_cd=$(echo "$REPO_TOP" | sed 's|^//wsl\$[^/]*||')
      ;;
    /home/* | /mnt/*)
      echo "husky: npm fehlt trotz Linux-Pfad ($REPO_TOP)." >&2
      exit 127
      ;;
    *)
      echo "husky: Repo-Pfad für WSL-Fallback nicht erkannt: $REPO_TOP" >&2
      echo "  Tipp: Node für Windows installieren oder HUSKY_NPM_CMD setzen (scripts/husky-env.sh)." >&2
      exit 127
      ;;
  esac

  exec "$_wsl_bin" -d "$WSL_DISTRO" -- bash -lc "cd $(printf '%q' "$_wsl_cd") && $_cmd"
}
