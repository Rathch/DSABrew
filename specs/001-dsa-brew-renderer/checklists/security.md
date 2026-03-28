# Security Checklist: DSABrew Markdown-to-DSA Renderer

**Purpose**: Validate that Markdown rendering + macro expansion is safe for untrusted input.  
**Created**: 2026-03-26  
**Feature**: [Link to spec](../../specs/001-dsa-brew-renderer/spec.md)

## Markdown & HTML Safety

- [x] Raw HTML from Markdown input is stripped/removed and never rendered as HTML.
- [x] Script execution is impossible from user-provided input (no inline scripts, no event handlers).
- [x] Links are rendered safely (no `javascript:` URLs).

## Macro Safety

- [x] Macro expansion is deterministic and does not execute arbitrary code.
- [x] Macros that reference assets resolve **only** via an internal allowlist mapping (no arbitrary URLs/paths).
- [x] Unknown macro keys produce a visible warning/placeholder marker and omit the background.
- [x] Malformed macro invocations are ignored and produce a visible warning/placeholder marker.

## Print & PDF export

- [x] In-app PDF export rasterizes the visible preview (no separate hidden pipeline); exported pages correspond to `.a4-page` elements.
- [x] Optional browser print (`window.print()` + print CSS) remains aligned with the same page structure where supported.
- [x] CSS used for layout does not allow user content to escape page bounds to overlap headers/footers unexpectedly.

## Manual Test Inputs (recommended)

- [x] Markdown containing `<script>alert(1)</script>` (must not execute; must not render as HTML).
- [x] Markdown containing `<img src=x onerror=alert(1)>` (must not execute).
- [x] Markdown containing `[x](javascript:alert(1))` (must not create an executable link).
