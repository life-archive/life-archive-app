---
id: life-app-deployment
type: entry
title: Deploying Life Archive App
date: 2026-07-02
kind: guide
tags:
  - application
  - deployment
  - production
collections:
  - life-archive-app
---

Deploy Life Archive App as a **Next.js server application**, not as a static export. Pages are server rendered as needed, and archive files, album media, generated thumbnails, and the archive favicon are served by runtime route handlers.

## Production build and start

Install dependencies and build the application in the deployment environment:

```bash
npm install
npm run build
npm run start
```

Your process manager or hosting platform may provide an equivalent command for starting the generated Next.js server. Keep the Node.js process running behind a reverse proxy when using a traditional server or virtual machine.

## Required filesystem access

The deployed server needs:

- the application build and `public/laf/` fallback assets;
- every configured `.life` folder under `content/`;
- read permission for all archive Markdown, JSON, photographs, and files;
- write permission for the configured `systemPath` if album thumbnails will be generated.

The default cache location is:

```text
.laf-system/cache/thumbnails/albums/
```

If the application filesystem is read-only, configure `systemPath` to use a writable mounted volume or temporary directory:

```ts
systemPath: "/tmp/life-archive-app",
```

Thumbnail cache loss is recoverable—the app regenerates missing thumbnails—but regeneration costs CPU and time. A persistent writable volume avoids repeating that work after each restart.

## Container and platform considerations

Do not copy only the compiled application while omitting the archive folders. Likewise, do not assume a build-time copy of an archive is sufficient when content must change after deployment.

For a container deployment, mount archives read-only under `content/` and mount a separate writable path for `systemPath`. Rebuild or restart according to the platform's deployment model after changing `src/defaults.ts`, because it is application source configuration.

Archive content itself is checked at request time using file metadata. On a long-running writable server, normal changes to archive files can be detected without moving the content into a database.

## Multi-host deployment checklist

In addition to the normal requirements, multi-host deployments need:

- DNS records for every archive hostname;
- TLS certificates covering those hostnames;
- a proxy that forwards the original host and protocol correctly;
- every hostname listed in `archiveRouting.hosts`;
- a safe fallback archive for unknown hosts.

Test each hostname independently, including metadata, `/robots.txt`, `/sitemap.xml`, `/icon`, `/life-files/...`, and album routes. A correct home page alone does not prove that host selection is working for runtime assets.

## Production verification

After deployment, visit:

```text
/
/entries
/collections
/about
/search?q=archive
```

When the archive includes albums, also test `/albums`, an album page, a full-size album image, and a generated thumbnail. Confirm that page source contains the archive's title and readable content for search indexing.

Finally, test a missing file and an invalid archive in a non-production copy. The app should return a real fallback image for missing image assets and a readable, non-indexable validation page for an invalid archive.
