/* eslint-disable */
/* global WebImporter */

/*
 * droff.com (JBake + AsciiDoc + Bootstrap 3) cleanup.
 *
 * beforeTransform: strip site chrome, JBake empty <p> spacers and the trailing <hr>,
 *   unwrap 1x1 table.tableblock into default content (tables with >= 2 cells are kept
 *   for the columns-framed parser), normalize AsciiDoc blocks into plain HTML
 *   (pre/code, blockquote, image + caption, admonitions).
 * afterTransform: unwrap AsciiDoc default-content wrappers outside block tables.
 *   HTML comments are NOT touched here (field hints may be written by parsers).
 */

const MEDIA_SELECTOR = 'img, picture, video, audio, iframe, svg, object, embed, canvas';

function isEmptyParagraph(p) {
  const text = (p.textContent || '').replace(/[\s ​]/g, '');
  return text === '' && !p.querySelector(MEDIA_SELECTOR);
}

function removeComments(root) {
  const doc = root.ownerDocument || root;
  const walker = doc.createTreeWalker(root, 128 /* NodeFilter.SHOW_COMMENT */);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((c) => c.remove());
}

function unwrap(el) {
  if (!el || !el.parentNode) return;
  while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
  el.remove();
}

function replaceWith(el, nodes) {
  nodes.filter(Boolean).forEach((n) => el.parentNode.insertBefore(n, el));
  el.remove();
}

function textParagraph(document, text) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  const p = document.createElement('p');
  p.textContent = t;
  return p;
}

function blockTitle(document, block) {
  const title = block.querySelector(':scope > .title');
  return title ? textParagraph(document, title.textContent) : null;
}

/** 1x1 table.tableblock -> its cell content (no side-by-side layout to preserve). */
function unwrapSingleCellTables(element, document) {
  element.querySelectorAll('table.tableblock').forEach((table) => {
    const cells = table.querySelectorAll('td, th');
    if (cells.length !== 1) return;
    const cell = cells[0];
    const nodes = [];
    const caption = table.querySelector('caption');
    if (caption) nodes.push(textParagraph(document, caption.textContent));
    const content = cell.querySelector(':scope > div.content');
    const source = content || cell;
    while (source.firstChild) nodes.push(source.firstChild) && source.removeChild(source.firstChild);
    // bare text cells (<td><p class="tableblock">) are kept as-is
    replaceWith(table, nodes);
  });
}

/** .literalblock / .listingblock -> [title] + <pre><code>text</code></pre> */
function normalizeCodeBlocks(element, document) {
  element.querySelectorAll('div.literalblock, div.listingblock').forEach((block) => {
    const pre = block.querySelector('pre');
    const text = pre ? pre.textContent : block.textContent;
    const newPre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = (text || '').replace(/^\n+|\s+$/g, '');
    newPre.append(code);
    replaceWith(block, [blockTitle(document, block), newPre]);
  });
}

function attributionParagraph(document, block) {
  const attribution = block.querySelector(':scope > .attribution');
  if (!attribution) return null;
  const p = document.createElement('p');
  // keep inline markup (cite, em, links); turn <br> into a separator
  attribution.querySelectorAll('br').forEach((br) => br.replaceWith(document.createTextNode(', ')));
  p.innerHTML = attribution.innerHTML.replace(/\s+/g, ' ').trim();
  return p.textContent.trim() ? p : null;
}

/** .quoteblock / .verseblock -> [title] + <blockquote> (+ attribution paragraph inside) */
function normalizeQuotes(element, document) {
  element.querySelectorAll('div.quoteblock').forEach((block) => {
    const quote = block.querySelector(':scope > blockquote') || block.querySelector('blockquote');
    if (!quote) { unwrap(block); return; }
    const attribution = attributionParagraph(document, block);
    if (attribution) quote.append(attribution);
    replaceWith(block, [blockTitle(document, block), quote]);
  });
  element.querySelectorAll('div.verseblock').forEach((block) => {
    const pre = block.querySelector('pre');
    const quote = document.createElement('blockquote');
    const p = document.createElement('p');
    (pre ? pre.textContent : '').replace(/^\n+|\s+$/g, '').split('\n').forEach((line, i) => {
      if (i > 0) p.append(document.createElement('br'));
      p.append(document.createTextNode(line));
    });
    quote.append(p);
    const attribution = attributionParagraph(document, block);
    if (attribution) quote.append(attribution);
    replaceWith(block, [blockTitle(document, block), quote]);
  });
}

/** .imageblock -> <p>[<a>]<img>[</a>]</p> + caption paragraph */
function normalizeImages(element, document) {
  element.querySelectorAll('div.imageblock').forEach((block) => {
    const img = block.querySelector('img');
    if (!img) { block.remove(); return; }
    const link = img.closest('a');
    const p = document.createElement('p');
    p.append(link && block.contains(link) ? link : img);
    const title = block.querySelector(':scope > .title');
    replaceWith(block, [p, title ? textParagraph(document, title.textContent) : null]);
  });
  // inline images: <span class="image"><img></span> -> <img>
  element.querySelectorAll('span.image').forEach((span) => unwrap(span));
}

/** .admonitionblock (layout table: icon | content) -> "Note:" paragraph + content */
function normalizeAdmonitions(element, document) {
  element.querySelectorAll('div.admonitionblock').forEach((block) => {
    const iconTitle = block.querySelector('td.icon .title');
    const label = (iconTitle && iconTitle.textContent.trim())
      || ((block.className.match(/\b(note|tip|important|caution|warning)\b/i) || [])[1] || 'Note');
    const content = block.querySelector('td.content');
    const strong = document.createElement('strong');
    strong.textContent = `${label.charAt(0).toUpperCase()}${label.slice(1).toLowerCase()}:`;
    const p = document.createElement('p');
    p.append(strong);
    const nodes = [p];
    if (content) {
      // a bare text admonition becomes "Note: text" in one paragraph
      if (!content.querySelector('div, p, ul, ol, pre, table, blockquote')) {
        p.append(document.createTextNode(` ${content.textContent.replace(/\s+/g, ' ').trim()}`));
      } else {
        while (content.firstChild) {
          nodes.push(content.firstChild);
          content.removeChild(content.firstChild);
        }
      }
    }
    replaceWith(block, nodes);
  });
}

/** Remove the trailing decorative <hr> left directly under the post container. */
function removeTrailingRules(element) {
  element.querySelectorAll('#wrap > div.container, #wrap').forEach((container) => {
    let last = container.lastElementChild;
    while (last && (last.tagName === 'HR' || (last.tagName === 'P' && isEmptyParagraph(last)))) {
      last.remove();
      last = container.lastElementChild;
    }
  });
}

export default function transform(hookName, element, payload) {
  const document = (payload && payload.document) || element.ownerDocument;

  if (hookName === 'beforeTransform') {
    // Site chrome and non-authorable elements
    WebImporter.DOMUtils.remove(element, [
      'div.navbar',
      '#footer',
      'script',
      'link',
      'noscript',
      'style',
      'iframe[src*="googletagmanager"]',
    ]);
    removeComments(element);

    // Layout: 1x1 tables become default content before parsers see them
    unwrapSingleCellTables(element, document);

    // AsciiDoc normalization (safe inside multi-cell tables too: only inner wrappers change)
    normalizeAdmonitions(element, document);
    normalizeCodeBlocks(element, document);
    normalizeQuotes(element, document);
    normalizeImages(element, document);

    // JBake <p><div> wrapping leaves empty <p> spacers behind
    element.querySelectorAll('p').forEach((p) => {
      if (isEmptyParagraph(p)) p.remove();
    });
    removeTrailingRules(element);
  }

  if (hookName === 'afterTransform') {
    // Unwrap AsciiDoc default-content wrappers that are not part of a block table.
    const wrappers = [
      'div.paragraph', 'div.ulist', 'div.olist', 'div.dlist', 'div.colist',
      'div.sect1', 'div.sect2', 'div.sect3', 'div.sect4', 'div.sect5', 'div.sectionbody',
      'div#preamble', 'div.openblock', 'div.exampleblock', 'div.sidebarblock',
      'div.content',
    ].join(', ');
    Array.from(element.querySelectorAll(wrappers))
      .filter((el) => !el.closest('table'))
      .reverse()
      .forEach((el) => unwrap(el));

    // Leftover AsciiDoc titles outside blocks become plain paragraphs
    Array.from(element.querySelectorAll('div.title'))
      .filter((el) => !el.closest('table'))
      .forEach((el) => {
        const p = textParagraph(document, el.textContent);
        if (p) el.replaceWith(p); else el.remove();
      });
  }
}
