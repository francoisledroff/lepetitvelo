/* eslint-disable */
/* global WebImporter */

/*
 * Import script: site navigation fragment (/nav) from the droff.com Bootstrap navbar.
 *
 * Produces two sections for the EDS header block:
 *   1. brand   - "Chez François" link to /
 *   2. sections - list of top-level links (Tech, Papa, Lectures, Musiques, Photos)
 * Links are rewritten to the new EDS paths with the shared droff-url mapping.
 */

import { toEdsPath } from './transformers/droff-url.js';

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const base = params.originalURL;
    const navbar = document.querySelector('.navbar');
    const main = document.createElement('div');

    const rewrite = (a) => {
      const target = toEdsPath(a.getAttribute('href'), base);
      if (target !== null) a.setAttribute('href', target);
      return a;
    };

    // section 1: brand
    const brand = navbar && navbar.querySelector('.navbar-brand');
    if (brand) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = brand.getAttribute('href');
      a.textContent = brand.textContent.trim();
      p.append(rewrite(a));
      main.append(p);
    }

    main.append(document.createElement('hr'));

    // section 2: top-level links (only rendered <li>, commented-out items are not in the DOM)
    const ul = document.createElement('ul');
    (navbar ? [...navbar.querySelectorAll('.navbar-nav > li > a')] : []).forEach((link) => {
      const text = link.textContent.trim();
      if (!text) return;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = text;
      li.append(rewrite(a));
      ul.append(li);
    });
    main.append(ul);

    return [{
      element: main,
      path: '/nav',
      report: { title: 'nav', template: 'nav', links: ul.children.length },
    }];
  },
};
