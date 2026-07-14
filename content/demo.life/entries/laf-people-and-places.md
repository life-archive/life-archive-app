---
id: laf-people-and-places
type: entry
title: People and Places in Life Archive Format
date: 2026-07-09
kind: specification
tags:
  - laf
  - people
  - places
  - relationships
collections:
  - life-archive-format
---

People and places give stories a stable context. Instead of repeating a person's biography or a place description in every entry, an archive can create one entity and refer to its id wherever it is relevant.

## Person example

Create `people/margaret-bennett.md`:

```md
---
id: margaret-bennett
type: person
name: Margaret Bennett
---

Margaret was a teacher, gardener, and keeper of the family's handwritten recipes.
```

The required type is `person`. `id` is recommended and `name` is the display name. If either `id` or `name` is omitted, the reference reader can derive a fallback from the file path, but explicit values make relationships clearer and more portable.

## Place example

Create `places/brighton.md`:

```md
---
id: brighton
type: place
name: Brighton
---

A coastal city in southern England and an important setting in this archive.
```

The required type is `place`. The same identity recommendations used for people apply to places.

## Referencing people and places

Entries reference entity ids in frontmatter:

```yaml
people:
  - margaret-bennett
places:
  - brighton
```

Collections may use dedicated lists or typed items:

```yaml
items:
  - person:margaret-bennett
  - place:brighton
```

References must match ids exactly. A validator should warn about a missing id while still preserving the original Markdown so the archive can be repaired.

## Extending entity metadata

The v0.1 reader preserves additional frontmatter fields. An archive may therefore add information such as alternate names, coordinates, dates, roles, or external identifiers:

```yaml
---
id: brighton
type: place
name: Brighton
country: United Kingdom
latitude: 50.8225
longitude: -0.1372
---
```

These fields are not yet standardized in `life/0.1`. Tools should preserve them, and authors should use clear names and ordinary JSON-compatible YAML values.

> **Reference app status:** People and places are indexed and validated today, and entries and collections can refer to them. Dedicated person and place pages are not yet implemented, so applications may present these relationships differently.
