import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const readJson = async (name) => JSON.parse(await readFile(path.join(root, 'content', name), 'utf8'));
const [site, skills, projects, posts, achievements] = await Promise.all([
  readJson('site.json'), readJson('skills.json'), readJson('projects.json'), readJson('posts.json'), readJson('achievements.json')
]);
const basePathRaw = process.env.SITE_BASE_PATH ?? site.basePath ?? '';
const basePath = basePathRaw && basePathRaw !== '/' ? `/${basePathRaw.replace(/^\/+|\/+$/g, '')}` : '';
const baseUrl = (process.env.SITE_BASE_URL || site.baseUrl || 'http://localhost:4173/').replace(/\/+$/, '/') ;
const u = (value = '/') => `${basePath}${value.startsWith('/') ? value : `/${value}`}`.replace(/\/{2,}/g, '/');
const abs = (value = '/') => new URL(u(value).replace(/^\//, ''), baseUrl).href;
const esc = (value = '') => String(value).replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const t = (value, lang) => typeof value === 'object' ? value[lang] : value;
const locale = (lang) => lang === 'ja' ? 'ja-JP' : 'en-US';
const langRoot = (lang) => lang === 'ja' ? '/' : '/en/';
const route = (lang, value = '') => u(`${langRoot(lang)}${value}`.replace(/\/{2,}/g, '/'));

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, 'public'), dist, { recursive: true });
await mkdir(path.join(dist, 'assets'), { recursive: true });
await cp(path.join(root, 'src', 'styles.css'), path.join(dist, 'assets', 'styles.css'));
await cp(path.join(root, 'src', 'app.js'), path.join(dist, 'assets', 'app.js'));
const ogParts = (await readdir(path.join(root, 'public'))).filter((name) => name.startsWith('og-image.png.base64.')).sort();
if (ogParts.length) {
  const data = (await Promise.all(ogParts.map((name) => readFile(path.join(root, 'public', name), 'utf8')))).join('').replace(/\s+/g, '');
  await writeFile(path.join(dist, 'og-image.png'), Buffer.from(data, 'base64'));
  await Promise.all(ogParts.map((name) => rm(path.join(dist, name), { force: true })));
}

const labels = {
  ja: {about:'私たちについて',skills:'スキル',projects:'作品',achievements:'実績',blog:'ブログ',contact:'お問い合わせ',view:'詳しく見る',allProjects:'作品一覧へ戻る',allPosts:'記事一覧へ戻る',challenge:'課題',solution:'解決方法',highlights:'主な特徴',technologies:'使用技術',send:'送信する',name:'お名前',email:'メールアドレス',organization:'所属（任意）',message:'お問い合わせ内容',repos:'GitHubの公開リポジトリ',loading:'GitHubから取得中…'},
  en: {about:'About',skills:'Skills',projects:'Projects',achievements:'Achievements',blog:'Blog',contact:'Contact',view:'View details',allProjects:'Back to projects',allPosts:'Back to articles',challenge:'Challenge',solution:'Solution',highlights:'Highlights',technologies:'Technologies',send:'Send message',name:'Name',email:'Email',organization:'Organization (optional)',message:'Message',repos:'Public GitHub repositories',loading:'Loading from GitHub…'}
};

function analytics() {
  const parts = [];
  if (site.plausibleDomain) parts.push(`<script defer data-domain="${esc(site.plausibleDomain)}" src="https://plausible.io/js/script.js"></script>`);
  if (site.gaMeasurementId) parts.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(site.gaMeasurementId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(site.gaMeasurementId)}');</script>`);
  if (site.turnstileSiteKey) parts.push('<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>');
  return parts.join('');
}

function head({ lang, title, description, pathname = '/', image = '/og-image.png', type = 'website' }) {
  const canonical = abs(pathname);
  const jsonLd = JSON.stringify({ '@context':'https://schema.org', '@type':'Organization', name:site.name, url:baseUrl, description:t(site.description, lang), email:site.email, sameAs:[site.githubUrl,site.xUrl,site.instagramUrl].filter(Boolean) });
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}"><link rel="icon" href="${u('/favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="${u('/assets/styles.css')}"><meta property="og:type" content="${type}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${abs(image)}"><meta property="og:locale" content="${locale(lang)}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#11131a">${analytics()}<script type="application/ld+json">${jsonLd}</script></head>`;
}

function header(lang) {
  const l = labels[lang];
  const other = lang === 'ja' ? 'en' : 'ja';
  const otherUrl = lang === 'ja' ? route('en') : route('ja');
  return `<a class="skip" href="#main">Skip to content</a><header class="header"><div class="wrap nav"><a class="brand" href="${route(lang)}"><img src="${u('/logo.svg')}" alt="TSUBAKI"></a><button class="nav-toggle" aria-label="Menu" aria-expanded="false">☰</button><nav><a href="${route(lang)}#about">${l.about}</a><a href="${route(lang)}#projects">${l.projects}</a><a href="${route(lang)}#blog">${l.blog}</a><a href="${route(lang)}#contact">${l.contact}</a><a class="lang" href="${otherUrl}" hreflang="${other}">${other.toUpperCase()}</a><button class="theme" aria-label="Toggle dark mode">◐</button></nav></div></header>`;
}

function footer(lang) {
  return `<footer><div class="wrap footer-grid"><div><img class="footer-logo" src="${u('/logo.svg')}" alt="TSUBAKI"><p>${esc(t(site.tagline, lang))}</p></div><div class="social"><a href="${esc(site.githubUrl)}">GitHub</a><a href="${esc(site.xUrl)}">X</a><a href="${esc(site.instagramUrl)}">Instagram</a><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></div></div><p class="copyright">© ${site.copyrightYear} TSUBAKI</p></footer>`;
}

function shell(lang, title, description, pathname, content, type = 'website', image = '/og-image.png') {
  return `${head({lang,title,description,pathname,image,type})}<body data-lang="${lang}" data-github-user="${esc(site.githubUser)}" data-contact-endpoint="${esc(site.contactEndpoint)}">${header(lang)}<main id="main">${content}</main>${footer(lang)}<script type="module" src="${u('/assets/app.js')}"></script></body></html>`;
}

const chips = (items) => `<div class="chips">${items.map((x) => `<span>${esc(x)}</span>`).join('')}</div>`;
const projectCard = (p, lang) => `<article class="card project-card reveal"><img src="${u(p.cover)}" alt="${esc(t(p.title,lang))}" loading="lazy"><div class="card-body"><div class="eyebrow">${esc(p.year)} · ${esc(t(p.status,lang))}</div><h3>${esc(t(p.title,lang))}</h3><p>${esc(t(p.summary,lang))}</p>${chips(p.technologies.slice(0,4))}<a class="text-link" href="${route(lang,`projects/${p.slug}/`)}">${labels[lang].view} →</a></div></article>`;
const postCard = (p, lang) => `<article class="card post-card reveal"><div class="card-body"><time datetime="${p.date}">${p.date}</time><h3>${esc(t(p.title,lang))}</h3><p>${esc(t(p.excerpt,lang))}</p>${chips(p.tags)}<a class="text-link" href="${route(lang,`blog/${p.slug}/`)}">${labels[lang].view} →</a></div></article>`;

function home(lang) {
  const l = labels[lang];
  const turnstile = site.turnstileSiteKey ? `<div class="cf-turnstile" data-sitekey="${esc(site.turnstileSiteKey)}"></div>` : '';
  const content = `<section class="hero"><div class="wrap hero-grid"><div class="hero-copy reveal"><div class="eyebrow">STUDENT DEVELOPMENT TEAM</div><h1>${esc(t(site.tagline,lang))}</h1><p>${esc(t(site.description,lang))}</p><div class="actions"><a class="button primary" href="#projects">${l.projects}</a><a class="button" href="#contact">${l.contact}</a></div></div><div class="profile reveal"><img src="${u('/profile.svg')}" alt="TSUBAKI team profile"><div class="orbit orbit-a"></div><div class="orbit orbit-b"></div></div></div></section>
  <section id="about"><div class="wrap split reveal"><div><div class="eyebrow">ABOUT TSUBAKI</div><h2>${l.about}</h2></div><p class="lead">${esc(t(site.about,lang))}</p></div></section>
  <section id="skills" class="soft"><div class="wrap"><div class="section-head reveal"><div><div class="eyebrow">CAPABILITIES</div><h2>${l.skills}</h2></div></div><div class="skill-grid">${skills.map((s)=>`<article class="skill reveal"><div class="skill-top"><span class="skill-icon">${esc(s.icon)}</span><strong>${esc(s.name)}</strong><span>${s.level}%</span></div><p>${esc(t(s.description,lang))}</p><div class="meter"><i style="--level:${s.level}%"></i></div></article>`).join('')}</div></div></section>
  <section id="projects"><div class="wrap"><div class="section-head reveal"><div><div class="eyebrow">SELECTED WORK</div><h2>${l.projects}</h2></div></div><div class="project-grid">${projects.map((p)=>projectCard(p,lang)).join('')}</div></div></section>
  <section id="achievements" class="soft"><div class="wrap"><div class="section-head reveal"><div><div class="eyebrow">MILESTONES</div><h2>${l.achievements}</h2></div></div><div class="timeline">${achievements.map((a)=>`<article class="timeline-item reveal"><div class="year">${esc(a.year)}</div><div><span class="tag">${esc(t(a.type,lang))}</span><h3>${esc(t(a.title,lang))}</h3><p>${esc(t(a.detail,lang))}</p></div></article>`).join('')}</div></div></section>
  <section id="blog"><div class="wrap"><div class="section-head reveal"><div><div class="eyebrow">NOTES & ENGINEERING</div><h2>${l.blog}</h2></div></div><div class="post-grid">${posts.map((p)=>postCard(p,lang)).join('')}</div></div></section>
  <section id="github" class="soft"><div class="wrap"><div class="section-head reveal"><div><div class="eyebrow">OPEN SOURCE</div><h2>${l.repos}</h2></div><a class="text-link" href="${esc(site.githubUrl)}">GitHub →</a></div><div id="github-repos" class="repo-grid"><p>${l.loading}</p></div></div></section>
  <section id="contact"><div class="wrap contact-grid"><div class="reveal"><div class="eyebrow">LET'S BUILD SOMETHING</div><h2>${l.contact}</h2><p>${esc(t(site.description,lang))}</p><a class="email-link" href="mailto:${esc(site.email)}">${esc(site.email)}</a></div><form id="contact-form" class="contact-form reveal"><input class="honeypot" name="website" tabindex="-1" autocomplete="off"><input type="hidden" name="startedAt" value=""><label>${l.name}<input name="name" required maxlength="100"></label><label>${l.email}<input name="email" type="email" required maxlength="200"></label><label>${l.organization}<input name="organization" maxlength="160"></label><label>${l.message}<textarea name="message" required minlength="5" maxlength="5000"></textarea></label>${turnstile}<button class="button primary" type="submit">${l.send}</button><p id="form-status" role="status"></p></form></div></section>`;
  return shell(lang, `${site.name} — ${t(site.tagline,lang)}`, t(site.description,lang), langRoot(lang), content);
}

function projectPage(project, lang) {
  const l = labels[lang];
  const content = `<section class="detail-hero"><div class="wrap"><a class="back" href="${route(lang)}#projects">← ${l.allProjects}</a><div class="detail-grid"><div><div class="eyebrow">${esc(project.year)} · ${esc(t(project.status,lang))}</div><h1>${esc(t(project.title,lang))}</h1><p class="lead">${esc(t(project.subtitle,lang))}</p>${chips(project.technologies)}<div class="actions"><a class="button primary" href="${esc(project.github)}">GitHub</a>${project.demo?`<a class="button" href="${esc(project.demo)}">Demo</a>`:''}</div></div><img src="${u(project.cover)}" alt="${esc(t(project.title,lang))}"></div></div></section><section><div class="wrap prose-grid"><article class="prose reveal"><h2>${l.challenge}</h2><p>${esc(t(project.challenge,lang))}</p><h2>${l.solution}</h2><p>${esc(t(project.solution,lang))}</p></article><aside class="card reveal"><div class="card-body"><h2>${l.highlights}</h2><ul>${t(project.highlights,lang).map((x)=>`<li>${esc(x)}</li>`).join('')}</ul><h2>${l.technologies}</h2>${chips(project.technologies)}</div></aside></div></section>`;
  return shell(lang, `${t(project.title,lang)} — TSUBAKI`, t(project.summary,lang), `${langRoot(lang)}projects/${project.slug}/`, content, 'article', project.cover);
}

function markdown(text) {
  return text.split(/\n\n+/).map((block)=>{
    if (block.startsWith('# ')) return `<h1>${esc(block.slice(2))}</h1>`;
    if (block.startsWith('## ')) return `<h2>${esc(block.slice(3))}</h2>`;
    return `<p>${esc(block).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\n/g,'<br>')}</p>`;
  }).join('');
}
function postPage(post, lang) {
  const l=labels[lang];
  const content=`<section class="article-hero"><div class="narrow"><a class="back" href="${route(lang)}#blog">← ${l.allPosts}</a><time datetime="${post.date}">${post.date}</time><h1>${esc(t(post.title,lang))}</h1><p class="lead">${esc(t(post.excerpt,lang))}</p>${chips(post.tags)}</div></section><article class="narrow article-body reveal">${markdown(t(post.content,lang))}</article>`;
  return shell(lang, `${t(post.title,lang)} — TSUBAKI`, t(post.excerpt,lang), `${langRoot(lang)}blog/${post.slug}/`, content, 'article');
}

async function writePage(relative, html) {
  const directory = path.join(dist, relative);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html);
}
await writePage('', home('ja'));
await writePage('en', home('en'));
for (const p of projects) for (const lang of ['ja','en']) await writePage(path.join(lang==='en'?'en':'','projects',p.slug), projectPage(p,lang));
for (const p of posts) for (const lang of ['ja','en']) await writePage(path.join(lang==='en'?'en':'','blog',p.slug), postPage(p,lang));
await writeFile(path.join(dist,'404.html'), shell('ja','404 — TSUBAKI','Page not found','/404.html','<section class="not-found"><div class="wrap"><h1>404</h1><p>ページが見つかりません。</p><a class="button primary" href="'+route('ja')+'">Home</a></div></section>'));
const paths=['/','/en/',...projects.flatMap((p)=>[`/projects/${p.slug}/`,`/en/projects/${p.slug}/`]),...posts.flatMap((p)=>[`/blog/${p.slug}/`,`/en/blog/${p.slug}/`])];
await writeFile(path.join(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((x)=>`<url><loc>${abs(x)}</loc></url>`).join('')}</urlset>`);
await writeFile(path.join(dist,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${abs('/sitemap.xml')}\n`);
console.log(`Built ${paths.length + 1} HTML pages in ${dist}`);
