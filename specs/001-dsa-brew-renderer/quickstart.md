# Quickstart: DSABrew Markdown-to-DSA Renderer

**Date**: 2026-03-26 (updated 2026-03-27)  
**Feature**: `specs/001-dsa-brew-renderer/spec.md`

## Goal

Run the web app locally, paste Markdown with macros, preview the multi-page A4 output, and export to PDF via browser print.

## Prerequisites

- **Node.js 18+** (see `web/package.json` → `engines`); the repo pins tooling compatible with Node 18 (e.g. Vite 5).
- npm (ships with Node)
- A modern browser (Chrome/Edge/Firefox)

## Run (development)

From repository root:

```bash
cd web
npm install
npm run dev
```

Then open the shown local URL in your browser (typically `http://localhost:5173`).

## UI behavior (dev shell)

- **Preview (right)**: scrolls vertically when the rendered pages exceed the viewport.
- **Editor (left)**: the textarea fills the left column; a **vertical scrollbar appears only when** the entered text is taller than the allocated input area (no extra page scroll for short text).

## Try a sample input

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

Use **PDF speichern** in the editor toolbar: the app builds a multi-page A4 PDF (one page per preview page) and triggers a download. The PDF is image-based (matches the on-screen preview; text may not be selectable). You can still use the browser’s print dialog (`Ctrl+P` / “Print”) if you prefer system printing.
