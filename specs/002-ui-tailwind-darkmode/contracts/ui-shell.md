# Contract: App shell — theme & tokens

**Spec**: `../spec.md` | **Status**: Draft | **Date**: 2026-03-28

## Scope

Dieses Dokument definiert **verbindliche Konventionen** für den **App-Chrome** (alles außerhalb des DSA-Seiten-Canvas in `.preview`), in Verbindung mit Tailwind und Dark Mode.

## Theme storage

| Key | Beispielwert | Semantik |
|-----|----------------|----------|
| `dsabrew-theme` | `light` \| `dark` \| `system` | Nutzer-Präferenz; `system` = kein Override, OS-`prefers-color-scheme` gilt |

*Implementierung:* Bei `system` darf **keine** persistierte `dark`-Klasse aus einem früheren Session-Zustand „kleben“, wenn das OS-Thema gewechselt wurde — entweder Klasse entfernen und auf Media Query reagieren **oder** bei `system` regelmäßig mit `matchMedia` synchronisieren (im Plan festlegen).

## HTML / CSS hooks

- **Root**: `document.documentElement` (`<html>`) trägt optional `class="dark"` für Tailwind `dark:` (bei **class**-basiertem Dark Mode).
- **Shell container**: `#app` bleibt Mount-Point; Kind-Elemente des Chrome dürfen ein Präfix `dsabrew-ui-` für zukünftige Selektoren nutzen (optional, nicht zwingend).

## Farb-Tokens (logisch)

Die konkreten Hex-Werte werden in **Tailwind theme** (`@theme` v4 oder `theme.extend` v3) abgebildet. Mindestens:

- `--color-ui-bg` — App-Hintergrund
- `--color-ui-surface` — Karten/Banner
- `--color-ui-border` — Haare Linien
- `--color-ui-text` — Primärtext
- `--color-ui-text-muted` — sekundär
- `--color-ui-accent` — primäre Aktion (Button)
- `--color-ui-accent-contrast` — Text auf Accent

**Light** und **Dark** jeweils mit AA-Kontrast für normalen Fließtext und für Text auf Accent-Button (Messung vor Merge).

## Vorschau-Insel (nicht theme-sensitiv)

- Selektoren unter `.preview` und `@media print` **SHOULD NOT** von `html.dark` abhängen für **Seitenhintergrund** und **Buch-Typografie**, außer eine spätere Spec erlaubt explizit eine „Preview dimming“-Option.

## Privacy strip

- Muss in **Light** und **Dark** lesbar sein; gleiche Token wie Banner/Surface wo möglich.

## Änderungsprozess

- Änderungen an öffentlichen Token-Namen oder `localStorage`-Keys **MUST** diese Datei und `spec.md` Success Criteria berühren.
