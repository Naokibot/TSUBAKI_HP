const page = document.documentElement;
const body = document.body;
const messages = readRuntimeMessages();

function readRuntimeMessages() {
  const element = document.querySelector('#runtime-i18n');
  if (!element) return {};

  try {
    return JSON.parse(element.textContent || '{}');
  } catch (error) {
    console.error('Unable to read runtime translations:', error);
    return {};
  }
}

function text(key, fallback) {
  return messages[key] || fallback;
}

// Theme preference is stored locally so the site opens consistently on the next visit.
const savedTheme = localStorage.getItem('tsubaki-theme');
const prefersDarkTheme = matchMedia('(prefers-color-scheme: dark)').matches;
page.dataset.theme = savedTheme || (prefersDarkTheme ? 'dark' : 'light');

document.querySelector('.theme')?.addEventListener('click', () => {
  const nextTheme = page.dataset.theme === 'dark' ? 'light' : 'dark';
  page.dataset.theme = nextTheme;
  localStorage.setItem('tsubaki-theme', nextTheme);
});

// Mobile navigation can be closed by selecting a link or pressing Escape.
const menuButton = document.querySelector('.nav-toggle');
const navigation = document.querySelector('.nav nav');

function closeNavigation() {
  navigation?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
}

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  navigation?.classList.toggle('open', !isOpen);
});

navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNavigation));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeNavigation();
});

// Header state, progress bar, and back-to-top button share one scroll calculation.
const header = document.querySelector('.header');
const progressBar = document.querySelector('.scroll-progress i');
const backToTopButton = document.querySelector('.back-to-top');

function updateScrollInterface() {
  const scrollTop = window.scrollY;
  const scrollableHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  header?.classList.toggle('is-scrolled', scrollTop > 18);
  backToTopButton?.classList.toggle('is-visible', scrollTop > 700);

  if (progressBar) {
    progressBar.style.width = `${Math.min(100, (scrollTop / scrollableHeight) * 100)}%`;
  }
}

window.addEventListener('scroll', updateScrollInterface, { passive: true });
window.addEventListener('resize', updateScrollInterface);
updateScrollInterface();

backToTopButton?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Elements are revealed only once to keep scrolling smooth on mobile devices.
const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  }
}, { threshold: 0.12, rootMargin: '0px 0px -30px' });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

// Highlight the section currently occupying the main part of the viewport.
const sectionLinks = [...document.querySelectorAll('.nav nav a[href*="#"]')];
const homeSections = [...document.querySelectorAll('main section[id]')];

if (sectionLinks.length && homeSections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const mostVisible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

    if (!mostVisible) return;

    sectionLinks.forEach((link) => {
      const hash = new URL(link.href, location.href).hash;
      link.classList.toggle('is-active', hash === `#${mostVisible.target.id}`);
    });
  }, { threshold: [0.25, 0.55], rootMargin: '-20% 0px -55%' });

  homeSections.forEach((section) => sectionObserver.observe(section));
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

async function loadPublicRepositories() {
  const container = document.querySelector('#github-repos');
  const userName = body.dataset.githubUser;
  if (!container || !userName) return;

  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(userName)}/repos?sort=updated&per_page=6`,
      { headers: { Accept: 'application/vnd.github+json' } }
    );

    if (!response.ok) throw new Error(`GitHub API ${response.status}`);

    const repositories = (await response.json())
      .filter((repository) => !repository.fork)
      .slice(0, 6);

    if (!repositories.length) {
      container.innerHTML = `<p>${escapeHtml(text('repoEmpty', 'No public repositories were found.'))}</p>`;
      return;
    }

    container.innerHTML = repositories.map((repository) => {
      const name = escapeHtml(repository.name);
      const description = escapeHtml(repository.description || text('repoDefaultDescription', 'GitHub repository'));
      const language = escapeHtml(repository.language || 'Code');
      const url = /^https:\/\/github\.com\//.test(repository.html_url) ? repository.html_url : '#';
      const stars = Number(repository.stargazers_count) || 0;

      return `<article class="repo"><h3><a href="${url}" target="_blank" rel="noopener">${name}</a></h3><p>${description}</p><div class="repo-meta"><span>${language}</span><span>★ ${stars}</span></div></article>`;
    }).join('');
  } catch (error) {
    console.error('Unable to load GitHub repositories:', error);
    container.innerHTML = `<p>${escapeHtml(text('repoFallback', 'GitHub repositories could not be loaded.'))}</p>`;
  }
}

loadPublicRepositories();

function formEndpointIsValid(endpoint) {
  return /^https:\/\/formspree\.io\/f\/[A-Za-z0-9_-]+$/.test(endpoint)
    && !endpoint.includes('YOUR_FORM_ID');
}

const contactForm = document.querySelector('#contact-form');

if (contactForm) {
  const startedAtField = contactForm.elements.startedAt;
  if (startedAtField) startedAtField.value = String(Date.now());

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const status = document.querySelector('#form-status');
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const endpoint = body.dataset.contactEndpoint || '';

    if (contactForm.elements.website?.value) {
      status.textContent = text('formBotSuccess', 'Message sent.');
      contactForm.reset();
      return;
    }

    const formOpenedAt = Number(startedAtField?.value || 0);
    if (!formOpenedAt || Date.now() - formOpenedAt < 2500) {
      status.textContent = text('formTooFast', 'Please wait a moment before sending.');
      return;
    }

    const previousSubmission = Number(localStorage.getItem('tsubaki-last-contact') || 0);
    if (Date.now() - previousSubmission < 30000) {
      status.textContent = text('formRateLimit', 'Please wait before sending another message.');
      return;
    }

    if (!formEndpointIsValid(endpoint)) {
      status.textContent = text('formNotConfigured', 'The contact form is not configured yet.');
      return;
    }

    submitButton.disabled = true;
    status.textContent = text('formSending', 'Sending…');

    try {
      const formData = new FormData(contactForm);
      formData.set('language', body.dataset.lang || 'ja');

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
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
      contactForm.reset();
      if (startedAtField) startedAtField.value = String(Date.now());
      status.textContent = text('formSuccess', 'Message sent.');
    } catch (error) {
      console.error('Unable to send contact form:', error);
      status.textContent = text('formError', 'The message could not be sent.');
    } finally {
      submitButton.disabled = false;
    }
  });
}
