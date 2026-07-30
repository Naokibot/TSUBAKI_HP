const root = document.documentElement;
const body = document.body;
const storedTheme = localStorage.getItem('tsubaki-theme');
const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
root.dataset.theme = storedTheme || (systemDark ? 'dark' : 'light');

document.querySelector('.theme')?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('tsubaki-theme', root.dataset.theme);
});
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav nav');
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('open', !open);
});
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
}));

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

async function loadRepos() {
  const container = document.querySelector('#github-repos');
  const user = body.dataset.githubUser;
  if (!container || !user) return;
  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=updated&per_page=6`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error('GitHub API error');
    const repos = (await response.json()).filter((repo) => !repo.fork).slice(0, 6);
    container.innerHTML = repos.map((repo) => `<article class="repo card"><div class="card-body"><h3><a href="${repo.html_url}">${repo.name}</a></h3><p>${repo.description || 'GitHub repository'}</p><div class="repo-meta"><span>${repo.language || 'Code'}</span><span>★ ${repo.stargazers_count}</span></div></div></article>`).join('') || '<p>No public repositories found.</p>';
  } catch { container.innerHTML = '<p>GitHub repositories could not be loaded. Please use the GitHub link above.</p>'; }
}
loadRepos();

const form = document.querySelector('#contact-form');
if (form) {
  form.elements.startedAt.value = String(Date.now());
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.querySelector('#form-status');
    const submit = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    data.locale = body.dataset.lang;
    const last = Number(localStorage.getItem('tsubaki-last-contact') || 0);
    if (Date.now() - last < 30000) { status.textContent = 'Please wait before sending another message.'; return; }
    submit.disabled = true; status.textContent = body.dataset.lang === 'ja' ? '送信中…' : 'Sending…';
    try {
      const endpoint = body.dataset.contactEndpoint;
      if (!endpoint || endpoint === '/api/contact' && location.hostname.endsWith('github.io')) throw new Error('Contact API is not configured on GitHub Pages.');
      const response = await fetch(endpoint, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(data) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Send failed');
      localStorage.setItem('tsubaki-last-contact', String(Date.now()));
      form.reset(); form.elements.startedAt.value = String(Date.now());
      status.textContent = body.dataset.lang === 'ja' ? '送信しました。' : 'Message sent.';
    } catch (error) {
      status.textContent = `${error.message} ${body.dataset.lang === 'ja' ? '表示されているメールアドレスも利用できます。' : 'You can also use the displayed email address.'}`;
    } finally { submit.disabled = false; }
  });
}
