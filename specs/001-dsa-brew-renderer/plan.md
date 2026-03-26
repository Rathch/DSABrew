# Implementation Plan: DSABrew Markdown-to-DSA Renderer

**Branch**: `001-dsa-brew-renderer` | **Date**: 2026-03-26 | **Spec**: `specs/001-dsa-brew-renderer/spec.md`
**Input**: Feature specification from `/specs/001-dsa-brew-renderer/spec.md`

## Summary

Build a web-based Markdown editor + preview that renders DSA-styled, multi-page A4 output with explicit page semantics (`\page`), safe macro expansion, and print-to-PDF via the browser. Add advanced macros for page numbers (`{{pageNumber N}}`), per-page footnotes (`{{footnote LABEL | CONTENT}}`), and a table of contents generated from headings (`{{tocDepthH3}}`).

## Technical Context

**Language/Version**: TypeScript (ES2022)  
**Primary Dependencies**: Vite (dev server/bundling), a Markdown parser (e.g., markdown-it), HTML sanitization/stripping (policy: strip raw HTML), optional CSS print helpers  
**Storage**: N/A (in-memory in the browser for MVP)  
**Testing**: Minimal automated tests optional; manual print validation required  
**Target Platform**: Modern desktop browsers (Chrome/Edge/Firefox)  
**Project Type**: Web application (single repository)  
**Performance Goals**: Typical input renders quickly; large documents (up to ~200 pages / ~100k chars) render within 15s without crash/hang  
**Constraints**: Deterministic rendering, print fidelity, strict input safety (no script execution, strip raw HTML), local assets only  
**Scale/Scope**: Single-user, local/offline-friendly preview and printing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Macro-First Extensibility**: All non-Markdown behavior must be explicit macros with documented semantics.
- **Rendering Determinism**: Same input + assets ⇒ stable output structure/pagination behavior.
- **Print Fidelity & Page Semantics**: `\page` boundaries must map to printed pages; CSS must be print-safe.
- **Separation of Concerns**: Keep renderer pure; UI handles input and print.
- **Security & Input Safety**: Strip raw HTML; prevent script execution; macros map only to internal assets.
- **Commit Governance**: Commit messages must follow Conventional Commits.

Status: No violations required. The plan keeps renderer pure and enforces strict macro mapping.

## Project Structure

### Documentation (this feature)

```text
specs/001-dsa-brew-renderer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── macros.md
└── checklists/
    ├── requirements.md
    └── security.md
```

### Source Code (repository root)

```text
web/
├── src/
├── public/
└── package.json

.specify/
specs/
```

**Structure Decision**: Single web app under `web/` with specs under `specs/`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| N/A | N/A | N/A |
