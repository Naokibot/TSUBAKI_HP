const root = document.documentElement;
const body = document.body;
const storedTheme = localStorage.getItem('tsubaki-theme');
const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
root.dataset.theme = storedTheme || (systemDark ? 'dark' : 'light');

const themeButton = document.querySelector('.theme');
themeButton?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('tsubaki-theme', root.dataset.theme);
});

const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav nav');
const closeNavigation = () => {
  nav?.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
};
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('open', !open);
});
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNavigation));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeNavigation();
});

const header = document.querySelector('.header');
const progress = document.querySelector('.scroll-progress i');
const backToTop = document.querySelector('.back-to-top');
function updateScrollUi() {
  const top = window.scrollY;
  const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  header?.classList.toggle('is-scrolled', top > 18);
  backToTop?.classList.toggle('is-visible', top > 700);
  if (progress) progress.style.width = `${Math.min(100, (top / scrollable) * 100)}%`;
}
window.addEventListener('scroll', updateScrollUi, { passive: true });
window.addEventListener('resize', updateScrollUi);
updateScrollUi();
backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  }
}, { threshold: 0.12, rootMargin: '0px 0px -30px' });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const navLinks = [...document.querySelectorAll('.nav nav a[href*="#"]')];
const homeSections = [...document.querySelectorAll('main section[id]')];
if (navLinks.length && homeSections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => {
      const hash = new URL(link.href, location.href).hash;
      link.classList.toggle('is-active', hash === `#${visible.target.id}`);
    });
  }, { threshold: [0.25, 0.55], rootMargin: '-20% 0px -55%' });
  homeSections.forEach((section) => sectionObserver.observe(section));
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

async function loadRepos() {
  const container = document.querySelector('#github-repos');
  const user = body.dataset.githubUser;
  if (!container || !user) return;
  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=updated&per_page=6`,
      { headers: { Accept: 'application/vnd.github+json' } }
    );
    if (!response.ok) throw new Error(`GitHub API ${response.status}`);
    const repos = (await response.json()).filter((repo) => !repo.fork).slice(0, 6);
    container.innerHTML = repos.map((repo) => {
      const name = escapeHtml(repo.name);
      const description = escapeHtml(repo.description || 'GitHub repository');
      const language = escapeHtml(repo.language || 'Code');
      const url = /^https:\/\/github\.com\//.test(repo.html_url) ? repo.html_url : '#';
      return `<article class="repo"><h3><a href="${url}" target="_blank" rel="noopener">${name}</a></h3><p>${description}</p><div class="repo-meta"><span>${language}</span><span>★ ${Number(repo.stargazers_count) || 0}</span></div></article>`;
    }).join('') || '<p>No public repositories found.</p>';
  } catch (error) {
    console.error('GitHub repositories:', error);
    container.innerHTML = '<p>GitHub repositories could not be loaded. Please use the GitHub link above.</p>';
  }
}
loadRepos();

const form = document.querySelector('#contact-form');
if (form) {
  const startedAt = form.elements.startedAt;
  if (startedAt) startedAt.value = String(Date.now());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.querySelector('#form-status');
    const submit = form.querySelector('button[type="submit"]');
    const isJapanese = body.dataset.lang === 'ja';
    const endpoint = body.dataset.contactEndpoint || '';

    if (form.elements.website?.value) {
      status.textContent = isJapanese ? '送信しました。' : 'Message sent.';
      form.reset();
      return;
    }

    const began = Number(startedAt?.value || 0);
    if (!began || Date.now() - began < 2500) {
      status.textContent = isJapanese
        ? '入力内容を確認して、少し待ってから送信してください。'
        : 'Please check the form and wait a moment before sending.';
      return;
    }

    const last = Number(localStorage.getItem('tsubaki-last-contact') || 0);
    if (Date.now() - last < 30000) {
      status.textContent = isJapanese
        ? '連続送信を防ぐため、30秒ほど待ってください。'
        : 'Please wait 30 seconds before sending another message.';
      return;
    }

    if (!/^https:\/\/formspree\.io\/f\/[A-Za-z0-9_-]+$/.test(endpoint) || endpoint.includes('YOUR_FORM_ID')) {
      status.textContent = isJapanese
        ? 'お問い合わせフォームは準備中です。表示されているメールアドレスへ直接ご連絡ください。'
        : 'The contact form is not configured yet. Please use the displayed email address.';
      return;
    }

    submit.disabled = true;
    status.textContent = isJapanese ? '送信中…' : 'Sending…';

    try {
      const data = new FormData(form);
      data.set('language', body.dataset.lang || 'ja');
      const response = await fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const details = Array.isArray(result.errors)
          ? result.errors.map((item) => item.message).filter(Boolean).join(' ')
          : '';
        throw new Error(details || result.error || 'Send failed');
      }
      localStorage.setItem('tsubaki-last-contact', String(Date.now()));
      form.reset();
      if (startedAt) startedAt.value = String(Date.now());
      status.textContent = isJapanese
        ? '送信しました。ご連絡ありがとうございます。'
        : 'Message sent. Thank you for contacting us.';
    } catch (error) {
      console.error('Contact form error:', error);
      status.textContent = isJapanese
        ? '送信できませんでした。時間をおいて再試行するか、表示されているメールアドレスへ直接ご連絡ください。'
        : 'The message could not be sent. Please try again later or use the displayed email address.';
    } finally {
      submit.disabled = false;
    }
  });
}
