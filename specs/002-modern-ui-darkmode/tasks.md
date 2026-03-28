# Tasks: App shell — modern UI & dark mode (vanilla CSS)

**Feature**: `specs/002-modern-ui-darkmode`  
**Spec**: `spec.md` · **Plan**: `plan.md` · **Contract**: `contracts/ui-shell.md`  
**Date**: 2026-03-28

> Task-IDs **T201+** gelten für dieses Feature (Nachfolger der früheren T101-Serie, die Tailwind vorsah).

## Phase: Basis (ohne Utility-Framework)

- [ ] **T201** Sicherstellen, dass `web/package.json` **keine** `tailwindcss`-Abhängigkeit und **kein** Tailwind-PostCSS-Plugin enthält; Build (`npm run build`) grün.
- [ ] **T202** `web/src/style.css`: App-Chrome-Abschnitt mit **CSS Custom Properties** (Hell auf `:root`, Dunkel unter `html.dark`); FOUC-Skript in `index.html` bleibt kompatibel.
- [ ] **T203** `npm run build` und `npm run test` in `web/` grün; bei Regression dokumentieren und beheben.

## Phase: Theme-Infrastruktur (Dark / System)

- [ ] **T204** Theme nach `contracts/ui-shell.md`: `localStorage`-Key **`dsabrew-theme`** (`light` | `dark` | `system`), Hilfsfunktionen lesen/schreiben (z. B. `web/src/theme.ts` oder in `main.ts`).
- [ ] **T205** **FOUC** reduzieren: vor erstem Paint `class` auf `<html>` setzen (Inline-Skript in `index.html`), konsistent mit T204.
- [ ] **T206** Bei **`system`**: Verhalten mit `prefers-color-scheme` und `matchMedia('(prefers-color-scheme: dark)')` synchron halten; keine „klebenden“ Zustände nach OS-Wechsel.

## Phase: Chrome mit semantischem CSS

- [ ] **T207** Gehostetes Layout in `web/src/main.ts` (Banner, Toolbars, View-Controls, Footer-Nav): **semantische Klassen** + `html.dark`-Selektoren in `style.css`; keine Tailwind-Utility-Klassen in Strings.
- [ ] **T208** Rechtstexte und Fehlerblöcke (`buildLegalPageLayout`, Fehler-/`preview-error`-Markup): gleiche Konvention; `setPublicPageScroll` / Body-Klassen beibehalten.
- [ ] **T209** **`index.html`**: Privacy-Strip mit Klassen, die in `style.css` definiert sind (kein Utility-Framework).

## Phase: Interaktion, A11y, Aufräumen

- [ ] **T210** Sichtbarer **Theme-Toggle** (Hell/Dunkel; optional **System** oder implizit über erneuten Klick — wie Vertrag); sofortiger Wechsel ohne Full-Reload.
- [ ] **T211** **`prefers-reduced-motion`**: keine aufwendigen Theme-Transition-Animationen (Spec User Story 1).
- [ ] **T212** **Focus-visible** für fokussierbare Chrome-Elemente; Kontrast **SC-UI-001** auf Stichproben prüfen.
- [ ] **T213** `style.css`: ungenutzte **hosted**-/Shell-Regeln entfernen; Spezifität mit `.preview` nicht kollidieren lassen.
- [ ] **T214** **SC-UI-003**: produzierte CSS-Bundle-Größe gegen Ausgang messen; bei >25 % Anstieg Begründung in `plan.md` oder Nacharbeit.
- [ ] **T215** Doku: `docs/hosting.md` und `specs/001-dsa-brew-renderer/quickstart.md` — Zeile **UI-Theme** auf **vanilla CSS + Dark** abstimmen; Verweis auf `contracts/ui-shell.md`.

## Abnahme (manuell)

- [ ] Print-Preview / **PDF speichern**: Seiteninhalt unverändert hell/fidel; nur Chrome betroffen.
- [ ] Mobile schmale Toolbar weiter bedienbar (User Story 3).
