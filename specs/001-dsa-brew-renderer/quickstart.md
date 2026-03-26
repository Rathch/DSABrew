# Quickstart: DSABrew Markdown-to-DSA Renderer

**Date**: 2026-03-26  
**Feature**: `specs/001-dsa-brew-renderer/spec.md`

## Goal

Run the web app locally, paste Markdown with macros, preview the multi-page A4 output, and export to PDF via browser print.

## Prerequisites

- Node.js installed (project uses TypeScript tooling)
- A modern browser (Chrome/Edge/Firefox)

## Run (development)

From repository root:

```bash
cd web
npm install
npm run dev
```

Then open the shown local URL in your browser (typically `http://localhost:5173`).

## Try a sample input

- Use `\page` to force a new page.
- Use Markdown headings (`#`, `##`, `###`) for headings (used by the TOC).
- Use `{{pageNumber 2}}` to start page numbers from 2.
- Use `{{footnote PART 2 | BORING STUFF}}` to create a per-page footnote.
- Use `{{tocDepthH3}}` to insert a table of contents (generated from headings up to H3).

## Export to PDF

Use the app’s print/export button (or browser print), then “Save as PDF”.
