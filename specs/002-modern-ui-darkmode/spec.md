# Feature Specification: App shell — modernes Styling & Dark Mode (ohne Tailwind)

**Feature Branch**: `002-modern-ui-darkmode` (vormals `002-ui-tailwind-darkmode`)  
**Created**: 2026-03-28  
**Updated**: 2026-03-28  
**Status**: Draft  
**Depends on**: `001-dsa-brew-renderer` (Kern-Renderer, gehostete Routen)  
**Input**: Nutzerwunsch — **App-Chrome** modernisieren, **Dark Mode** einführen, Styling **wartbar** und **ohne** Utility-Framework (Tailwind o. Ä.) halten.

## Zielbild

Die **Bedienoberfläche** von DSABrew (Banner, Toolbars, rechtliche Seiten, Fehlerhinweise, Datenschutz-Leiste, Editor-Rahmen um die Vorschau) soll **strukturiert** über **semantische Klassen** und **CSS-Custom-Properties** (Design-Tokens) gestaltet werden, **hell/dunkel** unterstützen und einem **zeitgemäßen** UI (klare Hierarchie, konsistente Abstände, lesbare Kontraste, dezente Interaktionszustände) entsprechen.

**Ausdrücklich nicht Ziel** ist, das **gedruckte DSA-Buch-Layout** in der Vorschau oder im PDF-Export optisch „zu modernisieren“ oder dunkel einzufärben: Hintergrundgrafiken, Einband und `contracts/typography.md` im **Seiten-Canvas** bleiben für **Print/PDF-Fidelity** prioritär (siehe Abschnitt *Abgrenzung Vorschau vs. Chrome*).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Dark Mode (Priority: P1)

Als Nutzer möchte ich die Oberfläche **dunkel** oder **hell** nutzen können, damit die App bei wenig Umgebungslicht angenehm und mit ausreichend Kontrast lesbar ist.

**Independent Test**: System auf `prefers-color-scheme: dark` stellen → App-Chrome erscheint in dunkler Palette; Umschalten auf hell → heller Chrome. Optional: manueller Toggle persistiert die Wahl über Sitzungen hinweg.

**Acceptance Scenarios**:

1. **Given** `prefers-color-scheme: dark` und kein manueller Override, **When** die App lädt, **Then** der App-Chrome verwendet die **dunkle** Farbpalette (Hintergrund, Text, Rahmen, interaktive Elemente).
2. **Given** ein sichtbarer **Theme-Toggle** (falls spezifiziert), **When** der Nutzer zwischen Hell/Dunkel wechselt, **Then** der Chrome wechselt **sofort** (ohne Reload) und die Wahl bleibt nach **Reload** erhalten (z. B. `localStorage`).
3. **Given** `prefers-reduced-motion: reduce`, **When** Theme wechselt, **Then** es gibt **keine** ablenkenden Animationen (nur instant oder minimale Übergänge).

---

### User Story 2 — Strukturiertes App-Chrome-CSS (Priority: P1)

Als Entwickler:in möchte ich Farben, Abstände und Komponenten des Chrome **zentral** (Tokens / BEM-ähnliche Klassen) pflegen, damit UI-Änderungen **ohne** Utility-Framework konsistent und nachvollziehbar bleiben.

**Independent Test**: Repräsentative Screens (gehosteter Editor, Impressum, Fehlerseite) nutzen durchgängig **semantische Klassen** (z. B. `.theme-segmented`, `.hosted-doc-nav`, `.chrome-link`); kein Tailwind-Build; `npm run build` ohne Regression der Kernfunktionen.

**Acceptance Scenarios**:

1. **Given** die gebaute App, **When** typische Shell-Komponenten gerendert werden, **Then** Abmessungen, Farben und Typo des **Chrome** kommen aus **`style.css`** (Selektoren + ggf. `html.dark …`), nicht aus verteilten Inline-Styles oder einem Drittanbieter-Utility-Layer.
2. **Given** `npm run build` im Ordner `web/`, **When** der Build abgeschlossen ist, **Then** er schlägt nicht fehl; die **CSS-Gesamtgröße** bleibt im dokumentierten Zielkorridor (siehe *Success Criteria*).

---

### User Story 3 — Moderneres Erscheinungsbild (Priority: P2)

Als Nutzer möchte ich eine **aufgeräumte**, **professionelle** Oberfläche, damit ich mich auf Inhalt und Vorschau konzentrieren kann.

**Independent Test**: Visuelle Review-Checkliste (Spacing, Button-States, Fokus-Ringe, mobile Toolbar) wird abgehakt.

**Acceptance Scenarios**:

1. **Given** fokussierbare Steuerungen (Buttons, Links, Segmented Controls), **When** der Nutzer per Tastatur navigiert, **Then** sind **sichtbare Fokus-Indikatoren** vorhanden (WCAG 2.2 *Focus Visible* soweit für den Chrome anwendbar).
2. **Given** schmale Viewports, **When** die gehostete Toolbar angezeigt wird, **Then** bleiben Aktionen **bedienbar** (bestehendes responsives Verhalten wird beibehalten oder verbessert, nicht verschlechtert).

---

### Edge Cases

- **PDF-Export / Druck**: `window.print` und PDF-Rasterexport dürfen durch Theme-Änderungen am **Chrome** nicht brechen; der **Seiteninhalt** in `.preview` behält definierte Print-Styles.
- **Drittanbieter-Schrift**: Gentium wird weiter für Renderer-Inhalt geladen; UI-Schrift kann `Arial`/System-Stack bleiben — keine Layout-Sprünge im Canvas durch globale `font-family` auf `body`.
- **Hydration / FOUC**: Kurzes Aufblitzen des falschen Themes soll vermieden oder minimiert werden (z. B. Skript im `<head>`, `class` auf `<html>` vor erstem Paint — Implementierungsdetail im Plan).
- **Barrierefreiheit**: Kontrast von Chrome-Text und Flächen mindestens **WCAG 2.2 AA** für normale Schrift im Hell- und Dunkelmodus (Messung auf repräsentativen Paaren).

## Requirements *(functional)*

### UI-001 — CSS-Architektur (ohne Tailwind)

- Das Projekt `web/` **MUST NOT** Tailwind CSS (oder vergleichbare Utility-First-Compiler) als **Build-Abhängigkeit** für den App-Chrome nutzen.
- App-Chrome-Styles **MUST** in **`web/src/style.css`** (oder klar benannten, von dort importierten Teil-Dateien) liegen; **Design-Tokens** **SHOULD** als **CSS Custom Properties** auf `:root` bzw. `html.dark` abgebildet werden.
- Vite **MAY** PostCSS nur für **Autoprefixer** o. Ä. nutzen — **ohne** Tailwind-Plugin.

### UI-002 — Abgrenzung Vorschau vs. Chrome

- Styles, die das **DSA-Seitenlayout** in `.preview` (A4-Seiten, Makro-Hintergründe, `contracts/typography.md`) steuern, **SHOULD** in einem **klar benannten** Abschnitt von `style.css` verbleiben, bis eine spätere Spezifikation **explizit** eine Umstellung vorsieht.
- Dark-Mode-Regeln **MUST NOT** die **Print-/PDF-Seiten** unbeabsichtigt invertieren; `@media print` **MUST** weiterhin **helles** Seiten-Rendering erzwingen, sofern das aktuelle Produktverhalten beibehalten wird.

### UI-003 — Dark Mode — Verhalten

- Standard **MUST** `prefers-color-scheme` folgen, solange der Nutzer keinen Override gesetzt hat.
- Ein **optionaler, empfohlener** Toggle **SHOULD** die Modi **Hell / Dunkel / System** anbieten; Varianten nur **Hell/Dunkel** plus implizites System sind akzeptabel, wenn dokumentiert (`contracts/ui-shell.md`).
- Persistenz des Overrides **SHOULD** über `localStorage` (Key-Name im `contracts/ui-shell.md` festhalten).

### UI-004 — Komponentenumfang (Phase 1)

Folgende Bereiche **MUST** in Phase 1 mit strukturiertem CSS + Dark abgedeckt werden:

- Gehosteter **Banner** und **Toolbars** (`main.ts` generiertes Layout).
- **Impressum / Datenschutz** und **Fehler**-/`preview-error`-Darstellungen.
- **Privacy-Strip** (`index.html`), inkl. Dark-kompatibler Farben.

### UI-005 — Keine Regression der Kernfunktionen

- Editor, Vorschau-Sync, Teilen-Buttons, PDF-Download, Routing (`/`, `/new`, `/d/...`) **MUST** nach der Umstellung unverändert funktionieren (bestehende Tests **MUST** grün bleiben; neue Tests für Theme optional).

## Success Criteria *(measurable)*

- **SC-UI-001**: Dark und Light Chrome erfüllen auf Stichproben **Kontrast AA** (normale Schrift) für Primärtext und Primär-Button.
- **SC-UI-002**: Theme-Wechsel ohne vollständigen Reload sichtbar innerhalb **< 200 ms** nach Interaktion (subjektiv flüssig; kein Blockieren des Main-Threads durch schwere Arbeit).
- **SC-UI-003**: Produktionsbuild `web/` erhöht die **CSS-Bundle-Größe** gegenüber Ausgangslage um höchstens **+25 %**, sofern nicht durch Messung und Begründung im Plan überschrieben (sonst Nacharbeit).

## Non-Goals *(MVP dieser Spec)*

- Komplette Migration aller **~1400+** Zeilen Renderer-CSS in einen Durchgang.
- Einführung von **Tailwind**, **UnoCSS** oder vergleichbaren Utility-Build-Pipelines für den Chrome.
- Dark Mode für den **perzeptiven** Inhalt der **Pergament-/Einband-Seiten** in der Live-Vorschau (kann spätere eigene Spec sein).
- Internationalisierung der UI-Strings (außerhalb Scope).

## Out of Scope / Follow-ups

- **Storybook** oder visuelle Regressionstests — optional später.
- CSS-Präprozessoren (Sass/Less) — nur wenn im Plan begründet.

## References

- `specs/001-dsa-brew-renderer/contracts/typography.md` — Renderer-Typografie (Canvas).
- `specs/001-dsa-brew-renderer/spec.md` — FR-015 (Scroll-Verhalten Editor/Vorschau).
- `docs/hosting.md` — gehostete Routen.
