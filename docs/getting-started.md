# 🏁 Getting started

## 📋 Requirements

| Tool       | Version                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------- |
| 🟢 Node.js | **24 or newer**; `.nvmrc` pins `26`, the newest line                                          |
| 📦 npm     | 11 or newer (ships with Node 24)                                                              |
| 🌐 Browser | Any evergreen browser. Chromium-based browsers additionally render the glass refraction layer |

> [!TIP]
> With a version manager, run `nvm use` (or `fnm use`) in the project root to switch to the Node.js line from `.nvmrc`.

## 📦 Install and run

```bash
npm ci
npm run dev
```

The dev server prints a local URL.

Open `http://localhost:5173`. The app lives at the root, the same as on <https://tasks.sacrificed.me>.

### 🐳 In Docker

```bash
docker compose -f compose.yaml -f docker/development.yaml up --watch
```

The same Vite dev server runs in a container at `http://localhost:5173`, and Compose Watch copies every change into it. Staging and production images with nginx are described in [Deployment](./deployment.md#-docker).

## 📜 npm scripts

| Script                  | What it does                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run dev`           | 🔥 Starts the Vite dev server with hot module replacement                                         |
| `npm run build`         | 📦 Type-checks the project and builds the production bundle into `dist/`                          |
| `npm run preview`       | 👀 Serves the production build locally, including the service worker                              |
| `npm run typecheck`     | 🧠 Runs the TypeScript 7 compiler in build mode without emitting files                            |
| `npm run lint`          | 🧹 Lints the code with Oxlint, including type-aware and React Compiler rules                      |
| `npm run lint:fix`      | 🩹 Applies the automatic Oxlint fixes                                                             |
| `npm run lint:text`     | 🧾 Finds em and en dashes in every text file and says where they are                              |
| `npm run format`        | 🎨 Formats every supported file with Oxfmt                                                        |
| `npm run format:check`  | 🔎 Fails if a file is not formatted                                                               |
| `npm test`              | 👁️ Starts Vitest in watch mode                                                                    |
| `npm run test:run`      | 🧪 Runs the whole test suite once                                                                 |
| `npm run test:coverage` | 📊 Runs the tests with V8 coverage and enforces the coverage thresholds                           |
| `npm run test:e2e`      | 🎭 Builds and previews the app, then runs Playwright, axe and Lighthouse                          |
| `npm run flags`         | 🏳️ Copies the flag of every language from `country-flag-icons` into `public/flags`                |
| `npm run check`         | ✅ Lint, the dash check, format check, type check and unit tests in one go, run it before pushing |

After `npm run build`, `node scripts/build-report.mjs` prints the bundle sizes and verifies the security headers, exactly as the pipeline does.

> [!TIP]
> Install the browsers for the end-to-end tests once with `npx playwright install chromium webkit`, or `make browsers`.

## 🛠️ make

Every common task has a short `make` command with a coloured summary of what it is doing:

| Command                                               | What it does                                                                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `make` or `make help`                                 | 📖 Every command, grouped by environment, with coloured **[DEV]**, **[STAGE]** and **[PROD]** tags                                                                  |
| `make setup`                                          | 🧰 Installs the packages, creates `.env` from `.env.example`, installs Chromium and WebKit for the tests and turns on the Git hooks                                 |
| `make env`                                            | 🔐 Creates the env file from `.env.example` if it is missing, never overwrites one; the Docker commands such as `make dev-up` do the same on their first run        |
| `make hooks`                                          | 🪝 Turns on the Git hooks in `.githooks/`: format, lint and dash checks of the staged files, and Conventional Commits for the message                               |
| `make doctor`                                         | 🩺 Checks Node.js, npm, Docker, the packages and the env file                                                                                                       |
| `make dev`                                            | 🚀 Starts the dev server                                                                                                                                            |
| `make check` / `make ci`                              | ✅ The checks before pushing / everything CI runs: registry signatures, the changelog, the checks with coverage, the build with its report and the end-to-end tests |
| `make e2e-chromium` · `make e2e-webkit`               | 🎭 The two end-to-end jobs of CI: Chromium with the visual tests and Lighthouse, or WebKit                                                                          |
| `make fix`                                            | 🪄 Applies the lint fixes and formats every file                                                                                                                    |
| `make dev-up` · `make stage-up` · `make prod-up`      | 🐳 Starts an environment in Docker: development with hot reload, staging and production in the background                                                           |
| `make stage-logs` · `make prod-ps` · `make dev-shell` | 📜 Every environment has the same commands: `up`, `down`, `restart`, `logs`, `ps`, `shell`, `open` and `clean`                                                      |
| `make status`                                         | 🚦 Shows which environments are running                                                                                                                             |
| `make up ENV=…`                                       | 🐳 The same commands for any `ENV`, handy in scripts; production asks before `down`, `restart` and `clean` unless `YES=1`                                           |
| `make shared`                                         | 🔗 Compares the files shared with the other two apps when they are checked out next to this one                                                                     |
| `make shared-sync`                                    | 🔁 Copies the shared files of this app over the other two after you changed one of them here                                                                        |
| `make live` · `make live-lighthouse`                  | 📡 The checks of the monitor against the live site, or the address in `MONITOR_URL`                                                                                 |
| `make screenshots`                                    | 📸 Takes the README pictures again from a running app, see [Contributing](./contributing.md#-readme-pictures)                                                       |
| `make clean` · `make reset`                           | 🧹 Removes build output and reports / also reinstalls the packages                                                                                                  |

> [!NOTE]
> The Makefile needs GNU Make and Bash, which macOS and Linux ship with; on Windows use WSL or the npm scripts above. Colours switch off in pipes and with `NO_COLOR=1`.

## 🗂️ Project layout

```text
tasks/
├── .github/
│   ├── ISSUE_TEMPLATE/              Bug report and feature request forms
│   ├── workflows/ci.yml             CI/CD: verify, build, end-to-end tests, Docker image, dependency review, deploy
│   ├── workflows/codeql.yml         CodeQL code scanning
│   ├── workflows/release.yml        GitHub release for every version tag
│   ├── dependabot.yml               Weekly npm, GitHub Actions and Docker updates
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── SECURITY.md                  How to report vulnerabilities
├── docker/                          Multi-stage Dockerfile, nginx configuration and the three environment overlays
├── docs/                            This documentation and its screenshots
├── e2e/                             Playwright specs and their helpers
├── lint/comments.js                 Custom Oxlint rule that keeps comments to one short line
├── public/                          Favicons, PWA icons, language flags, the social preview and the install screenshots
├── scripts/                         Flag sync, release notes, the coverage summary and the build report
├── src/
│   ├── app/                         Entry point, App shell, store, persistence, launch intents, PWA, back button, error screen
│   ├── widgets/                     Sidebar, Toolbar (phones), Workspace, Inspector, Backdrop, Footer
│   ├── features/
│   │   ├── tasks/                   Task model, repeats, quick add, subtasks; composer, list, rows, context menu, drag and drop, details
│   │   ├── projects/                Project model, colours and emoji icons; sidebar list, picker, dialog
│   │   ├── lists/                   Smart lists and project views, date groups, sorting, view state; navigation, tags, tab bar, Lists sheet, list header
│   │   ├── data/                    The stored document, import and export, undo history
│   │   ├── stats/                   Activity, streak and project progress; the overview card
│   │   ├── commands/                Shared task commands; the ⋯ menu and the ⌘K palette
│   │   ├── search/                  Search field
│   │   ├── settings/                Appearance, accent, background, glass, language and effects; the settings dialog
│   │   ├── i18n/                    Messages in ten languages, the lazy catalog, names, flags, Intl tags, week starts and the translator
│   │   └── notifications/           Toast state, the Toaster and the offline badge
│   ├── shared/
│   │   ├── ui/                      Icon, IconButton, Checkbox, Popover, Dialog, ContextMenu, Calendar, SwatchPicker, SegmentedControl, ProgressBar, EmptyState, Brand
│   │   ├── hooks/                   Refraction, effects level, shortcuts, media queries, scroll position, online status, app badge, today, pointer light
│   │   ├── lib/                     Dates and calendars, keyboard, fuzzy search, storage, motion, refraction, effects, haptics, confetti, Trusted Types, site details
│   │   ├── styles/                  Design tokens, accent and background palettes, glass and menu mixins, global styles
│   │   └── assets/                  Flow-lines artwork used by the backdrop
│   ├── test/                        Test setup, polyfills, factories and render helpers
│   └── types/                       Global type declarations
├── CHANGELOG.md                     Every release, newest first
├── Makefile                         make help, setup, dev, checks and Docker commands
├── compose.yaml                     The Docker Compose service shared by every environment
├── index.html
├── vite.config.ts                   Vite, React Compiler, PWA and CSP configuration
├── vitest.config.ts                 Vitest on top of the Vite configuration
├── playwright.config.ts             Browsers and the preview server for end-to-end tests
├── .dockerignore                    Keeps dependencies, build output and secrets out of the image
├── .oxlintrc.json                   Lint rules and layer boundaries
└── .oxfmtrc.json                    Formatting rules
```

Every feature has a `model/` folder for state and logic and, when it renders something, a `ui/` folder with one folder per component, for example `features/tasks/ui/TaskItem/TaskItem.tsx`, `TaskItem.module.scss` and `useRowGestures.ts`, a hook only that component uses. Tests sit next to the code they cover as `*.test.ts(x)`. The layers and their rules are explained in [Architecture](./architecture.md#-layers).

## 💻 Editor setup

Editor settings are not committed. For the best experience in VS Code, install:

- 🦀 **Oxc**: inline Oxlint diagnostics and Oxfmt formatting on save
- ⚡ **Vitest**: run and debug tests from the editor
- 🎭 **Playwright Test for VS Code**: run end-to-end tests and record locators
- 📝 **EditorConfig**: consistent whitespace settings (`.editorconfig` is part of the repository)

## 👉 Next steps

- ✨ Learn what the app can do in [Features](./features.md).
- 🏗️ Understand how data flows through the app in [Architecture](./architecture.md).
- 🌍 Add or change texts with the [Localization](./i18n.md) guide.
