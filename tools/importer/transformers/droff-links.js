/* eslint-disable */
/* global WebImporter */

/*
 * droff.com link rewriting (no dead links after the domain flip).
 *
 * - a[href] to droff.com pages  -> EDS path via toEdsPath (/content/.../cheeky-and-cheesy)
 * - a[href] to droff.com assets -> absolute https://droff.com/... (downloaded by importer)
 * - img[src]                    -> absolutized against the source page (path untouched)
 * - external / mailto: / javascript: / ftp: / #fragment links are left untouched
 *
 * Runs in beforeTransform (so links inside block tables are rewritten before parsing)
 * and again in afterTransform for links created by parsers (toEdsPath is idempotent).
 */
import { toEdsPath, toImageSrc, getBaseUrl } from './droff-url.js';

function rewrite(element, baseUrl) {
  element.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    const target = toEdsPath(href, baseUrl);
    if (target !== null && target !== href) a.setAttribute('href', target);
  });
  element.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    const abs = toImageSrc(src, baseUrl);
    if (abs && abs !== src) img.setAttribute('src', abs);
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    rewrite(element, getBaseUrl(payload));
  }
  if (hookName === 'afterTransform') {
    rewrite(element, getBaseUrl(payload));
  }
}
