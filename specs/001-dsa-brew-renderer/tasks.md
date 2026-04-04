# Tasks: DSABrew Markdown-to-DSA Renderer

**Feature**: `specs/001-dsa-brew-renderer`  
**Date**: 2026-03-27 (updated 2026-03-28)

## Phase: Setup

- [X] **T001** Web-App unter `web/` mit Vite, TypeScript, Abhängigkeiten (`markdown-it`, `vitest`)
- [X] **T002** Statische DSA-Hintergrundbilder nach `web/public/dsa/` (FR-013a: image13/14, 12, 17, 32)
- [X] **T003** `.gitignore` um `node_modules/`, `dist/`, Logs ergänzen

## Phase: Tests (Security & Kernverhalten)

- [X] **T004** Vitest-Tests: XSS/HTML-Escape, `javascript:`-Links, unbekannte/malformed `\map`
- [X] **T005** Vitest-Tests: leere Eingabe → eine Seite; `{{pageNumber N}}`; TOC/Fußnoten-Grundpfad

## Phase: Core

- [X] **T006** Markdown-Rendering ohne Raw-HTML; Link-Validierung
- [X] **T007** `\page`, `{{pageNumber N}}`, `{{footnote …}}`, `{{tocDepthH3}}`, `\map`/`\rauten` mit Allowlist und Warnungen
- [X] **T008** Map-Keys gemäß Spec (`einband`/`cover`, `content-even`, `content-odd`, `final`) → lokale Assets
- [X] **T009** Neues Dokument: genau **5** Seiten mit Default-Hintergründen (FR-013 / FR-013a)

## Phase: Integration

- [X] **T010** Editor + Live-Preview + PDF-Download (`html2canvas` + `jspdf`, eine Seite pro `.a4-page`)
- [X] **T011** Print-CSS (optional `Strg+P`): Seitenumbrüche; PDF-Export spiegelt die Vorschau

## Phase: Polish

- [X] **T012** `npm run test` grün; Quickstart (`cd web && npm install && npm run dev`) konsistent
- [X] **T013** Spezifikation: FR-014–FR-017, Clarifications 2026-03-27 (`spec.md`)
- [X] **T014** Verträge: `{{page}}`, Map-Keys, Auto-Even/Odd, Layout, Fußnote (`contracts/macros.md`)
- [X] **T015** Quickstart: Node 18+, Vite 5, UI-Scroll, Layout (`quickstart.md`)
- [X] **T016** Plan & Research: technische Entscheidungen nachziehen (`plan.md`, `research.md`)
- [X] **T017** Datenmodell: effektiver `mapKey`, Chrome-Klassen, Fußnote (`data-model.md`)
- [X] **T018** Root-`README.md` bleibt mit Specs konsistent (siehe Repo-README)
- [X] **T019** Typografie-Vertrag + CSS (`contracts/typography.md`, `web/index.html`, `style.css`), Spec FR-018
- [X] **T020** Impressum-Seite: `impressum-config.ts`, `{{impressumPage}}`, `\map{impressum}`, Spec FR-013/019, Default-5-Seiten-Dokument

## Phase: Öffentliche Dokumente (optional, FR-020–FR-027)

- [X] **T021** Vertrag `contracts/public-documents.md` und Spec-FRs in `spec.md` abgleichen (bei Änderungen der API nachziehen)
- [X] **T022** Backend wählen (Node/TS oder PHP): SQLite oder Dateiablage, `POST`/`GET`/`PUT`, getrennte View-/Edit-Slugs
- [X] **T023** Rate limiting für `POST` und `PUT`; Grenzwerte dokumentieren (`research.md`)
- [X] **T024** Client: Route `/d/:slug`, Autosave (Debounce + `beforeunload`/Beacon), kein Pflicht-Speichern-Button; View-only vs. Edit
- [X] **T025** TTL 24 h für unverändertes Standarddokument; Job **oder** lazy deletion — dokumentierte Strategie
- [X] **T026** Deployment-Doku: HTTPS, Umgebungsvariablen, Speicherpfad (`quickstart.md` oder eigenes `docs/hosting.md`)

## Phase: E2E (Playwright)

**Vertrag / Plan:** `contracts/e2e-playwright.md` (inkl. `data-testid`-Konvention und Phasen 0–4).

- [x] **T027** Playwright im Web-Paket einrichten (`playwright.config.ts`, Ordner `e2e/`, Skripte `test:e2e` / `test:e2e:ci`, CI in `.github/workflows/ci.yml`)
- [ ] **T028** `data-testid` gemäß Vertrag in `main.ts` / `index.html` / `theme.ts` (mindestens: hosted-main, editor-section, preview-root, hosted-banner; optional weitere aus Tabelle 3.3)
- [ ] **T029** Smoke-E2E: App lädt (`/`), `#app` sichtbar; optional Privacy-Dismiss
- [ ] **T030** Editor-E2E: Eingabe in `#markdown-input`, sichtbarer Inhalt in `#preview`
- [ ] **T031** CI: E2E-Job oder Schritt (z. B. `vite preview` + Playwright `webServer`) auf `main`/`master`
- [ ] **T032** (optional) API-E2E: Dokument anlegen/Autosave mit laufendem `server/` und `VITE_PUBLIC_API_BASE`
