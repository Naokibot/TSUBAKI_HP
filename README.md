# TSUBAKI Tech Portfolio

A dependency-free, multilingual portfolio website for **TSUBAKI Tech**, published with GitHub Pages.

The current public version keeps the project and blog sections in a clear “coming soon” state. The blog generation system remains in the static-site generator, so future articles can be added by editing `content/posts.json` without rebuilding the page structure by hand.

## Supported languages

- Japanese
- English
- Russian
- Traditional Chinese for Taiwan
- Korean
- Hindi
- French
- German

## Current public sections

- Hero and team introduction
- Development note: programming editor development since 2025
- Skills and capabilities
- Three release metrics, including two core projects
- Projects: coming soon
- Blog: coming soon
- GitHub link

The website intentionally contains no contact form and no social links other than GitHub.

## Editing guide

| Change | File |
|---|---|
| Team copy, statistics, footer copy, GitHub URL | `content/site.json` |
| Interface translations and “coming soon” messages | `content/languages.json` |
| Future blog articles | `content/posts.json` |
| Skills | `content/skills.json` |
| Page structure and article generation | `scripts/build.mjs` |
| Theme, navigation, and scroll interactions | `src/app.js` |
| Colors, spacing, and responsive layout | `src/styles.css` |

## Local development

```bash
npm run check
npm run dev
```

Open `http://localhost:4173`.

## Production build

```bash
npm run build:pages
```

The generated website is written to `dist/`.

## Deployment

The workflow at `.github/workflows/deploy-pages.yml` validates, builds, and deploys the site to GitHub Pages whenever `main` is updated.
