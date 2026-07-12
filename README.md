# Life Archive App

Life Archive App is a self-hostable web app for publishing and browsing Life Archive Format (LAF) folders.

LAF is an open, portable, file-based format for preserving personal stories, photographs, places, people, files, collections, and memories.

This repository contains the reference app for LAF archives. It reads a `.life` archive from the local filesystem and renders it as a public, search-indexable Next.js website.

The core idea is simple:

> Your life belongs to you.

A LAF archive is not a database and is not tied to a cloud service. It is a folder of Markdown files, media files, and metadata that can be copied, backed up, versioned, rendered, or edited by different tools.

## What This App Does

The app turns a LAF archive into a website with:

- Home page
- Entry listing and entry detail pages
- Album listing and album detail pages
- Collection listing and collection detail pages
- About page from archive `README.md`
- Runtime file and album asset routes
- Generated album thumbnails
- Markdown rendering with archive-aware links
- Theme support
- UI language selection
- Archive validation failure page
- Search-indexable server-rendered HTML

The app is read-only with respect to archive content. Generated runtime files such as thumbnail cache entries are written to the app system path, not into the archive.

## Current Archive Structure

The default archive path is configured in `src/defaults.ts`:

```ts
archivePath: "content/demo.life"
```

The current implementation expects this shape:

```txt
content/demo.life/
  life.json
  README.md

  entries/
  collections/
  people/
  places/

  albums/
  files/
```

`life.json` is the archive manifest. It currently requires:

```json
{
  "format": "laf",
  "title": "Archive Title"
}
```

Optional manifest fields used by the renderer include:

- `language`
- `owner`
- `email`
- `website`
- social links such as `github`, `linkedin`, `instagram`, `youtube`, and others

## Content Model

### Entries

Entries are Markdown files under `entries/`.

Each entry uses frontmatter with:

```yaml
---
type: entry
title: Welcome to the Demo Archive
date: 2024-03-12
kind: note
tags:
  - demo
  - archive
collections:
  - demo-highlights
---
```

The body is Markdown and is rendered on the entry page.

### Collections

Collections are Markdown files under `collections/`.

Collections can reference entries, people, places, files, tags, and explicit item references. In this renderer, collection detail pages are generated for collections with:

```yaml
kind: board
```

Supported collection fields include:

- `title`
- `description`
- `kind`
- `featured`
- `items`
- `entries`
- `people`
- `places`
- `files`
- `tags`
- `cover`

### People And Places

People and places are Markdown-backed entities under `people/` and `places/`.

They are indexed so entries and collections can reference them. Dedicated people/place pages are not implemented yet.

### Albums

Albums are folder-based.

Each directory under `albums/` becomes an album:

```txt
albums/
  namibia/
    photo-1.jpg
    photo-2.jpg
```

The album id and title are derived from the folder name. Album files are indexed recursively. Image dimensions are read with `sharp` when possible.

Album detail pages support:

- masonry view
- grid view
- full-screen photo book view
- slideshow/lightbox behavior
- generated thumbnails

### Files

Original media and document assets live under `files/`.

The renderer serves these through:

```txt
/life-files/...
```

Album files are served through:

```txt
/life-albums/...
/life-album-thumbs/...
```

## Markdown Links

Markdown links are rewritten into renderer routes.

Examples:

```md
[Welcome](entries/welcome-to-the-demo-archive.md)
[Demo Highlights](collections/demo-highlights.md)
![Hero](files/hero.png)
![Album Photo](albums/iceland/iceland-ruins.jpg)
```

These become links to entry, collection, file, and album asset routes.

External links are allowed for safe protocols:

- `http`
- `https`
- `mailto`
- `tel`

Unsafe or invalid archive-relative links are rewritten to `#`.

## Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Useful checks:

```bash
npm run lint
npm run build
```

## Production Runtime Test

Use the production server path locally:

```bash
npm run build
npm run start
```

To choose a port:

```bash
npm run start -- -p 4000
```

Open:

```txt
http://localhost:4000
```

Check representative routes:

```txt
/
/entries
/albums
/collections
/about
/albums/iceland
/collections/demo-highlights
```

Also verify asset routes:

```txt
/life-files/...
/life-albums/...
/life-album-thumbs/...
/icon
```

## Deployment

Deploy this as a Next.js server/runtime app, not as a static export.

The renderer has runtime route handlers for archive files, album files, generated thumbnails, and the icon route.

Deployment requirements:

- `content/demo.life` must exist on the deployed filesystem.
- The server process must be able to read archive files.
- The server process should be able to write thumbnail cache files under the configured app system path.
- `public/laf/*` fallback images/icons must be included.
- Run `npm run build` during deployment.
- Run the app with `npm run start` or the hosting provider's equivalent Next.js server command.

By default, runtime cache files are written under:

```txt
.laf-system/cache/...
```

If the deployment target has a read-only project filesystem, set `systemPath` in `src/defaults.ts` to a writable location such as a mounted volume or `/tmp/life-archive-app`.

## Search Indexing

Archive pages are rendered as server HTML and are indexable by search engines.

The production build should show archive pages as static or SSG where possible. Runtime asset routes remain dynamic.

If the archive cannot be read, or `life.json` is missing or invalid, the renderer shows a server-rendered validation failure page. That failure page is marked `noindex,nofollow` so broken archive states are not indexed.

## Configuration

Renderer defaults are centralized in:

```txt
src/defaults.ts
```

Current defaults include:

- archive path
- app system path
- default theme
- default locale
- fallback images
- metadata description
- cache headers

Theme tokens are in:

```txt
src/app/globals.css
```

UI translations are in:

```txt
src/app/i18n/dictionaries.ts
```

## Status

Life Archive Format and this renderer are under active development.

The current implementation supports the archive structure and rendering behavior documented above. The broader LAF specification may evolve as editors, importers, exporters, search, maps, and other renderers are developed.
