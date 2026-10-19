import { getPosts, tagSlug } from '../../scripts/post-index.js';

/**
 * Collects tags across posts, deduped by slug, using the most frequent casing.
 * @param {Array<{tags: string[]}>} posts posts
 * @returns {Array<{slug: string, name: string}>} sorted tags
 */
function collectTags(posts) {
  const bySlug = new Map();
  posts.forEach((post) => {
    post.tags.forEach((name) => {
      const slug = tagSlug(name);
      if (!slug) return;
      if (!bySlug.has(slug)) bySlug.set(slug, new Map());
      const names = bySlug.get(slug);
      names.set(name, (names.get(name) || 0) + 1);
    });
  });
  const collator = new Intl.Collator('fr', { sensitivity: 'base' });
  return [...bySlug.entries()]
    .map(([slug, names]) => {
      // Map keeps insertion order, so ties resolve to the first-seen casing
      let best = '';
      let bestCount = 0;
      names.forEach((count, name) => {
        if (count > bestCount) {
          best = name;
          bestCount = count;
        }
      });
      return { slug, name: best };
    })
    .sort((a, b) => collator.compare(a.name, b.name) || a.slug.localeCompare(b.slug));
}

export default async function decorate(block) {
  block.textContent = '';
  const tags = collectTags(await getPosts());
  if (!tags.length) return;

  const p = document.createElement('p');
  tags.forEach(({ slug, name }, i) => {
    if (i) p.append('\n');
    const a = document.createElement('a');
    a.href = `/tags/${slug}`;
    a.textContent = `${name} . `;
    p.append(a);
  });
  block.append(p);
}
