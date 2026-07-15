---
id: laf-archive-root
type: entry
title: Archive Root, life.json, and README.md
date: 2026-07-12
kind: specification
tags:
  - laf
  - manifest
  - readme
collections:
  - life-archive-format
---

Every life archive begins with a root directory. The root holds the manifest, the archive introduction, and the standard content folders.

## life.json

`life.json` is the archive manifest and the only required top-level file. It identifies the format version and gives the archive a title.

```json
{
  "format": "life/0.1",
  "title": "The Bennett Family Archive",
  "owner": "Emily Bennett",
  "language": "en-US",
  "theme": "dusk",
  "website": "https://archive.example.com",
  "email": "archive@example.com"
}
```

### Required fields

- `format` is the format identifier and version. For this specification it is `life/0.1`.
- `title` is the human-readable archive title used in page titles, navigation, and metadata.

### Common optional fields

- `owner` identifies the person, family, or organization responsible for the archive.
- `language` is a language or locale code such as `en`, `en-US`, or `ta-IN`.
- `theme` selects the archive's initial visual theme. The reference app accepts `light`, `dusk`, `gallery`, or `dark`.
- `website` gives the archive's public website and acts as the reference app's fallback origin for canonical links, social-preview images, sitemap entries, and robots metadata.
- `email` supplies a public contact address when the archive owner wants one shown.
- Social fields such as `github`, `instagram`, `linkedin`, and `youtube` may be used by renderers to create footer links.

The manifest accepts additional JSON fields. This lets specialized tools preserve information such as license, creation date, source system, or custom publishing settings. Field names should be descriptive, and tools should preserve unknown fields when rewriting the manifest.

`theme` is an archive default rather than a locked appearance. A renderer may allow visitors to choose another theme and remember that preference. When `theme` is omitted, the renderer chooses its configured fallback.

The archive `website` value travels with the archive, while deployment configuration belongs to the renderer. In a single-site Life Archive App deployment, `LAF_SITE_URL` can explicitly set the canonical public origin and takes precedence over `website`. In multi-host mode, the request's `X-Forwarded-Host` or `Host` determines the origin for each archive, and `website` remains a fallback if no usable host is available.

`life.json` must contain valid JSON: property names and string values use double quotes, trailing commas are not allowed, and comments are not supported.

## README.md

`README.md` is the optional human-readable introduction to the archive. It is ordinary Markdown and is a good place to explain the archive's purpose, scope, owner, editorial policy, or history.

```md
# The Bennett Family Archive

This archive preserves family stories, photographs, recipes, and letters.

## About this archive

The material was collected by three generations of the Bennett family.
```

The reference app uses `README.md` on the home and About surfaces. Relative links and images follow the same archive-aware rules as entry bodies.

## Standard root folders

```text
entries/      Markdown stories, notes, articles, and records
collections/  Curated groups of related archive entities
people/       Markdown records describing people
places/       Markdown records describing places
albums/       Folder-based photo albums
files/        General media, documents, and presentation assets
```

Folder names are lowercase and plural by convention. Tools should not place generated caches inside these folders. The reference app writes generated album thumbnails to its own system cache outside the `.life` archive so the archive remains clean and portable.

## Portability recommendations

- Use UTF-8 for JSON and Markdown files.
- Prefer forward slashes in stored relative paths, even when editing on Windows.
- Use relative archive links instead of machine-specific absolute paths.
- Avoid names that differ only by letter case; not every filesystem is case-sensitive.
- Back up the entire `.life` directory so metadata and media remain together.
