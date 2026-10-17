// Below this width the links collapse behind the toggle button (Bootstrap 3 grid-float-breakpoint)
const isDesktop = window.matchMedia('(min-width: 768px)');

/**
 * Loads the nav fragment: /content first (local preview), then the site root (DA/EDS).
 * @returns {Promise<Element|null>} container holding the fragment sections
 */
async function loadNavFragment() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  return container;
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Opens or closes the collapsed link list (mobile), sliding its height
 * like Bootstrap's collapse (0.35s ease, see header.css).
 * @param {Element} nav nav element
 * @param {boolean} [force] desired state, toggles when omitted
 */
function toggleMenu(nav, force) {
  const button = nav.querySelector('.nav-toggle');
  const collapse = nav.querySelector('.nav-collapse');
  const expanded = force ?? button.getAttribute('aria-expanded') !== 'true';
  if (expanded === nav.classList.contains('is-open')) return;
  button.setAttribute('aria-expanded', expanded);

  const animate = !isDesktop.matches && !reducedMotion.matches;
  const done = () => {
    collapse.classList.remove('is-collapsing');
    collapse.style.height = '';
    if (!expanded) nav.classList.remove('is-open');
  };
  if (!animate) {
    nav.classList.toggle('is-open', expanded);
    done();
    return;
  }

  nav.classList.add('is-open');
  const fullHeight = `${collapse.scrollHeight}px`;
  collapse.style.height = expanded ? '0px' : fullHeight;
  collapse.classList.add('is-collapsing');
  // force a reflow so the transition starts from the height set above
  collapse.getBoundingClientRect();
  collapse.style.height = expanded ? fullHeight : '0px';
  collapse.addEventListener('transitionend', done, { once: true });
}

/**
 * Builds a Bootstrap-like navbar from the fragment: first section = brand,
 * every list in the following sections = top-level links.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await loadNavFragment();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.querySelectorAll(':scope > div')];
  const [brandSection, ...linkSections] = sections;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  const container = document.createElement('div');
  container.className = 'nav-container';

  // brand + toggle
  const navHeader = document.createElement('div');
  navHeader.className = 'nav-header';
  const brandLink = brandSection && brandSection.querySelector('a');
  if (brandLink) {
    brandLink.className = 'nav-brand';
    navHeader.append(brandLink);
  }

  const collapse = document.createElement('div');
  collapse.className = 'nav-collapse';
  collapse.id = 'nav-collapse';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-toggle';
  button.setAttribute('aria-controls', collapse.id);
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', 'Toggle navigation');
  button.innerHTML = '<span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span>';
  navHeader.append(button);

  // links
  linkSections.forEach((section) => {
    section.querySelectorAll(':scope > ul').forEach((ul) => {
      ul.className = 'nav-list';
      ul.querySelectorAll('a[href^="http"]').forEach((a) => {
        if (new URL(a.href).host !== window.location.host) a.rel = 'noopener';
      });
      collapse.append(ul);
    });
  });

  container.append(navHeader, collapse);
  nav.append(container);

  button.addEventListener('click', () => toggleMenu(nav));
  nav.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !isDesktop.matches && nav.classList.contains('is-open')) {
      toggleMenu(nav, false);
      button.focus();
    }
  });
  // crossing the breakpoint resets the mobile menu state
  isDesktop.addEventListener('change', () => toggleMenu(nav, false));

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav);
  block.append(wrapper);
}
