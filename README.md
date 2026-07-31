# Hotaru Ascend Portfolio

A dependency-free, multilingual portfolio website for **Hotaru Ascend**, a student-led development team in Japan.

The website is generated with Node.js and published as plain HTML, CSS, and JavaScript on GitHub Pages. It currently presents the team, capabilities, statistics, member profiles, and preparing states for projects and the blog.

## Supported languages

| Language | Path |
|---|---|
| Japanese | `/` |
| English | `/en/` |
| Russian | `/ru/` |
| Traditional Chinese for Taiwan | `/zh-tw/` |
| Korean | `/ko/` |
| Hindi | `/hi/` |
| French | `/fr/` |
| German | `/de/` |

## Features

- Eight-language home, member profile, article, and error pages
- Member cards and individual member profile pages
- Equivalent-page language switching
- Responsive editorial layout
- Light and dark themes
- Accessible mobile navigation and reduced-motion support
- Localized SEO metadata and Open Graph tags
- Canonical and `hreflang` links
- XML sitemap and robots.txt
- Preparing states for projects and the blog
- Future article generation from `content/posts.json`
- Automated GitHub Pages deployment
- No contact form, database, server-side API, or external npm dependencies

## Project structure

```text
content/
  languages.json       Language metadata and interface labels
  site.json            Brand copy, links, statistics, and footer copy
  members.json         Member names, roles, introductions, icons, skills, and links
  posts.json           News and engineering articles; currently empty
  skills.json          Skills and localized descriptions

public/
  members/             Member icon files
  logo.svg             Hotaru Ascend wordmark
  favicon.svg          Browser icon
  og-image.svg         Social sharing image

scripts/
  build.mjs            Static-site generator
  validate-release.mjs Release and translation validation
  serve.mjs            Local preview server

src/
  app.js                Theme, navigation, and scroll behavior
  styles.css            Layout, member cards, member profiles, and responsive rules

docs/                   Japanese editing and deployment guides
```

## Local development

Requirements:

- Node.js 20 or newer
- Git, only when cloning or pushing changes

No `npm install` step is required.

```bash
git clone https://github.com/Naokibot/TSUBAKI_HP.git
cd TSUBAKI_HP
npm run check
npm run dev
```

Open `http://localhost:4173`.

## Production build

```bash
npm run build:pages
```

The generated website is written to `dist/`.

## GitHub Pages deployment

1. Open the repository on GitHub.
2. Open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Open **Actions → Deploy portfolio to GitHub Pages**.
5. Run the workflow, or push a commit to `main`.
6. Open `https://naokibot.github.io/TSUBAKI_HP/`.

The repository is still named `TSUBAKI_HP`, so the existing GitHub Pages path remains unchanged even though the public brand is Hotaru Ascend.

## Editing member profiles

Member profiles are controlled by:

```text
content/members.json
```

Each array entry creates:

- one member card on the home page
- one individual profile page in every supported language
- sitemap entries for each localized profile page

Example:

```json
{
  "slug": "member-name",
  "icon": "/members/member-name.svg",
  "name": {
    "ja": "表示名",
    "en": "Display Name",
    "ru": "Display Name",
    "zh-TW": "Display Name",
    "ko": "Display Name",
    "hi": "Display Name",
    "fr": "Display Name",
    "de": "Display Name"
  },
  "role": {
    "ja": "担当",
    "en": "Role"
  },
  "summary": {
    "ja": "一覧カードに表示する短い紹介",
    "en": "Short introduction shown on the card"
  },
  "bio": {
    "ja": "個別ページに表示する詳しい紹介",
    "en": "Long introduction shown on the profile page"
  },
  "skills": ["Programming", "Design"],
  "github": "https://github.com/example"
}
```

All eight language keys are required for `name`, `role`, `summary`, and `bio`. Put the icon file in `public/members/` and use an absolute site path such as `/members/member-name.svg`.

## Common edits

| Change | File or field |
|---|---|
| Public team name | `content/site.json` → `name` |
| Hero tagline | `content/site.json` → `tagline` |
| Homepage introduction | `content/site.json` → `description` |
| About copy | `content/site.json` → `about` |
| Development note | `content/site.json` → `developmentSince` |
| Footer message | `content/site.json` → `footerTagline` |
| Statistics | `content/site.json` → `stats` |
| Member profiles | `content/members.json` |
| Member icons | `public/members/` |
| Navigation and interface translations | `content/languages.json` |
| Articles | `content/posts.json` |
| Skills | `content/skills.json` |
| Colors, spacing, typography | `src/styles.css` |
| Browser interactions | `src/app.js` |
| Page structure and SEO | `scripts/build.mjs` |
| Logo and social artwork | `public/logo.svg`, `public/favicon.svg`, `public/og-image.svg` |

A detailed Japanese guide is available at `docs/EDITING_GUIDE_JA.md`.

## Validation

```bash
npm run validate
npm run check
npm run build:pages
```

Validation checks the brand name, eight-language UI consistency, member profile fields, icon paths, preparing states, removed contact features, and deleted legacy copy.

## License

MIT License
