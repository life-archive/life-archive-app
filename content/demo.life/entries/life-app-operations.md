---
id: life-app-operations
type: entry
title: Operations and Troubleshooting
date: 2026-07-01
kind: guide
tags:
  - application
  - maintenance
  - troubleshooting
collections:
  - life-archive-app
---

Life Archive App is intentionally light on operational state. The `.life` folder is the source of truth, while generated thumbnails live under `systemPath` and may be recreated. Good operations therefore center on validating, backing up, and safely publishing the archive itself.

## Updating archive content

Edit or replace files in the selected archive using ordinary filesystem tools or a version-controlled publishing workflow. The app builds an archive signature from file paths, sizes, and modification times. When that signature changes, it reloads and re-indexes the archive on a later request.

Use atomic deployment practices for large updates when possible: prepare a complete archive, validate it, then replace or switch to it. Copying hundreds of files into the live folder one at a time can briefly expose a partially updated archive.

Changes to application source or `src/defaults.ts` require the normal rebuild and restart process for the deployment platform.

## Backups

Back up the complete `.life` folder, including `life.json`, `README.md`, Markdown entities, albums, and files. That folder contains the durable archive.

The default `.laf-system` directory contains generated runtime data and does not need to be part of an archival backup. Keeping it may improve recovery speed, but deleting it should not lose original content.

## Archive validation failures

When the selected archive cannot be opened, the app displays a server-rendered error page marked `noindex,nofollow`. Common causes include:

- the configured archive folder does not exist;
- `life.json` is missing or contains invalid JSON;
- required manifest values such as the format or title are invalid;
- Markdown frontmatter has invalid YAML or does not match the expected entity type;
- a configured path points outside the allowed content root.

Start with the exact message on the validation page, then inspect the most recently edited manifest or Markdown file. Run `npm run build` before deployment to catch application-level problems, but also browse the archive because runtime-selected tenants may not all be exercised during one build.

## Images and thumbnails

If an archive hero or favicon appears stale, verify that the request is reaching the intended hostname and archive first. Then check proxy/browser caching against `cacheControl.asset` and `cacheControl.icon` in `src/defaults.ts`.

If album thumbnails fail while original photos work, confirm that:

- the source format is JPEG, PNG, or WebP;
- the server can read the album file;
- `systemPath` is writable;
- the deployment includes the native requirements used by `sharp`.

Thumbnail cache files include source size and modification time in their key, so replacing a source image should produce a new cached thumbnail.

## Multi-host diagnosis

If the wrong archive appears on a hostname, check these in order:

1. DNS sends the hostname to the intended deployment.
2. The proxy replaces or sets `X-Forwarded-Host` and `X-Forwarded-Proto` correctly.
3. The normalized hostname exists in `archiveRouting.hosts` without a path or protocol.
4. The mapped archive path exists beneath `content/`.
5. `archivePath` is an appropriate fallback for unmatched requests.

Test page routes and asset routes on the affected hostname. Host selection applies to both, and inconsistent proxy rules can make them appear to use different archives.

## Routine release check

Before publishing an application update:

```bash
npm run lint
npm run build
```

After starting the new release, smoke-test the home page, entries, collections, search, About page, and any albums on every configured hostname. Preserve the previous app build and archive backup until those checks pass.
