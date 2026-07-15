
A **Life Archive Format (LAF)** format, a simple open specification for creating portable, file-based personal archives.  

Whether you're building 
- a personal website
- a blog
- a photography portfolio
- a recipe collection
- a travel journal
- a family archive
- a documentation site
- or a knowledge base

a `.life` folder archive keeps your content in a portable, application-independent format.

The Life Archive app is the open source MIT-licensed reference website renderer of the .life format. The application reads the archive and presents it as a beautiful website without modifying the underlying content. Access the Git Hub repository for the Life Archive app at [https://github.com/life-archive/life-archive-app](https://github.com/life-archive/life-archive-app).

> **NOTE**
> This website is a demo of the Life Archive Format


### Features

- Open Source / MIT License
- Open Life Archive Format `.life` file format
- Read-only archive rendering
- Can be Self-Hosted
- Markdown entries
- SEO friendly
- Photo albums with automatic thumbnail generation
- Photo albums with masonry, grid and photo book layouts
- Curated collections
- Timeline view
- Full archive search
- Multiple color themes
- Multi-language support
- Multi-tenant hosting from a single app
- Responsive design

## Screenshots

Select any screenshot to open the full-size image.
Here are some examples of the Life Archive App rendering a .life folder. It can render photo albums from files, blogs from markdown entries and store and manage any files that can be linked to from entries, albums or collections. 

| Personal archive | Recipe archive |
| --- | --- |
| [![Life Archive personal website](album-thumbs/400/screenshots/1-personal_site_laf.jpeg)](albums/screenshots/1-personal_site_laf.jpeg) | [![Life Archive recipe website](album-thumbs/400/screenshots/2-cooking_recipe_site_in_life_archive_format.jpeg)](albums/screenshots/2-cooking_recipe_site_in_life_archive_format.jpeg) |

| **Album grid layout** | **Album masonry layout** | **Album photo-book layout** |
| --- | --- | --- |
| [![Album grid layout](album-thumbs/300/screenshots/album_grid_layout.jpeg)](albums/screenshots/album_grid_layout.jpeg) | [![Album masonry layout](album-thumbs/300/screenshots/album_masonry_layout.jpeg)](albums/screenshots/album_masonry_layout.jpeg) | [![Album photo-book layout](album-thumbs/400/screenshots/album_photobook_layout.jpeg)](albums/screenshots/album_photobook_layout.jpeg) |

[View the complete Screenshot album](albums/screenshots)

### Philosophy

Most of us accumulate a lifetime of stories, photographs, documents and memories, yet they end up scattered across many different applications and online services. Over time those services change, disappear or make it difficult to move your information elsewhere.

Life Archive takes a different approach. The archive is the important part. It lives in an open, file-based format that is easy to understand, back up and keep for the long term. The application is simply a way to browse and publish that archive.

By separating the archive from the software, your content remains portable. You are free to use today's application, tomorrow's application, or build your own, while keeping the same archive throughout.

The Life Archive format is meant to be simple, open and a long term archival format to store a person's life stories, photographs, places, people, files, collections and memories. It is not a database or a cloud service. It is a folder of Markdown files, media files and metadata that can be copied, backed up, versioned, rendered or edited by different tools.

Creating a photo album is as simple as creating a sub folder with photos into the 'albums' folder. Adding photos to a album is just again dropping more photos into that folder. The application will automatically generate thumbnails and render the album in a beautiful layout.

The same philosophy holds true for entries, collections and files. 

### Open Format

The Life Archive Format is intentionally simple.

A typical archive looks like:

```text
MyArchive.life/
    life.json
    README.md
    entries/
    collections/
    albums/
    files/
```

You can inspect a sample archive that powers this site at [Sample Life Archive](https://github.com/life-archive/life-archive-app/tree/main/content/demo.life)


## Start Exploring

Learn how the portable format works or follow the practical guides for running the reference application.

| [Life Archive Format](collections/life-archive-format.md) | [Life Archive App](collections/life-archive-app.md) |
| --- | --- |
| [Format overview](entries/laf-format-overview.md) | [App overview](entries/life-app-overview.md) |
| [Archive root, life.json, and README.md](entries/laf-archive-root.md) | [Installation](entries/life-app-installation.md) |
| [Entries](entries/laf-entries.md) | [Configuration](entries/life-app-configuration.md) |
| [Collections](entries/laf-collections.md) | [Single-archive and multi-host modes](entries/life-app-archive-modes.md) |
| [People and places](entries/laf-people-and-places.md) | [Deployment](entries/life-app-deployment.md) |
| [Albums](entries/laf-albums.md) | [Operations and troubleshooting](entries/life-app-operations.md) |
| [Files, media, and archive links](entries/laf-files-and-links.md) |  |


### Life Archive App Requirements

The Life Arhive app runs on a Node.js NextJS server. It can be run locally or deployed to a cloud service. The server runs on a VM with just 1 GB RAM available. (For example the smallest $5 linode VM)

### Contributors are welcome

Interested in improving the renderer or creating an app to read and write the Life Archive format, contributions and PRs are welcome. 
