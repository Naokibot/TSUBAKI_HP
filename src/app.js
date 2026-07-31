const root = document.documentElement;

const savedTheme = localStorage.getItem('tsubaki-theme');
const preferredTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
root.dataset.theme = savedTheme || preferredTheme;

document.querySelector('.theme')?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('tsubaki-theme', root.dataset.theme);
});

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

navigation?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeNavigation);
});

const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  }
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const header = document.querySelector('.header');
const progressBar = document.querySelector('.scroll-progress i');
const backToTopButton = document.querySelector('.back-to-top');

function updateScrollInterface() {
  const scrollTop = window.scrollY;
  const scrollableHeight = Math.max(1, document.documentElement.scrollHeight - innerHeight);

  header?.classList.toggle('is-scrolled', scrollTop > 18);
  backToTopButton?.classList.toggle('is-visible', scrollTop > 700);

  if (progressBar) {
    progressBar.style.width = `${Math.min(100, scrollTop / scrollableHeight * 100)}%`;
  }
}

addEventListener('scroll', updateScrollInterface, { passive: true });
addEventListener('resize', updateScrollInterface);
updateScrollInterface();

backToTopButton?.addEventListener('click', () => {
  scrollTo({ top: 0, behavior: 'smooth' });
});
