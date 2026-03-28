# Implementation Plan: Modern app shell & dark mode (vanilla CSS)

**Branch**: `002-modern-ui-darkmode` | **Date**: 2026-03-28 | **Spec**: `spec.md`  
**Parent feature**: `001-dsa-brew-renderer`

## Technical approach

### Styling stack

- **Festgelegt:** App-Chrome ausschließlich über **`web/src/style.css`** (ggf. logisch getrennte Abschnitte/Kommentar-Blöcke: *Chrome*, *Preview/Print*, *Legal*).
- **Design-Tokens:** CSS Custom Properties auf `:root` für Hell, ergänzend **`html.dark`** (oder `[data-theme="dark"]` — im Vertrag festhalten) für Dunkel — **kein** Tailwind-`@theme`, **kein** `@tailwind`-Purge.
- **Dark-Mode-Schalter:** `class="dark"` auf `<html>` (wie bisher), Selektoren `html.dark …` für dunkle Overrides.

### Dark mode strategy

- **Klasse auf `<html>`** für steuerbaren Toggle + einheitliche dunkle Selektoren.
- **Initial-Theme-Skript** (kleines Inline-Skript in `index.html`): liest `localStorage` und setzt Klasse **vor** erstem Paint, um FOUC zu reduzieren.
- **`prefers-color-scheme`**: `localStorage`-Wert **`system`** → `html` erhält `dark` nur wenn `matchMedia('(prefers-color-scheme: dark)')`; Listener bei OS-Wechsel; **`light`** / **`dark`** erzwingen explizit.

### Code changes (phased)

1. **Phase 0**: Tokens und Basis-Selektoren (`body`, `#app`, Links); sicherstellen, dass Vite **ohne** Tailwind-Plugin baut.
2. **Phase 1**: Markup in `web/src/main.ts` (Strings) auf **semantische Klassen** umstellen; doppelte Legacy-Selektoren entfernen, wo ersetzt.
3. **Phase 2**: Theme-Logik (z. B. `theme.ts` oder Abschnitt in `main.ts`), `localStorage`, Respekt für `prefers-reduced-motion`.
4. **Phase 3**: `style.css` für **hosted**-/Chrome-Bereiche aufräumen (tote Regeln nach Migration entfernen).

### Testing

- `npm run test` / `npm run build` in `web/`.
- Manuell: Hell/Dunkel, Systemwechsel, Print-Preview eines Dokuments, PDF-Export-Stichprobe.

### Risks

- **Spezifitätskonflikte** zwischen neuen Chrome-Regeln und bestehenden `.preview`-Regeln — Lösung: klare Trennung (`#app` Shell vs. `.preview`-Insel), minimale `!important`-Nutzung.
- **Wartbarkeit** ohne Framework: Konventionen in `contracts/ui-shell.md` und Kommentare in `style.css` pflegen.

### Build / Bundle (SC-UI-003)

- Nach Implementierung: `npm run build` unter `web/` und `dist/assets/index-*.css` mit dem Stand **vor** der Chrome-Modernisierung vergleichen. Liegt der Anstieg über ~25 %, gezielt Duplikate reduzieren oder Begründung im Plan dokumentieren.

## Constitution alignment (dsabrew)

- Renderer-Determinismus und Print-Fidelity: unverändert für **Seiteninhalt**; nur **Chrome** betroffen.
- Security: keine neuen externen Skripte außer bereits eingebundene Fonts.
