---
id: laf-entries
type: entry
title: Entries in Life Archive Format
date: 2026-07-11
kind: specification
tags:
  - laf
  - entries
  - markdown
collections:
  - life-archive-format
---

Entries are the primary written records in a life archive. An entry can represent a story, journal note, recipe, essay, document description, event, article, or any other item whose main content is text.

Each entry is a Markdown file under `entries/`.

```text
entries/
  grandmothers-apple-pie-recipe.md
  first-day-in-brighton.md
```

## Complete example

```md
---
id: grandmothers-apple-pie-recipe
type: entry
title: Grandmother's Apple Pie Recipe
date: 2025-08-14
kind: recipe
tags:
  - family-cooking
  - family-recipe
collections:
  - family-recipes
people:
  - margaret-bennett
places:
  - brighton
files:
  - recipe-card.jpg
---

This recipe was written down after an afternoon cooking with Grandmother.

## Ingredients

- Apples
- Flour
- Cinnamon

![Original recipe card](files/documents/recipe-card.jpg)
```

## Frontmatter fields

- `type` must be `entry`.
- `id` is the stable identity used by references and URLs. If omitted, the reference app derives it from the Markdown path without `.md`; an explicit id is recommended for long-lived archives.
- `title` is the display title. The reference app falls back to the id when it is absent, but portable archives should provide a title.
- `date` is normally an ISO calendar date in `YYYY-MM-DD` form. A predictable date format makes sorting and timeline rendering reliable.
- `kind` is an open classification such as `story`, `journal`, `recipe`, `essay`, `note`, or `document`. Renderers may use it for labels or filters.
- `tags` is a list of free-form descriptive strings.
- `collections`, `people`, and `places` contain ids of related entities.
- `files` contains filenames of related assets from `files/`. The current reference app resolves these references by filename, so filenames should be unique.

All list values should be YAML arrays, even when there is only one item.

## Markdown body

Everything after the closing `---` is the entry body. Standard Markdown headings, paragraphs, emphasis, lists, blockquotes, links, images, and fenced code blocks are supported.

```md
## A section heading

Normal paragraph text with **strong emphasis** and a [related entry](entries/another-entry.md).

> A remembered quotation or important note.
```

Archive-relative links begin with a standard root name such as `entries/`, `collections/`, `files/`, or `albums/`. The renderer rewrites them to website routes without changing the source Markdown.

## Relationship direction

References are explicit. Adding `collections: [family-recipes]` to an entry records the entry-to-collection relationship, but it does not automatically insert the entry into that collection's ordered item list. To make the entry appear on the collection page, also add `entry:grandmothers-apple-pie-recipe` to the collection's `items` field.

Keeping both sides explicit lets a collection control its membership and ordering without rewriting entries automatically.

## Identity guidelines

- Keep ids stable after publication, even if a title changes.
- Prefer lowercase ASCII ids separated with hyphens.
- Do not reuse the same id for another entry, collection, person, or place.
- Treat filenames as organization and ids as identity; they may match, but they serve different purposes.
