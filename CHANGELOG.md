# 1.0.0 (2026-04-04)


### Bug Fixes

* **markdown-demo:** extend demo text for clarity and add single-page macro for improved layout presentation ([2f447b4](https://github.com/Rathch/DSABrew/commit/2f447b41da57dba1c81af2990891472560e2f242))
* **release:** update release workflow ([67d8eed](https://github.com/Rathch/DSABrew/commit/67d8eed20c57353a5f60cfb25d2b7585bfea9c4a))


### Features

* add initial project structure with .gitignore, constitution, and feature specifications for DSABrew renderer ([93b0bc7](https://github.com/Rathch/DSABrew/commit/93b0bc77a34205e654e09a4cf10d3bec0e1241fb))
* **api:** implement public document hosting with Fastify and SQLite; add endpoints for document creation, retrieval, and updates; include rate limiting and TTL for document deletion; update README and documentation for API usage and deployment instructions ([75031fc](https://github.com/Rathch/DSABrew/commit/75031fca83b11e4c478a2a51745d5cdda70a4221))
* **ci:** add CI workflows for typechecking, testing, and dependency review; include coverage reporting and secret scanning; update .gitignore to exclude coverage directory ([42e57a4](https://github.com/Rathch/DSABrew/commit/42e57a444be321b0b8d62db916ed6278f02e7c73))
* **ci:** add ci:fix script to automate linting fixes; update README with new command details; adjust Stylelint configuration for BEM-style classes and specificity rules ([010728c](https://github.com/Rathch/DSABrew/commit/010728c71f6388e77abe7bb11441cbb82cbdeec0))
* **ci:** add deployment workflow for VPS; configure SSH access and deployment steps for production environment on push to main/master branch ([46762d6](https://github.com/Rathch/DSABrew/commit/46762d682ec11f3e9e0ca198cd78b8d58679bfdf))
* **ci:** create separate deployment workflow for VPS ([d5cd5e8](https://github.com/Rathch/DSABrew/commit/d5cd5e86db8c6a50cec76817b22e2a19c553eb2d))
* **ci:** enhance deployment workflow with diagnostic steps for SSH connectivity; add optional SSH port and protocol configuration ([5809af6](https://github.com/Rathch/DSABrew/commit/5809af62eca96962f60b2f21bbedc18c4457a5db))
* **ci:** improve VPS deployment script by enhancing branch detection logic and updating documentation for clarity on default branch behavior ([a79ae46](https://github.com/Rathch/DSABrew/commit/a79ae46b0a019337e01e211ce86419ab36a98b3b))
* **ci:** refine deployment workflow for VPS; optimize SSH access configuration and streamline deployment steps for production environment on main/master branch push ([b8fa313](https://github.com/Rathch/DSABrew/commit/b8fa3133b99103ffbac2c728e04321741b1bc4cb))
* **datenschutz:** add static Datenschutz content and integrate privacy strip functionality; enhance layout and styling for legal pages ([3473e86](https://github.com/Rathch/DSABrew/commit/3473e8692929feb42a2efb8d182097af8ba361c1))
* **docs:** enhance hosting documentation with Apache configuration details and update TLS termination notes; add fan-product logo to web index and update asset source in fan-product notice ([d7e72a9](https://github.com/Rathch/DSABrew/commit/d7e72a9ee82a00289e34e547ab5ef67685aa7e6b))
* **docs:** update README, hosting, and renderer specifications to clarify document creation flow; introduce fan product notice in app footer and enhance styling for legal pages ([6230320](https://github.com/Rathch/DSABrew/commit/62303203a92f65b12e95963402ab14fd142cf408))
* **docs:** update README, hosting, and renderer specifications to clarify document creation flow; introduce fan product notice in app footer and enhance styling for legal pages ([525943a](https://github.com/Rathch/DSABrew/commit/525943a24d324edfc8f21e8984625ee94f622617))
* **dsabrew:** enhance project setup with README, additional assets, and refined specifications; update .gitignore for build artifacts ([5f80453](https://github.com/Rathch/DSABrew/commit/5f804530815ad0502f205c3e27d164fb013afb54))
* **dsabrew:** expand specifications and documentation for DSABrew renderer, including data model, implementation plan, quickstart guide, and macro contracts ([713608e](https://github.com/Rathch/DSABrew/commit/713608ea4152e4671d977f8c65e2fe89a1a3dffc))
* **e2e:** integrate Playwright for end-to-end testing; add configuration files and scripts for E2E tests, including integration with CI; update package.json and .gitignore to support new testing structure ([8901358](https://github.com/Rathch/DSABrew/commit/8901358e67ade9b3ae1c7d93ae9c3bf8e504251c))
* **e2e:** introduce Playwright for end-to-end testing; add specifications and tasks for E2E tests; update .gitignore to exclude ESLint cache ([5d7a805](https://github.com/Rathch/DSABrew/commit/5d7a805f6021cc4f630d3df4396b21887c51febf))
* **env:** add .env.example for environment variable configuration; include detailed descriptions for operational settings and SMTP configuration; update .gitignore to exclude sensitive .env files; introduce LICENSE file with GPL-3.0 text; enhance hosting documentation with environment variable usage and operational email settings ([0ff7e58](https://github.com/Rathch/DSABrew/commit/0ff7e5890e1350e8aafac945ab0890c82957e26b))
* **env:** update .env.example with new handling for ABUSE_DOC_CREATE_MAX; enhance CI scripts to include server tests; improve documentation on abuse prevention settings; refactor server code for environment variable parsing ([c06527b](https://github.com/Rathch/DSABrew/commit/c06527b7107d118a1bb3e20c972edaa947bd7e09))
* **husky:** add pre-commit and pre-push hooks for automated linting and verification; update package.json to include husky and new CI scripts for pre-commit checks ([f38284d](https://github.com/Rathch/DSABrew/commit/f38284d75632fa72ea9a5d112ef31bcd840c791b))
* **linting:** add ESLint configuration for TypeScript across the repository; update package.json scripts for linting; enhance CI workflow to include root-level ESLint execution; update README with new linting structure and commands ([256adc9](https://github.com/Rathch/DSABrew/commit/256adc94f738aa2fe42f6daea940cf1d08bc6de8))
* **linting:** implement script for ESLint execution from repository ([032c5c9](https://github.com/Rathch/DSABrew/commit/032c5c971d8e490599134a9db6b9664f1a466175))
* **linting:** integrate ESLint and Stylelint for TypeScript and CSS; update CI workflows to include linting steps; enhance README with new linting commands and usage instructions ([63fd01a](https://github.com/Rathch/DSABrew/commit/63fd01a480d4b4b341a12dc592192d96b482384e))
* **logger:** add function to normalize rotating log file size; update logger configuration to use normalized size ([7115cca](https://github.com/Rathch/DSABrew/commit/7115cca65f5ae2c8037d35731bd9501cb644cc94))
* **media:** add dummy NPC portrait SVG asset and update references in markdown demo and renderer; enhance toolbar with preview functionality for NPC blocks ([1c5fe38](https://github.com/Rathch/DSABrew/commit/1c5fe380b054f67669561c46dbd157aac275e856))
* **media:** add multiple new image assets for document rendering and default backgrounds ([abe7663](https://github.com/Rathch/DSABrew/commit/abe766330c7fa744fd6de849ab628d61afff3b32))
* **media:** introduce new assets and scripts for GM frame rendering; add configuration for frame slicing and import functionality ([cba43b0](https://github.com/Rathch/DSABrew/commit/cba43b080c81eee4fd1c00f2c178aa3948b34f80))
* **ops:** update default week settings to include weekend days (Saturday and Sunday) in ISO week configuration ([913b5b0](https://github.com/Rathch/DSABrew/commit/913b5b0c3977c266ccb59a6a882db27567ace770))
* **pdf:** implement in-app PDF export functionality using html2canvas and jsPDF; update documentation and specifications to reflect new download feature and enhance user experience with multi-page A4 layout ([246c128](https://github.com/Rathch/DSABrew/commit/246c12865d8b5bd33a920a36c459c2013e33dfb0))
* **release:** implement semantic-release setup with changelog generation ([c20cee3](https://github.com/Rathch/DSABrew/commit/c20cee34b58f085fd77a246fedf5db1d3c3b7872))
* **renderer:** add `{{abschnitt N | LABEL}}` macro for internal jumps to numbered H2 headings; implement toolbar integration and rendering logic; enhance styles and tests for new functionality ([8130c3e](https://github.com/Rathch/DSABrew/commit/8130c3eaea78c9ee5101624262f13bccfdefc542))
* **renderer:** implement roulbox macro for styled rule blocks with optional subtitles; enhance Markdown table rendering and add corresponding styles ([f4b3420](https://github.com/Rathch/DSABrew/commit/f4b34204e803e869da8b6fef0ef5c1fb89ec72fa))
* **renderer:** introduce `\pageSingle` macro for single-column page layout; update rendering logic and styles to support new layout; enhance demo and tests for functionality ([5d9c9c8](https://github.com/Rathch/DSABrew/commit/5d9c9c8c56c67d2036644ccfe12c83de76a8fdbd))
* **renderer:** refactor NPC block handling and introduce new macros for easier/harder difficulty ratings and chess pieces; update asset paths and styles for improved rendering ([d5f71fd](https://github.com/Rathch/DSABrew/commit/d5f71fd073aabadc126f60f106793d7aa474a41f))
* **scroll-sync:** implement editor and preview scroll synchronization with minimap; add UI elements for scroll linking and enhance layout responsiveness ([946183e](https://github.com/Rathch/DSABrew/commit/946183eb51ab00d66f8f69223c36d72021e9597d))
* **setup:** add Node.js 20 support and update package configurations; include .nvmrc for version management and enhance .gitignore to exclude node_modules ([3203a27](https://github.com/Rathch/DSABrew/commit/3203a27d1a76aeb83d32a541be9dbed8879224ab))
* **style:** add custom bullet list styling and table of contents layout; include new list-bullet asset for improved visual presentation ([66d4e53](https://github.com/Rathch/DSABrew/commit/66d4e5387645e7f5e15aa0910018eb403bdae236))
* **style:** enhance footer layout and spacing for A4 pages; introduce new CSS variables for footer gap and clearance, and adjust page-body styles for improved flexibility and alignment of footnotes ([6fb9386](https://github.com/Rathch/DSABrew/commit/6fb9386a6fbe76d4134b2a7e87fcc258436c4a4b))
* **tests:** add unit tests ([b9eb1b6](https://github.com/Rathch/DSABrew/commit/b9eb1b647a9320d3d625284669cb44a59a9a901c))
* **tests:** refactor E2E tests ([a9cd99a](https://github.com/Rathch/DSABrew/commit/a9cd99a11ae229f7099092266e4e68e8b5efc67e))
* **tests:** update Playwright configuration to ignore integration tests and modify E2E serve script for improved process management ([caaac47](https://github.com/Rathch/DSABrew/commit/caaac4716793188ab7573eb420539dd15d3254db))
* **tests:** update Vitest configuration to include specific test file patterns and exclude unnecessary directories for improved test management ([c539aac](https://github.com/Rathch/DSABrew/commit/c539aaca269c9157675c98dd95734931838361ab))
* **theme:** implement theme preference management with light, dark, and system modes; enhance UI with theme toggle buttons and responsive styling; add functionality for editor line numbers and page stripes in the editor ([bf58b03](https://github.com/Rathch/DSABrew/commit/bf58b030e42247208aee16dead461009741509fa))

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
