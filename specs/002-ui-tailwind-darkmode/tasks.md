# Tasks: App shell — Tailwind, dark mode, modern UI

**Feature**: `specs/002-ui-tailwind-darkmode`  
**Spec**: `spec.md` · **Plan**: `plan.md` · **Contract**: `contracts/ui-shell.md`  
**Date**: 2026-03-28  

> Task-IDs **T101+** sind nur in diesem Feature eindeutig (unabhängig von `001-dsa-brew-renderer`).

## Phase: Setup (Tailwind + Build)

- [ ] **T101** Tailwind in `web/` integrieren (eine Variante festlegen: **v4 + `@tailwindcss/vite`** oder **v3 + PostCSS**), `package.json`-Abhängigkeiten, Vite-Konfiguration; gewählte Variante in `plan.md` vermerken.
- [ ] **T102** Tailwind-Einstieg: `content`-Pfade für `index.html` und `src/**/*.{ts,html}`; `@import "tailwindcss"` bzw. `@tailwind`-Direktiven; **bestehende** Renderer-Styles so einbinden, dass **UI-002** (`.preview`-Insel) nicht bricht.
- [ ] **T103** `npm run build` und `npm run test` in `web/` grün; bei Regression Abweichung dokumentieren und beheben.

## Phase: Theme-Infrastruktur (Dark / System)

- [ ] **T104** Theme nach `contracts/ui-shell.md`: `localStorage`-Key **`dsabrew-theme`** (`light` | `dark` | `system`), Hilfsfunktionen lesen/schreiben (z. B. in `web/src/theme.ts` oder in `main.ts`).
- [ ] **T105** **FOUC** reduzieren: vor erstem Paint `class` auf `<html>` setzen (Inline-Skript in `index.html` oder gleichwertig), konsistent mit T104.
- [ ] **T106** Bei **`system`**: Verhalten mit `prefers-color-scheme` und ggf. `matchMedia('(prefers-color-scheme: dark)')` synchron halten (wie im Vertrag festgehalten); keine „klebenden“ `dark`-Klassen nach OS-Wechsel.

## Phase: Chrome auf Tailwind migrieren

- [ ] **T107** Gehostetes Layout in `web/src/main.ts` (Banner, Toolbars, View-Controls, Footer-Nav): Utility-Klassen + `dark:`; Legacy-Klassen entfernen, wo ersetzt.
- [ ] **T108** Rechtstexte und Fehlerblöcke (`buildLegalPageLayout`, `preview-error`-Markup): Tailwind + Dark; `setPublicPageScroll` / Body-Klassen beibehalten.
- [ ] **T109** **`index.html`**: Privacy-Strip-Markup auf Tailwind umstellen; zugehörige Regeln in `style.css` streichen oder auf technisches Minimum reduzieren.

## Phase: Interaktion, A11y, Aufräumen

- [ ] **T110** Sichtbarer **Theme-Toggle** (mindestens Hell/Dunkel; optional **System** dritte Option) im App-Chrome; sofortiger Wechsel ohne Full-Reload.
- [ ] **T111** **`prefers-reduced-motion`**: keine aufwendigen Theme-Transition-Animationen (Spec User Story 1).
- [ ] **T112** **Focus-visible** für fokussierbare Chrome-Elemente (Buttons, Links, Segmente); Kontrast **SC-UI-001** auf Stichproben prüfen.
- [ ] **T113** `style.css`: ungenutzte **hosted**-/Shell-Regeln nach Migration entfernen; Spezifitätskonflikte mit `.preview` vermeiden (Wrapper `#app` vs. Insel).
- [ ] **T114** **SC-UI-003**: produzierte CSS-Bundle-Größe gegen Ausgang messen; bei >25 % Anstieg Begründung in `plan.md` oder Nacharbeit notieren.
- [ ] **T115** Doku: `quickstart.md` oder `docs/hosting.md` um eine Zeile **UI-Theme** (Toggle, optional) ergänzen; Verweis von `spec.md` auf erledigte Tasks optional aktualisieren.

## Abnahme (manuell)

- [ ] Print-Preview / **PDF speichern**: Seiteninhalt unverändert hell/fidel; nur Chrome betroffen.
- [ ] Mobile schmale Toolbar weiter bedienbar (User Story 3).
