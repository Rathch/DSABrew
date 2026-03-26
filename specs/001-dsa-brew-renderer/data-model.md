# Data Model: DSABrew Markdown-to-DSA Renderer

**Date**: 2026-03-26  
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
  - **mapKey**: string | null
  - **rautenKey**: string | null
  - **missingKeysWarnings**: string[] (unknown keys or malformed macros)
- **footnotes**: Footnote[]

### 5) Footnote

Represents a per-page footnote entry.

- **label**: string (e.g., `PART 2`)
- **content**: string (e.g., `BORING STUFF`)
- **sequence**: number (order of appearance on the page)

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
