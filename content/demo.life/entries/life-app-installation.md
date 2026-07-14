---
id: life-app-installation
type: entry
title: Installing Life Archive App
date: 2026-07-05
kind: guide
tags:
  - application
  - installation
  - self-hosting
collections:
  - life-archive-app
---

Life Archive App is a Next.js server application. A local installation needs Node.js with npm, a copy of the application repository, and at least one valid `.life` archive.

The project does not currently declare a minimum Node.js version in `package.json`. Use a Node.js release supported by the Next.js version recorded in the repository lockfile, and keep the lockfile when installing dependencies.

## Install dependencies

From the application root, run:

```bash
npm install
```

This installs Next.js, React, the Markdown and frontmatter readers, archive validation, file indexing, and `sharp` for image metadata and generated thumbnails.

## Add or select an archive

Archives normally live under the repository's `content/` directory:

```text
content/
  demo.life/
    life.json
    README.md
    entries/
    collections/
    people/
    places/
    albums/
    files/
```

You may start with `content/demo.life`, copy another `.life` folder into `content/`, or create a new archive using the [Life Archive Format documentation](collections/life-archive-format.md).

Select the default archive in `src/defaults.ts`:

```ts
export const rendererDefaults = {
  archivePath: "content/demo.life",
  // ...
} as const;
```

The path is resolved beneath `content/`. Keeping archives there makes the allowed filesystem boundary explicit and prevents archive-relative paths from escaping the content area.

## Start development mode

Run:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

Check the home page and representative content routes such as `/entries`, `/collections`, `/albums`, and `/about`. Empty sections may be absent from navigation, depending on the selected archive.

## Validate a production build

Before deployment, run:

```bash
npm run lint
npm run build
```

To exercise the production server locally:

```bash
npm run start
```

The default address is `http://localhost:3000`. To choose another port, pass it to Next.js:

```bash
npm run start -- -p 4000
```

## What a successful installation confirms

A working home page confirms that the app can start and read the selected archive. Also open an entry, a collection, and—when present—an album image. These routes test Markdown rendering and the runtime file handlers that a home-page-only check does not cover.

If the archive is missing or invalid, the app intentionally displays an archive validation page rather than failing with an opaque server error. Use the message on that page together with [Operations and troubleshooting](entries/life-app-operations.md) to correct the source archive.
