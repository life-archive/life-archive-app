---
id: laf-collections
type: entry
title: Collections in Life Archive Format
date: 2026-07-10
kind: specification
tags:
  - laf
  - collections
  - curation
collections:
  - life-archive-format
---

Collections create curated groups inside an archive. They are useful for topics, projects, family branches, recipe categories, travel journals, exhibitions, reading paths, and any other grouping whose order and presentation matter.

Each collection is a Markdown file under `collections/`.

## Naming collections in the interface

An archive can customize the singular and plural collection names in `life.json`:

```json
{
  "labels": {
    "collection": "Project",
    "collections": "Projects"
  }
}
```

The reference app uses these names in navigation, headings, metadata, counts, search guidance, and normal collection detail pages. This is a presentation label only: the folder remains `collections/`, entity frontmatter still uses `type: collection`, and other tools can continue to recognize the standard format. Timeline collections retain the distinct label **Timeline**.

## Board collection example

```md
---
id: family-recipes
type: collection
kind: board
title: Family Recipes
description: Recipes preserved and shared across generations.
featured: true
pos: 1
cover: covers/family-recipes.jpg
items:
  - entry:grandmothers-apple-pie-recipe
  - entry:festival-sweets
  - person:margaret-bennett
  - place:brighton
  - file:recipe-card.jpg
tags:
  - food
  - family
---

This collection brings together recipes, people, places, and original documents.
```

## Core fields

- `type` must be `collection`.
- `id` is the stable collection identity. If omitted, it is derived from the Markdown path.
- `kind` selects the collection behavior. The reference app supports `board` for a normal collection detail page, `timeline` for a dated sequence of entries, and `link` for an internal or external navigation card.
- `title` and `description` provide the collection's display name and summary.
- `featured: true` makes the collection eligible for prominent home-page placement. If an archive has featured collections, the home page prioritizes that featured set.
- `pos` is an optional numeric sort position. Collections with lower positions sort first; collections without a position sort after positioned collections by title.
- `cover` points to an asset under `files/`. Both `covers/example.jpg` and `file:covers/example.jpg` are accepted by the current renderer.
- `tags` provides free-form classification.
- The Markdown body provides a longer introduction for the collection page.

## Typed items

The `items` list is ordered and uses a type prefix:

```yaml
items:
  - entry:a-family-story
  - person:margaret-bennett
  - place:brighton
  - file:portrait.jpg
```

Supported prefixes are `entry:`, `person:`, `place:`, and `file:`. The reference reader also accepts dedicated arrays:

```yaml
entries:
  - a-family-story
people:
  - margaret-bennett
places:
  - brighton
files:
  - portrait.jpg
```

Typed `items` are best when one curated sequence should contain different entity types. Dedicated arrays are useful for generated archives or tools that manage each relationship separately. When both forms are supplied, the reader combines them; avoid repeating the same reference in both.

## Ordering and inverse references

The order of `items` is meaningful and should be preserved by tools. An entry may also name this collection in its own `collections` list, but that inverse reference does not add or reorder the collection's items. For predictable rendering, maintain both references when both navigation directions matter.

## Timeline collections

A timeline collection presents its entries as a dated sequence:

```md
---
id: experience
type: collection
kind: timeline
title: Experience
description: Selected roles and projects.
items:
  - entry:principal-designer
  - entry:product-design-lead
  - entry:senior-designer
---
```

Each referenced entry supplies the timeline date, title, and supporting line:

```md
---
id: principal-designer
type: entry
title: Principal Designer
date: 2024-01
---

Leading product strategy and design across the organization.
```

The reference app renders every timeline collection after the normal collection cards on the home page. Each item shows its date, title, and a short line extracted from the entry body. Entries are sorted newest first by date, the home page shows a limited preview, and **View all** links to the collection page where the complete timeline is displayed. Entries without a date appear after dated entries as ongoing items. Multiple timeline collections can represent sections such as Experience, Education, and Awards.

## Link collections

The reference app also supports lightweight external or internal link cards:

```md
---
id: project-source
type: collection
kind: link
title: Project Source Code
description: Visit the source repository.
href: https://github.com/example/archive
featured: true
---
```

For `kind: link`, the destination may be stored in `href`, `link`, or `url`. This is a renderer extension for navigation cards; portable tools that do not understand it can still preserve and display the collection metadata.

The optional `layout` field is indexed for future or renderer-specific presentation choices. The current reference app does not use it to change the board layout.
