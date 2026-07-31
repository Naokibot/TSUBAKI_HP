import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const readJson = async (name) => JSON.parse(await readFile(path.join(root, 'content', name), 'utf8'));
const [site, skills, projects, posts, achievements] = await Promise.all([
  readJson('site.json'),
  readJson('skills.json'),
  readJson('projects.json'),
  readJson('posts.json'),
  readJson('achievements.json')
]);

const basePathRaw = process.env.SITE_BASE_PATH ?? site.basePath ?? '';
const basePath = basePathRaw && basePathRaw !== '/' ? `/${basePathRaw.replace(/^\/+|\/+$/g, '')}` : '';
const baseUrl = (process.env.SITE_BASE_URL || site.baseUrl || 'http://localhost:4173/').replace(/\/+$/, '/');
const baseOrigin = new URL(baseUrl).origin;
const u = (value = '/') => `${basePath}${value.startsWith('/') ? value : `/${value}`}`.replace(/\/{2,}/g, '/');
const abs = (value = '/') => new URL(u(value), `${baseOrigin}/`).href;
const esc = (value = '') => String(value).replace(/[&<>"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
}[char]));
const t = (value, lang) => typeof value === 'object' && value !== null ? value[lang] : value;
const locale = (lang) => lang === 'ja' ? 'ja-JP' : 'en-US';
const langRoot = (lang) => lang === 'ja' ? '/' : '/en/';
const route = (lang, value = '') => u(`${langRoot(lang)}${value}`.replace(/\/{2,}/g, '/'));

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, 'public'), dist, { recursive: true });
await mkdir(path.join(dist, 'assets'), { recursive: true });
await cp(path.join(root, 'src', 'styles.css'), path.join(dist, 'assets', 'styles.css'));
await cp(path.join(root, 'src', 'app.js'), path.join(dist, 'assets', 'app.js'));

const ogParts = (await readdir(path.join(root, 'public')))
  .filter((name) => name.startsWith('og-image.png.base64.'))
  .sort();
if (ogParts.length) {
  const data = (await Promise.all(ogParts.map((name) => readFile(path.join(root, 'public', name), 'utf8'))))
    .join('')
    .replace(/\s+/g, '');
  await writeFile(path.join(dist, 'og-image.png'), Buffer.from(data, 'base64'));
  await Promise.all(ogParts.map((name) => rm(path.join(dist, name), { force: true })));
}

const labels = {
  ja: {
    about: '私たちについて', whatWeDo: '活動領域', projects: 'プロジェクト', achievements: '実績',
    blog: 'ニュース・記事', contact: 'お問い合わせ', view: '詳しく見る', allProjects: '作品一覧へ戻る',
    allPosts: '記事一覧へ戻る', challenge: '課題', solution: '解決方法', highlights: '主な特徴',
    technologies: '使用技術', send: '送信する', name: 'お名前', email: 'メールアドレス',
    organization: '所属（任意）', message: 'お問い合わせ内容', repos: 'GitHubの公開リポジトリ',
    loading: 'GitHubから取得中…', latest: 'LATEST', explore: 'プロジェクトを見る', talk: '相談する',
    news: '最新情報', mission: '私たちの目標', capabilities: '技術と制作力', backTop: 'ページ上部へ'
  },
  en: {
    about: 'About', whatWeDo: 'What we do', projects: 'Projects', achievements: 'Achievements',
    blog: 'News & stories', contact: 'Contact', view: 'View details', allProjects: 'Back to projects',
    allPosts: 'Back to articles', challenge: 'Challenge', solution: 'Solution', highlights: 'Highlights',
    technologies: 'Technologies', send: 'Send message', name: 'Name', email: 'Email',
    organization: 'Organization (optional)', message: 'Message', repos: 'Public GitHub repositories',
    loading: 'Loading from GitHub…', latest: 'LATEST', explore: 'Explore projects', talk: 'Start a conversation',
    news: 'Latest news', mission: 'Our mission', capabilities: 'Capabilities', backTop: 'Back to top'
  }
};

function analytics() {
  const parts = [];
  if (site.plausibleDomain) {
    parts.push(`<script defer data-domain="${esc(site.plausibleDomain)}" src="https://plausible.io/js/script.js"></script>`);
  }
  if (site.gaMeasurementId) {
    parts.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(site.gaMeasurementId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(site.gaMeasurementId)}');</script>`);
  }
  return parts.join('');
}

function head({ lang, title, description, pathname = '/', image = '/og-image.svg', type = 'website' }) {
  const canonical = abs(pathname);
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: abs(langRoot(lang)),
    description: t(site.description, lang),
    email: site.email,
    sameAs: [site.githubUrl, site.xUrl, site.instagramUrl].filter(Boolean)
  });
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}"><link rel="icon" href="${u('/favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="${u('/assets/styles.css')}"><meta property="og:type" content="${type}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${abs(image)}"><meta property="og:locale" content="${locale(lang)}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#fcfaf7">${analytics()}<script type="application/ld+json">${jsonLd}</script></head>`;
}

function header(lang) {
  const l = labels[lang];
  const other = lang === 'ja' ? 'en' : 'ja';
  const otherUrl = lang === 'ja' ? route('en') : route('ja');
  return `<a class="skip" href="#main">Skip to content</a><div class="scroll-progress" aria-hidden="true"><i></i></div><header class="header"><div class="site-frame nav"><a class="brand" href="${route(lang)}"><img src="${u('/logo.svg')}" alt="${esc(site.name)}"></a><button class="nav-toggle" type="button" aria-label="Menu" aria-expanded="false"><span></span><span></span></button><nav aria-label="Primary"><a href="${route(lang)}#about">${l.about}</a><a href="${route(lang)}#focus">${l.whatWeDo}</a><a href="${route(lang)}#projects">${l.projects}</a><a href="${route(lang)}#news">${l.blog}</a><a class="nav-contact" href="${route(lang)}#contact">${l.contact}</a><a class="lang" href="${otherUrl}" hreflang="${other}">${other.toUpperCase()}</a><button class="theme" type="button" aria-label="Toggle dark mode"><span aria-hidden="true">◐</span></button></nav></div></header>`;
}

function footer(lang) {
  const l = labels[lang];
  return `<footer class="footer"><div class="site-frame footer-top"><div class="footer-brand"><img src="${u('/logo.svg')}" alt="${esc(site.name)}"><p>${esc(t(site.tagline, lang))}</p></div><div class="footer-links"><div><span>EXPLORE</span><a href="${route(lang)}#about">${l.about}</a><a href="${route(lang)}#projects">${l.projects}</a><a href="${route(lang)}#news">${l.blog}</a></div><div><span>CONNECT</span><a href="${esc(site.githubUrl)}" target="_blank" rel="noopener">GitHub</a><a href="${esc(site.xUrl)}" target="_blank" rel="noopener">X</a><a href="${esc(site.instagramUrl)}" target="_blank" rel="noopener">Instagram</a></div></div></div><div class="site-frame footer-bottom"><p>© ${site.copyrightYear} ${esc(site.name)}</p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></div></footer>`;
}

function shell(lang, title, description, pathname, content, type = 'website', image = '/og-image.svg') {
  return `${head({ lang, title, description, pathname, image, type })}<body data-lang="${lang}" data-github-user="${esc(site.githubUser)}" data-contact-endpoint="${esc(site.contactEndpoint)}">${header(lang)}<main id="main">${content}</main>${footer(lang)}<button class="back-to-top" type="button" aria-label="${esc(labels[lang].backTop)}">↑</button><script type="module" src="${u('/assets/app.js')}"></script></body></html>`;
}

const chips = (items) => `<div class="chips">${items.map((item) => `<span>${esc(item)}</span>`).join('')}</div>`;

function projectFeature(project, index, lang) {
  const l = labels[lang];
  const reverse = index % 2 ? ' project-feature--reverse' : '';
  return `<article class="project-feature${reverse} reveal"><a class="project-visual" href="${route(lang, `projects/${project.slug}/`)}"><span class="project-index">0${index + 1}</span><img src="${u(project.cover)}" alt="${esc(t(project.title, lang))}" loading="lazy"><span class="project-status">${esc(t(project.status, lang))}</span></a><div class="project-copy"><p class="section-kicker">${esc(project.year)} / ${esc(t(project.subtitle, lang))}</p><h3>${esc(t(project.title, lang))}</h3><p>${esc(t(project.summary, lang))}</p>${chips(project.technologies.slice(0, 5))}<a class="arrow-link" href="${route(lang, `projects/${project.slug}/`)}"><span>${l.view}</span><i>↗</i></a></div></article>`;
}

function newsItem(post, index, lang) {
  return `<article class="news-item reveal"><a href="${route(lang, `blog/${post.slug}/`)}"><span class="news-index">${String(index + 1).padStart(2, '0')}</span><div><time datetime="${post.date}">${post.date}</time><h3>${esc(t(post.title, lang))}</h3><p>${esc(t(post.excerpt, lang))}</p></div><span class="news-arrow">↗</span></a></article>`;
}

function home(lang) {
  const l = labels[lang];
  const announcement = site.announcement;
  const heroProject = projects[0];
  const content = `<section class="hero hero-home"><div class="hero-word" aria-hidden="true">TSUBAKI</div><div class="site-frame hero-stage"><div class="hero-copy reveal"><p class="hero-kicker">STUDENT-LED TECHNOLOGY TEAM / JAPAN</p><h1><span>WE ARE</span><strong>${esc(site.name)}</strong></h1><p class="hero-lead">${esc(t(site.description, lang))}</p><div class="hero-actions"><a class="button button--dark" href="#projects">${l.explore}<i>↗</i></a><a class="text-button" href="#contact">${l.talk}<i>→</i></a></div></div><div class="hero-collage reveal"><div class="hero-photo hero-photo--main"><img src="${u('/profile.svg')}" alt="${esc(site.name)}"></div><div class="hero-photo hero-photo--project"><img src="${u(heroProject.cover)}" alt="${esc(t(heroProject.title, lang))}"></div><div class="hero-stamp"><span>BUILD</span><span>LEARN</span><span>SHARE</span></div></div></div><a class="scroll-cue" href="#about"><span>SCROLL</span><i></i></a></section>

  <section class="announcement"><div class="site-frame announcement-inner"><span class="announcement-label">${l.latest}</span><time>${esc(announcement.date)}</time><a href="${esc(announcement.link)}">${esc(t(announcement.title, lang))}<i>↗</i></a></div></section>

  <section id="about" class="mission-section section-space"><div class="site-frame mission-grid"><div class="section-number reveal"><span>01</span><p>${l.mission}</p></div><div class="mission-copy reveal"><p class="section-kicker">OUR GOAL</p><h2>${esc(t(site.mission.title, lang))}</h2><div class="mission-body"><p>${esc(t(site.mission.body, lang))}</p><p>${esc(t(site.about, lang))}</p></div></div></div></section>

  <section id="focus" class="focus-section section-space"><div class="site-frame"><div class="section-heading section-heading--light reveal"><div><span>02</span><p>WHAT WE DO</p></div><h2>${l.whatWeDo}</h2></div><div class="focus-grid">${site.focusAreas.map((area) => `<article class="focus-card reveal"><div class="focus-top"><span>${esc(area.number)}</span><i>↗</i></div><h3>${esc(t(area.title, lang))}</h3><h4>${esc(t(area.subtitle, lang))}</h4><p>${esc(t(area.body, lang))}</p></article>`).join('')}</div><div class="skill-ticker" aria-label="${esc(l.capabilities)}"><div>${[...skills, ...skills].map((skill) => `<span>${esc(skill.name)} <i>✦</i></span>`).join('')}</div></div></div></section>

  <section id="projects" class="projects-section section-space"><div class="site-frame"><div class="section-heading reveal"><div><span>03</span><p>SELECTED WORK</p></div><h2>${l.projects}</h2></div><div class="project-list">${projects.map((project, index) => projectFeature(project, index, lang)).join('')}</div></div></section>

  <section id="achievements" class="impact-section section-space"><div class="site-frame"><div class="section-heading section-heading--light reveal"><div><span>04</span><p>IMPACT & PROGRESS</p></div><h2>${l.achievements}</h2></div><div class="stats-grid">${site.stats.map((stat) => `<article class="stat reveal"><strong>${esc(stat.value)}</strong><span>${esc(t(stat.label, lang))}</span></article>`).join('')}</div><div class="achievement-list">${achievements.map((achievement) => `<article class="achievement-row reveal"><span>${esc(achievement.year)}</span><div><small>${esc(t(achievement.type, lang))}</small><h3>${esc(t(achievement.title, lang))}</h3><p>${esc(t(achievement.detail, lang))}</p></div></article>`).join('')}</div></div></section>

  <section id="news" class="news-section section-space"><div class="site-frame"><div class="section-heading reveal"><div><span>05</span><p>NEWS & STORIES</p></div><h2>${l.news}</h2></div><div class="news-list">${posts.map((post, index) => newsItem(post, index, lang)).join('')}</div></div></section>

  <section id="github" class="github-section section-space"><div class="site-frame"><div class="github-heading reveal"><div><p class="section-kicker">OPEN SOURCE</p><h2>${l.repos}</h2></div><a class="arrow-link arrow-link--light" href="${esc(site.githubUrl)}" target="_blank" rel="noopener"><span>GitHub</span><i>↗</i></a></div><div id="github-repos" class="repo-grid"><p>${l.loading}</p></div></div></section>

  <section id="contact" class="contact-section section-space"><div class="site-frame"><div class="contact-intro reveal"><p class="section-kicker">LET'S CREATE TOGETHER</p><h2>${esc(t(site.cta.title, lang))}</h2><p>${esc(t(site.cta.body, lang))}</p><a class="contact-email" href="mailto:${esc(site.email)}">${esc(site.email)} <i>↗</i></a></div><form id="contact-form" class="contact-form reveal"><input class="honeypot" name="website" tabindex="-1" autocomplete="off"><input type="hidden" name="startedAt" value=""><div class="form-row"><label>${l.name}<input name="name" required maxlength="100"></label><label>${l.email}<input name="email" type="email" required maxlength="200"></label></div><label>${l.organization}<input name="organization" maxlength="160"></label><label>${l.message}<textarea name="message" required minlength="5" maxlength="5000"></textarea></label><button class="button button--dark" type="submit">${l.send}<i>↗</i></button><p id="form-status" role="status"></p></form></div></section>`;

  return shell(lang, `${site.name} — ${t(site.tagline, lang)}`, t(site.description, lang), langRoot(lang), content);
}

function projectPage(project, lang) {
  const l = labels[lang];
  const content = `<section class="detail-hero"><div class="site-frame"><a class="back" href="${route(lang)}#projects">← ${l.allProjects}</a><div class="detail-grid"><div class="detail-copy reveal"><p class="section-kicker">${esc(project.year)} / ${esc(t(project.status, lang))}</p><h1>${esc(t(project.title, lang))}</h1><p class="detail-lead">${esc(t(project.subtitle, lang))}</p>${chips(project.technologies)}<div class="hero-actions"><a class="button button--dark" href="${esc(project.github)}" target="_blank" rel="noopener">GitHub <i>↗</i></a>${project.demo ? `<a class="text-button" href="${esc(project.demo)}" target="_blank" rel="noopener">Demo <i>↗</i></a>` : ''}</div></div><div class="detail-image reveal"><span>PROJECT / ${esc(project.year)}</span><img src="${u(project.cover)}" alt="${esc(t(project.title, lang))}"></div></div></div></section><section class="project-story section-space"><div class="site-frame story-grid"><article class="story-main reveal"><section><span>01</span><h2>${l.challenge}</h2><p>${esc(t(project.challenge, lang))}</p></section><section><span>02</span><h2>${l.solution}</h2><p>${esc(t(project.solution, lang))}</p></section></article><aside class="story-aside reveal"><p class="section-kicker">PROJECT NOTES</p><h2>${l.highlights}</h2><ul>${t(project.highlights, lang).map((item) => `<li>${esc(item)}</li>`).join('')}</ul><h2>${l.technologies}</h2>${chips(project.technologies)}</aside></div></section>`;
  return shell(lang, `${t(project.title, lang)} — ${site.name}`, t(project.summary, lang), `${langRoot(lang)}projects/${project.slug}/`, content, 'article', project.cover);
}

function markdown(text) {
  return text.split(/\n\n+/).map((block) => {
    if (block.startsWith('# ')) return `<h1>${esc(block.slice(2))}</h1>`;
    if (block.startsWith('## ')) return `<h2>${esc(block.slice(3))}</h2>`;
    return `<p>${esc(block).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

function postPage(post, lang) {
  const l = labels[lang];
  const content = `<section class="article-hero"><div class="narrow"><a class="back" href="${route(lang)}#news">← ${l.allPosts}</a><p class="section-kicker">NEWS / ${esc(post.date)}</p><h1>${esc(t(post.title, lang))}</h1><p class="detail-lead">${esc(t(post.excerpt, lang))}</p>${chips(post.tags)}</div></section><article class="narrow article-body reveal">${markdown(t(post.content, lang))}</article>`;
  return shell(lang, `${t(post.title, lang)} — ${site.name}`, t(post.excerpt, lang), `${langRoot(lang)}blog/${post.slug}/`, content, 'article');
}

async function writePage(relative, html) {
  const directory = path.join(dist, relative);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html);
}

await writePage('', home('ja'));
await writePage('en', home('en'));
for (const project of projects) {
  for (const lang of ['ja', 'en']) {
    await writePage(path.join(lang === 'en' ? 'en' : '', 'projects', project.slug), projectPage(project, lang));
  }
}
for (const post of posts) {
  for (const lang of ['ja', 'en']) {
    await writePage(path.join(lang === 'en' ? 'en' : '', 'blog', post.slug), postPage(post, lang));
  }
}

await writeFile(path.join(dist, '404.html'), shell(
  'ja',
  `404 — ${site.name}`,
  'Page not found',
  '/404.html',
  `<section class="not-found"><div class="site-frame"><p class="section-kicker">ERROR 404</p><h1>PAGE<br>NOT FOUND</h1><p>ページが見つかりません。</p><a class="button button--dark" href="${route('ja')}">Home <i>↗</i></a></div></section>`
));

const paths = [
  '/', '/en/',
  ...projects.flatMap((project) => [`/projects/${project.slug}/`, `/en/projects/${project.slug}/`]),
  ...posts.flatMap((post) => [`/blog/${post.slug}/`, `/en/blog/${post.slug}/`])
];
await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((pathname) => `<url><loc>${abs(pathname)}</loc></url>`).join('')}</urlset>`);
await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${abs('/sitemap.xml')}\n`);
console.log(`Built ${paths.length + 1} HTML pages in ${dist}`);
