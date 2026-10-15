# 📜 Changelog

All notable changes to Tasks are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html). How versions are cut is described in [docs/releases.md](./docs/releases.md).

## [Unreleased]

## [1.0.0] - 2026-10-15

The first release.

### Added

- 📚 Smart lists for all tasks, today, upcoming, important and completed tasks, with counters and a badge on the installed app.
- 📁 Projects with colours, emoji icons picked from a grid or typed in the name, their own pages and progress, and an undoable delete.
- ✍️ Quick add that understands dates, repeats, projects and importance in the title, in all ten languages.
- 🔁 Repeating tasks, subtasks with a progress chip, notes, a calendar and drag and drop between lists and projects.
- 🏷️ Tags on every task, picked or created with the **#** chip or typed as `#word`, with a tag cloud in the sidebar and in search.
- ↩️ Undo and redo for the last 50 changes, a context menu, a command palette and keyboard shortcuts for almost everything.
- 🎨 Light, dark and automatic themes, ten accents, six backgrounds, clear or tinted glass and full or reduced effects (reduced by default outside Apple devices).
- 📱 A phone layout with a tab bar, swipes on rows and between lists and projects, haptics and a Back button that closes sheets.
- 💾 Autosave with a request for persistent storage and a backup offer when saving fails, sync between tabs, validated JSON import and export, offline mode, app shortcuts, a share target and update prompts.
- 🌍 Ten languages: English, Ukrainian, Czech, German, Spanish, French, Italian, Dutch, Polish and Portuguese, loaded on demand.
- ♿ WCAG AA support: full keyboard control, landmarks, live regions, forced colours, reduced motion and reduced transparency.
- 🖨️ Printed lists that read as a clean checklist on white paper in any appearance.
- 🛡️ A strict Content Security Policy with Trusted Types, validated imports and flags served by the app itself.
- 🧪 Unit tests, end-to-end tests on the production build in Chrome and Safari's WebKit, visual tests, axe checks and a Lighthouse budget in CI, with deployment to GitHub Pages at tasks.sacrificed.me.
- 🔎 A light and a dark browser colour before the app loads, plus robots rules and a sitemap generated from the site address.
- 🐳 Docker images for development, staging and production: a multi-stage Dockerfile, a Compose overlay per environment and an unprivileged nginx with security headers and caching, a read-only file system and resource limits in staging and production; every release also publishes the production image to GitHub Packages for amd64 and arm64 with provenance and an SBOM.
- 📡 A `security.txt` for private reports and a monitor that checks the live site every hour and its Lighthouse scores every week.
- 🪝 Git hooks and CI checks for formatting, one-line comments, em and en dashes, Conventional Commits and pull request titles.
- 🛠️ A Makefile with a coloured, grouped `make help`: setup that creates `.env` from `.env.example`, the dev server, checks, end-to-end tests, every Docker environment and a sync of the files the three apps share.

[Unreleased]: https://github.com/sacrificed666/tasks/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/sacrificed666/tasks/releases/tag/v1.0.0
