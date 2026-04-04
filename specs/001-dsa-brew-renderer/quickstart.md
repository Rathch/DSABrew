# Quickstart: DSABrew Markdown-to-DSA Renderer

**Date**: 2026-03-26 (updated 2026-03-28)  
**Feature**: `specs/001-dsa-brew-renderer/spec.md`

## Goal

Mit **laufender API** (`server/`) und **Web-App** (`web/`) Dokumente anlegen, unter **`/d/:token`** bearbeiten oder nur lesen, Links **teilen** (Nur Ansicht / Bearbeiten) und als PDF exportieren. Es gibt **keine** eingebaute Offline-Demo und **keine** separate Startseite: Aufruf von **`/`** oder **`/new`** löst `POST /api/documents` aus und leitet zur **Bearbeiten-URL** weiter. Zusätzlich: **„+ Neues Dokument“** in der Toolbar öffnet **`/new`** in einem **neuen Tab** (weiteres Dokument, aktueller Tab bleibt unverändert).

## Prerequisites

- **Node.js**: **24+** (see root `package.json` → `engines` and `.nvmrc`; matches CI).
- npm (ships with Node)
- A modern browser (Chrome/Edge/Firefox)

## Run (development)

Zwei Terminals (API + Web):

```bash
cd server && npm install && npm run dev
```

```bash
cd web && npm install && npm run dev
```

Browser: **`http://localhost:5173/`** — legt wie **`/new`** ein Dokument an und leitet zur **Bearbeiten-URL** weiter (ersetzt die URL im aktuellen Tab). **„+ Neues Dokument“** öffnet **`/new`** in einem **neuen Tab**. Vite leitet **`/api`** an Port **3001** weiter (Proxy). Unbekannte Pfade (außer `/impressum`, `/datenschutz`) zeigen eine kurze Fehlermeldung mit Link zurück zu **`/`**.

## UI (Dokument)

- **Preview (rechts)**: scrollt bei langem Dokument.
- **Editor (links)**: Textarea; Scrollbalken nur bei viel Text.
- **+ Neues Dokument**: neuer Tab mit `/new` (weiteres Dokument).
- **Teilen: Nur Ansicht** / **Teilen: Bearbeiten**: kopiert die passende URL in die Zwischenablage (Bearbeiten-Link nur im Edit-Modus sichtbar).

## Markdown & Makros (im Dokument)

- Use `\page` or **`{{page}}`** to force a new page (equivalent semantics).
- On **cover** / **final** pages, set `\map{einband}` (or `\map{cover}`) and `\map{final}` as needed; **Impressum** after Einband: `{{impressumField …}}` (optional) + `{{impressumPage}}` — gleicher Seitenhintergrund wie Inhalt (even/odd); Defaults in `impressum-config.ts`.
- **content pages** without `\map` get **even/odd** backgrounds automatically from the **displayed** page number (see `contracts/macros.md`).
- Use Markdown headings (`#` … `####`) for the four template levels; the TOC macro still collects up to **H3** (`{{tocDepthH3}}`).
- Use `{{pageNumber 2}}` to start page numbers from 2.
- Use `{{footnote PART 2 | BORING STUFF}}` to create a per-page footnote.
- Use `{{tocDepthH3}}` to insert a table of contents (generated from headings up to H3).

## Layout

- Target preview/print uses a **two-column** body layout; headings, TOC, warnings, and footnotes span the full content width (see `spec.md` FR-014 and `contracts/macros.md`).

## Typography

- Fonts and point sizes follow **`contracts/typography.md`** (Scriptorium Word alignment: Andalus + Gentium Book Plus).
- Use `#` … `####` for the four heading levels mapped to Kapitel → Unterabschnitt.

## Export to PDF

Use **PDF speichern** in the editor toolbar: the app builds a multi-page A4 PDF (one page per preview page) and triggers a download. Tagged PDF mode adds invisible text and link annotations for copy/search; you can still use the browser’s print dialog (`Ctrl+P` / “Print”) if you prefer system printing.

## API & Deployment

Vertrag: `contracts/public-documents.md` · Betrieb: `docs/hosting.md`.

- **`POST /api/documents`** — neues Dokument; `GET /api/documents/:token` — inkl. `slugView`, `slugEdit` nur bei Bearbeiten-Kontext.
- **`VITE_PUBLIC_API_BASE`** setzen, wenn Web und API auf **verschiedenen Origins** liegen (sonst relativer `/api`-Proxy unter Vite).

Details: Rate Limits, 24h-TTL, Lazy Deletion — `research.md` (Public hosting) und `docs/hosting.md`.

**UI-Theme:** In der App-Leiste (Dokument, Impressum, Datenschutz) kann das Farbschema **System / Hell / Dunkel** gewählt werden; Umsetzung mit **reinem CSS** (`style.css`, `html.dark`). Die Wahl liegt in `localStorage` unter **`dsabrew-theme`** (siehe `specs/002-modern-ui-darkmode/contracts/ui-shell.md`).
