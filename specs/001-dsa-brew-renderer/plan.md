# Implementation Plan: DSABrew Markdown-to-DSA Renderer

**Branch**: `001-dsa-brew-renderer` | **Date**: 2026-03-26 | **Spec**: `specs/001-dsa-brew-renderer/spec.md`  
**Input**: Feature specification from `/specs/001-dsa-brew-renderer/spec.md`

## Summary

Build a web-based Markdown editor + preview that renders DSA-styled, multi-page A4 output with explicit page semantics (`\page`), safe macro expansion, and print-to-PDF via the browser. Implement page numbers (`{{pageNumber N}}`), per-page footnotes (`{{footnote LABEL | CONTENT}}`), and an auto-generated TOC from Markdown headings (`{{tocDepthH3}}`). A new document initializes with 4 pages (cover, two content pages, final page) and default backgrounds from packaged assets.

## Technical Context

**Language/Version**: TypeScript (ES2022)  
**Primary Dependencies**: Vite (bundling/dev server), a Markdown parser (e.g., markdown-it)  
**Storage**: N/A (in-memory in the browser for MVP)  
**Testing**: Manual print validation required; minimal automated tests optional  
**Target Platform**: Modern desktop browsers (Chrome/Edge/Firefox)  
**Project Type**: Web application (single repository)  
**Performance Goals**: Typical documents render quickly; large documents (up to ~200 pages / ~100k chars) render within 15s without crash/hang  
**Constraints**: Deterministic rendering, print fidelity, strict input safety (no script execution, strip raw HTML), local assets only  
**Scale/Scope**: Single-user, local/offline-friendly preview and printing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Macro-First Extensibility**: All non-Markdown behavior is explicit macros with documented semantics.
- **Rendering Determinism**: Same input + assets ⇒ stable output structure/pagination behavior.
- **Print Fidelity & Page Semantics**: `\page` boundaries map to printed pages; backgrounds align to page coordinates for preview + `window.print()`.
- **Separation of Concerns**: Renderer stays pure; UI handles input and print.
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
├── contracts/
│   └── macros.md
└── checklists/
    ├── requirements.md
    └── security.md
```

### Source Code (repository root)

```text
web/
├── src/                # app code (currently empty; will be initialized)
├── public/
│   └── dsa/            # static assets (backgrounds, frames, etc.)
└── package.json        # will be added when app is initialized

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
