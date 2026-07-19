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

Tracked application defaults are centralized in `src/defaults.ts`. Deployment-specific overrides belong in the root `.env.local`, which Git ignores. Archive-specific identity and content belong in the selected archive's `life.json`, `README.md`, Markdown files, and media folders.

Keeping those two layers separate makes an archive portable: archive presentation preferences remain ordinary manifest metadata, while renderer cache and runtime settings stay with the application.

## Core paths and routing

Copy the tracked example and customize the local file:

```powershell
Copy-Item .env.example .env.local
```

```dotenv
LAF_ARCHIVE_PATH=content/demo.life
NEXT_PUBLIC_LAF_ARCHIVE_ROUTING_MODE=single
LAF_ARCHIVE_HOSTS={}
LAF_SITE_URL=https://archive.example.com
LAF_SYSTEM_PATH=.laf-system
```

- `LAF_ARCHIVE_PATH` is the default `.life` folder. Relative paths may be written with or without the leading `content/` segment, but they resolve inside the app's `content` directory.
- `NEXT_PUBLIC_LAF_ARCHIVE_ROUTING_MODE` is either `single` or `multi-host`. Because the image component also needs this value, changing it requires rebuilding the app.
- `LAF_ARCHIVE_HOSTS` is a JSON object mapping normalized hostnames to archive paths in multi-host mode.
- `LAF_SITE_URL` is the canonical public origin for a single-site deployment, such as `https://openlaf.org`.
- `LAF_SYSTEM_PATH` stores app-generated data such as cached album thumbnails. A relative path is resolved from the project root; an absolute path may point to a writable mounted volume or temporary directory.

Do not place original archive material under `LAF_SYSTEM_PATH`. It is cache space and should be safe to recreate.

In single mode, an explicit `LAF_SITE_URL` is used for canonical, Open Graph, Twitter image, sitemap, and robots URLs. If it is omitted, the app uses the request's forwarded host or host header and then the selected archive's `life.json.website` value.

In multi-host mode, the request hostname takes precedence so every archive receives URLs on its own domain. Leave `LAF_SITE_URL` unset for normal multi-host deployments; it is only an emergency fallback when the request has no usable hostname.

## Presentation defaults

```ts
defaultLocale: "en",
defaultTheme: "gallery",
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

## Home-page limits

Each archive controls its own home-page limits in `life.json`:

```json
{
  "home": {
    "albumLimit": 20,
    "collectionLimit": 25,
    "entryLimit": 3,
    "timelineEntryLimit": 6
  }
}
```

- `home.albumLimit` caps albums on the home page.
- `home.collectionLimit` caps normal collection cards on the home page.
- `home.entryLimit` caps the Recent Entries section.
- `home.timelineEntryLimit` caps the entries shown in each home-page timeline.

Set any limit to `0` to hide that content from the home page. The full Albums, Collections, Entries, and timeline detail pages remain available. Archives that omit these settings use the values shown above for backward compatibility.

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

The metadata values are application fallbacks. When an archive loads successfully, its manifest title and description provide the site-specific identity. Absolute metadata URLs use `LAF_SITE_URL` in single mode or the request hostname in multi-host mode, with `life.json.website` as a fallback.

## Links and cache headers

`links.project` controls the project link shown by the renderer. `cacheControl.asset` and `cacheControl.icon` control browser and proxy caching for runtime asset responses.

Change cache headers deliberately. Archive files may be replaced without changing their URL, so long immutable caching can leave visitors seeing stale media.

## Archive configuration belongs in life.json

Use `life.json` for the archive title, language, theme, collection labels, owner, website, email, and supported social links. The optional `labels.collection` and `labels.collections` values let each archive rename Collection and Collections throughout the interface. Use `README.md` for the archive's About page. See [Archive root, life.json, and README.md](entries/laf-archive-root.md) for the complete format and examples.
