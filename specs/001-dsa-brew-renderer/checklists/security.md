# Security Checklist: DSABrew Markdown-to-DSA Renderer

**Purpose**: Validate that Markdown rendering + macro expansion is safe for untrusted input.  
**Created**: 2026-03-26  
**Feature**: [Link to spec](../../specs/001-dsa-brew-renderer/spec.md)

## Markdown & HTML Safety

- [ ] Raw HTML from Markdown input is stripped/removed and never rendered as HTML.
- [ ] Script execution is impossible from user-provided input (no inline scripts, no event handlers).
- [ ] Links are rendered safely (no `javascript:` URLs).

## Macro Safety

- [ ] Macro expansion is deterministic and does not execute arbitrary code.
- [ ] Macros that reference assets resolve **only** via an internal allowlist mapping (no arbitrary URLs/paths).
- [ ] Unknown macro keys produce a visible warning/placeholder marker and omit the background.
- [ ] Malformed macro invocations are ignored and produce a visible warning/placeholder marker.

## Print & Isolation

- [ ] The printed output (`window.print()`) matches the preview page structure (no hidden content that prints differently).
- [ ] CSS used for layout does not allow user content to escape page bounds to overlap headers/footers unexpectedly.

## Manual Test Inputs (recommended)

- [ ] Markdown containing `<script>alert(1)</script>` (must not execute; must not render as HTML).
- [ ] Markdown containing `<img src=x onerror=alert(1)>` (must not execute).
- [ ] Markdown containing `[x](javascript:alert(1))` (must not create an executable link).
