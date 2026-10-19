/* eslint-disable */
/* global WebImporter */

/*
 * Parser: post-list
 *
 * JBake listings (Archives, /tags/*) are static "<h4>YYYY</h4><ul><li>DD Mon - <a>…</a></li></ul>"
 * groups. They become a single dynamic "Post List" block rendered from the query index,
 * so new posts appear without editing the listing pages.
 *
 * Tag pages:  <h4>Articles Tagged `Papa` :</h4> stays as default content, block gets "Tag | Papa".
 * Archives:   no tag row (all posts).
 *
 * Only direct-child year headings are considered, so the outer #wrap > div.container on tag
 * pages (which wraps div.container.marketing) is a no-op.
 */

const YEAR = /^\s*\d{4}\s*$/;

export default function parse(element, { document }) {
  if (!element) return;
  const children = Array.from(element.children);
  const yearHeadings = children.filter((el) => /^H[1-6]$/.test(el.tagName) && YEAR.test(el.textContent));
  const heading = children.find((el) => /^H[1-6]$/.test(el.tagName) && /Articles Tagged/i.test(el.textContent));

  // Empty tag pages (e.g. /tags/All) have the heading but no year groups: still emit the block
  if (!yearHeadings.length && !heading) return;

  let tag = '';
  if (heading) {
    const m = heading.textContent.match(/`([^`]+)`/);
    tag = m ? m[1].trim() : heading.textContent.replace(/Articles Tagged/i, '').replace(/[:`]/g, '').trim();
  }

  const cells = tag ? [['Tag', tag]] : [];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Post List', cells });

  // Insert where the first year group was (or right after the tag heading)
  const anchor = yearHeadings[0] || null;
  if (anchor) anchor.before(block);
  else heading.after(block);

  // Remove the static year groups (heading + following list)
  yearHeadings.forEach((h) => {
    let next = h.nextElementSibling;
    while (next && (next.tagName === 'UL' || next.tagName === 'OL')) {
      const rm = next;
      next = next.nextElementSibling;
      rm.remove();
    }
    h.remove();
  });
}
