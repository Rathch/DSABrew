# Implementation Plan: DSABrew Markdown-to-DSA Renderer

**Branch**: `001-dsa-brew-renderer` | **Date**: 2026-03-26 (updated 2026-03-28) | **Spec**: `specs/001-dsa-brew-renderer/spec.md`  
**Input**: Feature specification from `/specs/001-dsa-brew-renderer/spec.md`

## Summary

Build a web-based Markdown editor + preview that renders DSA-styled, multi-page A4 output with explicit page semantics (`\page` and **`{{page}}`** alias), safe macro expansion, and **in-app PDF download** (html2canvas + jsPDF: one A4 page per preview page). Implement page numbers (`{{pageNumber N}}`), per-page footnotes (`{{footnote LABEL | CONTENT}}`), and an auto-generated TOC from Markdown headings (`{{tocDepthH3}}`). A new document initializes with 5 pages (cover, Impressum, two content pages, final page) and default backgrounds from packaged assets; **content pages without `\map`** use **automatic even/odd** backgrounds. The preview shows **two-column** body text with full-width headings/TOC/footnotes; the **preview pane scrolls** in the viewport, while the **editor textarea scrolls** only when its content exceeds its allocated height. Optional **browser print** (`@media print`) remains for users who prefer the system dialog.

**Öffentlicher Betrieb (FR-020ff.):** Referenzimplementierung mit **`server/`** (Fastify + SQLite), Web-Routen **`/`**, **`/new`** (neues Tab → Anlage → Redirect Bearbeiten), **`/d/:token`**, **Teilen**-Buttons (View-/Edit-URL kopieren; Edit-Token nicht in `GET` bei View-Kontext). Keine eingebaute **Offline-Demo** mit vorgefülltem Markdown auf `/`.

## Technical Context

**Language/Version**: TypeScript (ES2022)  
**Primary Dependencies**: Vite 5.x (bundling/dev server; Node 18+ compatible), **markdown-it**  
**Storage (primary product)**: SQLite via **`server/`** (`better-sqlite3`); alternative **PHP**/**file-per-doc** möglich (siehe `research.md`).  
**Storage (browser)**: Kein persistenter Local-Storage-Modus ohne API — die Startseite lädt kein Demo-Markdown.  
**Testing**: Manual PDF-export validation recommended; minimal automated tests optional; API/rate-limit tests when hosting backend lands  
**Target Platform**: Modern desktop browsers (Chrome/Edge/Firefox)  
**Project Type**: Web application + **REST API** in einem Repo; Reverse Proxy für HTTPS in Produktion  
**Performance Goals**: Typical documents render quickly; large documents (up to ~200 pages / ~100k chars) render within 15s without crash/hang  
**Constraints**: Deterministic rendering, print fidelity, strict input safety (no script execution, strip raw HTML), local assets only; hosted mode adds **HTTPS**, **rate limits**, **unguessable slugs**  
**Scale/Scope**: Prozess: anonyme Dokumenterzeugung mit Rate Limits; Rendering/Preview pro **Dokument-URL**

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Macro-First Extensibility**: All non-Markdown behavior is explicit macros with documented semantics.
- **Rendering Determinism**: Same input + assets ⇒ stable output structure/pagination behavior.
- **Print/PDF Fidelity & Page Semantics**: `\page` boundaries map to preview pages and to exported PDF sheets; backgrounds align to page coordinates for preview + PDF raster export (+ optional `window.print()`).
- **Separation of Concerns**: Renderer stays pure; UI handles input, preview, and PDF export. **Hosted mode**: Server stores/returns Markdown **strings only**; rendering remains client-side (or server calls same `renderDocument` for SSR later — optional).
- **Security & Input Safety**: Strip raw HTML; prevent script execution; macros resolve only via internal asset map. **Hosted mode**: rate limit writes; separate edit token; no slug enumeration.
- **Commit Governance**: Commit messages follow Conventional Commits.

**Post-design (2026-03-28):** Public-hosting extension does **not** violate separation of concerns if the renderer package stays free of DB/file I/O; persistence lives in a thin API layer.

## Project Structure

### Documentation (this feature)

```text
specs/001-dsa-brew-renderer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── spec.md
├── tasks.md
├── contracts/
│   ├── macros.md
│   ├── typography.md
│   └── public-documents.md   # öffentliche Dokumente / Autosave / View+Edit (optional)
└── checklists/
    ├── requirements.md
    └── security.md
```

### Source Code (repository root)

```text
web/
├── src/                # app code (renderer, UI, styles)
├── public/
│   └── dsa/            # static assets (backgrounds, frames, etc.)
└── package.json

.cursor/
specs/
media/                  # source/template images currently tracked in repo
# (Optional) .specify/ — Speckit-Skripte; in diesem Repo nicht vorhanden
```

**Structure Decision**: Single web app under `web/` with feature docs under `specs/001-dsa-brew-renderer/`. Static assets are served from a local path under `web/public/` and resolved through an explicit macro-to-asset mapping.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| N/A | N/A | N/A |

---

## Öffentliche Dokumente (FR-020–FR-027) — Umsetzung (geplant)

**Vertrag**: `contracts/public-documents.md` · **Spec**: `spec.md` (Abschnitt Public hosting)

### Phase A — Backend-Grundlage

1. **API** minimal: `POST /api/documents` (neu, Standard-Markdown), `GET /api/documents/:slug` (Lesen), `PUT /api/documents/:editSlug` (nur Edit-Token, Autosave-Body).
2. **Persistenz**: SQLite (eine Tabelle: `id`, `slug_view`, `slug_edit`, `markdown`, `created_at`, `updated_at`, `content_hash`, `is_default_content` o. Ä.) **oder** Dateien `storage/{id}.md` + SQLite nur für Slug→ID-Mapping (Variante wählen und festhalten).
3. **Slug-Generierung**: kryptografisch sicher, getrennte Werte für View und Edit.
4. **Rate limiting**: Middleware (Express/Fastify) oder PHP-Rate-Limit-Bibliothek; Grenzwerte in `research.md` notieren.

### Phase B — Frontend-Anbindung (Vite-App)

1. Routen **`/`** (Start), **`/new`** (Anlage im neuen Tab → Redirect `/d/{edit}`), **`/d/:token`** — View vs. Edit per API; Editor read-only oder Autosave-`PUT`.
2. Kein Pflicht-„Speichern“-Button; Status „Gespeichert“ optional.
3. **„+ Neues Dokument“** öffnet **`/new`** in **neuem Tab**; **Teilen** kopiert View- bzw. Edit-URL (Edit nur im Bearbeiten-Kontext).

### Phase C — TTL / Löschen

1. Hash des Markdowns mit kanonischem Standard vergleichen (Whitespace-Regel in `public-documents.md` präzisieren).
2. Aufgabe wählen: **Cron** (täglich/stündlich), **lazy** bei GET, oder **hosted scheduler** — in `research.md` begründen.

### Phase D — Betrieb

1. HTTPS, keine Slugs in Fehler-Logs mit Volltext.
2. Load-/Soak-Tests für Rate-Limit und Autosave-Spitzen (optional).

**Hinweis**: Die bestehende reine **Browser-MVP**-App bleibt lauffähig; öffentliches Hosting ist ein **zusätzlicher** Deploy-Modus mit Backend.
