---
id: laf-format-overview
type: entry
title: Life Archive Format Overview
date: 2026-07-13
kind: specification
tags:
  - laf
  - specification
  - overview
collections:
  - life-archive-format
---

The **Life Archive Format (LAF)** is an open, portable, file-based format for personal archives. A life archive is an ordinary folder containing JSON, Markdown, and media files. It can be copied, backed up, placed under version control, opened with common tools, or rendered by different applications without converting the source into a proprietary database.

This documentation describes **`life/0.1`**, the version currently supported by the reference Life Archive app.

## Design principles

LAF is built around a few simple ideas:

- **The archive is the source of truth.** Applications read the archive; they do not own it.
- **Content should remain understandable without the app.** Metadata uses JSON or YAML frontmatter, writing uses Markdown, and media remains in its original file format.
- **Relationships use stable ids.** Entries, collections, people, and places can refer to one another without depending on a database.
- **The format and renderer are separate.** A renderer may add presentation, search, thumbnails, and navigation while leaving the archive untouched.
- **Unknown metadata can be preserved.** Tools may add fields for their own workflows as long as required LAF fields remain valid.

## Archive structure

A complete archive commonly looks like this:

```text
MyArchive.life/
  life.json
  README.md

  entries/
    first-memory.md
  collections/
    family-stories.md
  people/
    margaret-bennett.md
  places/
    brighton.md

  albums/
    summer-2025/
      beach.jpg
      picnic.jpg
  files/
    hero.png
    profile.png
    documents/
      letter.pdf
```

Only `life.json` is required to identify and describe the archive. `README.md` and the content folders are optional, although most useful archives will include at least `entries/` or `albums/`. Missing or empty content folders are treated as empty by the reference app.

The `.life` suffix is a naming convention for the archive directory. The archive remains a normal folder and does not need to be packaged into a single binary file.

Archive presentation can be customized without changing the underlying format. For example, `life.json` can rename Collection and Collections for a particular archive, timeline collections can present dated entries as résumé-style sections, and `files/profile.png` can provide a portrait beside the archive name in the reference app's home-page hero.

## Two content models

LAF uses two complementary models:

1. **Markdown entities** live in `entries/`, `collections/`, `people/`, and `places/`. Their YAML frontmatter contains structured metadata and their Markdown body contains human-readable content.
2. **Filesystem media** lives in `albums/` and `files/`. Folder names and paths provide organization while the original files remain directly accessible.

Entity ids should be unique across entries, collections, people, and places. Short lowercase ids with hyphens are recommended because they produce stable, readable URLs.

## Read order

- [Archive root, life.json, and README.md](entries/laf-archive-root.md)
- [Entries](entries/laf-entries.md)
- [Collections](entries/laf-collections.md)
- [People and places](entries/laf-people-and-places.md)
- [Albums](entries/laf-albums.md)
- [Files, media, and Markdown links](entries/laf-files-and-links.md)

> **Implementation note:** Life Archive Format is under active development. A tool should check the `format` value before reading an archive and should avoid discarding metadata it does not understand.
