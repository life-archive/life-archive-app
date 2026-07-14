---
id: life-app-configuration
type: entry
title: Configuring Life Archive App
date: 2026-07-04
kind: guide
tags:
  - application
  - configuration
  - themes
collections:
  - life-archive-app
---

Application defaults are centralized in `src/defaults.ts`. Archive-specific identity and content belong in the selected archive's `life.json`, `README.md`, Markdown files, and media folders.

Keeping those two layers separate makes an archive portable: archive presentation preferences remain ordinary manifest metadata, while renderer cache and runtime settings stay with the application.

## Core paths and routing

```ts
archivePath: "content/demo.life",
archiveRouting: {
  mode: "single",
  hosts: {},
},
systemPath: ".laf-system",
```

- `archivePath` is the default `.life` folder. Relative paths may be written with or without the leading `content/` segment, but they resolve inside the app's `content` directory.
- `archiveRouting.mode` is either `single` or `multi-host`.
- `archiveRouting.hosts` maps normalized hostnames to archive paths in multi-host mode.
- `systemPath` stores app-generated data such as cached album thumbnails. A relative path is resolved from the project root; an absolute path may point to a writable mounted volume or temporary directory.

Do not place original archive material under `systemPath`. It is cache space and should be safe to recreate.

## Presentation defaults

```ts
defaultLocale: "en",
defaultTheme: "gallery",
home: {
  albumLimit: 20,
  collectionLimit: 25,
},
```

The built-in theme names are `light`, `dusk`, `gallery`, and `dark`. `defaultTheme` is the application fallback when the selected archive does not specify a theme.

An archive can choose its own initial theme in `life.json`:

```json
{
  "format": "life/0.1",
  "title": "The Bennett Family Archive",
  "theme": "dusk"
}
```

Theme precedence is:

1. the visitor's saved choice for that website;
2. the selected archive's `theme` value;
3. `rendererDefaults.defaultTheme`.

This allows archives in a multi-host deployment to have different defaults while preserving each visitor's choice. Invalid theme names fail manifest validation instead of silently producing an undefined design.

The archive manifest's `language` determines the initial interface language when it matches a supported locale. The current built-in locale codes are `en`, `de`, `es`, `fr`, `nl`, `pt`, `it`, `ja`, `zh`, and `ko`. Visitors can change the language in the interface, and their selection is saved locally.

`home.albumLimit` and `home.collectionLimit` cap how many of those items appear on the home page. They do not remove items from the full Albums or Collections pages.

## Fallback images and metadata

```ts
fallbackImages: {
  album: "/laf/albums.png",
  collection: "/laf/collections.png",
  hero: "/laf/hero.png",
},
metadata: {
  defaultTitle: "Life Archive",
  description: "Reference renderer for Life Archive Format archives.",
},
```

Fallback images live in `public/laf/` and are used when an archive does not provide a suitable image. An archive can supply its own `files/hero.png` and `files/favicon.svg` or `files/favicon.ico` without modifying the shared public fallbacks.

The metadata values are application fallbacks. When an archive loads successfully, its manifest title and description provide the site-specific identity.

## Links and cache headers

`links.project` controls the project link shown by the renderer. `cacheControl.asset` and `cacheControl.icon` control browser and proxy caching for runtime asset responses.

Change cache headers deliberately. Archive files may be replaced without changing their URL, so long immutable caching can leave visitors seeing stale media.

## Archive configuration belongs in life.json

Use `life.json` for the archive title, language, theme, owner, website, email, and supported social links. Use `README.md` for the archive's About page. See [Archive root, life.json, and README.md](entries/laf-archive-root.md) for the complete format and examples.
