import { getPosts, tagSlug } from '../../scripts/post-index.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Reads the optional "Tag | <name>" row from the authored block.
 * @param {Element} block block element
 * @returns {string} tag name or ''
 */
function readTag(block) {
  let tag = '';
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      if (key === 'tag' || key === 'tags') tag = cells[1].textContent.trim();
    } else if (cells.length === 1 && !tag) {
      const text = cells[0].textContent.trim();
      const m = text.match(/^tags?\s*[:|]\s*(.+)$/i);
      if (m) [, tag] = m;
    }
  });
  return tag;
}

function formatDay(date) {
  return `${String(date.getUTCDate()).padStart(2, '0')} ${MONTHS[date.getUTCMonth()]}`;
}

export default async function decorate(block) {
  const tag = readTag(block);
  const slug = tag ? tagSlug(tag) : '';
  block.textContent = '';
  if (tag && !slug) return;

  const posts = await getPosts();
  const matching = posts
    .filter((post) => !slug || post.tags.some((t) => tagSlug(t) === slug))
    .sort((a, b) => b.date - a.date);
  if (!matching.length) return;

  const fragment = document.createDocumentFragment();
  let currentYear;
  let ul;
  matching.forEach((post) => {
    const year = post.date.getUTCFullYear();
    if (year !== currentYear) {
      currentYear = year;
      const h4 = document.createElement('h4');
      h4.textContent = String(year);
      ul = document.createElement('ul');
      fragment.append(h4, ul);
    }
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = post.path;
    a.textContent = post.title;
    li.append(`${formatDay(post.date)} - `, a);
    ul.append(li);
  });
  block.append(fragment);
}
