/* eslint-disable */
/*
 * Shared URL mapping for the droff.com -> EDS migration.
 *
 * Plain ESM, no globals: imported by the import bundle (droff-links.js) and
 * reusable from Node (e.g. redirects sheet generation):
 *   import { toEdsPath } from './tools/importer/transformers/droff-url.js';
 *
 * Segment normalization mirrors @adobe/helix-importer FileUtils.sanitizeFilename.
 *
 * NOTE: this is a helper module, not a transformer (no default export). Do not register
 * it in the import script's transformer list.
 */

export const SOURCE_ORIGIN = 'https://droff.com';
export const INTERNAL_HOSTS = ['droff.com', 'www.droff.com'];

// Directories whose content is binary/static and must be downloaded, not rewritten.
const ASSET_DIRS = ['/img/', '/pdf/', '/images/'];

// Non-HTML extensions treated as downloadable assets wherever they live.
const ASSET_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'bmp', 'ico', 'tif', 'tiff',
  'pdf', 'zip', 'gz', 'tgz', 'jar', 'war',
  'mp3', 'mp4', 'm4a', 'ogg', 'wav', 'webm', 'mov', 'avi', 'swf', 'flv',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'odp', 'ods', 'key',
];

const UNTOUCHED_SCHEMES = /^(mailto|javascript|ftp|tel|data|sms|file):/i;

/** Exact copy of helix-importer FileUtils.sanitizeFilename (decode errors tolerated). */
export function sanitizeSegment(name) {
  if (!name) return '';
  let decoded = name;
  try {
    decoded = decodeURIComponent(name);
  } catch (e) {
    // malformed escape sequence: keep the raw segment
  }
  return decoded.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isInternalHost(hostname) {
  return INTERNAL_HOSTS.includes(String(hostname || '').toLowerCase());
}

function getExtension(pathname) {
  const last = pathname.split('/').pop() || '';
  const dot = last.lastIndexOf('.');
  return dot > 0 ? last.substring(dot + 1).toLowerCase() : '';
}

export function isAssetPath(pathname) {
  const lower = String(pathname || '').toLowerCase();
  if (ASSET_DIRS.some((dir) => lower.startsWith(dir))) return true;
  return ASSET_EXTENSIONS.includes(getExtension(lower));
}

// Asset folders that are migrated (uploaded to DA at their normalized path).
// Anything else (e.g. /images/icons/*, already 404 on droff.com) is left pointing at droff.com.
const MIGRATED_ASSET_DIRS = ['/img/', '/pdf/'];
export const DA_CONTENT_ORIGIN = 'https://content.da.live/francoisledroff/lepetitvelo';

export function isMigratedAsset(pathname) {
  const lower = String(pathname || '').toLowerCase();
  return MIGRATED_ASSET_DIRS.some((dir) => lower.startsWith(dir));
}

/**
 * Map a migrated asset pathname to its EDS/DA path: segments sanitized like pages,
 * extension kept but lowercased. /img/couv-Hammered%20Hamster.jpg -> /img/couv-hammered-hamster.jpg
 */
export function assetPathToEds(pathname) {
  const ext = getExtension(pathname);
  const base = ext ? pathname.substring(0, pathname.length - ext.length - 1) : pathname;
  const segments = base.split('/').filter((s) => s !== '').map(sanitizeSegment).filter((s) => s !== '');
  return `/${segments.join('/')}${ext ? `.${ext}` : ''}`;
}

/** img[src] target: migrated images are referenced from DA content, others absolutized. */
export function toImageSrc(urlOrPath, baseUrl = `${SOURCE_ORIGIN}/`) {
  const abs = toSourceAbsolute(urlOrPath, baseUrl);
  if (!abs) return null;
  const { pathname } = new URL(abs);
  return isMigratedAsset(pathname) ? `${DA_CONTENT_ORIGIN}${assetPathToEds(pathname)}` : abs;
}

/** Map an internal page pathname to its EDS document path. */
export function pagePathToEds(pathname) {
  let p = pathname || '/';
  if (/(^|\/)index\.html?$/i.test(p)) p = p.replace(/index\.html?$/i, '');
  const trailingSlash = p.endsWith('/');
  p = p.replace(/\.html?$/i, '');
  const segments = p.split('/').filter((s) => s !== '').map(sanitizeSegment).filter((s) => s !== '');
  if (segments.length === 0) return '/';
  return `/${segments.join('/')}${trailingSlash ? '/' : ''}`;
}

/**
 * Resolve a link found on a droff.com page to its post-migration target.
 *
 * Returns:
 *  - null for external links, unsupported schemes (mailto:, javascript:, ftp:, ...),
 *    pure fragments ("#x") and unparsable values (caller leaves them untouched);
 *  - an absolute "https://droff.com/..." URL (original path, not rewritten) for assets
 *    (/img/, /pdf/, /images/, binary extensions) so the importer downloads them;
 *  - an EDS path for internal pages ("/content/2018/06/21/cheeky-and-cheesy"), keeping
 *    ?query and #fragment. Other non-HTML files (e.g. /feed.xml) keep their pathname.
 */
export function toEdsPath(urlOrPath, baseUrl = `${SOURCE_ORIGIN}/`) {
  if (urlOrPath === undefined || urlOrPath === null) return null;
  const raw = String(urlOrPath).trim();
  if (!raw || raw.startsWith('#') || UNTOUCHED_SCHEMES.test(raw)) return null;

  let url;
  try {
    url = new URL(raw, baseUrl || `${SOURCE_ORIGIN}/`);
  } catch (e) {
    return null;
  }
  if (!/^https?:$/.test(url.protocol) || !isInternalHost(url.hostname)) return null;

  const { pathname, search, hash } = url;
  if (isMigratedAsset(pathname)) {
    return `${assetPathToEds(pathname)}${search}${hash}`;
  }
  if (isAssetPath(pathname)) {
    return `${SOURCE_ORIGIN}${pathname}${search}${hash}`;
  }
  const ext = getExtension(pathname);
  if (ext && ext !== 'html' && ext !== 'htm') {
    return `${pathname}${search}${hash}`;
  }
  return `${pagePathToEds(pathname)}${search}${hash}`;
}

/** Absolutize a (possibly relative) droff.com URL without rewriting its path. */
export function toSourceAbsolute(urlOrPath, baseUrl = `${SOURCE_ORIGIN}/`) {
  if (!urlOrPath) return null;
  const raw = String(urlOrPath).trim();
  if (UNTOUCHED_SCHEMES.test(raw)) return null;
  try {
    const url = new URL(raw, baseUrl || `${SOURCE_ORIGIN}/`);
    if (!/^https?:$/.test(url.protocol) || !isInternalHost(url.hostname)) return null;
    return `${SOURCE_ORIGIN}${url.pathname}${url.search}${url.hash}`;
  } catch (e) {
    return null;
  }
}

/** Pick a droff.com base URL from an importer payload (proxy URLs are mapped back to droff.com). */
export function getBaseUrl(payload = {}) {
  const candidates = [
    payload.params && payload.params.originalURL,
    payload.url,
    payload.document && payload.document.URL,
  ];
  for (const c of candidates) {
    if (!c) continue;
    try {
      const u = new URL(c);
      if (!/^https?:$/.test(u.protocol)) continue;
      if (isInternalHost(u.hostname)) return u.href;
      // importer proxy (e.g. http://localhost:3001/content/...): keep path, swap origin
      if (/^(localhost|127\.0\.0\.1)$/.test(u.hostname)) return `${SOURCE_ORIGIN}${u.pathname}`;
    } catch (e) {
      // try next candidate
    }
  }
  return `${SOURCE_ORIGIN}/`;
}
