# Hotaru Ascend Portfolio

A dependency-free, multilingual portfolio website for **Hotaru Ascend**.

The site is generated with Node.js and published as plain HTML, CSS, and JavaScript on GitHub Pages. It includes team information, member profiles, statistics, projects, and a long-form blog.

## Features

- Eight-language home, member, article, and error pages
- Member cards and individual profile pages
- A restrained editorial interface with light and dark themes
- Long-form blog articles written as Markdown files
- A simple `npm run blog:new` article creation command
- Automated GitHub Pages deployment
- No contact form, database, server-side API, or external npm dependencies

## Local development

Requirements:

- Node.js 20 or newer
- Git, only when cloning or publishing changes

```bash
git clone https://github.com/Naokibot/TSUBAKI_HP.git
cd TSUBAKI_HP
npm run check
npm run dev
```

Open `http://localhost:4173`.

## Create a blog article

Run:

```bash
npm run blog:new
```

The command asks for the title, date, short description, and optional URL name. It creates one Markdown file in `content/blog/`. Open that file and write the full article below the metadata block.

```markdown
---
title: Minecraftサーバー開発で学んだこと
date: 2026-08-02
excerpt: Javaで独自機能を実装した過程を紹介します。
---

ここから長い本文を書きます。

## 最初に取り組んだこと

段落ごとに1行空けます。
```

`npm run dev` and production builds automatically synchronize the Markdown files with the website. Do not edit `content/posts.json` manually.

A detailed Japanese guide is available at `docs/BLOG_GUIDE_JA.md`.

## Production build

```bash
npm run build:pages
```

The generated website is written to `dist/`.

## Project structure

```text
content/
  blog/                 Long-form Markdown articles
  languages.json        Interface translations
  members.json          Member profiles
  posts.json            Automatically generated blog data
  site.json             Brand copy and statistics

public/
  refine-ui.css         Restrained visual adjustments
  refine-blog.css       Long-form article styles
  members/              Member icon files
  logo.svg              Hotaru Ascend wordmark
  favicon.svg           Browser icon
  og-image.svg          Social sharing image

scripts/
  blog.mjs              Creates and synchronizes blog articles
  build.mjs             Static-site generator
  validate-release.mjs  Release validation
  serve.mjs             Local preview server
```

## Common edits

| Change | File or command |
|---|---|
| Team name and copy | `content/site.json` |
| Member profiles | `content/members.json` |
| Member icons | `public/members/` |
| Create a blog article | `npm run blog:new` |
| Edit an article | `content/blog/<slug>.md` |
| Interface colors and spacing | `public/refine-ui.css` |
| Long-form article styles | `public/refine-blog.css` |
| Interface translations | `content/languages.json` |

## GitHub Pages deployment

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push a commit to `main`, or run the deployment workflow manually.
4. Open `https://naokibot.github.io/TSUBAKI_HP/`.

## Validation

```bash
npm run check
npm run build:pages
```

## License

MIT License
