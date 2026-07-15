---
id: laf-files-and-links
type: entry
title: Files, Media, and Archive Links
date: 2026-07-07
kind: specification
tags:
  - laf
  - files
  - media
  - links
collections:
  - life-archive-format
---

The `files/` directory stores assets that are not organized as photo albums. It can contain images, audio, video, PDFs, scans, text documents, and other files that belong with the archive.

## Folder example

```text
files/
  hero.png
  profile.png
  favicon.ico
  covers/
    family-recipes.jpg
  documents/
    recipe-card.jpg
    immigration-letter.pdf
  audio/
    oral-history.mp3
```

Subdirectories are allowed and are the best way to organize a growing archive.

## Special presentation files

The reference app recognizes several filename conventions:

- `hero.jpg`, `hero.jpeg`, `hero.png`, or `hero.webp` can become the home-page hero image.
- `profile.png` can appear as the archive profile image.
- `favicon.ico` can become the website icon.
- A collection's `cover` field can point to an image such as `covers/family-recipes.jpg`.

These names affect presentation in the reference app; the files remain ordinary archive assets and other renderers may present them differently.

## Frontmatter file references

Entries and collections can associate files through frontmatter:

```yaml
files:
  - recipe-card.jpg
  - immigration-letter.pdf
```

The current reference reader resolves these associations by filename. Filenames should therefore be unique across `files/`, even when assets are stored in different subdirectories. Duplicate basenames produce a validation warning because a reference such as `portrait.jpg` would be ambiguous.

Collection covers are path-aware and may include a subdirectory:

```yaml
cover: covers/family-recipes.jpg
```

## Markdown links and images

Archive-relative Markdown URLs start at a recognized archive root:

```md
[Read the related entry](entries/grandmothers-apple-pie-recipe.md)

[Open the collection](collections/family-recipes.md)

![Recipe card](files/documents/recipe-card.jpg)

[Download the original letter](files/documents/immigration-letter.pdf)

[Open a photo album](albums/summer-in-iceland/)
```

The reference app rewrites these source paths into website routes. The Markdown remains portable and understandable outside the app.

The reference app also supports generated album thumbnails in Markdown. Put the desired pixel width after `album-thumbs/`, followed by the image path relative to `albums/`:

```md
[![A smaller preview](album-thumbs/640/summer-in-iceland/01-waterfall.jpg)](albums/summer-in-iceland/01-waterfall.jpg)
```

In this example, the page displays a cached 640-pixel-wide preview while the link opens the original album image. Generated thumbnails are stored in the renderer's disposable system cache and do not modify the archive.

External links are allowed for `http`, `https`, `mailto`, and `tel` URLs:

```md
[Project website](https://example.com)
[Email the archivist](mailto:archive@example.com)
```

Root-relative paths, filesystem traversal such as `../`, unsafe protocols, and malformed archive links are rejected or rewritten to a safe placeholder by the reference renderer.

## Path recommendations

- Use relative paths rooted at `files/` or `albums/` in Markdown.
- Use forward slashes in stored paths.
- URL encoding is handled by the renderer; source filenames can contain spaces, though simple names are more portable.
- Avoid renaming referenced files without updating Markdown and frontmatter.
- Keep irreplaceable originals in the archive and treat generated previews as disposable cache data.

## Archive size

File size is not prescribed by the format. Practical limits depend on storage, backup strategy, network delivery, and renderer implementation. For large media archives, preserve originals in LAF while allowing renderers to generate thumbnails, stream files, or use deployment-specific delivery layers without changing the archive's logical structure.
