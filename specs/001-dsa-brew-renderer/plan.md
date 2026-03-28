# Implementation Plan: DSABrew Markdown-to-DSA Renderer

**Branch**: `001-dsa-brew-renderer` | **Date**: 2026-03-26 (updated 2026-03-27) | **Spec**: `specs/001-dsa-brew-renderer/spec.md`  
**Input**: Feature specification from `/specs/001-dsa-brew-renderer/spec.md`

## Summary

Build a web-based Markdown editor + preview that renders DSA-styled, multi-page A4 output with explicit page semantics (`\page` and **`{{page}}`** alias), safe macro expansion, and **in-app PDF download** (html2canvas + jsPDF: one A4 page per preview page). Implement page numbers (`{{pageNumber N}}`), per-page footnotes (`{{footnote LABEL | CONTENT}}`), and an auto-generated TOC from Markdown headings (`{{tocDepthH3}}`). A new document initializes with 5 pages (cover, Impressum, two content pages, final page) and default backgrounds from packaged assets; **content pages without `\map`** use **automatic even/odd** backgrounds. The preview shows **two-column** body text with full-width headings/TOC/footnotes; the **preview pane scrolls** in the viewport, while the **editor textarea scrolls** only when its content exceeds its allocated height. Optional **browser print** (`@media print`) remains for users who prefer the system dialog.

## Technical Context

**Language/Version**: TypeScript (ES2022)  
**Primary Dependencies**: Vite 5.x (bundling/dev server; Node 18+ compatible), **markdown-it**  
**Storage**: N/A (in-memory in the browser for MVP)  
**Testing**: Manual PDF-export validation recommended; minimal automated tests optional  
**Target Platform**: Modern desktop browsers (Chrome/Edge/Firefox)  
**Project Type**: Web application (single repository)  
**Performance Goals**: Typical documents render quickly; large documents (up to ~200 pages / ~100k chars) render within 15s without crash/hang  
**Constraints**: Deterministic rendering, print fidelity, strict input safety (no script execution, strip raw HTML), local assets only  
**Scale/Scope**: Single-user, local/offline-friendly preview and printing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Macro-First Extensibility**: All non-Markdown behavior is explicit macros with documented semantics.
- **Rendering Determinism**: Same input + assets ⇒ stable output structure/pagination behavior.
- **Print/PDF Fidelity & Page Semantics**: `\page` boundaries map to preview pages and to exported PDF sheets; backgrounds align to page coordinates for preview + PDF raster export (+ optional `window.print()`).
- **Separation of Concerns**: Renderer stays pure; UI handles input, preview, and PDF export.
- **Security & Input Safety**: Strip raw HTML; prevent script execution; macros resolve only via internal asset map.
- **Commit Governance**: Commit messages follow Conventional Commits.

Status: No violations required.

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
│   └── typography.md
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
.specify/
specs/
media/                  # source/template images currently tracked in repo
```

**Structure Decision**: Single web app under `web/` with feature docs under `specs/001-dsa-brew-renderer/`. Static assets are served from a local path under `web/public/` and resolved through an explicit macro-to-asset mapping.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| N/A | N/A | N/A |
