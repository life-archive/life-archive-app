---
id: life-app-overview
type: entry
title: Life Archive App Overview
date: 2026-07-06
kind: guide
tags:
  - laf
  - application
  - overview
collections:
  - life-archive-app
---

**Life Archive App** is the open-source reference web application for the [Life Archive Format](collections/life-archive-format.md). It reads a `.life` folder from the local filesystem and presents the archive as a public, searchable website.

The app and the archive have separate responsibilities:

- The **archive** owns the stories, metadata, relationships, photographs, and files.
- The **app** reads that material and supplies navigation, page layouts, search, themes, translations, metadata, thumbnails, and web-friendly asset routes.

The app does not move archive content into a database and does not rewrite the archive while serving it. This keeps the original Markdown and media portable: the same folder can be backed up, versioned, edited with ordinary tools, or rendered by another LAF-compatible application.

## What the app renders

Given a valid archive, the app provides:

- a home page shaped by the archive title, hero image, featured collections, albums, and recent entries;
- chronological entry lists and individual Markdown entry pages;
- collection lists and board-style collection pages;
- album lists, responsive photo layouts, and a full-screen photo viewer;
- an About page rendered from the archive's `README.md`;
- server-rendered text search across archive items;
- archive-aware links to entries, collections, files, and album media;
- archive metadata, favicon, sitemap, and robots responses;
- selectable visual themes and interface languages.

Navigation adapts to the archive. For example, the Albums link is omitted when the selected archive has no albums.

## Read-only source, generated cache

Archive content is treated as read-only. The app may generate resized album thumbnails, but those files are placed under the configured app system directory—`.laf-system` by default—not inside the `.life` folder.

The app also keeps an in-memory index of an archive. It compares file paths, sizes, and modification times on later requests, so normal edits are detected without requiring a content database.

## One app, one or many archives

The simplest deployment serves one archive at every route. A single running app can also map different hostnames to different archive folders, allowing sites such as `family.example.com` and `travel.example.com` to share the same application process while displaying separate archives.

This is hostname-based multi-tenancy, not account-based multi-tenancy. The app does not include sign-in, an administrative dashboard, or browser editing. Archive owners manage the source folders and deployment environment directly.

## Read order

- [Installation](entries/life-app-installation.md)
- [Configuration](entries/life-app-configuration.md)
- [Single-archive and multi-tenant modes](entries/life-app-archive-modes.md)
- [Deployment](entries/life-app-deployment.md)
- [Operations and troubleshooting](entries/life-app-operations.md)

> **Project status:** The app and LAF specification are under active development. Check the repository and the documentation shipped with the version you deploy before relying on a setting or behavior.
