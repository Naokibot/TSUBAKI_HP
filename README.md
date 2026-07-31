# TSUBAKI Tech Portfolio

A dependency-free, multilingual portfolio website for **TSUBAKI Tech**, a student-led development team in Japan. The site presents projects, engineering articles, skills, achievements, public GitHub repositories, and a Formspree-powered contact form.

The project uses Node.js only as a static-site generator. The published website is plain HTML, CSS, and JavaScript and is deployed automatically to GitHub Pages.

## Supported languages

| Language | URL path |
|---|---|
| Japanese | `/` |
| English | `/en/` |
| Russian | `/ru/` |
| Traditional Chinese for Taiwan | `/zh-tw/` |
| Korean | `/ko/` |
| Hindi | `/hi/` |
| French | `/fr/` |
| German | `/de/` |

The language menu keeps visitors on the equivalent project or article page. Each page also includes canonical URLs, `hreflang` alternates, localized Open Graph metadata, and localized runtime messages.

## Features

- Eight-language home, project, article, and error pages
- Editorial, responsive layout with light and dark themes
- Project detail pages and technical articles generated from JSON
- Public GitHub repository feed
- Formspree contact form with basic anti-spam checks
- SEO metadata, JSON-LD, sitemap, robots.txt, and Open Graph tags
- Translation completeness checks before every build
- Automated deployment through GitHub Actions and GitHub Pages
- No external npm dependencies

## Project structure

```text
content/
  languages.json       Language metadata, navigation labels, and runtime messages
  site.json            Team profile, homepage copy, links, statistics, and CTA
  projects.json        Project cards and project detail content
  posts.json           News and engineering articles
  skills.json          Skills and localized descriptions
  achievements.json    Achievements and qualifications

public/                 Logo, profile artwork, project images, favicon, and OGP assets
scripts/
  build.mjs             Static-site generator
  validate-translations.mjs
                        Three-pass localization validation
  serve.mjs             Local static server
src/
  app.js                Browser interactions and contact form behavior
  styles.css            Complete visual system and responsive layout
docs/                   Editing, deployment, form, and translation-review guides
```

## Requirements

- Node.js 20 or newer
- Git, only when cloning or publishing changes

No `npm install` step is required because the project has no external package dependencies.

## Local development

```bash
git clone https://github.com/Naokibot/TSUBAKI_HP.git
cd TSUBAKI_HP
npm run check
npm run dev
```

Open `http://localhost:4173` in a browser.

Useful commands:

```bash
npm run validate      # Check all localized content
npm run check         # Validate translations and JavaScript syntax
npm run build         # Build the local version into dist/
npm run build:pages   # Build with the GitHub Pages base path
npm run serve         # Serve an existing dist/ directory
```

## Publishing with GitHub Pages

1. Open the repository settings.
2. Go to **Pages**.
3. Set **Source** to **GitHub Actions**.
4. Run the `Deploy portfolio to GitHub Pages` workflow once, or push to `main`.
5. Open `https://naokibot.github.io/TSUBAKI_HP/`.

Every push to `main` triggers validation, a production build, and deployment.

## Enabling the contact form

Create a form in Formspree and replace the placeholder in `content/site.json`:

```json
"contactEndpoint": "https://formspree.io/f/YOUR_REAL_FORM_ID"
```

Set the notification recipient in Formspree to `tsubaki.tech.jp@gmail.com`. See `docs/GITHUB_PAGES_FORM_SETUP_JA.md` for the detailed setup process.

## Where to edit common items

| What you want to change | File | Key or section |
|---|---|---|
| Team name and public links | `content/site.json` | `name`, `email`, `githubUrl`, `xUrl`, `instagramUrl` |
| Hero copy and About section | `content/site.json` | `tagline`, `description`, `about` |
| Announcement bar | `content/site.json` | `announcement` |
| Mission, focus areas, statistics, CTA | `content/site.json` | `mission`, `focusAreas`, `stats`, `cta` |
| Navigation and form translations | `content/languages.json` | each language's `ui` object |
| Projects | `content/projects.json` | project objects |
| Articles | `content/posts.json` | post objects |
| Skills | `content/skills.json` | skill objects |
| Achievements | `content/achievements.json` | achievement objects |
| Colors, spacing, typography, responsive layout | `src/styles.css` | `:root`, component classes, media queries |
| Browser interactions | `src/app.js` | named functions by feature |
| Page structure and SEO output | `scripts/build.mjs` | `homePage`, `projectPage`, `postPage`, `documentHead` |
| Images and logo | `public/` | replace the relevant asset while preserving its path |

The detailed Japanese editing guide is available at `docs/EDITING_GUIDE_JA.md`.

## Adding or editing translations

Localized values use the following shape:

```json
{
  "ja": "日本語",
  "en": "English",
  "ru": "Русский",
  "zh-TW": "繁體中文",
  "ko": "한국어",
  "hi": "हिन्दी",
  "fr": "Français",
  "de": "Deutsch"
}
```

Do not remove language keys from a localized object. `npm run validate` fails when a translation is missing or empty.

The current translations were reviewed in three editorial passes: meaning and factual alignment, natural wording and regional terminology, and UI consistency and publishing hygiene. Automated checks cannot replace an independent native-language editor for legal, medical, contractual, or other high-stakes public copy. See `docs/TRANSLATION_REVIEW.md`.

## Design and code principles

- Content is kept separate from presentation.
- Functions are named by responsibility instead of relying on dense inline logic.
- Browser code is split into small feature sections with comments where intent matters.
- External links and user-generated repository data are escaped or validated before rendering.
- Secret keys are never stored in browser code.
- Reduced-motion preferences and keyboard navigation are respected.

## License

MIT License
