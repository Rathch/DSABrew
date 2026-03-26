# Feature Specification: DSABrew Markdown-to-DSA Renderer

**Feature Branch**: `001-dsa-brew-renderer`  
**Created**: 2026-03-26  
**Status**: Draft  
**Input**: User description: "Ich baue ein Web-Tool („DSABrew“), in dem Nutzer RPG-Dokumente in Markdown schreiben und zusätzlich DSA5-Layouts über definierte Makros steuern. Das Tool rendert daraus ein mehrseitiges A4-“Book”-Layout (ähnlich Homebrewery-Konzept), nutzt die bereitgestellten DSA5-Template-Grafik-Assets (z.B. Aventurienkarte und Rauten) für Hintergründe und unterstützt \page für Seitenumbrüche. Außerdem soll der Nutzer das Ergebnis über Drucken/Export als PDF speichern können. Markdown gilt als untrusted input; gefährliche HTML/Skripte dürfen nicht ausführbar sein."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-page preview and print (Priority: P1)

The user writes RPG content in Markdown, includes DSA-specific layout macros, and expects the system to render an A4 multi-page book that can be previewed and printed/exported as PDF.

**Why this priority**: This is the core promise of the tool and enables the user to create printable documents.

**Independent Test**: Test by entering a sample Markdown document with multiple `\page` blocks and known background macros, then verify the preview shows multiple A4 pages and `window.print()` produces a PDF with correct page boundaries.

**Acceptance Scenarios**:

1. **Given** an empty editor and a sample Markdown containing `\page`, Markdown headings (e.g., `#`, `##`, `###`), and background macros, **When** the user saves/updates the preview, **Then** the preview displays multiple page sections corresponding to the `\page` blocks.
2. **Given** a rendered multi-page preview, **When** the user triggers print/export from the page, **Then** the printed output contains distinct pages at the expected `\page` boundaries (including empty pages created by consecutive `\page` blocks).

---

### User Story 2 - Macro safety and HTML/script protection (Priority: P2)

The user may paste Markdown that includes raw HTML or attempts to inject scripts. The system must treat Markdown as untrusted and prevent script execution or unsafe rendering.

**Why this priority**: Security is required because user content can contain hostile HTML.

**Independent Test**: Test by providing Markdown that includes `<script>`, event handlers, and unsafe HTML, then verify that preview does not execute scripts and that the output is sanitized/escaped.

**Acceptance Scenarios**:

1. **Given** Markdown input containing a `<script>` tag, **When** the preview is rendered, **Then** the script does not execute and the content is displayed as plain text or safely removed.
2. **Given** Markdown input containing a `<script>` tag or raw HTML tags, **When** the preview is rendered, **Then** scripts do not execute and raw HTML is stripped/removed (no rendered HTML output).

---

### User Story 3 - Deterministic macro resolution with asset mapping (Priority: P3)

The user expects macros that reference known background keys (e.g., map theme and rauten variant) to resolve consistently to local template assets. Unknown or invalid macro keys must not break rendering.

**Why this priority**: Predictable macro resolution improves user trust and prevents broken layouts.

**Independent Test**: Test by using known macro keys and then using an unknown key for each macro, verifying that known keys render the expected background and unknown keys produce a visible placeholder or omit the background without breaking layout.

**Acceptance Scenarios**:

1. **Given** Markdown input with a known `\map{...}` key and a known `\rauten{...}` key, **When** the preview is rendered, **Then** the page backgrounds show the corresponding local assets.
2. **Given** Markdown input with an unknown `\map{...}` key or an unknown `\rauten{...}` key, **When** the preview is rendered, **Then** rendering completes and the page shows a visible warning/placeholder marker for the unknown background key (background is omitted).
3. **Given** Markdown input with a malformed macro invocation (e.g., missing closing brace in `\map{...}`), **When** the preview is rendered, **Then** rendering completes and the malformed macro is ignored, while the page shows a visible warning/placeholder marker.

---

### User Story 4 - Page numbers, footnotes, and auto-generated TOC (Priority: P2)

The user needs standard book navigation aids: page numbers, footnotes, and a table of contents derived from headings.

**Why this priority**: These features materially improve readability and make the generated document feel like a structured printed book.

**Independent Test**: Test by entering a sample document that spans multiple `\page` blocks and contains Markdown headings (`#`/`##`/`###`), footnotes, and the three macros `{{pageNumber 2}}`, `{{footnote ... | ...}}`, and `{{tocDepthH3}}`, then verify that the preview displays correct page numbers, per-page footnote lists, and a TOC that matches the included headings.

**Acceptance Scenarios**:

1. **Given** a document with multiple `\page` blocks and the macro `{{pageNumber N}}`, **When** the preview is rendered, **Then** the first rendered page displays `N`, and each subsequent rendered page displays an incremented page number (N + 1, N + 2, ...).
2. **Given** a document with footnote macros like `{{footnote PART 2 | BORING STUFF}}`, **When** the preview is rendered, **Then** each footnote reference shows the provided label `PART 2` at the reference position, and the corresponding footnote content `BORING STUFF` appears in the footnote list at the bottom of the page where the reference occurs.
3. **Given** a document containing Markdown headings (e.g., `#`, `##`, `###`) and the macro `{{tocDepthH3}}`, **When** the preview is rendered, **Then** the TOC inserted at the macro location includes headings up to depth level H3 in document order, with titles matching the source headings.

---

### Edge Cases

- What happens when the input is empty or contains only whitespace? → It produces exactly one empty rendered page in the output document.
- What happens when a macro is malformed (e.g., missing closing brace in `\chapter{...}`)?
- What happens when a macro references an unknown asset key (e.g., `\rauten{rot-999}`)?
- What happens when the user includes raw HTML elements like `<img src="...">` or `<iframe>`?
- What happens when a large document is provided (many `\page` blocks)? → Up to ~200 pages / ~100k characters render without crash and within 15 seconds, with output structure correct.
- What happens when `{{pageNumber ...}}` is used with multiple different starting numbers within the same document?
- What happens when `{{footnote ...}}` is used multiple times on the same page?
- What happens when the document contains `{{tocDepthH3}}` but has no headings eligible for the TOC?

## Clarifications

### Session 2026-03-26

- Q: Raw HTML policy in Markdown? → A: Option C (remove/strip raw HTML)
- Q: Unknown macro key fallback behavior? → A: Option B (visible warn/placeholder marker)
- Q: Malformed macro handling? → A: Option B (ignore/skip malformed macro and show visible warning/placeholder marker)
- Q: Empty pages due to consecutive `\page` blocks? → A: Option A (each `\page` starts a new page, empty pages are counted)
- Q: Empty / whitespace-only input output? → A: produces exactly one empty rendered page
- Q: Large document performance/stability rule? → A: Option C (<= 15s, up to ~200 pages / ~100k characters, no crash, output structure correct)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an interactive way for users to enter or edit Markdown content.
- **FR-002**: System MUST render the input Markdown into an A4 multi-page layout using a `\page` semantic that starts a new printed page; consecutive `\page` blocks MUST create additional pages even if no visible content exists on those pages.
- **FR-002a**: System MUST treat empty or whitespace-only Markdown input as producing exactly one rendered page in the output document (even if no explicit `\page` blocks are present).
- **FR-003**: System MUST support headings via Markdown heading syntax (e.g., `#`, `##`, `###`) and preserve a consistent hierarchy for TOC generation up to H3.
- **FR-004**: System MUST support background macros for maps and rauten via a predefined macro-to-asset mapping.
- **FR-005**: System MUST resolve known macro keys deterministically to the corresponding local template assets packaged with the tool.
- **FR-006**: System MUST handle unknown macro keys safely by omitting the background and showing a visible warning/placeholder marker for the unknown background key, without breaking page rendering.
- **FR-006a**: System MUST handle malformed macro invocations safely by ignoring the malformed macro and showing a visible warning/placeholder marker, without breaking page rendering.
- **FR-007**: System MUST treat Markdown as untrusted input, prevent HTML/script execution, and strip raw HTML elements/blocks from rendering (they must never be executed and must not be rendered as HTML).
- **FR-008**: Users MUST be able to export the rendered result to PDF via browser print (i.e., `window.print()` produces a stable multi-page PDF).
- **FR-009**: System MUST implement page number macro `{{pageNumber N}}` where `N` defines the starting page number for the first rendered page of the document and increments by 1 for each subsequent rendered page.
- **FR-010**: System MUST implement footnote macro `{{footnote LABEL | CONTENT}}` where `LABEL` is the visible reference label and `CONTENT` is the footnote text; footnotes MUST be collected per page and rendered as a footnote list at the bottom of the page containing the reference.
- **FR-011**: System MUST implement TOC macro `{{tocDepthH3}}` to generate a table of contents derived from document headings; it MUST include headings up to depth level H3 and insert the TOC at the macro location.
- **FR-012**: System MUST remain stable and produce correct rendered output for large documents (up to ~200 pages / ~100k characters) within 15 seconds of the preview/render action (no crash/hang).

### Key Entities *(include if feature involves data)*

- **Markdown document**: The raw user input string that may include macros and text.
- **Rendered book**: A structured collection of pages derived from `\page` blocks and macro expansion.
- **Macro definition and asset map**: The internal mapping of supported macro names/keys to local background assets.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can produce a two-page document preview from a typical input (up to ~5,000 characters) within 2 seconds of editing.
- **SC-002**: At least 95% of supported macros resolve correctly to the expected page backgrounds on a representative sample document set.
- **SC-003**: Printing/export via browser print yields a PDF with the number of pages matching the number of `\page` blocks (±0 pages) for the representative sample.
- **SC-004**: For malicious input containing scripts and raw HTML, no script execution is observed, and unsafe HTML is removed/stripped (it must not be executed and must not appear as rendered HTML in the preview) (pass/fail based on test).
- **SC-005**: For a representative multi-page document using `{{pageNumber N}}`, the displayed page numbers match the formula `displayedPageNumber = N + (pageIndex - 1)` for all rendered pages.
- **SC-006**: For a representative document containing at least 3 footnotes across multiple pages, every footnote reference shows the specified `LABEL` and every footnote list contains the corresponding `CONTENT` exactly once on the correct page.
- **SC-007**: For a representative document containing headings across multiple levels, the TOC generated by `{{tocDepthH3}}` includes all and only headings eligible for depth H3 in correct document order.
- **SC-008**: For empty or whitespace-only input, the rendered output contains exactly one page and printing/export yields a PDF with exactly one page.
- **SC-009**: For a representative large document (up to ~200 pages / ~100k characters), rendering completes within 15 seconds and produces a correct page structure without crashes/hangs.

## Assumptions

- Users run the tool in a modern web browser.
- All required background assets are available locally within the tool’s package (no runtime dependency on external URLs for core backgrounds).
- PDF export is implemented via the browser’s standard print dialog, so users can save to PDF using the OS/browser UI.
- The initial macro set is limited to the documented subset; extensibility beyond that subset is handled by adding entries to the supported macro mapping.
- Footnote rendering is per-page: each page contains a footnote list for references that appear on that page.
