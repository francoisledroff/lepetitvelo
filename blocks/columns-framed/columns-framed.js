/**
 * Columns Framed: single-row layout table (e.g. cover image + link beside a tracklist).
 * Authors may omit or add cells, so every row is handled independently.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  let maxCols = 0;
  rows.forEach((row) => {
    // drop cells that carry no text and no media (stray empty authored cells)
    [...row.children].forEach((cell) => {
      const hasMedia = cell.querySelector('picture, img, video, iframe');
      if (!hasMedia && !cell.textContent.trim()) cell.remove();
    });

    const cells = [...row.children];
    if (!cells.length) {
      row.remove();
      return;
    }
    maxCols = Math.max(maxCols, cells.length);
    row.classList.add('columns-framed-row');

    cells.forEach((cell) => {
      cell.classList.add('columns-framed-col');
      const pic = cell.querySelector('picture');
      if (!pic) return;
      cell.classList.add('columns-framed-media-col');
      if (cell.children.length === 1 && pic.parentElement === cell) {
        // picture is the only content in the cell
        cell.classList.add('columns-framed-img-col');
      }
    });
  });

  if (maxCols) block.classList.add(`columns-framed-${maxCols}-cols`);
}
