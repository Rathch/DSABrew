# Data Model: DSABrew Markdown-to-DSA Renderer

**Date**: 2026-03-26 (updated 2026-03-28)  
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

### 7) HostedDocument (public hosting, FR-020+)

Server-persisted document row (or file manifest). Primary product surface uses the API; the web client does not preload sample Markdown without a document row.

- **id**: UUID or integer primary key
- **slug_view**: string, unique — resolves read-only URL
- **slug_edit**: string, unique — resolves editable session; **must never** be derivable from `slug_view`
- **markdown**: string — raw Markdown body
- **created_at**, **updated_at**: ISO timestamps
- **content_sha256**: string — hash of normalized body (for TTL rule vs canonical default)
- **flags** (optional): `is_eligible_for_ttl` boolean — set false on first divergence from default hash

**Relationships**: One HostedDocument maps to one logical editor session; rendering still produces `Book` / `Page[]` client-side via existing renderer.

## Validation Rules

- Raw HTML must be stripped/removed before rendering output HTML.
- Unknown asset keys produce a visible warning/placeholder marker and omit the background.
- Malformed macros are ignored and produce a visible warning/placeholder marker.
- Empty or whitespace-only input produces exactly one rendered page.
- **Hosted mode**: `PUT` must reject writes unless the path matches `slug_edit`; `GET` returns `slug_view` always and `slug_edit` **only** when the request used the edit token (FR-028).
