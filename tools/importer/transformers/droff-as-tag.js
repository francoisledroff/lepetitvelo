/* eslint-disable */
/* global WebImporter */

/*
 * droff.com synthetic tag pages.
 *
 * Some tags used by published posts (e.g. "Spring Security") have no tag page on droff.com
 * (404), so the post's tag link would dead-end. Import any existing tag page with
 * "?as-tag=<Tag Name>" appended: this transformer retitles its heading to that tag before the
 * post-list parser runs, so the result is a dynamic tag page for <Tag Name>.
 * The import script derives the document path from the same parameter.
 */

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  let tag = null;
  try {
    tag = new URL(payload.params.originalURL).searchParams.get('as-tag');
  } catch (e) {
    return;
  }
  if (!tag) return;
  const heading = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    .find((h) => /Articles Tagged/i.test(h.textContent));
  if (heading) heading.textContent = `Articles Tagged \`${tag}\` :`;
}
