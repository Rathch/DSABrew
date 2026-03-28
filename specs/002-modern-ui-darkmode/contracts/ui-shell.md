# Contract: App shell — theme & tokens (vanilla CSS)

**Spec**: `../spec.md` | **Status**: Draft | **Date**: 2026-03-28  
**Updated**: 2026-03-28 — **ohne Tailwind**; Tokens und Selektoren in **`style.css`**.

## Scope

Dieses Dokument definiert **verbindliche Konventionen** für den **App-Chrome** (alles außerhalb des DSA-Seiten-Canvas in `.preview`), mit **`html.dark`** und **CSS Custom Properties** (kein Utility-CSS-Framework).

## Theme storage

| Key | Beispielwert | Semantik |
|-----|----------------|----------|
| `dsabrew-theme` | `light` \| `dark` \| `system` | Nutzer-Präferenz; `system` = kein Override, OS-`prefers-color-scheme` gilt |

*Implementierung:* Bei **`system`** setzt die App `html.dark` aus `matchMedia('(prefers-color-scheme: dark)')` und hört auf **`change`** am selben MediaQueryList, um ohne Reload zu synchronisieren. FOUC: Inline-Skript in `web/index.html` (vor Paint) spiegelt dieselbe Logik.

## HTML / CSS hooks

- **Root**: `document.documentElement` (`<html>`) trägt optional **`class="dark"`** für dunkle UI-Regeln (Selektoren **`html.dark …`** in `style.css`).
- **Shell container**: `#app` bleibt Mount-Point; Kind-Elemente des Chrome nutzen **semantische Klassen** (z. B. `.hosted-banner`, `.theme-segmented`, `.chrome-link`).

## Design-Tokens

Konkrete Werte werden als **CSS Custom Properties** in `style.css` gepflegt, z. B.:

- Auf **`:root`** (Hell): `--color-ui-bg`, `--color-ui-surface`, `--color-ui-border`, `--color-ui-text`, `--color-ui-text-muted`, `--color-ui-accent`, `--color-ui-on-accent` (Namen können leicht variieren, müssen im Code konsistent sein).
- Unter **`html.dark`** dieselben Namen **überschreiben** oder ergänzende Variablen setzen.

Mindestanforderung: **Light** und **Dark** jeweils mit **AA-Kontrast** für normalen Fließtext und für Text auf primärem Button (Messung vor Merge).

*Kein* Tailwind-`theme.extend` — nur natives CSS.

## Vorschau-Insel (nicht theme-sensitiv)

- Selektoren unter `.preview` und `@media print` **SHOULD NOT** den Seitenhintergrund der DSA-Seiten **unbeabsichtigt** durch `html.dark` invertieren, außer eine spätere Spec erlaubt explizit eine „Preview dimming“-Option.

## Privacy strip

- Muss in **Light** und **Dark** lesbar sein; gleiche Token/Selektor-Konvention wie übriger Chrome (`style.css`).

## Änderungsprozess

- Änderungen an öffentlichen Token-Namen oder `localStorage`-Keys **MUST** diese Datei und `spec.md` Success Criteria berühren.
