import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectRoot, 'dist');

async function readJson(fileName) {
  const filePath = path.join(projectRoot, 'content', fileName);
  return JSON.parse(await readFile(filePath, 'utf8'));
}

const [languages, site, skills, posts] = await Promise.all([
  readJson('languages.json'),
  readJson('site.json'),
  readJson('skills.json'),
  readJson('posts.json')
]);

const languageCodes = Object.keys(languages);
const configuredBasePath = process.env.SITE_BASE_PATH ?? site.basePath ?? '';
const basePath = configuredBasePath && configuredBasePath !== '/'
  ? `/${configuredBasePath.replace(/^\/+|\/+$/g, '')}`
  : '';
const baseUrl = (process.env.SITE_BASE_URL || site.baseUrl || 'http://localhost:4173/').replace(/\/+$/, '/');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function translate(value, languageCode) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value ?? '';
  return value[languageCode] ?? value.en ?? value.ja ?? '';
}

function assetPath(value = '/') {
  const pathname = `${basePath}${value.startsWith('/') ? value : `/${value}`}`;
  return pathname.replace(/\/{2,}/g, '/');
}

function languageRoot(languageCode) {
  return languages[languageCode].path ? `/${languages[languageCode].path}/` : '/';
}

function localizedPath(languageCode, suffix = '') {
  return assetPath(`${languageRoot(languageCode)}${suffix}`.replace(/\/{2,}/g, '/'));
}

function absoluteUrl(pathname) {
  return new URL(pathname.replace(/^\//, ''), baseUrl).href;
}

function articlePath(languageCode, slug) {
  return localizedPath(languageCode, `blog/${slug}/`);
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(path.join(outputDirectory, 'assets'), { recursive: true });
await cp(path.join(projectRoot, 'public'), outputDirectory, { recursive: true });
await cp(path.join(projectRoot, 'src', 'styles.css'), path.join(outputDirectory, 'assets', 'styles.css'));
await cp(path.join(projectRoot, 'src', 'app.js'), path.join(outputDirectory, 'assets', 'app.js'));

const ogImageParts = (await readdir(path.join(projectRoot, 'public')))
  .filter((name) => name.startsWith('og-image.png.base64.'))
  .sort();

if (ogImageParts.length) {
  const base64Data = (await Promise.all(
    ogImageParts.map((name) => readFile(path.join(projectRoot, 'public', name), 'utf8'))
  )).join('').replace(/\s+/g, '');

  await writeFile(path.join(outputDirectory, 'og-image.png'), Buffer.from(base64Data, 'base64'));
  await Promise.all(ogImageParts.map((name) => rm(path.join(outputDirectory, name), { force: true })));
}

function languageMenu(currentLanguage, equivalentSuffix = '') {
  const currentUi = languages[currentLanguage].ui;
  const links = languageCodes.map((languageCode) => {
    const href = localizedPath(languageCode, equivalentSuffix);
    const current = languageCode === currentLanguage ? ' aria-current="page"' : '';
    return `<a href="${href}" lang="${escapeHtml(languages[languageCode].htmlLang)}"${current}>${escapeHtml(languages[languageCode].label)}</a>`;
  }).join('');

  return `<details class="language-menu"><summary aria-label="${escapeHtml(currentUi.language)}">${escapeHtml(languages[currentLanguage].shortLabel)}</summary><div class="language-panel">${links}</div></details>`;
}

function documentHead(languageCode, title, description, pathname, equivalentSuffix = '') {
  const language = languages[languageCode];
  const canonicalUrl = absoluteUrl(pathname);
  const alternateLinks = languageCodes.map((code) => (
    `<link rel="alternate" hreflang="${escapeHtml(languages[code].htmlLang)}" href="${absoluteUrl(localizedPath(code, equivalentSuffix))}">`
  )).join('');

  return `<!doctype html><html lang="${escapeHtml(language.htmlLang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${canonicalUrl}">${alternateLinks}<link rel="alternate" hreflang="x-default" href="${absoluteUrl(assetPath('/'))}"><link rel="icon" href="${assetPath('/favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="${assetPath('/assets/styles.css')}"><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonicalUrl}"><meta property="og:image" content="${absoluteUrl(assetPath('/og-image.png'))}"><meta property="og:locale" content="${escapeHtml(language.ogLocale)}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#171316"></head>`;
}

function siteHeader(languageCode, equivalentSuffix = '') {
  const ui = languages[languageCode].ui;
  return `<a class="skip" href="#main">${escapeHtml(ui.skip)}</a><div class="scroll-progress" aria-hidden="true"><i></i></div><header class="header"><div class="wrap nav"><a class="brand" href="${localizedPath(languageCode)}"><img src="${assetPath('/logo.svg')}" alt="${escapeHtml(site.name)}"></a><button class="nav-toggle" type="button" aria-label="${escapeHtml(ui.menu)}" aria-expanded="false">☰</button><nav aria-label="${escapeHtml(ui.primaryNavigation)}"><a href="${localizedPath(languageCode)}#about">${escapeHtml(ui.about)}</a><a href="${localizedPath(languageCode)}#projects">${escapeHtml(ui.projects)}</a><a href="${localizedPath(languageCode)}#blog">${escapeHtml(ui.blog)}</a>${languageMenu(languageCode, equivalentSuffix)}<button class="theme" type="button" aria-label="${escapeHtml(ui.theme)}">◐</button></nav></div></header>`;
}

function siteFooter(languageCode) {
  return `<footer><div class="wrap footer-grid"><div><img class="footer-logo" src="${assetPath('/logo.svg')}" alt="${escapeHtml(site.name)}"><p>${escapeHtml(translate(site.footerTagline, languageCode))}</p></div><div class="social"><a href="${escapeHtml(site.githubUrl)}" target="_blank" rel="noopener">GitHub ↗</a></div></div><p class="copyright">© ${escapeHtml(site.copyrightYear)} ${escapeHtml(site.name)}</p></footer><button class="back-to-top" type="button" aria-label="${escapeHtml(languages[languageCode].ui.backTop)}">↑</button>`;
}

function statsMarkup(languageCode) {
  return `<section class="stats-section"><div class="wrap stats-grid">${site.stats.map((stat) => `<div class="stat reveal"><strong>${escapeHtml(stat.value)}</strong><span>${escapeHtml(translate(stat.label, languageCode))}</span></div>`).join('')}</div></section>`;
}

function projectSection(languageCode) {
  const ui = languages[languageCode].ui;
  return `<section id="projects"><div class="wrap"><div class="section-head reveal"><div><div class="eyebrow">PROJECTS</div><h2>${escapeHtml(ui.projects)}</h2></div></div><div class="preparing reveal"><span>${escapeHtml(ui.preparing)}</span><p>${escapeHtml(ui.projectsPreparing)}</p></div></div></section>`;
}

function blogCards(languageCode) {
  const ui = languages[languageCode].ui;
  if (!posts.length) {
    return `<div class="preparing reveal"><span>${escapeHtml(ui.preparing)}</span><p>${escapeHtml(ui.blogPreparing)}</p></div>`;
  }

  return `<div class="post-grid">${posts.map((post) => `<article class="post-card reveal"><time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time><h3>${escapeHtml(translate(post.title, languageCode))}</h3><p>${escapeHtml(translate(post.excerpt, languageCode))}</p><a class="text-link" href="${articlePath(languageCode, post.slug)}">${escapeHtml(ui.readArticle)} →</a></article>`).join('')}</div>`;
}

function blogSection(languageCode) {
  const ui = languages[languageCode].ui;
  return `<section id="blog" class="soft"><div class="wrap"><div class="section-head reveal"><div><div class="eyebrow">BLOG</div><h2>${escapeHtml(ui.blog)}</h2></div></div>${blogCards(languageCode)}</div></section>`;
}

function homePage(languageCode) {
  const ui = languages[languageCode].ui;
  const content = `<section class="hero"><div class="wrap hero-single"><div class="hero-copy reveal"><div class="eyebrow">TSUBAKI TECH</div><h1>${escapeHtml(translate(site.tagline, languageCode))}</h1><p>${escapeHtml(translate(site.description, languageCode))}</p><div class="actions"><a class="button primary" href="#projects">${escapeHtml(ui.projects)}</a><a class="button" href="${escapeHtml(site.githubUrl)}" target="_blank" rel="noopener">GitHub ↗</a></div></div></div></section>
<section id="about"><div class="wrap split reveal"><div><div class="eyebrow">ABOUT ${escapeHtml(site.name)}</div><h2>${escapeHtml(ui.about)}</h2></div><div><p class="lead">${escapeHtml(translate(site.about, languageCode))}</p><aside class="development-note"><span>${escapeHtml(ui.development)}</span><p>${escapeHtml(translate(site.developmentSince, languageCode))}</p></aside></div></div></section>
<section class="soft"><div class="wrap"><div class="section-head reveal"><div><div class="eyebrow">CAPABILITIES</div><h2>${escapeHtml(ui.capabilities)}</h2></div></div><div class="skill-grid">${skills.map((skill) => `<article class="skill reveal"><div class="skill-top"><span class="skill-icon">${escapeHtml(skill.icon)}</span><strong>${escapeHtml(skill.name)}</strong><span>${escapeHtml(skill.level)}%</span></div><p>${escapeHtml(translate(skill.description, languageCode))}</p><div class="meter"><i style="--level:${Number(skill.level) || 0}%"></i></div></article>`).join('')}</div></div></section>
${statsMarkup(languageCode)}
${projectSection(languageCode)}
${blogSection(languageCode)}`;

  const title = `${site.name} — ${translate(site.tagline, languageCode)}`;
  const description = translate(site.description, languageCode);
  const pathname = localizedPath(languageCode);

  return `${documentHead(languageCode, title, description, pathname)}<body data-lang="${escapeHtml(languageCode)}">${siteHeader(languageCode)}<main id="main">${content}</main>${siteFooter(languageCode)}<script type="module" src="${assetPath('/assets/app.js')}"></script></body></html>`;
}

function markdownToHtml(markdown = '') {
  const lines = String(markdown).split(/\r?\n/);
  const output = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${paragraph.map(escapeHtml).join(' ')}</p>`);
    paragraph = [];
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    if (line.startsWith('## ')) {
      flushParagraph();
      output.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      flushParagraph();
      output.push(`<h2>${escapeHtml(line.slice(2))}</h2>`);
      continue;
    }
    paragraph.push(line.trim());
  }

  flushParagraph();
  return output.join('');
}

function articlePage(languageCode, post) {
  const ui = languages[languageCode].ui;
  const title = `${translate(post.title, languageCode)} — ${site.name}`;
  const description = translate(post.excerpt, languageCode);
  const suffix = `blog/${post.slug}/`;
  const pathname = articlePath(languageCode, post.slug);

  const content = `<article class="article"><div class="narrow"><a class="text-link" href="${localizedPath(languageCode)}#blog">← ${escapeHtml(ui.blog)}</a><time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time><h1>${escapeHtml(translate(post.title, languageCode))}</h1><p class="article-lead">${escapeHtml(description)}</p><div class="article-body">${markdownToHtml(translate(post.content, languageCode))}</div></div></article>`;

  return `${documentHead(languageCode, title, description, pathname, suffix)}<body data-lang="${escapeHtml(languageCode)}">${siteHeader(languageCode, suffix)}<main id="main">${content}</main>${siteFooter(languageCode)}<script type="module" src="${assetPath('/assets/app.js')}"></script></body></html>`;
}

function notFoundPage(languageCode) {
  const ui = languages[languageCode].ui;
  const pathname = localizedPath(languageCode, '404.html');
  return `${documentHead(languageCode, `404 — ${site.name}`, ui.pageNotFound, pathname)}<body><main class="not-found"><div class="narrow"><h1>404</h1><p>${escapeHtml(ui.pageNotFound)}</p><a class="button primary" href="${localizedPath(languageCode)}">${escapeHtml(ui.home)}</a></div></main></body></html>`;
}

async function writePage(relativePath, html) {
  const outputPath = path.join(outputDirectory, relativePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html);
}

for (const languageCode of languageCodes) {
  const rootPath = languages[languageCode].path;
  await writePage(path.join(rootPath, 'index.html'), homePage(languageCode));
  await writePage(path.join(rootPath, '404.html'), notFoundPage(languageCode));

  for (const post of posts) {
    await writePage(path.join(rootPath, 'blog', post.slug, 'index.html'), articlePage(languageCode, post));
  }
}

await writeFile(path.join(outputDirectory, '404.html'), notFoundPage('ja'));

const sitemapEntries = [];
for (const languageCode of languageCodes) {
  sitemapEntries.push(`<url><loc>${absoluteUrl(localizedPath(languageCode))}</loc></url>`);
  for (const post of posts) {
    sitemapEntries.push(`<url><loc>${absoluteUrl(articlePath(languageCode, post.slug))}</loc></url>`);
  }
}

await writeFile(path.join(outputDirectory, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries.join('')}</urlset>`);
await writeFile(path.join(outputDirectory, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${absoluteUrl(assetPath('/sitemap.xml'))}\n`);
await writeFile(path.join(outputDirectory, '.nojekyll'), '');

console.log(`Built ${languageCodes.length} home pages, ${posts.length * languageCodes.length} article pages, and ${languageCodes.length} localized 404 pages.`);
