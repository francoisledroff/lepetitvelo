/* eslint-disable */
/* global WebImporter */

/*
 * Parser: tag-list
 *
 * /listalltags.html: "<h4>Tags:</h4><p><a href=/tags/X.html>X . </a>…</p>" becomes a dynamic
 * "Tag List" block rendered from the query index (all tags used by posts).
 * The "Tags:" heading stays as default content.
 */

export default function parse(element, { document }) {
  if (!element || element.tagName !== 'P') return;
  const prev = element.previousElementSibling;
  if (!prev || !/^H[1-6]$/.test(prev.tagName) || !/^\s*Tags\s*:?\s*$/i.test(prev.textContent)) return;
  if (!element.querySelector('a[href*="/tags/"]')) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'Tag List', cells: [] });
  element.replaceWith(block);
}
