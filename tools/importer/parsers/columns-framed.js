/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-framed (AsciiDoc table.tableblock with >= 2 cells).
 * Output: header "Columns Framed", one content row per source <tr>, one cell per <td>/<th>.
 * Cell content keeps images, paragraphs, links, lists, headings (and code/quotes);
 * AsciiDoc wrapper divs (.content, .imageblock, .paragraph, .ulist, ...) are unwrapped,
 * colgroup and width/style attributes are dropped.
 */

const STRIP_ATTRS = ['width', 'height', 'style', 'class', 'align', 'valign'];

function getRows(table) {
  return [...table.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr, :scope > tr')];
}

function getCells(tr) {
  return [...tr.children].filter((c) => c.tagName === 'TD' || c.tagName === 'TH');
}

/** Replace every <div> (and <span> without attributes needed) in root with its children. */
function unwrapDivs(root) {
  let div = root.querySelector('div');
  while (div) {
    div.replaceWith(...div.childNodes);
    div = root.querySelector('div');
  }
}

function cleanAttributes(root) {
  root.querySelectorAll('*').forEach((el) => {
    STRIP_ATTRS.forEach((a) => {
      // keep img dimensions out, but never touch src/alt/href
      if (el.hasAttribute(a)) el.removeAttribute(a);
    });
  });
}

function buildCellContent(td, document) {
  const clone = td.cloneNode(true);
  clone.querySelectorAll('colgroup, col, script, style').forEach((el) => el.remove());
  unwrapDivs(clone);
  cleanAttributes(clone);

  const content = [];
  [...clone.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      const text = node.textContent.trim();
      if (text) {
        const p = document.createElement('p');
        p.textContent = text;
        content.push(p);
      }
      return;
    }
    if (node.nodeType !== 1) return;
    // drop empty paragraphs/spacers that hold neither text nor media
    if (!node.textContent.trim() && !node.querySelector?.('img, picture, video, iframe')
      && !['IMG', 'PICTURE', 'HR', 'BR'].includes(node.tagName)) {
      return;
    }
    if (node.tagName === 'BR') return;
    content.push(node);
  });
  return content;
}

export default function parse(element, { document }) {
  if (!element || element.tagName !== 'TABLE') return;
  // nested tables inside another block table: leave untouched (blocks cannot nest)
  if (element.parentElement && element.parentElement.closest('table.tableblock')) return;

  const rows = getRows(element);
  const allCells = rows.flatMap(getCells);
  // defensive: 1-cell tables are unwrapped by droff-cleanup; never make a block of them
  if (allCells.length < 2) return;

  const colCount = Math.max(...rows.map((tr) => getCells(tr).length));

  const cells = [];
  rows.forEach((tr) => {
    const rowCells = getCells(tr).map((td) => buildCellContent(td, document));
    if (!rowCells.length) return;
    while (rowCells.length < colCount) rowCells.push('');
    cells.push(rowCells);
  });

  if (!cells.length) return;

  const caption = element.querySelector(':scope > caption');
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-framed', cells });

  if (caption && caption.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = caption.textContent.trim();
    element.before(p);
  }
  element.replaceWith(block);
}
