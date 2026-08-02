import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectRoot, 'dist');

async function readJson(fileName) {
  const filePath = path.join(projectRoot, 'content', fileName);
  return JSON.parse(await readFile(filePath, 'utf8'));
}

const [languages, site, posts, members] = await Promise.all([
  readJson('languages.json'),
  readJson('site.json'),
  readJson('posts.json'),
  readJson('members.json')
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
  const pathWithoutBase = basePath && pathname.startsWith(`${basePath}/`)
    ? pathname.slice(basePath.length)
    : pathname;
  return new URL(pathWithoutBase.replace(/^\//, ''), baseUrl).href;
}

function articlePath(languageCode, slug) {
  return localizedPath(languageCode, `blog/${slug}/`);
}

function memberPath(languageCode, slug) {
  return localizedPath(languageCode, `members/${slug}/`);
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(path.join(outputDirectory, 'assets'), { recursive: true });
await cp(path.join(projectRoot, 'public'), outputDirectory, { recursive: true });
await cp(path.join(projectRoot, 'src', 'styles.css'), path.join(outputDirectory, 'assets', 'styles.css'));
await cp(path.join(projectRoot, 'src', 'app.js'), path.join(outputDirectory, 'assets', 'app.js'));

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

  return `<!doctype html><html lang="${escapeHtml(language.htmlLang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${canonicalUrl}">${alternateLinks}<link rel="alternate" hreflang="x-default" href="${absoluteUrl(assetPath('/'))}"><link rel="icon" href="${assetPath('/favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="${assetPath('/assets/styles.css')}"><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonicalUrl}"><meta property="og:image" content="${absoluteUrl(assetPath('/og-image.svg'))}"><meta property="og:locale" content="${escapeHtml(language.ogLocale)}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#0d1224"></head>`;
}

function siteHeader(languageCode, equivalentSuffix = '') {
  const ui = languages[languageCode].ui;
  return `<a class="skip" href="#main">${escapeHtml(ui.skip)}</a><div class="scroll-progress" aria-hidden="true"><i></i></div><header class="header"><div class="wrap nav"><a class="brand" href="${localizedPath(languageCode)}"><img src="${assetPath('/logo.svg')}" alt="${escapeHtml(site.name)}"></a><button class="nav-toggle" type="button" aria-label="${escapeHtml(ui.menu)}" aria-expanded="false">☰</button><nav aria-label="${escapeHtml(ui.primaryNavigation)}"><a href="${localizedPath(languageCode)}#about">${escapeHtml(ui.about)}</a><a href="${localizedPath(languageCode)}#members">${escapeHtml(ui.members)}</a><a href="${localizedPath(languageCode)}#projects">${escapeHtml(ui.projects)}</a><a href="${localizedPath(languageCode)}#blog">${escapeHtml(ui.blog)}</a>${languageMenu(languageCode, equivalentSuffix)}<button class="theme" type="button" aria-label="${escapeHtml(ui.theme)}">◐</button></nav></div></header>`;
}

function siteFooter(languageCode) {
  return `<footer><div class="wrap footer-grid"><div><img class="footer-logo" src="${assetPath('/logo.svg')}" alt="${escapeHtml(site.name)}"><p>${escapeHtml(translate(site.footerTagline, languageCode))}</p></div><div class="social"><a href="${escapeHtml(site.githubUrl)}" target="_blank" rel="noopener">GitHub ↗</a></div></div><p class="copyright">© ${escapeHtml(site.copyrightYear)} ${escapeHtml(site.name)}</p></footer><button class="back-to-top" type="button" aria-label="${escapeHtml(languages[languageCode].ui.backTop)}">↑</button>`;
}

function statsMarkup(languageCode) {
  return `<section class="stats-section"><div class="stats-tape" aria-hidden="true"><span>CREATE / RESEARCH / ASCEND / HOTARU ASCEND / </span><span>CREATE / RESEARCH / ASCEND / HOTARU ASCEND / </span></div><div class="wrap stats-grid">${site.stats.map((stat, index) => `<div class="stat reveal"><span class="stat-index">0${index + 1}</span><strong>${escapeHtml(stat.value)}</strong><span class="stat-label">${escapeHtml(translate(stat.label, languageCode))}</span></div>`).join('')}</div></section>`;
}

function memberCards(languageCode) {
  const ui = languages[languageCode].ui;
  if (!members.length) {
    return `<div class="preparing reveal"><span>${escapeHtml(ui.preparing)}</span><p>${escapeHtml(ui.membersPreparing)}</p></div>`;
  }

  return `<div class="member-grid">${members.map((member) => `<article class="member-card reveal"><a class="member-icon-link" href="${memberPath(languageCode, member.slug)}"><img class="member-icon" src="${assetPath(member.icon)}" alt="${escapeHtml(translate(member.name, languageCode))}"></a><div class="member-card-body"><p class="member-role">${escapeHtml(translate(member.role, languageCode))}</p><h3>${escapeHtml(translate(member.name, languageCode))}</h3><p>${escapeHtml(translate(member.summary, languageCode))}</p><a class="text-link" href="${memberPath(languageCode, member.slug)}">${escapeHtml(ui.viewProfile)} →</a></div></article>`).join('')}</div>`;
}

function memberSection(languageCode) {
  const ui = languages[languageCode].ui;
  return `<section id="members" class="section-block members-section"><div class="wrap"><div class="section-head reveal"><div class="section-number">02</div><div><div class="eyebrow">MEMBERS</div><h2>${escapeHtml(ui.members)}</h2><p class="section-intro">${escapeHtml(ui.membersIntro)}</p></div></div>${memberCards(languageCode)}</div></section>`;
}

function memberPage(languageCode, member) {
  const ui = languages[languageCode].ui;
  const name = translate(member.name, languageCode);
  const role = translate(member.role, languageCode);
  const summary = translate(member.summary, languageCode);
  const suffix = `members/${member.slug}/`;
  const pathname = memberPath(languageCode, member.slug);
  const skills = Array.isArray(member.skills) ? member.skills : [];
  const skillList = skills.length ? `<div class="profile-specialties"><h2>${escapeHtml(ui.specialties)}</h2><div class="profile-tags">${skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join('')}</div></div>` : '';
  const githubLink = member.github ? `<a class="button" href="${escapeHtml(member.github)}" target="_blank" rel="noopener">${escapeHtml(ui.memberGithub)} ↗</a>` : '';
  const content = `<article class="member-profile"><div class="wrap profile-layout"><div class="profile-visual reveal"><img src="${assetPath(member.icon)}" alt="${escapeHtml(name)}"></div><div class="profile-copy reveal"><a class="text-link" href="${localizedPath(languageCode)}#members">← ${escapeHtml(ui.memberBack)}</a><p class="member-role">${escapeHtml(role)}</p><h1>${escapeHtml(name)}</h1><p class="profile-lead">${escapeHtml(summary)}</p><p class="profile-bio">${escapeHtml(translate(member.bio, languageCode))}</p>${skillList}<div class="actions">${githubLink}</div></div></div></article>`;
  return `${documentHead(languageCode, `${name} — ${site.name}`, summary, pathname, suffix)}<body data-lang="${escapeHtml(languageCode)}">${siteHeader(languageCode, suffix)}<main id="main">${content}</main>${siteFooter(languageCode)}<script type="module" src="${assetPath('/assets/app.js')}"></script></body></html>`;
}

function projectSection(languageCode) {
  const ui = languages[languageCode].ui;
  return `<section id="projects" class="section-block projects-section"><div class="wrap"><div class="section-head reveal"><div class="section-number">03</div><div><div class="eyebrow">PROJECTS</div><h2>${escapeHtml(ui.projects)}</h2></div></div><div class="preparing reveal"><span>${escapeHtml(ui.preparing)}</span><p>${escapeHtml(ui.projectsPreparing)}</p><i aria-hidden="true">COMING SOON</i></div></div></section>`;
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
  return `<section id="blog" class="section-block blog-section"><div class="wrap"><div class="section-head reveal"><div class="section-number">04</div><div><div class="eyebrow">BLOG</div><h2>${escapeHtml(ui.blog)}</h2></div></div>${blogCards(languageCode)}</div></section>`;
}

function homePage(languageCode) {
  const ui = languages[languageCode].ui;
  const content = `<section class="hero"><div class="hero-grid" aria-hidden="true"></div><div class="hero-shape hero-shape-red" aria-hidden="true"></div><div class="hero-shape hero-shape-yellow" aria-hidden="true"></div><div class="wrap hero-stage"><div class="hero-copy reveal"><div class="hero-kicker"><span>STUDENT CREATIVE TEAM</span><b>EST. 2025</b></div><div class="eyebrow">${escapeHtml(site.name.toUpperCase())}</div><h1>${escapeHtml(translate(site.tagline, languageCode))}</h1><p>${escapeHtml(translate(site.description, languageCode))}</p><div class="actions"><a class="button primary" href="#projects">${escapeHtml(ui.projects)}</a><a class="button hero-github" href="${escapeHtml(site.githubUrl)}" target="_blank" rel="noopener">GitHub ↗</a></div></div><div class="hero-symbol reveal" aria-hidden="true"><div class="hero-symbol-ring"></div><img src="${assetPath('/favicon.svg')}" alt=""><span>ASCEND</span></div></div><div class="hero-ticker" aria-hidden="true"><span>HOTARU ASCEND — CREATE THE UNSEEN — HOTARU ASCEND — CREATE THE UNSEEN — </span></div></section>
<section id="about" class="section-block about-section"><div class="wrap"><div class="section-head reveal"><div class="section-number">01</div><div><div class="eyebrow">ABOUT ${escapeHtml(site.name)}</div><h2>${escapeHtml(ui.about)}</h2></div></div><div class="about-grid reveal"><p class="lead">${escapeHtml(translate(site.about, languageCode))}</p><aside class="development-note"><span>${escapeHtml(ui.development)}</span><p>${escapeHtml(translate(site.developmentSince, languageCode))}</p></aside></div></div></section>
${memberSection(languageCode)}
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

  for (const member of members) {
    await writePage(path.join(rootPath, 'members', member.slug, 'index.html'), memberPage(languageCode, member));
  }

  for (const post of posts) {
    await writePage(path.join(rootPath, 'blog', post.slug, 'index.html'), articlePage(languageCode, post));
  }
}

await writeFile(path.join(outputDirectory, '404.html'), notFoundPage('ja'));

const sitemapEntries = [];
for (const languageCode of languageCodes) {
  sitemapEntries.push(`<url><loc>${absoluteUrl(localizedPath(languageCode))}</loc></url>`);
  for (const member of members) {
    sitemapEntries.push(`<url><loc>${absoluteUrl(memberPath(languageCode, member.slug))}</loc></url>`);
  }
  for (const post of posts) {
    sitemapEntries.push(`<url><loc>${absoluteUrl(articlePath(languageCode, post.slug))}</loc></url>`);
  }
}

await writeFile(path.join(outputDirectory, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries.join('')}</urlset>`);
await writeFile(path.join(outputDirectory, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${absoluteUrl(assetPath('/sitemap.xml'))}\n`);
await writeFile(path.join(outputDirectory, '.nojekyll'), '');

console.log(`Built ${languageCodes.length} home pages, ${members.length * languageCodes.length} member pages, ${posts.length * languageCodes.length} article pages, and ${languageCodes.length} localized 404 pages.`);
