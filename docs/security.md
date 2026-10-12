# 🛡️ Security

Tasks is a static, local-first web app: no backend, no accounts, no cookies, no analytics and no requests to other origins, not even for the language flags. That removes whole classes of problems, but the browser still handles untrusted data (imported files, shared content, URL parameters and data written by other tabs), so the app treats all of it as hostile until validated.

To report a vulnerability, follow the [security policy](../.github/SECURITY.md).

## 🗺️ Trust boundaries

```mermaid
flowchart LR
  subgraph Untrusted["⚠️ Untrusted input"]
    File[📥 Imported JSON file]
    Share[📤 Share target and URL parameters]
    Storage[(🗄️ localStorage and other tabs)]
    Typing[⌨️ Titles and notes]
  end

  subgraph Gate["🛂 Validation"]
    Limits["Size limits<br/>2 MB, 5000 tasks"]
    Parse["parseData()<br/>tasks, projects, links, ids, dates, lengths"]
    Normalize["normalizeTitle() / normalizeNotes()"]
  end

  subgraph App["✅ Trusted state"]
    Store[(🗃️ Redux store)]
    React["⚛️ React rendering<br/>text only, auto-escaped"]
  end

  File --> Limits --> Parse
  Storage --> Parse
  Share --> Normalize
  Typing --> Normalize
  Parse --> Store
  Normalize --> Store
  Store --> React
```

## 🧱 Content Security Policy

GitHub Pages cannot send custom headers, so the production build injects a CSP `<meta>` tag as the very first element of `<head>` (the `security-headers` plugin in `vite.config.ts`). The development server stays without it because Vite's hot reload relies on inline scripts.

| Directive                                               | Value                | Why                                                                                   |
| ------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| `default-src`                                           | `'self'`             | 🔒 Nothing is loaded from other origins                                               |
| `script-src`                                            | `'self'`             | 🚫 No inline scripts, no `eval`, no third-party code                                  |
| `style-src`                                             | `'self'`             | 🎨 Only the bundled stylesheet; dynamic values use the CSSOM                          |
| `img-src`                                               | `'self' data: blob:` | 🖼️ Icons, SVG masks, the refraction maps generated on a canvas and the language flags |
| `connect-src`, `font-src`, `manifest-src`, `worker-src` | `'self'`             | 📡 Only the app's own files and service worker                                        |
| `object-src`                                            | `'none'`             | 🧩 No plugins                                                                         |
| `base-uri`, `form-action`                               | `'self'`             | 🧭 Prevents base tag and form hijacking                                               |
| `require-trusted-types-for`                             | `'script'`           | 🛂 DOM XSS sinks only accept Trusted Types                                            |
| `trusted-types`                                         | `default`            | 📜 Only the app's own policy may create them                                          |

A `referrer` meta tag sets `strict-origin-when-cross-origin`, and external links use `rel="noopener noreferrer"`.

> [!NOTE]
> The policy has no `upgrade-insecure-requests`. Every address in the app is relative and GitHub Pages enforces HTTPS, so it would change nothing in production, while Safari, unlike Chrome, applies it to `localhost` too and broke the preview and the Docker images served over plain HTTP.

The only `<script>` without a `src` in `index.html` is the `application/ld+json` block with structured data for search engines. Browsers treat it as data and never run it, so it needs no exception in the policy; the build report allows exactly this type and fails on any other inline script.

## 🛂 Trusted Types

With Trusted Types enforced, assigning a string to a dangerous DOM sink such as `innerHTML`, `script.src` or `ServiceWorkerContainer.register()` throws. The app never needs HTML strings: React renders every title and note as text.

The only sink in use is the service worker registration. `shared/lib/trustedTypes.ts` installs a `default` policy that allows exactly one URL, the app's own `sw.js` on the same origin, and rejects everything else:

```ts
installScriptUrlPolicy([`${import.meta.env.BASE_URL}sw.js`]);
```

`scripts/build-report.mjs` checks on every CI run that the built `index.html` still contains the policy, enforces Trusted Types and has no inline scripts.

> [!NOTE]
> The end-to-end test `e2e/security.spec.ts` proves the same in a real browser: a session of adding tasks, opening the settings and the palette produces no console errors and no `securitypolicyviolation` events, and assigning HTML to `innerHTML` throws a `TypeError`.

## ✅ Input validation

| Input                      | Protection                                                                                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📥 Imported files          | Rejected above 2 MB, parsed with `JSON.parse` in a `try`, limited to 5000 tasks and 200 projects, validated by `parseData()`                                                       |
| 🗄️ Stored data, other tabs | Read through `readJson()` and `parseData()`; corrupted data falls back to defaults instead of crashing                                                                             |
| 📁 Projects                | Names normalized and cut to 40 characters, colours checked against the fixed list, duplicates dropped                                                                              |
| 🔗 Links                   | A task's `projectId` must be a valid id of a project in the same document, otherwise the task keeps no project                                                                     |
| 🆔 Ids                     | Must match `[A-Za-z0-9_-]{1,64}`; anything else, or a duplicate, is replaced with a fresh `nanoid()`                                                                               |
| 📝 Titles and notes        | Whitespace-normalized and cut to 200 and 2000 characters, counted in Unicode code points                                                                                           |
| 📅 Dates                   | Only real calendar dates in `YYYY-MM-DD`; `2026-02-30` is dropped                                                                                                                  |
| 🔗 URL parameters          | Only `list`, `action`, `title`, `text` and `url` are read; they become plain text and are removed from the address bar                                                             |
| 🎨 Preferences             | Every value is checked against the allowed appearances, accents, backgrounds, glass styles, languages, effects and sort orders; a saved project view must name an existing project |

Objects are rebuilt field by field, so unknown properties, including `__proto__`, never reach the store.

## 🏳️ Flag images

The language picker shows flags from `public/flags/`, copied from the `country-flag-icons` package by `npm run flags`, so no third-party origin is involved.

- 🖼️ They are plain `<img>` elements from the app's own origin, the only one the CSP allows; an SVG loaded as an image cannot run scripts or reach the page.
- 💤 `loading="lazy"` inside closed menus means they load only when the settings or the palette's language commands are opened.
- 📦 The service worker precaches them with the rest of the app, so the language picker works offline too.

## 🗄️ Data on the device

- 💾 Tasks, projects and preferences live in `localStorage` of the site's origin and never leave the device.
- ⬅️ The history entries that let **Back** close sheets carry only a random marker, never task data, and are removed when the sheet closes.
- 🧹 Clearing the site data in the browser removes everything; the error screen offers **Download a backup** first, and a failed save offers **Export** at once.
- 📌 After the first change the app requests persistent storage, so the browser does not evict the tasks when space runs low. Safari still clears sites that were not opened for seven days of browsing unless the app is installed; see the [FAQ](./faq.md#-can-safari-delete-my-tasks-on-its-own).
- 🔄 The service worker only caches the app's own files and asks before activating an update.

## 🔗 Supply chain and CI

```mermaid
flowchart LR
  PR([Pull request]) --> Review[🛡️ Dependency review<br/>fails on high severity]
  PR --> CodeQL[🔬 CodeQL<br/>JS/TS and Actions]
  PR --> Verify[🔍 npm ci + npm audit signatures<br/>lint, types, tests]
  PR --> Build[🛠️ Build + build report<br/>CSP, Trusted Types, no inline scripts]
  PR --> E2E[🎭 End to end<br/>no CSP violations in a real browser]
  Schedule([Every Monday]) --> Dependabot[🤖 Dependabot]
  Schedule --> CodeQL
  Dependabot --> PR
```

- 📦 `npm ci` installs exactly what `package-lock.json` describes, and `npm audit signatures` verifies the registry signatures and provenance attestations of every package.
- 🛡️ The dependency review action blocks pull requests that add dependencies with high-severity advisories.
- 🔬 CodeQL scans the TypeScript code and the workflow files with the `security-extended` queries on every push, pull request and weekly.
- 🔐 Workflows run with a read-only token, checkouts do not persist credentials, and only the deploy job may write to Pages.
- 🤖 Dependabot proposes npm, GitHub Actions and Docker updates every week.
- ⏳ Dependabot waits before it proposes a new version: 3 days for npm patches, 7 for minor and 14 for major releases, and 7 days for actions and Docker images, so a compromised release is usually pulled before it reaches the project.
- 🏷️ Every release publishes its Docker image to GitHub Packages with SLSA provenance (`mode=max`) and an SBOM attached by BuildKit, so anyone can check how and from what the image was built.
- 📮 `/.well-known/security.txt` (RFC 9116) points to private advisories. The build writes it with an expiry one year ahead, and the monitor fails 30 days before that date, so a site that has not been rebuilt for eleven months is noticed in time.
- 📌 Every GitHub Action is pinned to a full commit SHA with its version in a comment, and the Docker base images are pinned by digest, so a moved tag can never change what runs; Dependabot updates both.
- 🐳 The Docker image serves the build with an unprivileged nginx and the same security headers; staging and production run it on a read-only file system without Linux capabilities, see [Deployment](./deployment.md#-docker).
- 🧾 npm runs dependency install scripts only for packages approved in `allowScripts` in `package.json`; the two that exist (`@parcel/watcher` and `fsevents`, both shipping prebuilt binaries) are denied.

## ☑️ Checklist for contributors

> [!CAUTION]
> Trusted Types make any HTML string assignment throw at runtime, in production only. Test new DOM code with `npm run test:e2e`, which runs the production build.

- [ ] Never render user content with `dangerouslySetInnerHTML` or assign HTML strings to the DOM.
- [ ] Route every new kind of input through a parser that rebuilds the data and caps its size.
- [ ] Do not add requests to other origins; if one is unavoidable, extend the CSP as narrowly as possible (one origin, one directive) and explain why in the pull request.
- [ ] Keep workflow permissions minimal and pass `persist-credentials: false` to new checkouts.
