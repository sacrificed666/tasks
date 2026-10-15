# 🔎 SEO

Tasks is one static page that also works offline, so everything a search engine or a chat app needs is written into `index.html` and reaches crawlers before any JavaScript runs.

## 🏷️ Metadata

| Field                    | Value                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| 🏷️ Title                 | `Tasks · Private task planner`, then `Today · Tasks`, `Work · Tasks` and so on while the app is open  |
| 📝 Description           | A 154-character summary: projects, tags, smart lists, repeats, the calendar, offline, privacy         |
| 🔗 Canonical             | `https://tasks.sacrificed.me/`, whatever a shortcut or a share adds to the query                      |
| 🖼️ Open Graph and X card | Title, description and a 1200 × 630 preview (`public/og-image.jpg`) with alternative text             |
| 🌍 `og:locale`           | `en_GB`, with the nine other interface languages as `og:locale:alternate`                             |
| 🙈 `<noscript>`          | A heading and a summary for visitors and crawlers without JavaScript                                  |
| 🎨 Colours and app name  | `color-scheme`, a light and a dark `theme-color`, `application-name` and `apple-mobile-web-app-title` |

The description and the address of the site are written once, in `vite.config.ts`: `index.html` uses `%APP_DESCRIPTION%` and `%SITE_URL%`, and the `site-meta` plugin fills them in for the dev server and the build, so the meta tags, Open Graph, JSON-LD and the manifest can never disagree. The SEO end-to-end test fails if a placeholder is left in the page.

`useDocumentTitle()` in `app/useDocumentTitle.ts` names the tab after the open list in the interface language, so history entries, bookmarks and screen readers tell lists apart. **All tasks** shows the app name with a short tagline, which also gives search results a clearer title.

## 🌍 Languages

The interface speaks ten languages, but the language is a setting stored in the browser, not a part of the address: there is one page, and it switches language without a reload, see [Localization](./i18n.md).

- 📄 `<html lang>` follows the chosen language, so screen readers and browser translation pick the right one.
- 🏷️ `og:locale` and the structured data list every language the app supports.

> [!NOTE]
> Search engines index the English page only: a local-first app has no server that could render the other languages under their own addresses.

## 🧩 Structured data

`index.html` includes one `WebApplication` block in JSON-LD:

| Property                        | Value                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------ |
| 🏷️ `name`, `url`, `description` | The same as the metadata above                                                 |
| 🗂️ `applicationCategory`        | `ProductivityApplication`, on any operating system with a modern browser       |
| 🌍 `inLanguage`                 | All ten languages                                                              |
| 💸 `offers`                     | A free offer, together with `isAccessibleForFree`                              |
| 🖼️ `image`, `screenshot`        | The share preview and the wide screenshot of the manifest                      |
| ✨ `featureList`                | Projects, smart lists, repeats, the calendar and quick add, offline, languages |
| ✍️ `author`, `license`          | Illia Movchko and the MIT License                                              |

> [!TIP]
> Validate changes with the [Rich Results Test](https://search.google.com/test/rich-results) or the [Schema Markup Validator](https://validator.schema.org/), and check the share card with the preview of the network you post to.

## 🗺️ Sitemap and robots

The app has a domain of its own, so the build ships `robots.txt`, which allows everything and points to the sitemap, and `sitemap.xml` with the one address of the app. The `site-meta` plugin in `vite.config.ts` writes both from `siteUrl`, the same constant as the canonical link, and `scripts/build-report.mjs` checks that they agree.

In Docker, nginx sends `X-Robots-Tag: noindex, nofollow` and a `Disallow: /` robots file in every environment except production, so a staging copy never competes with the real site, see [Deployment](./deployment.md#-docker).

## ⚡ Page experience

- 📦 The build is one HTML file with hashed JavaScript and CSS, and the service worker precaches it for instant repeat visits and offline use.
- 🔤 Montserrat is self-hosted and loaded with `font-display: swap`; languages load on demand, so English visitors never download the other catalogues.
- 📐 Task rows use `content-visibility: auto` with an intrinsic size, so lists with thousands of tasks stay quick to render and scroll.
- 🧭 The manifest with icons, screenshots, shortcuts and a share target makes the app installable, see [Deployment](./deployment.md#-progressive-web-app).
- 🚦 The build report fails when the canonical link, the preview image, valid structured data or the manifest screenshots go missing, and a Lighthouse budget in CI keeps performance, accessibility, best practices and SEO in check, see [Testing](./testing.md).
