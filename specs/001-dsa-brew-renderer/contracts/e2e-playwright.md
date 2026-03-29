# Vertrag: End-to-End-Tests mit Playwright

**Feature**: `specs/001-dsa-brew-renderer`  
**Stand**: 2026-03-29  
**Status**: Geplant (Implementierung nachfolgend)

## 1. Ziel und Abgrenzung

| Ebene | Werkzeug | Zweck |
|--------|----------|--------|
| **Unit / Integration (Logik)** | Vitest (`web/tests/`) | Renderer, Hilfsfunktionen, schnelle Regression |
| **E2E (Browser)** | **Playwright** | Kritische Nutzerpfade in **echtem Chromium** (optional Firefox/WebKit): Routing, Editor, Vorschau, API-Anbindung, Chrome-UI |

E2E ersetzen keine Vitest-Tests; sie validieren **ganze Flows** und **DOM-Verhalten**, das sich aus Unit-Tests allein nicht verlässlich absichern lässt.

## 2. Wahl: Playwright

- **Ein Runner**, mehrere Browser-Projekte, **Trace/Screenshot/Video** bei Fehlern.
- **Gute CI-Integration** (GitHub Actions, `npx playwright install --with-deps`).
- **Stabiler** als klassisches Selenium für SPAs; **offizielle** und große Community.

Alternativen (kurz): Cypress (anderes Architekturmodell), reine Vitest-Browser-Tests (kein vollständiger E2E-Ersatz für Multi-Page/API).

## 3. Adressierung: `id` vs. `data-testid`

### 3.1 Prinzipien

1. **Bestehende stabile `id`-Attribute** (z. B. `#app`, `#markdown-input`, `#preview`, `#hosted-new-btn`) bleiben **primäre** Anker für Tests und Produktcode — **nicht** ohne Grund umbenennen.
2. **Zusätzlich** werden **`data-testid`-Attribute** eingeführt, wo:
   - es **kein** sinnvolles `id` gibt (Wrapper, Layout),
   - **Klassen** sich ändern können (Styling-Refactors),
   - **mehrere ähnliche Elemente** vorkommen (Toolbar-Gruppen).
3. **Namenskonvention**: `data-testid="dsabrew-<bereich>-<rolle>"`  
   - `bereich`: z. B. `chrome`, `editor`, `preview`, `hosted`, `legal`, `privacy`  
   - `rolle`: z. B. `root`, `textarea`, `toolbar`, `banner`, `view-controls`  
   Beispiele: `dsabrew-editor-root`, `dsabrew-preview-root`, `dsabrew-hosted-banner`.

### 3.2 Bestehende stabile Selektoren (ohne Änderung nutzbar)

Diese können in Playwright **direkt** verwendet werden (`#…` oder `[data-theme-btn]`):

| Selektor | Bedeutung |
|----------|-----------|
| `#app` | React/Vite-Mount (Shell) |
| `#dsabrew-privacy-strip`, `#privacy-strip-dismiss` | Privacy-Hinweis (`index.html`) |
| `#markdown-input` | Markdown-Textarea |
| `#preview` | Vorschau-Container |
| `#md-toolbar` | Toolbar-Container |
| `#save-status` | Autosave-/Feedback-Zeile |
| `#hosted-new-btn` | „Neues Dokument“ |
| `#share-view-btn`, `#share-edit-btn` | Teilen (hosted) |
| `#pdf-btn-banner` | PDF speichern |
| `#hosted-view-layout`, `#hosted-view-md`, `#hosted-view-preview` | Ansicht-Umschaltung |
| `#scroll-link-toggle` | Scroll koppeln |
| `[data-theme-btn="light" \| "dark"]` | Theme (bereits vorhanden) |

### 3.3 Geplante `data-testid`-Ergänzungen (Implementierung Phase 2)

| Ort (Datei / Struktur) | `data-testid` | Bemerkung |
|------------------------|---------------|-----------|
| `index.html` → `#app` | `dsabrew-app` | Zusätzlich zum `id="app"` (optional, falls `#app` in Tests nicht reicht) |
| `buildDocumentLayout` → `<main class="layout …">` | `dsabrew-hosted-main` | Hosted-Layout-Root |
| `buildDocumentLayout` → `<section class="editor …">` | `dsabrew-editor-section` | Editor-Bereich |
| `buildDocumentLayout` → `<section class="preview" id="preview">` | `dsabrew-preview-root` | Redundant zu `#preview`, für einheitliches `getByTestId` |
| `buildDocumentLayout` → `.hosted-banner` | `dsabrew-hosted-banner` | Kopfzeile hosted |
| `buildDocumentLayout` → `.hosted-doc-nav` | `dsabrew-hosted-doc-nav` | Toolbar-Navigation |
| `theme.ts` → `.theme-segmented` | `dsabrew-theme-segmented` | Theme-Cluster (ergänzt zu `data-theme-btn`) |
| `siteChromeFooter` / Legal-Seiten | `dsabrew-site-footer` | Footer mit Links (optional) |
| Markdown-Toolbar generierte Buttons | `data-testid` pro Gruppe (später) | Nur wenn Toolbar-Buttons einzeln angesprochen werden sollen; sonst zunächst `#md-toolbar` + Rollen |

**Hinweis:** Vorschau-Inhalt (`.a4-page`, Überschriften) bleibt **inhaltsabhängig**; E2E sollten **mindestens** ` #preview .a4-page` oder erste Überschrift prüfen, nicht fragile Texte aus dem Default-Dokument, wenn möglich.

## 4. Test-Szenarien (Priorität)

### P0 – Smoke (ohne API)

1. **Start**: `GET /` → Shell lädt, `#app` sichtbar, kein konsolenweiter Fatal-Error.
2. **Privacy-Strip** (falls nicht dismissed): Strip sichtbar oder Dismiss klickbar (`#privacy-strip-dismiss`).
3. **Theme**: Theme-Buttons vorhanden (`[data-theme-btn]`).

### P1 – Editor + Vorschau (lokal / mit Mock-API)

4. **Textarea + Preview**: `#markdown-input` fokussieren, kurzen Text eingeben, in `#preview` erscheint gerenderter Inhalt (Timeout).
5. **PDF-Button**: Klick auf `#pdf-btn-banner` löst erwarteten Ablauf aus (Download-Dialog oder Fehlerhinweis — je nach CI-Umgebung ggf. nur „kein Throw“).

### P2 – Gehostetes Dokument (API nötig)

6. **Dokument anlegen**: `POST /api/documents` (oder Flow `/new`) → Redirect/Edit-URL mit `/d/:token`.
7. **Autosave**: `#save-status` wechselt oder Netzwerk-Request zu `PUT` (Route aus `contracts/public-documents.md`).
8. **View vs. Edit**: Slug Nur-Ansicht vs. Bearbeiten; Textarea `readOnly` im View-Modus.

Tests der Stufe P2 laufen nur, wenn in CI ein **Server** (`server/`) und **DB**/Storage bereitgestellt werden (siehe Abschnitt 6).

## 5. Implementierungsplan (Phasen)

### Phase 0 – Vorbereitung (Repo)

- [ ] Playwright als **devDependency** im Paket `web/` (oder Root — konsistent mit Lint-Setup).
- [ ] `playwright.config.ts`: `testDir: e2e/` (oder `web/e2e/`), `baseURL` aus `process.env` oder `http://127.0.0.1:5173`.
- [ ] Skripte: `npm run test:e2e`, `npm run test:e2e:ui` (optional).
- [ ] `.gitignore`: `playwright-report/`, `test-results/`, `blob-report/` (Playwright-Default).

### Phase 1 – `data-testid` im UI (dieses Repo)

- [ ] `data-testid` gemäß Tabelle 3.3 in `main.ts` / `index.html` / `theme.ts` ergänzen (mindestens `dsabrew-hosted-main`, `dsabrew-editor-section`, `dsabrew-preview-root`, `dsabrew-hosted-banner`).
- [ ] Kurz im **UI-Shell-Vertrag** (`specs/002-modern-ui-darkmode/contracts/ui-shell.md`) verweisen oder eine Zeile „Test-IDs“ ergänzen.

### Phase 2 – Erste Playwright-Tests

- [ ] `e2e/smoke.spec.ts`: Laden von `/`, Sichtbarkeit `#app` (und optional `getByTestId('dsabrew-app')` falls gesetzt).
- [ ] `e2e/editor.spec.ts`: Eingabe in `#markdown-input`, Assertion auf Inhalt in `#preview`.

### Phase 3 – CI

- [ ] GitHub Actions: Job **„E2E“** oder Schritt im Web-Job nach `npm run build` **oder** gegen `vite preview` + `webServer` in Playwright.
- [ ] Browser-Binaries: `npx playwright install --with-deps` (Ubuntu).

### Phase 4 – API-abhängige Flows

- [ ] Docker-Compose oder Job-Matrix: Server starten, `VITE_PUBLIC_API_BASE` setzen, Tests aus Abschnitt 4 P2.

## 6. CI und Umgebungsvariablen

| Variable | Zweck |
|----------|--------|
| `PLAYWRIGHT_BASE_URL` | Basis-URL der Web-App (z. B. `http://127.0.0.1:4173` nach `vite preview`) |
| `VITE_PUBLIC_API_BASE` | Muss zur Test-API zeigen, wenn Flows `/api/...` nutzen |

**Empfehlung:** Zuerst E2E gegen **`vite preview`** + statische Routen; API-Flows in einem **gesonderten** Job mit `working-directory: server` und Healthcheck.

## 7. Referenzen

- Playwright: https://playwright.dev/
- Öffentliche Dokumente / API: `contracts/public-documents.md`
- UI-Shell: `specs/002-modern-ui-darkmode/contracts/ui-shell.md`
