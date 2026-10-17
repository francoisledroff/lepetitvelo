/**
 * Shared access to blog posts listed in the site query index.
 * Used by the post-list and tag-list blocks.
 */

const INDEX_URL = '/query-index.json';
const PAGE_SIZE = 500;
const MAX_PAGES = 200; // safety stop against a misbehaving index

const DAY_MS = 86400000;
// Excel serial day 25569 is 1970-01-01
const EXCEL_EPOCH_OFFSET = 25569;

/**
 * Slugifies a tag name the same way the importer names tag pages.
 * @param {string} name tag name
 * @returns {string} slug, e.g. 'Sécurité' -> 'securite'
 */
export function tagSlug(name) {
  return String(name ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parses an index tags value: comma-separated string, JSON array string or array.
 * @param {string|string[]} value raw value
 * @returns {string[]} trimmed, non-empty tag names
 */
export function parseTags(value) {
  if (value === undefined || value === null) return [];
  let list = value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    list = null;
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {
        // not valid JSON: fall back to comma splitting
      }
    }
    if (!list) list = trimmed.replace(/^\[|\]$/g, '').split(',');
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((t) => String(t ?? '').trim().replace(/^["']|["']$/g, '').trim())
    .filter(Boolean);
}

/**
 * Parses an index date: ISO 'YYYY-MM-DD' string, Excel serial or unix seconds/ms.
 * @param {string|number} value raw value
 * @returns {Date|null} date (UTC midnight for day-precision values) or null
 */
export function parseDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const str = String(value).trim();
  if (!str) return null;
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    const num = Number(str);
    if (!Number.isFinite(num) || num <= 0) return null;
    let ms;
    if (num < 100000) ms = Math.round((num - EXCEL_EPOCH_OFFSET) * DAY_MS); // Excel serial
    else if (num < 1e11) ms = num * 1000; // unix seconds
    else ms = num; // unix milliseconds
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso.map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function fetchAllRows() {
  const rows = [];
  let offset = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetch(`${INDEX_URL}?offset=${offset}&limit=${PAGE_SIZE}`);
    if (!resp.ok) break;
    // eslint-disable-next-line no-await-in-loop
    const json = await resp.json();
    const data = Array.isArray(json?.data) ? json.data : [];
    rows.push(...data);
    const total = Number(json?.total) || 0;
    const limit = Number(json?.limit) || data.length;
    const start = Number(json?.offset) || offset;
    if (!data.length || !limit || start + limit >= total) break;
    offset = start + limit;
  }
  return rows;
}

function toPost(row) {
  if (!row || typeof row.path !== 'string' || !row.path) return null;
  const date = parseDate(row.date);
  const template = String(row.template ?? '').trim().toLowerCase();
  const isPost = template
    ? template === 'blog-post'
    : row.path.startsWith('/content/') && !!date;
  if (!isPost || !date) return null;
  return {
    path: row.path,
    title: String(row.title ?? '').trim() || row.path,
    date,
    tags: parseTags(row.tags),
  };
}

let postsPromise;

/**
 * Returns all blog posts from the query index, in index order (memoized).
 * @returns {Promise<Array<{path: string, title: string, date: Date, tags: string[]}>>}
 */
export function getPosts() {
  if (!postsPromise) {
    postsPromise = fetchAllRows()
      .then((rows) => rows.map(toPost).filter(Boolean))
      .catch(() => {
        postsPromise = undefined;
        return [];
      });
  }
  return postsPromise;
}
