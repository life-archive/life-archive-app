A **Life Archive Format (.life)** format, an open specification for creating portable, file-based personal archives.  

Whether you're building 
- a personal website
- a blog
- a photography portfolio
- a recipe collection
- a travel journal
- a family archive
- a documentation site
- or a knowledge base

a `.life` archive keeps your content in a portable, application-independent format.

The Life Archive app is the reference website renderer of the .life format. The application reads the archive and presents it as a beautiful website without modifying the underlying content.

The archive remains the source of truth. The application is simply one way to experience it.

> **NOTE**
> This website is a demo of the Life Archive Format

### Philosophy

Most of us accumulate a lifetime of stories, photographs, documents and memories, yet they end up scattered across many different applications and online services. Over time those services change, disappear or make it difficult to move your information elsewhere.

Life Archive takes a different approach. The archive is the important part. It lives in an open, file-based format that is easy to understand, back up and keep for the long term. The application is simply a way to browse and publish that archive.

By separating the archive from the software, your content remains portable. You are free to use today's application, tomorrow's application, or build your own, while keeping the same archive throughout.

The Life Archive format is meant to be simple, open and a long term archival format to store a person's life stories, photographs, places, people, files, collections and memories. It is not a database or a cloud service. It is a folder of Markdown files, media files and metadata that can be copied, backed up, versioned, rendered or edited by different tools.

### Features

- Open Source / MIT License
- Open `.life` file format
- Read-only archive rendering
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

