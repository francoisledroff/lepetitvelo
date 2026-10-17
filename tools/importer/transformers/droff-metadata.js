/* eslint-disable */
/* global WebImporter */

/*
 * droff.com page metadata -> Metadata block (afterTransform, after parsers).
 *
 * Title       .page-header h1, fallback <title> without "Francois Le Droff: "
 * Description first non-empty body paragraph, ~160 chars
 * Date/Tags/Template (blog posts only: .page-header p.credit containing "First published")
 *   Date      "First published on June 21 2018" -> 2018-06-21
 *   Tags      p.credit a[href*='/tags/'] text, trailing " . " stripped, joined ", "
 *   Template  blog-post
 *
 * Head metadata (title/description/og:*) consumed here is removed so the import
 * script's WebImporter.rules.createMetadata() does not append a second Metadata block.
 */

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function parsePublishedDate(creditText) {
  const m = clean(creditText).match(/First published on\s+([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (!month) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${m[3]}-${pad(month)}-${pad(parseInt(m[2], 10))}`;
}

function truncate(text, max = 160) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:!?-]+$/, '')}…`;
}

function firstParagraphText(element) {
  const paragraphs = element.querySelectorAll('p');
  for (const p of paragraphs) {
    if (p.closest('.page-header, table, blockquote, pre, #footer')) continue;
    const text = clean(p.textContent);
    if (text) return text;
  }
  return '';
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const document = (payload && payload.document) || element.ownerDocument;

  const header = element.querySelector('.page-header');
  const h1 = header ? header.querySelector('h1') : null;
  const credit = header ? header.querySelector('p.credit') : null;

  // Keep anything else the importer can read from <head> (e.g. og:image)
  const meta = WebImporter.Blocks.getMetadata(document) || {};
  delete meta['og:title'];
  delete meta['twitter:title'];

  const headTitle = document.querySelector('title');
  const title = clean(h1 && h1.textContent)
    || clean(headTitle && headTitle.textContent).replace(/^Fran(c|ç)ois Le Droff\s*:\s*/i, '');
  if (title) meta.Title = title; else delete meta.Title;

  const isPost = !!(credit && /First published/i.test(credit.textContent));
  if (isPost) {
    const date = parsePublishedDate(credit.textContent);
    if (date) meta.Date = date;
    const tags = Array.from(credit.querySelectorAll("a[href*='/tags/']"))
      .map((a) => clean(a.textContent).replace(/[\s.]+$/, '').trim())
      .filter(Boolean);
    if (tags.length) meta.Tags = tags.join(', ');
    meta.Template = 'blog-post';
  }

  // Posts: the template renders title + credit from metadata. Other pages keep their H1.
  if (header && isPost) header.remove();
  else if (header) header.replaceWith(...header.childNodes);

  const description = firstParagraphText(element);
  if (description) meta.Description = truncate(description);

  if (Object.keys(meta).length) {
    element.append(WebImporter.Blocks.getMetadataBlock(document, meta));
  }

  // Prevent a duplicate Metadata block from rules.createMetadata()
  if (document.head) {
    document.head.querySelectorAll(
      'title, meta[name="description"], meta[property^="og:"], meta[name^="og:"], meta[name^="twitter:"], meta[property^="twitter:"]',
    ).forEach((el) => el.remove());
  }
}
