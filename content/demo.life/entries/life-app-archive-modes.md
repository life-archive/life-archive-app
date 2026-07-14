---
id: life-app-archive-modes
type: entry
title: Single-Archive and Multi-Tenant Modes
date: 2026-07-03
kind: guide
tags:
  - application
  - multi-tenant
  - hosting
collections:
  - life-archive-app
---

Life Archive App supports two archive-routing modes. **Single-archive mode** serves one `.life` folder for every request. **Multi-host mode** chooses an archive from the request hostname, allowing one application process to serve several independent archive websites.

## Single-archive mode

This is the default and the best choice for most installations:

```ts
archivePath: "content/demo.life",
archiveRouting: {
  mode: "single",
  hosts: {},
},
```

Every route reads `content/demo.life`. The same archive supplies pages, search results, metadata, sitemap, favicon, files, album images, and thumbnails.

Use single mode when deploying one public archive, testing locally, or running separate application instances for separate sites. It has the fewest DNS and reverse-proxy requirements.

## Multi-host mode

Multi-host mode maps hostnames to archive folders:

```ts
archivePath: "content/default.life",
archiveRouting: {
  mode: "multi-host",
  hosts: {
    "archive.example.com": "content/family.life",
    "www.archive.example.com": "content/family.life",
    "travel.example.com": "content/travel.life",
  },
},
```

With this configuration:

```text
archive.example.com       -> content/family.life
www.archive.example.com   -> content/family.life
travel.example.com        -> content/travel.life
unlisted.example.com      -> content/default.life
```

The host match is case-insensitive. A trailing dot and port are removed, and when a proxy supplies multiple forwarded hosts, the first value is used. Each hostname must be listed explicitly; wildcard host mappings are not currently supported.

An unknown or missing hostname falls back to `archivePath`. Choose that default intentionally. If unrecognized hosts should not expose a personal archive, point `archivePath` to a safe public landing archive rather than a private tenant.

## Reverse proxies and forwarded headers

The app checks `X-Forwarded-Host` before `Host` and uses `X-Forwarded-Proto` when constructing host-specific site URLs. A reverse proxy should therefore:

- preserve the public hostname;
- set trustworthy `X-Forwarded-Host` and `X-Forwarded-Proto` values;
- route every tenant hostname to the same Next.js server;
- avoid accepting client-supplied forwarded headers unless the proxy replaces or validates them.

DNS and TLS certificates must also cover every public hostname.

## Tenant boundaries

This feature isolates archive selection by configured hostname, but it is not a user-account system. There is no tenant dashboard, authentication layer, per-user authorization, or browser-based archive editor.

All configured archives are readable by the server process. Operators are responsible for filesystem permissions, deployment access, backups, DNS, TLS, and deciding which archives are safe to publish.

The same URL path can represent different content on different hosts. For example, `/entries/welcome` may resolve to one entry on `archive.example.com` and another on `travel.example.com`. For this reason, multi-host deployments must use the server runtime rather than one globally shared static export.
