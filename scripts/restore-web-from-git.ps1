# PowerShell: im Repo-Root ausführen (z. B. \\wsl$\...\dsabrew oder lokaler Klon).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..
Write-Host "== Vorher ==" -ForegroundColor Cyan
git status -sb

git restore web/ `
  docs/hosting.md `
  specs/001-dsa-brew-renderer/quickstart.md `
  specs/001-dsa-brew-renderer/checklists/requirements.md `
  specs/002-modern-ui-darkmode/contracts/ui-shell.md `
  specs/002-modern-ui-darkmode/plan.md `
  specs/002-modern-ui-darkmode/tasks.md

if ($LASTEXITCODE -ne 0) {
  git checkout HEAD -- web/ `
    docs/hosting.md `
    specs/001-dsa-brew-renderer/quickstart.md `
    specs/001-dsa-brew-renderer/checklists/requirements.md `
    specs/002-modern-ui-darkmode/contracts/ui-shell.md `
    specs/002-modern-ui-darkmode/plan.md `
    specs/002-modern-ui-darkmode/tasks.md
}

Remove-Item -Force -ErrorAction SilentlyContinue `
  web/postcss.config.js, web/tailwind.config.js, web/src/theme.ts

Write-Host "== Nachher ==" -ForegroundColor Cyan
git status -sb
Write-Host "`nDann: cd web; npm install" -ForegroundColor Yellow
