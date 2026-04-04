# shellcheck shell=sh
# Fallback: Repo liegt unter \\wsl.localhost\…, Hook läuft mit Win-Git → npm nur in WSL.
# Nutzung: nach husky-env.sh, wenn `command -v npm` fehlschlägt:
#   . "$(git rev-parse --show-toplevel)/scripts/husky-wsl.sh"
#   husky_run_in_wsl "npm run ci:precommit"

# Git übergibt COMMIT_EDITMSG u. a. als Windows- oder UNC-Pfad; in WSL braucht commitlint einen Linux-Pfad.
husky_path_for_wsl() {
  _p=$(printf '%s' "$1" | tr '\\' '/')
  case "$_p" in
    "") printf '%s\n' "$_p"; return ;;
  esac
  case "$_p" in
    /home/* | /mnt/* | /usr/* | /opt/*)
      printf '%s\n' "$_p"
      return
      ;;
  esac
  case "$_p" in
    //wsl.localhost/*/*)
      _rest=$(printf '%s' "$_p" | sed 's|^//wsl\.localhost/[^/]*/||')
      printf '/%s\n' "$_rest"
      return
      ;;
    //wsl\$/*/*)
      _rest=$(printf '%s' "$_p" | sed 's|^//wsl\$[^/]*/||')
      printf '/%s\n' "$_rest"
      return
      ;;
  esac
  case "$_p" in
    /[a-z]/[Mm][Nn][Tt]/*)
      printf '%s\n' "$_p"
      return
      ;;
    /[a-z]/*)
      _dl=$(printf '%s' "$_p" | sed -n 's|^/\([^/]*\)/.*|\1|p')
      _rest=$(printf '%s' "$_p" | sed 's|^/[^/]*/||')
      printf '/mnt/%s/%s\n' "$_dl" "$_rest"
      return
      ;;
  esac
  case "$_p" in
    [a-zA-Z]:*)
      _d=$(printf '%s' "$_p" | cut -c1 | tr '[:upper:]' '[:lower:]')
      _rest=${_p#?:}
      printf '/mnt/%s%s\n' "$_d" "$_rest"
      return
      ;;
  esac
  printf '%s\n' "$_p"
}

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
