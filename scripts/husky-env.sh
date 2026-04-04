# Wird von .husky/* gesourct: GUI-Git / IDE starten Hooks oft ohne Login-PATH (kein nvm/npm).
# Optional: volle Pfadangabe setzen, z. B. in Windows „Umgebungsvariablen“ für deinen Benutzer:
#   HUSKY_NPM_CMD="C:\Program Files\nodejs\npm.cmd"
# (Git Bash versteht /c/Program\ Files/nodejs/npm.cmd)
# shellcheck shell=sh

# 1) Explizite Überschreibung (empfohlen, wenn GUI-Git keinen PATH hat)
# Windows: z. B. HUSKY_NPM_CMD=C:\Program Files\nodejs\npm.cmd — Backslashes normalisieren
if [ -n "${HUSKY_NPM_CMD:-}" ]; then
  _npm_cmd=$(printf '%s' "$HUSKY_NPM_CMD" | tr '\\' '/')
  _npm_dir=$(dirname "$_npm_cmd")
  PATH="$_npm_dir:$PATH"
  export PATH
fi

if command -v npm >/dev/null 2>&1; then
  :
else
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh"
  fi
fi

if ! command -v npm >/dev/null 2>&1 && command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env)"
fi

# Volta / asdf (häufig im Login-PATH, nicht im GUI-PATH)
if ! command -v npm >/dev/null 2>&1; then
  for _d in "$HOME/.volta/bin" "$HOME/.asdf/shims"; do
    if [ -d "$_d" ]; then
      PATH="$_d:$PATH"
    fi
  done
  export PATH
fi

if ! command -v npm >/dev/null 2>&1; then
  export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin"
fi

# Git for Windows: typische Installationsorte (inkl. x64/x86)
if ! command -v npm >/dev/null 2>&1; then
  for _d in \
    "/c/Program Files/nodejs" \
    "/c/Program Files (x86)/nodejs"
  do
    if [ -f "$_d/npm.cmd" ] || [ -f "$_d/npm" ] || [ -x "$_d/node.exe" ]; then
      PATH="$_d:$PATH"
      export PATH
      break
    fi
  done
fi

# Scoop (User-Installation)
if ! command -v npm >/dev/null 2>&1 && [ -d "$HOME/scoop/apps/nodejs/current" ]; then
  PATH="$HOME/scoop/apps/nodejs/current:$PATH"
  export PATH
fi

# nvm-windows: Symlinks unter AppData (Version je nach Installation)
if ! command -v npm >/dev/null 2>&1 && [ -d "$HOME/AppData/Roaming/nvm" ]; then
  PATH="$HOME/AppData/Roaming/nvm:$PATH"
  export PATH
fi

# winget / „Current User“-Installer: Node oft unter Local\Programs
if ! command -v npm >/dev/null 2>&1; then
  for _d in "$HOME/AppData/Local/Programs/node" "$HOME/AppData/Local/Microsoft/WinGet/Links"; do
    if [ -d "$_d" ]; then
      PATH="$_d:$PATH"
    fi
  done
  export PATH
fi

# Wenn node schon gefunden wird, npm oft im selben Ordner (npm.cmd)
if ! command -v npm >/dev/null 2>&1 && command -v node >/dev/null 2>&1; then
  _nd=$(dirname "$(command -v node)")
  PATH="$_nd:$PATH"
  export PATH
fi

# Kein exit hier — wenn npm fehlt, können .husky/* per scripts/husky-wsl.sh in WSL nachziehen (Cursor-GUI + nur WSL-Node).
