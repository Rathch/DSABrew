<!--
Sync Impact Report:
- Version change: template (unversioned) → 0.1.0
- Modified principles:
  - Core Principles: [PRINCIPLE_1_NAME..5] → (I) Macro-First Extensibility, (II) Rendering Determinism, (III) Print Fidelity & Page Semantics, (IV) Separation of Concerns, (V) Security & Input Safety
- Added sections:
  - Project Scope & Constraints
  - Development Workflow & Quality Gates
- Removed sections: none
- Templates requiring updates: none
- Follow-up TODOs:
  - Define the full macro reference (syntax + escaping + examples) once the macro set stabilizes.
-->

# DSABrew Constitution

## Core Principles

### I. Macro-First Extensibility
Every feature beyond plain Markdown MUST be expressed as an explicit macro with documented syntax and semantics. Unknown macros MUST fail loudly (or render a visible placeholder) instead of silently producing incorrect layout.

### II. Rendering Determinism
Given the same Markdown input and the same asset set, the renderer MUST produce stable HTML/CSS output and stable pagination behavior. The system MUST avoid nondeterministic behavior (randomness, time-based rendering, network-dependent assets).

### III. Print Fidelity & Page Semantics
The page model MUST be unambiguous: `\page` MUST start a new A4 page, and background assets MUST be aligned to page coordinates for both screen preview and `window.print()`. Layout MUST NOT depend on viewport size.

### IV. Separation of Concerns
The renderer MUST be a pure transformation from (Markdown + renderer options) to HTML. The UI layer MUST only handle input, preview, and export triggers. Asset mapping MUST be centralized so macros resolve consistently.

### V. Security & Input Safety
The system MUST treat Markdown as untrusted input. Script execution MUST be prevented; generated HTML MUST be escaped by default for macro-derived content. Image URLs used by macros MUST be validated against the internal asset map (no arbitrary external URLs).

## Project Scope & Constraints
This project builds a web-based tool that renders RPG documents written in Markdown into a DSA5-inspired, multi-page “book” layout (analogous in concept to The Homebrewery). Visual fidelity relies on the provided DSA5 template assets (e.g. Aventurienkarte and Rauten graphics).

Technology constraints:
- Frontend MUST use TypeScript and a predictable bundler (e.g. Vite).
- Markdown parsing MUST be performed via a dedicated Markdown library; output MUST be post-processed to apply macros and page semantics.
- Assets MUST be served from a local/static path (e.g. `public/dsa/`) using an explicit macro-to-asset mapping table.

## Development Workflow & Quality Gates
Change workflow:
- Any change that modifies macro syntax, page semantics, or asset resolution MUST update (or clearly note) the macro reference.
- A feature MUST include at least one representative sample Markdown input that demonstrates the new behavior.
- Printing/export behavior MUST be validated via `window.print()` in at least one common browser before merging.

Quality gates:
- Rendering determinism: verify that the same input yields the same output structure (DOM) across rerenders.
- Print fidelity: verify that `\page` boundaries and background placement match expectations.
- Safety: verify that macro content is escaped and does not allow HTML/script injection.

## Governance
The constitution supersedes ad-hoc decisions when conflicts occur.

Amendment procedure (how to change this constitution):
1. Propose the amendment with rationale and expected user-facing impact.
2. Update the relevant specification notes inside the project (e.g., macro reference / renderer options).
3. Implement the change with a focus on determinism, print fidelity, and safety.
4. Validate by running the dev server and manually checking preview + print output.
5. Update `CONSTITUTION_VERSION` using semver rules:
   - MAJOR: breaks existing macro syntax/behavior or page semantics.
   - MINOR: adds new macros or expands supported layout behavior without breaking existing input.
   - PATCH: clarifies wording, fixes escaping/safety edge cases, or improves internal structure without changing documented behavior.

Compliance review expectations:
- Every meaningful change MUST be checked against the principles above (especially Security & Input Safety and Print Fidelity & Page Semantics).
- Every commit message MUST follow the Conventional Commits specification (e.g., `feat:`, `fix:`, `docs:`, `chore:`, optional scope like `feat(dsabrew): ...`).
- If a requirement cannot be met yet, a TODO MUST be added and the risk explicitly documented in the next follow-up artifact.

**Version**: 0.1.1 | **Ratified**: 2026-03-26 | **Last Amended**: 2026-03-26
