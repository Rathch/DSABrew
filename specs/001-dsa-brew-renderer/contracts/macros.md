# Contracts: DSABrew Renderer Macros (MVP)

**Date**: 2026-03-26  
**Feature**: `specs/001-dsa-brew-renderer/spec.md`

This document defines the macro surface that extends plain Markdown.

## Macro: `\page`

**Type**: Structural

- Starts a new A4 page.
- Consecutive `\page` blocks create consecutive pages, including empty pages.
- Empty or whitespace-only documents still produce exactly one page.

## Headings

Headings are expressed using plain Markdown headings:

- `# Title` (H1)
- `## Title` (H2)
- `### Title` (H3)

## Macro: `\map{KEY}`

**Type**: Background asset selector

- Selects a map background asset for the current page.
- Unknown keys omit the background and produce a visible warning/placeholder marker.
- Malformed invocations are ignored and produce a visible warning/placeholder marker.

## Macro: `\rauten{KEY}`

**Type**: Background asset selector

- Selects a rauten background asset for the current page.
- Unknown keys omit the background and produce a visible warning/placeholder marker.
- Malformed invocations are ignored and produce a visible warning/placeholder marker.

## Macro: `{{pageNumber N}}`

**Type**: Page metadata / display

- Defines the starting page number `N` for the first rendered page in the document.
- Displayed page number for page index \(i\) (1-based) is: \(N + (i - 1)\).

## Macro: `{{footnote LABEL | CONTENT}}`

**Type**: Per-page footnote

- Inserts a footnote reference with visible label `LABEL`.
- Adds a footnote entry to the footnote list at the bottom of the same page.
- `CONTENT` is the footnote body text.

## Macro: `{{tocDepthH3}}`

**Type**: Generated content

- Inserts a table of contents at the macro location.
- The TOC is generated from document headings up to depth H3.
- Heading sources include Markdown headings.

## Safety Contract (non-negotiable)

- Raw HTML from Markdown input is stripped/removed and must not be rendered as HTML.
- Script execution must be impossible from user-provided input.
