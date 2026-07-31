import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectRoot, 'dist');
const contentDirectory = path.join(projectRoot, 'content');
const publicDirectory = path.join(projectRoot, 'public');

async function readJson(fileName) {
  const filePath = path.join(contentDirectory, fileName);
  return JSON.parse(await readFile(filePath, 'utf8'));
}

const [languages, site, skills, projects, posts, achievements] = await Promise.all([
  readJson('languages.json'),
  readJson('site.json'),
  readJson('skills.json'),
  readJson('projects.json'),
  readJson('posts.json'),
  readJson('achievements.json')
]);

const languageCodes = Object.keys(languages);
const defaultLanguage = 'ja';
const configuredBasePath = process.env.SITE_BASE_PATH ?? site.basePath ?? '';
const basePath = configuredBasePath && configuredBasePath !== '/'
  ? `/${configuredBasePath.replace(/^\/+|\/+$/g, '')}`
  : '';
const baseUrl = (process.env.SITE_BASE_URL || site.baseUrl || 'http://localhost:4173/').replace(/\/+$/, '/');
const siteOrigin = new URL(baseUrl).origin;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function translate(value, languageCode) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value[languageCode] ?? value[defaultLanguage] ?? '';
  }
  return value;
}

function publicPath(value = '/') {
  const normalized = value.startsWith('/') ? value : `/${value}`;
  return `${basePath}${normalized}`.replace(/\/{2,}/g, '/');
}

function absoluteUrl(value = '/') {
  return new URL(publicPath(value), `${siteOrigin}/`).href;
}

function languageRoot(languageCode) {
  const segment = languages[languageCode].path;
  return segment ? `/${segment}/` : '/';
}

function localizedPath(languageCode, suffix = '') {
  return `${languageRoot(languageCode)}${suffix}`.replace(/\/{2,}/g, '/');
}

function route(languageCode, suffix = '') {
  return publicPath(localizedPath(languageCode, suffix));
}

function outputPath(languageCode, suffix = '') {
  return path.join(languages[languageCode].path, suffix);
}

async function prepareOutputDirectory() {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(path.join(outputDirectory, 'assets'), { recursive: true });
  await cp(publicDirectory, outputDirectory, { recursive: true });
  await cp(path.join(projectRoot, 'src', 'styles.css'), path.join(outputDirectory, 'assets', 'styles.css'));
  await cp(path.join(projectRoot, 'src', 'app.js'), path.join(outputDirectory, 'assets', 'app.js'));
}

async function rebuildPngOpenGraphImage() {
  const parts = (await readdir(publicDirectory))
    .filter((name) => name.startsWith('og-image.png.base64.'))
    .sort();

  if (!parts.length) return;

  const encodedImage = (await Promise.all(
    parts.map((name) => readFile(path.join(publicDirectory, name), 'utf8'))
  )).join('').replace(/\s+/g, '');

  await writeFile(path.join(outputDirectory, 'og-image.png'), Buffer.from(encodedImage, 'base64'));
  await Promise.all(parts.map((name) => rm(path.join(outputDirectory, name), { force: true })));
}

function analyticsMarkup() {
  const scripts = [];

  if (site.plausibleDomain) {
    scripts.push(`<script defer data-domain="${escapeHtml(site.plausibleDomain)}" src="https://plausible.io/js/script.js"></script>`);
  }

  if (site.gaMeasurementId) {
    const measurementId = escapeHtml(site.gaMeasurementId);
    scripts.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${measurementId}');</script>`);
  }

  return scripts.join('');
}

function alternateLanguageLinks(pageSuffix) {
  const alternates = languageCodes.map((languageCode) => {
    const language = languages[languageCode];
    return `<link rel="alternate" hreflang="${escapeHtml(language.htmlLang)}" href="${absoluteUrl(localizedPath(languageCode, pageSuffix))}">`;
  });
  alternates.push(`<link rel="alternate" hreflang="x-default" href="${absoluteUrl(localizedPath(defaultLanguage, pageSuffix))}">`);
  return alternates.join('');
}

function documentHead({ languageCode, title, description, pageSuffix = '', image = '/og-image.svg', type = 'website' }) {
  const language = languages[languageCode];
  const canonical = absoluteUrl(localizedPath(languageCode, pageSuffix));
  const alternateLocales = languageCodes
    .filter((code) => code !== languageCode)
    .map((code) => `<meta property="og:locale:alternate" content="${escapeHtml(languages[code].ogLocale)}">`)
    .join('');
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: absoluteUrl(languageRoot(languageCode)),
    description,
    email: site.email,
    sameAs: [site.githubUrl, site.xUrl, site.instagramUrl].filter(Boolean),
    inLanguage: language.htmlLang
  });

  return `<!doctype html><html lang="${escapeHtml(language.htmlLang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${canonical}">${alternateLanguageLinks(pageSuffix)}<link rel="icon" href="${publicPath('/favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="${publicPath('/assets/styles.css')}"><meta property="og:type" content="${type}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${absoluteUrl(image)}"><meta property="og:locale" content="${escapeHtml(language.ogLocale)}">${alternateLocales}<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#fcfaf7">${analyticsMarkup()}<script type="application/ld+json">${structuredData}</script></head>`;
}

function languageMenu(languageCode, pageSuffix) {
  const currentLanguage = languages[languageCode];
  const links = languageCodes.map((code) => {
    const language = languages[code];
    const current = code === languageCode ? ' aria-current="page"' : '';
    return `<a href="${route(code, pageSuffix)}" hreflang="${escapeHtml(language.htmlLang)}" lang="${escapeHtml(language.htmlLang)}"${current}>${escapeHtml(language.label)}</a>`;
  }).join('');

  return `<details class="language-menu"><summary aria-label="${escapeHtml(currentLanguage.ui.language)}"><span>${escapeHtml(currentLanguage.shortLabel)}</span><i aria-hidden="true">⌄</i></summary><div>${links}</div></details>`;
}

function headerMarkup(languageCode, pageSuffix) {
  const ui = languages[languageCode].ui;
  return `<a class="skip" href="#main">${escapeHtml(ui.skip)}</a><div class="scroll-progress" aria-hidden="true"><i></i></div><header class="header"><div class="site-frame nav"><a class="brand" href="${route(languageCode)}"><img src="${publicPath('/logo.svg')}" alt="${escapeHtml(site.name)}"></a><button class="nav-toggle" type="button" aria-label="${escapeHtml(ui.menu)}" aria-expanded="false"><span></span><span></span></button><nav aria-label="${escapeHtml(ui.primaryNavigation)}"><a href="${route(languageCode)}#about">${escapeHtml(ui.about)}</a><a href="${route(languageCode)}#focus">${escapeHtml(ui.whatWeDo)}</a><a href="${route(languageCode)}#projects">${escapeHtml(ui.projects)}</a><a href="${route(languageCode)}#news">${escapeHtml(ui.blog)}</a><a class="nav-contact" href="${route(languageCode)}#contact">${escapeHtml(ui.contact)}</a>${languageMenu(languageCode, pageSuffix)}<button class="theme" type="button" aria-label="${escapeHtml(ui.theme)}"><span aria-hidden="true">◐</span></button></nav></div></header>`;
}

function footerMarkup(languageCode) {
  const ui = languages[languageCode].ui;
  return `<footer class="footer"><div class="site-frame footer-top"><div class="footer-brand"><img src="${publicPath('/logo.svg')}" alt="${escapeHtml(site.name)}"><p>${escapeHtml(translate(site.tagline, languageCode))}</p></div><div class="footer-links"><div><span>${escapeHtml(ui.exploreFooter)}</span><a href="${route(languageCode)}#about">${escapeHtml(ui.about)}</a><a href="${route(languageCode)}#projects">${escapeHtml(ui.projects)}</a><a href="${route(languageCode)}#news">${escapeHtml(ui.blog)}</a></div><div><span>${escapeHtml(ui.connectFooter)}</span><a href="${escapeHtml(site.githubUrl)}" target="_blank" rel="noopener">GitHub</a><a href="${escapeHtml(site.xUrl)}" target="_blank" rel="noopener">X</a><a href="${escapeHtml(site.instagramUrl)}" target="_blank" rel="noopener">Instagram</a></div></div></div><div class="site-frame footer-bottom"><p>© ${site.copyrightYear} ${escapeHtml(site.name)}</p><a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a></div></footer>`;
}

function runtimeMessages(languageCode) {
  const ui = languages[languageCode].ui;
  const messages = {
    repoFallback: ui.repoFallback,
    repoEmpty: ui.repoEmpty,
    repoDefaultDescription: ui.repoDefaultDescription,
    formBotSuccess: ui.formBotSuccess,
    formTooFast: ui.formTooFast,
    formRateLimit: ui.formRateLimit,
    formNotConfigured: ui.formNotConfigured,
    formSending: ui.formSending,
    formSuccess: ui.formSuccess,
    formError: ui.formError
  };
  return JSON.stringify(messages).replace(/</g, '\\u003c');
}

function pageShell({ languageCode, title, description, pageSuffix = '', content, type = 'website', image = '/og-image.svg' }) {
  return `${documentHead({ languageCode, title, description, pageSuffix, image, type })}<body data-lang="${escapeHtml(languageCode)}" data-github-user="${escapeHtml(site.githubUser)}" data-contact-endpoint="${escapeHtml(site.contactEndpoint)}">${headerMarkup(languageCode, pageSuffix)}<main id="main">${content}</main>${footerMarkup(languageCode)}<button class="back-to-top" type="button" aria-label="${escapeHtml(languages[languageCode].ui.backTop)}">↑</button><script id="runtime-i18n" type="application/json">${runtimeMessages(languageCode)}</script><script type="module" src="${publicPath('/assets/app.js')}"></script></body></html>`;
}

function chips(items) {
  return `<div class="chips">${items.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>`;
}

function projectFeature(project, index, languageCode) {
  const ui = languages[languageCode].ui;
  const reverseClass = index % 2 ? ' project-feature--reverse' : '';
  const projectSuffix = `projects/${project.slug}/`;
  return `<article class="project-feature${reverseClass} reveal"><a class="project-visual" href="${route(languageCode, projectSuffix)}"><span class="project-index">0${index + 1}</span><img src="${publicPath(project.cover)}" alt="${escapeHtml(translate(project.title, languageCode))}" loading="lazy"><span class="project-status">${escapeHtml(translate(project.status, languageCode))}</span></a><div class="project-copy"><p class="section-kicker">${escapeHtml(project.year)} / ${escapeHtml(translate(project.subtitle, languageCode))}</p><h3>${escapeHtml(translate(project.title, languageCode))}</h3><p>${escapeHtml(translate(project.summary, languageCode))}</p>${chips(project.technologies.slice(0, 5))}<a class="arrow-link" href="${route(languageCode, projectSuffix)}"><span>${escapeHtml(ui.view)}</span><i>↗</i></a></div></article>`;
}

function newsItem(post, index, languageCode) {
  const postSuffix = `blog/${post.slug}/`;
  return `<article class="news-item reveal"><a href="${route(languageCode, postSuffix)}"><span class="news-index">${String(index + 1).padStart(2, '0')}</span><div><time datetime="${post.date}">${post.date}</time><h3>${escapeHtml(translate(post.title, languageCode))}</h3><p>${escapeHtml(translate(post.excerpt, languageCode))}</p></div><span class="news-arrow">↗</span></a></article>`;
}

function homePage(languageCode) {
  const ui = languages[languageCode].ui;
  const heroProject = projects[0];
  const focusCards = site.focusAreas.map((area) => `<article class="focus-card reveal"><div class="focus-top"><span>${escapeHtml(area.number)}</span><i>↗</i></div><h3>${escapeHtml(translate(area.title, languageCode))}</h3><h4>${escapeHtml(translate(area.subtitle, languageCode))}</h4><p>${escapeHtml(translate(area.body, languageCode))}</p></article>`).join('');
  const skillTicker = [...skills, ...skills].map((skill) => `<span>${escapeHtml(skill.name)} <i>✦</i></span>`).join('');
  const statistics = site.stats.map((stat) => `<article class="stat reveal"><strong>${escapeHtml(stat.value)}</strong><span>${escapeHtml(translate(stat.label, languageCode))}</span></article>`).join('');
  const achievementRows = achievements.map((achievement) => `<article class="achievement-row reveal"><span>${escapeHtml(achievement.year)}</span><div><small>${escapeHtml(translate(achievement.type, languageCode))}</small><h3>${escapeHtml(translate(achievement.title, languageCode))}</h3><p>${escapeHtml(translate(achievement.detail, languageCode))}</p></div></article>`).join('');

  const content = `<section class="hero hero-home"><div class="hero-word" aria-hidden="true">TSUBAKI</div><div class="site-frame hero-stage"><div class="hero-copy reveal"><p class="hero-kicker">${escapeHtml(ui.studentTeam)}</p><h1><span>WE ARE</span><strong>${escapeHtml(site.name)}</strong></h1><p class="hero-lead">${escapeHtml(translate(site.description, languageCode))}</p><div class="hero-actions"><a class="button button--dark" href="#projects">${escapeHtml(ui.explore)}<i>↗</i></a><a class="text-button" href="#contact">${escapeHtml(ui.talk)}<i>→</i></a></div></div><div class="hero-collage reveal"><div class="hero-photo hero-photo--main"><img src="${publicPath('/profile.svg')}" alt="${escapeHtml(site.name)}"></div><div class="hero-photo hero-photo--project"><img src="${publicPath(heroProject.cover)}" alt="${escapeHtml(translate(heroProject.title, languageCode))}"></div><div class="hero-stamp"><span>BUILD</span><span>LEARN</span><span>SHARE</span></div></div></div><a class="scroll-cue" href="#about"><span>SCROLL</span><i></i></a></section>

  <section class="announcement"><div class="site-frame announcement-inner"><span class="announcement-label">${escapeHtml(ui.latest)}</span><time>${escapeHtml(site.announcement.date)}</time><a href="${escapeHtml(site.announcement.link)}">${escapeHtml(translate(site.announcement.title, languageCode))}<i>↗</i></a></div></section>

  <section id="about" class="mission-section section-space"><div class="site-frame mission-grid"><div class="section-number reveal"><span>01</span><p>${escapeHtml(ui.mission)}</p></div><div class="mission-copy reveal"><p class="section-kicker">OUR GOAL</p><h2>${escapeHtml(translate(site.mission.title, languageCode))}</h2><div class="mission-body"><p>${escapeHtml(translate(site.mission.body, languageCode))}</p><p>${escapeHtml(translate(site.about, languageCode))}</p></div></div></div></section>

  <section id="focus" class="focus-section section-space"><div class="site-frame"><div class="section-heading section-heading--light reveal"><div><span>02</span><p>WHAT WE DO</p></div><h2>${escapeHtml(ui.whatWeDo)}</h2></div><div class="focus-grid">${focusCards}</div><div class="skill-ticker" aria-label="${escapeHtml(ui.capabilities)}"><div>${skillTicker}</div></div></div></section>

  <section id="projects" class="projects-section section-space"><div class="site-frame"><div class="section-heading reveal"><div><span>03</span><p>SELECTED WORK</p></div><h2>${escapeHtml(ui.projects)}</h2></div><div class="project-list">${projects.map((project, index) => projectFeature(project, index, languageCode)).join('')}</div></div></section>

  <section id="achievements" class="impact-section section-space"><div class="site-frame"><div class="section-heading section-heading--light reveal"><div><span>04</span><p>IMPACT & PROGRESS</p></div><h2>${escapeHtml(ui.achievements)}</h2></div><div class="stats-grid">${statistics}</div><div class="achievement-list">${achievementRows}</div></div></section>

  <section id="news" class="news-section section-space"><div class="site-frame"><div class="section-heading reveal"><div><span>05</span><p>NEWS & STORIES</p></div><h2>${escapeHtml(ui.news)}</h2></div><div class="news-list">${posts.map((post, index) => newsItem(post, index, languageCode)).join('')}</div></div></section>

  <section id="github" class="github-section section-space"><div class="site-frame"><div class="github-heading reveal"><div><p class="section-kicker">OPEN SOURCE</p><h2>${escapeHtml(ui.repos)}</h2></div><a class="arrow-link arrow-link--light" href="${escapeHtml(site.githubUrl)}" target="_blank" rel="noopener"><span>GitHub</span><i>↗</i></a></div><div id="github-repos" class="repo-grid"><p>${escapeHtml(ui.loading)}</p></div></div></section>

  <section id="contact" class="contact-section section-space"><div class="site-frame"><div class="contact-intro reveal"><p class="section-kicker">LET'S CREATE TOGETHER</p><h2>${escapeHtml(translate(site.cta.title, languageCode))}</h2><p>${escapeHtml(translate(site.cta.body, languageCode))}</p><a class="contact-email" href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)} <i>↗</i></a></div><form id="contact-form" class="contact-form reveal"><input class="honeypot" name="website" tabindex="-1" autocomplete="off"><input type="hidden" name="startedAt" value=""><div class="form-row"><label>${escapeHtml(ui.name)}<input name="name" required maxlength="100"></label><label>${escapeHtml(ui.email)}<input name="email" type="email" required maxlength="200"></label></div><label>${escapeHtml(ui.organization)}<input name="organization" maxlength="160"></label><label>${escapeHtml(ui.message)}<textarea name="message" required minlength="5" maxlength="5000"></textarea></label><button class="button button--dark" type="submit">${escapeHtml(ui.send)}<i>↗</i></button><p id="form-status" role="status"></p></form></div></section>`;

  return pageShell({
    languageCode,
    title: `${site.name} — ${translate(site.tagline, languageCode)}`,
    description: translate(site.description, languageCode),
    content
  });
}

function projectPage(project, languageCode) {
  const ui = languages[languageCode].ui;
  const pageSuffix = `projects/${project.slug}/`;
  const content = `<section class="detail-hero"><div class="site-frame"><a class="back" href="${route(languageCode)}#projects">← ${escapeHtml(ui.allProjects)}</a><div class="detail-grid"><div class="detail-copy reveal"><p class="section-kicker">${escapeHtml(project.year)} / ${escapeHtml(translate(project.status, languageCode))}</p><h1>${escapeHtml(translate(project.title, languageCode))}</h1><p class="detail-lead">${escapeHtml(translate(project.subtitle, languageCode))}</p>${chips(project.technologies)}<div class="hero-actions"><a class="button button--dark" href="${escapeHtml(project.github)}" target="_blank" rel="noopener">GitHub <i>↗</i></a>${project.demo ? `<a class="text-button" href="${escapeHtml(project.demo)}" target="_blank" rel="noopener">Demo <i>↗</i></a>` : ''}</div></div><div class="detail-image reveal"><span>PROJECT / ${escapeHtml(project.year)}</span><img src="${publicPath(project.cover)}" alt="${escapeHtml(translate(project.title, languageCode))}"></div></div></div></section><section class="project-story section-space"><div class="site-frame story-grid"><article class="story-main reveal"><section><span>01</span><h2>${escapeHtml(ui.challenge)}</h2><p>${escapeHtml(translate(project.challenge, languageCode))}</p></section><section><span>02</span><h2>${escapeHtml(ui.solution)}</h2><p>${escapeHtml(translate(project.solution, languageCode))}</p></section></article><aside class="story-aside reveal"><p class="section-kicker">PROJECT NOTES</p><h2>${escapeHtml(ui.highlights)}</h2><ul>${translate(project.highlights, languageCode).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul><h2>${escapeHtml(ui.technologies)}</h2>${chips(project.technologies)}</aside></div></section>`;

  return pageShell({
    languageCode,
    title: `${translate(project.title, languageCode)} — ${site.name}`,
    description: translate(project.summary, languageCode),
    pageSuffix,
    content,
    type: 'article',
    image: project.cover
  });
}

function markdownToHtml(markdown) {
  return markdown.split(/\n\n+/).map((block) => {
    if (block.startsWith('# ')) return `<h1>${escapeHtml(block.slice(2))}</h1>`;
    if (block.startsWith('## ')) return `<h2>${escapeHtml(block.slice(3))}</h2>`;
    return `<p>${escapeHtml(block).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

function postPage(post, languageCode) {
  const ui = languages[languageCode].ui;
  const pageSuffix = `blog/${post.slug}/`;
  const content = `<section class="article-hero"><div class="narrow"><a class="back" href="${route(languageCode)}#news">← ${escapeHtml(ui.allPosts)}</a><p class="section-kicker">NEWS / ${escapeHtml(post.date)}</p><h1>${escapeHtml(translate(post.title, languageCode))}</h1><p class="detail-lead">${escapeHtml(translate(post.excerpt, languageCode))}</p>${chips(post.tags)}</div></section><article class="narrow article-body reveal">${markdownToHtml(translate(post.content, languageCode))}</article>`;

  return pageShell({
    languageCode,
    title: `${translate(post.title, languageCode)} — ${site.name}`,
    description: translate(post.excerpt, languageCode),
    pageSuffix,
    content,
    type: 'article'
  });
}

async function writePage(relativeDirectory, html) {
  const directory = path.join(outputDirectory, relativeDirectory);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html);
}

function allPagePaths() {
  return languageCodes.flatMap((languageCode) => [
    localizedPath(languageCode),
    ...projects.map((project) => localizedPath(languageCode, `projects/${project.slug}/`)),
    ...posts.map((post) => localizedPath(languageCode, `blog/${post.slug}/`))
  ]);
}

await prepareOutputDirectory();
await rebuildPngOpenGraphImage();

for (const languageCode of languageCodes) {
  await writePage(outputPath(languageCode), homePage(languageCode));

  for (const project of projects) {
    await writePage(outputPath(languageCode, path.join('projects', project.slug)), projectPage(project, languageCode));
  }

  for (const post of posts) {
    await writePage(outputPath(languageCode, path.join('blog', post.slug)), postPage(post, languageCode));
  }
}

for (const languageCode of languageCodes) {
  const ui = languages[languageCode].ui;
  const notFoundContent = `<section class="not-found"><div class="site-frame"><p class="section-kicker">ERROR 404</p><h1>PAGE<br>NOT FOUND</h1><p>${escapeHtml(ui.pageNotFound)}</p><a class="button button--dark" href="${route(languageCode)}">${escapeHtml(ui.home)} <i>↗</i></a></div></section>`;
  const notFoundHtml = pageShell({
    languageCode,
    title: `404 — ${site.name}`,
    description: ui.pageNotFound,
    pageSuffix: '404.html',
    content: notFoundContent
  });
  const languageDirectory = path.join(outputDirectory, languages[languageCode].path);
  await mkdir(languageDirectory, { recursive: true });
  await writeFile(path.join(languageDirectory, '404.html'), notFoundHtml);
}

const publishedPaths = allPagePaths();
const sitemapEntries = publishedPaths.map((pathname) => `<url><loc>${absoluteUrl(pathname)}</loc></url>`).join('');
await writeFile(path.join(outputDirectory, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries}</urlset>`);
await writeFile(path.join(outputDirectory, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`);

console.log(`Built ${publishedPaths.length + languageCodes.length} HTML pages in ${outputDirectory}`);
