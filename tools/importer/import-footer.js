/* eslint-disable */
/* global WebImporter */

/*
 * Import script: site footer fragment (/footer) from the droff.com #footer
 * ("Published under a Creative Commons by-nc-sa license").
 */

export default {
  transform: (payload) => {
    const { document } = payload;
    const main = document.createElement('div');
    const credit = document.querySelector('#footer .credit');
    if (credit) {
      const p = document.createElement('p');
      p.innerHTML = credit.innerHTML.replace(/\s+/g, ' ').trim();
      main.append(p);
    }
    return [{
      element: main,
      path: '/footer',
      report: { title: 'footer', template: 'footer' },
    }];
  },
};
