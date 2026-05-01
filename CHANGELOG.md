# [0.45.0](https://github.com/Rathch/DSABrew/compare/v0.44.0...v0.45.0) (2026-05-01)


### Features

* **deploy:** enhance deployment workflow_run triggers ([cdd6a58](https://github.com/Rathch/DSABrew/commit/cdd6a5895b84e6e3b8f4d64e52ee2fce9ad2c4a0))

# [0.44.0](https://github.com/Rathch/DSABrew/compare/v0.43.0...v0.44.0) (2026-05-01)


### Features

* **deploy:** add Docker support and update deployment configuration ([aca347a](https://github.com/Rathch/DSABrew/commit/aca347afec391f3b8cf06a438ab15d7bf00fffe5))

# [0.43.0](https://github.com/Rathch/DSABrew/compare/v0.42.0...v0.43.0) (2026-04-10)


### Features

* **deploy:** improve Node.js version handling ([bea4428](https://github.com/Rathch/DSABrew/commit/bea4428bdcf1cc04e086eec92ff275aecbe7c721))

# [0.42.0](https://github.com/Rathch/DSABrew/compare/v0.41.0...v0.42.0) (2026-04-10)


### Bug Fixes

* **web:** stack hosted nav controls on narrow screens ([4e80792](https://github.com/Rathch/DSABrew/commit/4e8079275e51019f9edb70e97724f1a377f9c728))


### Features

* enhance impressum ([da529ef](https://github.com/Rathch/DSABrew/commit/da529ef567c61c673dc316bc51fd91c66d83e2ef))

# [0.41.0](https://github.com/Rathch/DSABrew/compare/v0.40.0...v0.41.0) (2026-04-09)


### Features

* add Anleitung page ([00051ac](https://github.com/Rathch/DSABrew/commit/00051ac91ed9176d3d863ef57b5e70f8828c3481))
* add Buy Me a Coffee link to footer navigation ([48b2591](https://github.com/Rathch/DSABrew/commit/48b2591fd18472cc977ee7d106748d51569bd348))

# [0.40.0](https://github.com/Rathch/DSABrew/compare/v0.39.0...v0.40.0) (2026-04-07)


### Features

* **viewport:** implement narrow viewport handling ([e9d12fe](https://github.com/Rathch/DSABrew/commit/e9d12fe25ca652adc0db66c2a8852c2d80a5ff9a))

# [0.39.0](https://github.com/Rathch/DSABrew/compare/v0.38.2...v0.39.0) (2026-04-07)


### Bug Fixes

* **dependencies:** upgrade vite to version 6.4.2 and adjust related configurations ([1f8b8c9](https://github.com/Rathch/DSABrew/commit/1f8b8c9b9cec6cc4fac45ca3f374cdbe1672e2e6))
* potential fix for pull request finding 'CodeQL / Incomplete HTML attribute sanitization' ([cdec910](https://github.com/Rathch/DSABrew/commit/cdec91099acd2b28e1b320c20d257daf8f80bd7c))


### Features

* toolbar-Bild, Einband-Farbe, Tabellen-scope, Roulbox-Kontrast, Dark-UI ([0b7d49e](https://github.com/Rathch/DSABrew/commit/0b7d49e1b4bdb4d15ca139bf30dd023879161ae5))

# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden in dieser Datei festgehalten.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionsnummern folgen [Semantic Versioning](https://semver.org/lang/de/).

Der Abschnitt **„Gesamthistorie (Git)“** wird mit `npm run changelog:sync` bzw. `node scripts/changelog-from-git.mjs` aus dem Git-Verlauf neu geschrieben.

## [Unreleased]

<!-- AUTO:CHANGELOG_GIT_START -->
## [0.39.2] - 2026-04-04

Automatisch aus `git log --reverse` erzeugt (**41** Commits). Version **0.39.2**: Minor = Anzahl `feat`, Patch = Anzahl aller übrigen konventionellen Commits; bei Breaking → `1.0.0`.

### Nach Typ (gruppiert)

#### feat

- `93b0bc7` feat: add initial project structure with .gitignore, constitution, and feature specifications for DSABrew renderer
- `713608e` feat(dsabrew): expand specifications and documentation for DSABrew renderer, including data model, implementation plan, quickstart guide, and macro contracts
- `abe7663` feat(media): add multiple new image assets for document rendering and default backgrounds
- `5f80453` feat(dsabrew): enhance project setup with README, additional assets, and refined specifications; update .gitignore for build artifacts
- `cba43b0` feat(media): introduce new assets and scripts for GM frame rendering; add configuration for frame slicing and import functionality
- `66d4e53` feat(style): add custom bullet list styling and table of contents layout; include new list-bullet asset for improved visual presentation
- `d5f71fd` feat(renderer): refactor NPC block handling and introduce new macros for easier/harder difficulty ratings and chess pieces; update asset paths and styles for improved rendering
- `f4b3420` feat(renderer): implement roulbox macro for styled rule blocks with optional subtitles; enhance Markdown table rendering and add corresponding styles
- `5d9c9c8` feat(renderer): introduce `\pageSingle` macro for single-column page layout; update rendering logic and styles to support new layout; enhance demo and tests for functionality
- `1c5fe38` feat(media): add dummy NPC portrait SVG asset and update references in markdown demo and renderer; enhance toolbar with preview functionality for NPC blocks
- `246c128` feat(pdf): implement in-app PDF export functionality using html2canvas and jsPDF; update documentation and specifications to reflect new download feature and enhance user experience with multi-page A4 layout
- `8130c3e` feat(renderer): add `{{abschnitt N | LABEL}}` macro for internal jumps to numbered H2 headings; implement toolbar integration and rendering logic; enhance styles and tests for new functionality
- `6fb9386` feat(style): enhance footer layout and spacing for A4 pages; introduce new CSS variables for footer gap and clearance, and adjust page-body styles for improved flexibility and alignment of footnotes
- `75031fc` feat(api): implement public document hosting with Fastify and SQLite; add endpoints for document creation, retrieval, and updates; include rate limiting and TTL for document deletion; update README and documentation for API usage and deployment instructions
- `946183e` feat(scroll-sync): implement editor and preview scroll synchronization with minimap; add UI elements for scroll linking and enhance layout responsiveness
- `3473e86` feat(datenschutz): add static Datenschutz content and integrate privacy strip functionality; enhance layout and styling for legal pages
- `525943a` feat(docs): update README, hosting, and renderer specifications to clarify document creation flow; introduce fan product notice in app footer and enhance styling for legal pages
- `6230320` feat(docs): update README, hosting, and renderer specifications to clarify document creation flow; introduce fan product notice in app footer and enhance styling for legal pages
- `bf58b03` feat(theme): implement theme preference management with light, dark, and system modes; enhance UI with theme toggle buttons and responsive styling; add functionality for editor line numbers and page stripes in the editor
- `42e57a4` feat(ci): add CI workflows for typechecking, testing, and dependency review; include coverage reporting and secret scanning; update .gitignore to exclude coverage directory
- `3203a27` feat(setup): add Node.js 20 support and update package configurations; include .nvmrc for version management and enhance .gitignore to exclude node_modules
- `63fd01a` feat(linting): integrate ESLint and Stylelint for TypeScript and CSS; update CI workflows to include linting steps; enhance README with new linting commands and usage instructions
- `5d7a805` feat(e2e): introduce Playwright for end-to-end testing; add specifications and tasks for E2E tests; update .gitignore to exclude ESLint cache
- `256adc9` feat(linting): add ESLint configuration for TypeScript across the repository; update package.json scripts for linting; enhance CI workflow to include root-level ESLint execution; update README with new linting structure and commands
- `032c5c9` feat(linting): implement script for ESLint execution from repository root; update package.json scripts for TypeScript linting; enhance CI workflow for consistent linting across web, shared, and server directories
- `010728c` feat(ci): add ci:fix script to automate linting fixes; update README with new command details; adjust Stylelint configuration for BEM-style classes and specificity rules
- `0ff7e58` feat(env): add .env.example for environment variable configuration; include detailed descriptions for operational settings and SMTP configuration; update .gitignore to exclude sensitive .env files; introduce LICENSE file with GPL-3.0 text; enhance hosting documentation with environment variable usage and operational email settings
- `f38284d` feat(husky): add pre-commit and pre-push hooks for automated linting and verification; update package.json to include husky and new CI scripts for pre-commit checks
- `913b5b0` feat(ops): update default week settings to include weekend days (Saturday and Sunday) in ISO week configuration
- `d7e72a9` feat(docs): enhance hosting documentation with Apache configuration details and update TLS termination notes; add fan-product logo to web index and update asset source in fan-product notice
- `c06527b` feat(env): update .env.example with new handling for ABUSE_DOC_CREATE_MAX; enhance CI scripts to include server tests; improve documentation on abuse prevention settings; refactor server code for environment variable parsing
- `46762d6` feat(ci): add deployment workflow for VPS; configure SSH access and deployment steps for production environment on push to main/master branch
- `b8fa313` feat(ci): refine deployment workflow for VPS; optimize SSH access configuration and streamline deployment steps for production environment on main/master branch push
- `5809af6` feat(ci): enhance deployment workflow with diagnostic steps for SSH connectivity; add optional SSH port and protocol configuration
- `a79ae46` feat(ci): improve VPS deployment script by enhancing branch detection logic and updating documentation for clarity on default branch behavior
- `8901358` feat(e2e): integrate Playwright for end-to-end testing; add configuration files and scripts for E2E tests, including integration with CI; update package.json and .gitignore to support new testing structure
- `c539aac` feat(tests): update Vitest configuration to include specific test file patterns and exclude unnecessary directories for improved test management
- `caaac47` feat(tests): update Playwright configuration to ignore integration tests and modify E2E serve script for improved process management
- `7115cca` feat(logger): add function to normalize rotating log file size; update logger configuration to use normalized size

#### fix

- `2f447b4` fix(markdown-demo): extend demo text for clarity and add single-page macro for improved layout presentation

#### chore

- `03ef46b` chore(docs): update implementation plan and research documentation for DSABrew renderer; add security checklist for input safety

### Chronologisch (älteste zuerst, alle Commit-Betreffzeilen)

1. `93b0bc7` feat: add initial project structure with .gitignore, constitution, and feature specifications for DSABrew renderer
2. `713608e` feat(dsabrew): expand specifications and documentation for DSABrew renderer, including data model, implementation plan, quickstart guide, and macro contracts
3. `abe7663` feat(media): add multiple new image assets for document rendering and default backgrounds
4. `03ef46b` chore(docs): update implementation plan and research documentation for DSABrew renderer; add security checklist for input safety
5. `5f80453` feat(dsabrew): enhance project setup with README, additional assets, and refined specifications; update .gitignore for build artifacts
6. `cba43b0` feat(media): introduce new assets and scripts for GM frame rendering; add configuration for frame slicing and import functionality
7. `66d4e53` feat(style): add custom bullet list styling and table of contents layout; include new list-bullet asset for improved visual presentation
8. `d5f71fd` feat(renderer): refactor NPC block handling and introduce new macros for easier/harder difficulty ratings and chess pieces; update asset paths and styles for improved rendering
9. `f4b3420` feat(renderer): implement roulbox macro for styled rule blocks with optional subtitles; enhance Markdown table rendering and add corresponding styles
10. `5d9c9c8` feat(renderer): introduce `\pageSingle` macro for single-column page layout; update rendering logic and styles to support new layout; enhance demo and tests for functionality
11. `1c5fe38` feat(media): add dummy NPC portrait SVG asset and update references in markdown demo and renderer; enhance toolbar with preview functionality for NPC blocks
12. `246c128` feat(pdf): implement in-app PDF export functionality using html2canvas and jsPDF; update documentation and specifications to reflect new download feature and enhance user experience with multi-page A4 layout
13. `8130c3e` feat(renderer): add `{{abschnitt N | LABEL}}` macro for internal jumps to numbered H2 headings; implement toolbar integration and rendering logic; enhance styles and tests for new functionality
14. `6fb9386` feat(style): enhance footer layout and spacing for A4 pages; introduce new CSS variables for footer gap and clearance, and adjust page-body styles for improved flexibility and alignment of footnotes
15. `75031fc` feat(api): implement public document hosting with Fastify and SQLite; add endpoints for document creation, retrieval, and updates; include rate limiting and TTL for document deletion; update README and documentation for API usage and deployment instructions
16. `946183e` feat(scroll-sync): implement editor and preview scroll synchronization with minimap; add UI elements for scroll linking and enhance layout responsiveness
17. `2f447b4` fix(markdown-demo): extend demo text for clarity and add single-page macro for improved layout presentation
18. `3473e86` feat(datenschutz): add static Datenschutz content and integrate privacy strip functionality; enhance layout and styling for legal pages
19. `525943a` feat(docs): update README, hosting, and renderer specifications to clarify document creation flow; introduce fan product notice in app footer and enhance styling for legal pages
20. `6230320` feat(docs): update README, hosting, and renderer specifications to clarify document creation flow; introduce fan product notice in app footer and enhance styling for legal pages
21. `bf58b03` feat(theme): implement theme preference management with light, dark, and system modes; enhance UI with theme toggle buttons and responsive styling; add functionality for editor line numbers and page stripes in the editor
22. `42e57a4` feat(ci): add CI workflows for typechecking, testing, and dependency review; include coverage reporting and secret scanning; update .gitignore to exclude coverage directory
23. `3203a27` feat(setup): add Node.js 20 support and update package configurations; include .nvmrc for version management and enhance .gitignore to exclude node_modules
24. `63fd01a` feat(linting): integrate ESLint and Stylelint for TypeScript and CSS; update CI workflows to include linting steps; enhance README with new linting commands and usage instructions
25. `5d7a805` feat(e2e): introduce Playwright for end-to-end testing; add specifications and tasks for E2E tests; update .gitignore to exclude ESLint cache
26. `256adc9` feat(linting): add ESLint configuration for TypeScript across the repository; update package.json scripts for linting; enhance CI workflow to include root-level ESLint execution; update README with new linting structure and commands
27. `032c5c9` feat(linting): implement script for ESLint execution from repository root; update package.json scripts for TypeScript linting; enhance CI workflow for consistent linting across web, shared, and server directories
28. `010728c` feat(ci): add ci:fix script to automate linting fixes; update README with new command details; adjust Stylelint configuration for BEM-style classes and specificity rules
29. `0ff7e58` feat(env): add .env.example for environment variable configuration; include detailed descriptions for operational settings and SMTP configuration; update .gitignore to exclude sensitive .env files; introduce LICENSE file with GPL-3.0 text; enhance hosting documentation with environment variable usage and operational email settings
30. `f38284d` feat(husky): add pre-commit and pre-push hooks for automated linting and verification; update package.json to include husky and new CI scripts for pre-commit checks
31. `913b5b0` feat(ops): update default week settings to include weekend days (Saturday and Sunday) in ISO week configuration
32. `d7e72a9` feat(docs): enhance hosting documentation with Apache configuration details and update TLS termination notes; add fan-product logo to web index and update asset source in fan-product notice
33. `c06527b` feat(env): update .env.example with new handling for ABUSE_DOC_CREATE_MAX; enhance CI scripts to include server tests; improve documentation on abuse prevention settings; refactor server code for environment variable parsing
34. `46762d6` feat(ci): add deployment workflow for VPS; configure SSH access and deployment steps for production environment on push to main/master branch
35. `b8fa313` feat(ci): refine deployment workflow for VPS; optimize SSH access configuration and streamline deployment steps for production environment on main/master branch push
36. `5809af6` feat(ci): enhance deployment workflow with diagnostic steps for SSH connectivity; add optional SSH port and protocol configuration
37. `a79ae46` feat(ci): improve VPS deployment script by enhancing branch detection logic and updating documentation for clarity on default branch behavior
38. `8901358` feat(e2e): integrate Playwright for end-to-end testing; add configuration files and scripts for E2E tests, including integration with CI; update package.json and .gitignore to support new testing structure
39. `c539aac` feat(tests): update Vitest configuration to include specific test file patterns and exclude unnecessary directories for improved test management
40. `caaac47` feat(tests): update Playwright configuration to ignore integration tests and modify E2E serve script for improved process management
41. `7115cca` feat(logger): add function to normalize rotating log file size; update logger configuration to use normalized size

<!-- AUTO:CHANGELOG_GIT_END -->
