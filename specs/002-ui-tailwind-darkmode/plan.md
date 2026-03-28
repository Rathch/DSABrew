# Implementation Plan: Tailwind, dark mode, modern app shell

**Branch**: `002-ui-tailwind-darkmode` | **Date**: 2026-03-28 | **Spec**: `spec.md`  
**Parent feature**: `001-dsa-brew-renderer`

## Technical approach

### Tailwind version

- **Empfehlung**: **Tailwind CSS v4** mit `@tailwindcss/vite` (wenn mit Vite 5 + Node 18 verifiziert) **oder** **Tailwind v3** mit `postcss` + `autoprefixer` — vor Merge **eine** Variante festlegen und in dieser Datei vermerken.
- Einstieg: `web/src/style.css` (oder neues `web/src/tailwind.css`) importiert Tailwind; **bestehende** Renderer-Regeln bleiben zunächst **unterhalb** oder in separater Importkette, um Spez **UI-002** einzuhalten.

### Dark mode strategy

- **`class` strategy** auf `<html>` (z. B. `class="dark"`) für steuerbaren Toggle + `dark:` Utilities.
- **Initial theme script** (kleines Inline-Skript in `index.html` oder früher `main.ts`-Import): liest `localStorage` und setzt Klasse **vor** erstem Paint, um FOUC zu reduzieren.
- **`prefers-color-scheme`**: Wenn kein Override, keine `dark`-Klasse setzen und stattdessen `media (prefers-color-scheme: dark)` per **`@custom-variant`** (v4) oder Tailwind **`darkMode: 'media'`** vs. `'class'` — **Entscheidung**: Hybrid oft als `class` + Standard aus System via JS beim Load; im `contracts/ui-shell.md` festhalten.

### Code changes (phased)

1. **Phase 0**: Dependencies, Vite/PostCSS-Konfiguration, Content-Globs, leere Smoke-Test-Seite optional.
2. **Phase 1**: Markup in `web/src/main.ts` (Strings) auf Tailwind-Klassen umstellen; **Privacy strip** in `index.html` + zugehörige Legacy-CSS entfernen oder auf Minimum reduzieren.
3. **Phase 2**: Theme-Toggle-Komponente (Button im Banner oder Settings-Popover), `localStorage`, Respekt für `prefers-reduced-motion`.
4. **Phase 3**: Legacy `style.css` für **hosted**- und **landing**-ähnliche Klassen aufräumen (totes CSS nach Migration entfernen).

### Testing

- `npm run test` / `npm run build` in `web/`.
- Manuell: Hell/Dunkel, Systemwechsel, Print-Preview eines Dokuments, PDF-Export-Stichprobe.

### Risks

- **Spezifitätskonflikte** zwischen Tailwind-Utilities und bestehenden `.preview`-Regeln — Lösung: klare Wrapper-Klassen (`#app` Shell vs. `.preview` Island).
- **Bundle-Größe** — bei Überschreitung von SC-UI-003: `tailwind.config` `safelist` prüfen, Purge/Content-Pfade prüfen.

## Constitution alignment (dsabrew)

- Renderer-Determinismus und Print-Fidelity: unverändert für **Seiteninhalt**; nur **Chrome** betroffen.
- Security: keine neuen externen Skripte außer bereits eingebundene Fonts (UI-Fonts optional lokal halten).
