# Research: DSABrew Markdown-to-DSA Renderer

**Date**: 2026-03-26 (updated 2026-03-27)  
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

**Chosen**: Generate TOC from heading tokens (Markdown headings) during render, with an explicit depth cap for `{{tocDepthH3}}`.
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

### Decision: Footnote reference injection vs Markdown `html: false`

**Chosen**: Replace `{{footnote …}}` with a **non-HTML placeholder token** before `markdown-it` runs, then inject `<sup class="footnote-ref">…</sup>` **after** Markdown rendering.
**Rationale**: With `html: false`, inserting `<sup>` in the source would be escaped to text; placeholders must not use Markdown-active patterns (e.g. `__` for emphasis).
**Alternatives considered**: Enable HTML in Markdown (rejected: weakens untrusted-input guarantees); custom markdown-it inline rule (more coupling).

### Decision: Default content backgrounds without repeating `\map`

**Chosen**: If a page has no `\map{…}`, set effective map to `content-even` when `displayPageNumber` is even, else `content-odd`.
**Rationale**: Matches book-style even/odd spreads and reduces author boilerplate; explicit `\map` still overrides per page.
**Alternatives considered**: Require `\map` on every page (more verbose).

### Decision: Page-break alias `{{page}}`

**Chosen**: Normalize `{{page}}` to the same split as `\page`.
**Rationale**: Author ergonomics; same semantics as `\page`.
**Alternatives considered**: Only `\page` (less flexible for templating).

### Decision: Two-column body layout

**Chosen**: CSS multi-column (`column-count: 2`) on the page body; headings, TOC, warnings, footnotes use `column-span: all` where appropriate.
**Rationale**: Matches “scriptorium” print look without a complex layout engine for MVP.
**Alternatives considered**: CSS Grid per page (heavier); single column (rejected by product).

### Decision: Vite major vs Node LTS

**Chosen**: Pin **Vite 5** so developers on **Node 18** can run the dev server without requiring Node 20+ (Vite 7+).
**Rationale**: Lower friction for common LTS setups; error `crypto.hash is not a function` on Node 18 + Vite 7 was observed in the wild.
**Alternatives considered**: Require Node 20.19+ only (stricter environment).

### Decision: Scriptorium typography (Andalus + Gentium)

**Chosen**: Map Markdown `#`–`####` to Word-style levels per `contracts/typography.md`. **Gentium** is loaded as **Gentium Book Plus** from Google Fonts. **Andalus** uses a system `font-family` stack (no redistribution of Microsoft font files).
**Rationale**: Matches the user’s template sizes; Gentium is OFL-licensed for web embedding; Andalus matches installed Office/Windows users.
**Alternatives considered**: Substitute a free “Arabic-looking” webfont for Andalus (deviates from exact name); embed Andalus without license (rejected).

### Decision: Impressum page

**Chosen**: Macros `{{impressumField key=value}}` merge into defaults; `{{impressumPage}}` renders the block. Page uses the **same background** as other content pages (even/odd rule), not a separate asset.
**Rationale**: Matches user expectation; field-level macros allow document-local edits without rebuilding.
**Alternatives considered**: Separate `\map{impressum}` chrome (rejected: duplicate look vs content pages); JSON-only config (less author-friendly).

## Open Questions (deferred to implementation detail, not spec-level)

- Exact visual layout (typography, margins, footer placement) for page number/footnotes/TOC.
- Exact rules for which headings count as H1/H2/H3 for TOC generation (based on Markdown heading levels).
- Fine-tuning column gaps and hyphenation for very long words in two-column mode.
