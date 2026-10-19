# post-list

Custom **post-list** block. It lists blog posts from `/query-index.json`, grouped by year, and updates on its own when new posts are published.

## Authoring (Document Authoring)

Model: `standalone`

Archives (all posts), a block table with only the header:

| Post List |
| --- |

Tag page (posts tagged `Papa`), with one optional key/value row:

| Post List | |
| --- | --- |
| Tag | Papa |

- Tag matching ignores case and accents (`Devoxx` = `devoxx`, `Sécurité` = `securite`).
- Posts are index rows with `template` = `blog-post`. If a row has no template, it counts as a post when its path starts with `/content/` and it has a valid date.
- Sorted by date, newest first. Each year gets an `h4`, followed by a list of `DD Mon - Title` links.
- If no post matches, the block renders nothing.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
