# Data Model: DSABrew Markdown-to-DSA Renderer

**Date**: 2026-03-26 (updated 2026-03-27)  
**Feature**: `specs/001-dsa-brew-renderer/spec.md`

## Entities

### 1) MarkdownDocument

Represents the raw user input.

- **text**: string (raw Markdown with macros)

### 2) RenderOptions

Configuration for a render invocation.

- **assetsBaseUrl**: string (base URL for internal assets, e.g., `/dsa`)
- **pageNumberStart**: number (default start for page numbering if `{{pageNumber N}}` is present)
- **tocDepth**: number (for `{{tocDepthH3}}`, fixed to 3 for MVP)

### 3) Book

The rendered output structure.

- **pages**: Page[]
- **toc**: TocEntry[] (derived from headings, used when TOC macro is present)

### 4) Page

Single A4 page (print unit).

- **index**: number (0-based)
- **displayPageNumber**: number
- **rawPageMarkdown**: string (original page segment prior to markdown rendering)
- **renderedHtml**: string (sanitized HTML for page body)
- **backgrounds**:
  - **mapKey**: string | null — **effective** canonical map id used for chrome (`einband`, `content-even`, `content-odd`, `final`, …): either from an explicit `\map{...}` on that page or, if absent, **derived** from even/odd **displayed** page number for default content pages.
  - **rautenKey**: string | null
  - **missingKeysWarnings**: string[] (unknown keys or malformed macros)
- **pageChromeClasses**: string (optional presentation) — CSS class names for background/rauten layers on the page shell.
- **footnotes**: Footnote[]

### 5) Footnote

Represents a per-page footnote entry.

- **label**: string (e.g., `PART 2`) — HTML-escaped for display
- **content**: string (e.g., `BORING STUFF`) — HTML-escaped for display
- **sequence**: number (order of appearance on the page)

**Note**: The inline reference in the rendered HTML is emitted as `<sup class="footnote-ref">[label]</sup>` after Markdown rendering (see `contracts/macros.md`), to avoid Markdown engines escaping raw `<sup>` when `html` is disabled.

### 6) TocEntry

Represents one entry in the table of contents.

- **level**: number (1..3)
- **title**: string
- **source**: `markdownHeading`

## Validation Rules

- Raw HTML must be stripped/removed before rendering output HTML.
- Unknown asset keys produce a visible warning/placeholder marker and omit the background.
- Malformed macros are ignored and produce a visible warning/placeholder marker.
- Empty or whitespace-only input produces exactly one rendered page.
