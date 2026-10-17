# tag-list

Custom **tag-list** block. It lists every tag used by blog posts in `/query-index.json` and updates on its own when new posts are published.

## Authoring (Document Authoring)

Model: `standalone`

A block table with only the header and no rows:

| Tag List |
| --- |

- Tags are deduped by slug (case and accents ignored). The display name is the casing used most often.
- Sorted alphabetically using French collation, ignoring case and accents.
- Each tag renders as `Name . ` and links to `/tags/<slug>` (for example `Spring Security` links to `/tags/spring-security`).

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
