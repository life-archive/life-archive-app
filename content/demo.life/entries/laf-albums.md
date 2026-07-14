---
id: laf-albums
type: entry
title: Albums in Life Archive Format
date: 2026-07-08
kind: specification
tags:
  - laf
  - albums
  - photos
collections:
  - life-archive-format
---

Albums preserve groups of photographs with as little metadata overhead as possible. In `life/0.1`, an album is a directory under `albums/`; it does not require a Markdown file or manifest.

## Folder example

```text
albums/
  summer-in-iceland/
    01-waterfall.jpg
    02-geysir.jpg
    ruins/
      03-stone-house.jpg
```

The top-level directory becomes the album. The reference app derives:

- id: `summer-in-iceland`
- title: `Summer In Iceland`
- cover: the first indexed image
- files: all supported images found recursively inside the album directory

Album folder names may contain spaces, but lowercase names with hyphens are recommended for portable paths and stable URLs.

## Supported image files

The reference app currently indexes these extensions:

- `.jpg` and `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.svg`

Extension matching is case-insensitive. Non-image files and common operating-system artifacts such as `.DS_Store` and `Thumbs.db` are ignored.

Image width and height are read when possible. Renderers can use those dimensions for masonry, grid, slideshow, or photo-book layouts while preserving the original image files.

## Ordering and cover selection

Files are sorted by relative path. Prefixing filenames with numbers is a simple portable way to control their order:

```text
01-arrival.jpg
02-market.jpg
03-family-dinner.jpg
```

The first supported image becomes the default cover in the current renderer. Authors who need more expressive album metadata should keep filenames stable; a future format version may define an optional album manifest without invalidating the folder-based model.

## Linking to albums

Markdown can link to an album page:

```md
[Open the Iceland album](albums/summer-in-iceland/)
```

It can also embed or link directly to an album image:

```md
![The waterfall](albums/summer-in-iceland/01-waterfall.jpg)
```

The reference renderer maps album pages and album assets to separate web routes and generates responsive JPEG thumbnails on demand. Generated thumbnails live in the application's cache, not in the archive, so they can always be deleted and rebuilt.

## Album portability

- Keep original photos inside the archive when the archive is meant to be self-contained.
- Preserve filenames and folder structure when moving an archive.
- Avoid duplicate or ambiguous names within the same album.
- Do not depend on generated thumbnails as archival originals.
- Store edits as new files when retaining the original photograph matters.
