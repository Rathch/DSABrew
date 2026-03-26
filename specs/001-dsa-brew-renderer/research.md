# Research: DSABrew Markdown-to-DSA Renderer

**Date**: 2026-03-26  
**Feature**: `specs/001-dsa-brew-renderer/spec.md`

## Decisions

### Decision: Markdown parsing library

**Chosen**: A Markdown parser that can render to HTML and be extended (e.g., markdown-it).
**Rationale**: Mature, fast, and predictable; easy to post-process for macros while keeping a clear separation between Markdown rendering and macro expansion.
**Alternatives considered**: Remark/Unified pipeline; custom Markdown parsing (rejected due to complexity and risk).

### Decision: Raw HTML policy

**Chosen**: Strip/remove raw HTML from Markdown rendering.
**Rationale**: Matches spec/clarifications; reduces XSS risk and makes behavior consistent and safe by default.
**Alternatives considered**: Allowlisted sanitization (more flexible but higher risk and more complexity); escaping (safe but less “clean” UX for users pasting HTML).

### Decision: Macro processing strategy

**Chosen**: Two-pass rendering: (1) preprocess macros that affect page structure and metadata, (2) render Markdown, (3) post-process to inject page backgrounds/TOC/footnotes/page numbers into the page template.
**Rationale**: Keeps renderer deterministic and allows page-scoped features (footnotes per page) without relying on DOM mutation heuristics.
**Alternatives considered**: Single-pass regex replacement (too brittle for malformed macro handling and heading extraction).

### Decision: Table of contents generation

**Chosen**: Generate TOC from heading tokens (chapter macro + Markdown headings) during render, with an explicit depth cap for `{{tocDepthH3}}`.
**Rationale**: Deterministic, does not require layout measurement; can be inserted at macro location as a generated block.
**Alternatives considered**: DOM scanning after render (works but less deterministic and harder to keep stable across renderer changes).

### Decision: Footnotes

**Chosen**: Per-page footnote collection: references are inline labels, footnote bodies appear in a page footer area for that page.
**Rationale**: Matches spec assumption and print expectations; avoids cross-page reflow complexities.
**Alternatives considered**: Global footnote list at end of document (simpler, but not desired).

### Decision: Page numbers

**Chosen**: `{{pageNumber N}}` defines the start number for the first rendered page; numbering increments by 1 for each subsequent page.
**Rationale**: Deterministic and simple; aligns with print/PDF needs.
**Alternatives considered**: Separate “set page number” macro per page (more complex, unclear precedence).

## Open Questions (deferred to implementation detail, not spec-level)

- Exact visual layout (typography, margins, footer placement) for page number/footnotes/TOC.
- Which headings count as “H1/H2/H3” when mixing `\chapter{}` with Markdown headings.
