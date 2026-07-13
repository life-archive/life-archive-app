#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const defaults = {
  xml: "tools/wordpress/kaizenist.xml",
  archive: "content/madhan.life",
  clean: false,
};

const args = parseArgs(process.argv.slice(2));
const xmlPath = path.resolve(root, args.xml ?? defaults.xml);
const archivePath = path.resolve(root, args.archive ?? defaults.archive);
const shouldClean = args.clean ?? defaults.clean;
const filesPath = path.join(archivePath, "files");

const xml = await readFile(xmlPath, "utf8");
const items = parseItems(xml);
const site = parseSite(xml);
const attachments = new Map();
const usedSlugs = new Set();

for (const item of items) {
  if (item.postType === "attachment" && item.attachmentUrl) {
    attachments.set(item.postId, item);
  }
}

const posts = items
  .filter((item) => ["post", "page"].includes(item.postType))
  .filter((item) => item.status === "publish")
  .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

await mkdir(path.join(archivePath, "entries"), { recursive: true });
await mkdir(path.join(archivePath, "collections"), { recursive: true });
await mkdir(path.join(archivePath, "people"), { recursive: true });
await mkdir(path.join(archivePath, "places"), { recursive: true });
await mkdir(path.join(archivePath, "albums"), { recursive: true });

if (shouldClean) {
  await cleanMarkdownFolder(path.join(archivePath, "entries"));
  await cleanMarkdownFolder(path.join(archivePath, "collections"));
  await rm(filesPath, { recursive: true, force: true });
}

await mkdir(filesPath, { recursive: true });

const categoryEntries = new Map();
const generatedEntries = [];

for (const post of posts) {
  const slug = uniqueSlug(post.slug || slugify(post.title) || `wordpress-${post.postId}`);
  const categories = post.categories.map((category) => category.slug);
  const tags = [...new Set([...categories, ...post.tags.map((tag) => tag.slug)])]
    .filter((tag) => tag && tag !== "uncategorized")
    .sort();
  const collections = categories
    .filter((category) => category && category !== "uncategorized")
    .sort();
  const kind = post.postType === "page" ? "page" : categories.includes("photo-album") ? "photo" : "blog";
  const body = wordpressHtmlToMarkdown(post.content, attachments);

  for (const collection of collections) {
    const entries = categoryEntries.get(collection) ?? [];
    entries.push(slug);
    categoryEntries.set(collection, entries);
  }

  const markdown = [
    "---",
    `id: ${quoteYaml(slug)}`,
    "type: entry",
    `title: ${quoteYaml(post.title || slug)}`,
    post.date ? `date: ${quoteYaml(post.date.slice(0, 10))}` : undefined,
    `kind: ${quoteYaml(kind)}`,
    post.link ? `originalUrl: ${quoteYaml(post.link)}` : undefined,
    post.postId ? `wordpressId: ${quoteYaml(post.postId)}` : undefined,
    yamlList("tags", tags),
    yamlList("collections", collections),
    "---",
    "",
    body || `_Imported from ${post.link || site.link || "WordPress"}. Content was empty in the export._`,
    "",
  ].filter(Boolean).join("\n");

  generatedEntries.push({ slug, markdown });
}

const media = {
  downloaded: 0,
  failed: [],
};

for (const entry of generatedEntries) {
  const entryFilesPath = path.join(filesPath, "entries", entry.slug);
  const archiveFilesPath = `files/entries/${entry.slug}`;
  await mkdir(entryFilesPath, { recursive: true });
  const entryMedia = await localizeMedia(
    [entry.markdown],
    entryFilesPath,
    archiveFilesPath,
  );
  media.downloaded += entryMedia.downloaded;
  media.failed.push(...entryMedia.failed);

  await writeFile(
    path.join(archivePath, "entries", `${entry.slug}.md`),
    rewriteRemoteImages(entry.markdown, entryMedia.replacements),
    "utf8",
  );
}

for (const [slug, entryIds] of [...categoryEntries.entries()].sort()) {
  const title = titleCase(slug.replaceAll("-", " "));
  const markdown = [
    "---",
    `id: ${quoteYaml(slug)}`,
    "type: collection",
    "kind: board",
    `title: ${quoteYaml(title)}`,
    `description: ${quoteYaml(`Imported WordPress ${title} posts from kaizen.ist.`)}`,
    "featured: true",
    yamlList("items", entryIds.map((entryId) => `entry:${entryId}`)),
    yamlList("tags", [slug]),
    "---",
    "",
    `Imported WordPress posts from the ${title} category.`,
    "",
  ].filter(Boolean).join("\n");

  await writeFile(path.join(archivePath, "collections", `${slug}.md`), markdown, "utf8");
}

const readme = [
  "# Madhan Life Archive",
  "",
  `Imported from ${site.link || "kaizen.ist"} WordPress export.`,
  "",
  `- ${posts.length} published posts/pages imported as entries`,
  `- ${categoryEntries.size} WordPress categories imported as collections`,
  `- ${attachments.size} attachment records found in the export`,
  `- ${media.downloaded} remote images stored in files/`,
  media.failed.length > 0 ? `- ${media.failed.length} remote images could not be downloaded and were left as remote URLs` : undefined,
  "",
].filter(Boolean).join("\n");

await writeFile(path.join(archivePath, "README.md"), readme, "utf8");

await writeFile(
  path.join(archivePath, "life.json"),
  `${JSON.stringify({
    format: "life/0.1",
    title: site.title ? `${site.title} Life Archive` : "Madhan Life Archive",
    owner: "madhan",
    language: site.language || "en-US",
    website: site.link || "https://kaizen.ist",
  }, null, 2)}\n`,
  "utf8",
);

console.log(`Imported ${posts.length} published posts/pages into ${path.relative(root, archivePath)}.`);
console.log(`Created ${categoryEntries.size} category collections.`);
console.log(`Indexed ${attachments.size} attachment records for gallery/image expansion.`);
console.log(`Downloaded ${media.downloaded} remote images into ${path.relative(root, path.join(filesPath, "entries"))}.`);
if (media.failed.length > 0) {
  console.warn(`Left ${media.failed.length} image URLs remote because downloads failed.`);
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--clean") {
      parsed.clean = true;
      continue;
    }

    if (arg === "--xml") {
      parsed.xml = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--archive") {
      parsed.archive = argv[index + 1];
      index += 1;
      continue;
    }
  }

  return parsed;
}

async function cleanMarkdownFolder(folderPath) {
  const entries = await readdir(folderPath, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      await rm(path.join(folderPath, entry.name));
    }
  }
}

function parseSite(source) {
  const channel = source.match(/<channel>([\s\S]*?)<item>/)?.[1] ?? source;

  return {
    title: textAt(channel, "title"),
    link: textAt(channel, "link").replace(/^https:\/\/www\./, "https://"),
    description: textAt(channel, "description"),
    language: textAt(channel, "language"),
  };
}

function parseItems(source) {
  const matches = source.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return matches.map(parseItem);
}

function parseItem(item) {
  const categories = categoriesFrom(item);
  const postType = textAt(item, "wp:post_type");

  return {
    postId: textAt(item, "wp:post_id"),
    postType,
    status: textAt(item, "wp:status"),
    title: normalizeWhitespace(textAt(item, "title")),
    slug: slugify(textAt(item, "wp:post_name") || textAt(item, "title")),
    link: textAt(item, "link"),
    date: textAt(item, "wp:post_date"),
    content: textAt(item, "content:encoded"),
    attachmentUrl: textAt(item, "wp:attachment_url"),
    categories: categories.filter((category) => category.domain === "category"),
    tags: categories.filter((category) => category.domain === "post_tag"),
  };
}

function textAt(source, tag) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`));
  return decodeXml(unwrapCdata(match?.[1] ?? "").trim());
}

function categoriesFrom(source) {
  const categories = [];
  const matches = source.matchAll(/<category\s+([^>]*)>([\s\S]*?)<\/category>/g);

  for (const match of matches) {
    const attrs = attrsFrom(match[1]);
    const label = decodeXml(unwrapCdata(match[2]).trim()).replace(/^#/, "");
    const slug = slugify(attrs.nicename || label);

    if (slug) {
      categories.push({
        domain: attrs.domain || "category",
        slug,
        label,
      });
    }
  }

  return categories;
}

function attrsFrom(source) {
  const attrs = {};
  const matches = source.matchAll(/([a-zA-Z_:.-]+)="([^"]*)"/g);

  for (const match of matches) {
    attrs[match[1]] = decodeXml(match[2]);
  }

  return attrs;
}

function unwrapCdata(value) {
  const match = value.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  return match ? match[1] : value;
}

function wordpressHtmlToMarkdown(html, attachments) {
  const attachmentIds = attachmentIdsFromBlocks(html);
  let markdown = htmlToMarkdown(html);

  const missingImages = attachmentIds
    .map((id) => attachments.get(String(id)))
    .filter(Boolean)
    .filter((attachment) => attachment.attachmentUrl && !markdownContainsImage(markdown, attachment.attachmentUrl))
    .map((attachment) => `![${escapeMarkdown(attachment.title || "Image")}](${attachment.attachmentUrl})`);

  if (missingImages.length > 0) {
    markdown = `${markdown.trim()}\n\n${missingImages.join("\n\n")}`.trim();
  }

  return markdown.trim();
}

function attachmentIdsFromBlocks(html) {
  const ids = new Set();
  const comments = html.matchAll(/<!--\s+wp:[\w/-]+\s+({[\s\S]*?})\s+(?:\/)?-->/g);

  for (const comment of comments) {
    try {
      const data = JSON.parse(comment[1]);
      for (const id of [data.id, ...(Array.isArray(data.ids) ? data.ids : [])]) {
        if (id) {
          ids.add(String(id));
        }
      }
    } catch {
      // Ignore malformed block metadata; the visible HTML still gets converted.
    }
  }

  return [...ids];
}

function htmlToMarkdown(html) {
  let output = html
    .replace(/\r\n/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  output = output.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    return `\n\n\`\`\`\n${decodeXml(stripTags(code)).trim()}\n\`\`\`\n\n`;
  });

  output = output.replace(/<img\b([^>]*)\/?>/gi, (_, attrs) => {
    const parsed = attrsFrom(attrs);
    const src = parsed.src || parsed["data-src"];
    if (!src) {
      return "";
    }
    const alt = parsed.alt || parsed.title || "Image";
    return `\n\n![${escapeMarkdown(decodeXml(alt))}](${decodeXml(src)})\n\n`;
  });

  output = output.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_, attrs, label) => {
    const parsed = attrsFrom(attrs);
    const href = parsed.href;
    const text = normalizeInline(stripTags(label));
    return href && text ? `[${escapeMarkdown(text)}](${decodeXml(href)})` : text;
  });

  output = output
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n\n#### $1\n\n")
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, "\n\n##### $1\n\n")
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, "\n\n###### $1\n\n")
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "_$2_")
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, quote) => {
      return `\n\n${stripTags(quote).trim().split("\n").map((line) => `> ${line.trim()}`).join("\n")}\n\n`;
    })
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => `\n- ${normalizeInline(stripTags(item))}`)
    .replace(/<\/?(ul|ol)[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/(div|figure|figcaption|section|article|table|tr)>/gi, "\n\n")
    .replace(/<(div|figure|figcaption|section|article|table|tbody|thead|tr|td|th)[^>]*>/gi, "\n")
    .replace(/&nbsp;/gi, " ");

  output = stripTags(output);
  output = decodeXml(output);

  return output
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, "");
}

function decodeXml(value) {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, number) => String.fromCodePoint(Number.parseInt(number, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

async function localizeMedia(markdowns, destinationFolder, archiveFolder) {
  const imageUrls = uniqueValues(markdowns.flatMap(imageUrlsFromMarkdown));
  const replacements = new Map();
  const usedFilenames = new Set();
  const replacementsBySourceFilename = new Map();
  const failed = [];
  let downloaded = 0;

  for (const imageUrl of imageUrls) {
    const filename = uniqueMediaFilename(imageUrl, usedFilenames);
    const destination = path.join(destinationFolder, filename);
    let downloadedImage = false;
    let lastError = "";

    for (const candidateUrl of downloadCandidates(imageUrl)) {
      try {
        const response = await fetch(candidateUrl, {
          headers: {
            "User-Agent": "LifeArchiveImporter/1.0",
          },
          redirect: "follow",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const bytes = Buffer.from(await response.arrayBuffer());
        await writeFile(destination, bytes);
        replacements.set(imageUrl, `${archiveFolder}/${filename}`);
        replacementsBySourceFilename.set(
          filenameFromUrl(imageUrl).toLowerCase(),
          `${archiveFolder}/${filename}`,
        );
        downloaded += 1;
        downloadedImage = true;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    if (!downloadedImage) {
      failed.push({
        url: imageUrl,
        error: lastError,
      });
    }
  }

  const unresolved = [];

  for (const failure of failed) {
    const localPath = replacementsBySourceFilename.get(filenameFromUrl(failure.url).toLowerCase());

    if (localPath) {
      replacements.set(failure.url, localPath);
    } else {
      unresolved.push(failure);
    }
  }

  return { replacements, downloaded, failed: unresolved };
}

function imageUrlsFromMarkdown(markdown) {
  const urls = [];
  const matches = markdown.matchAll(/!?\[[^\]]*]\((https?:\/\/[^)\s]+)\)/g);

  for (const match of matches) {
    const url = match[1];
    if (isImageUrl(url)) {
      urls.push(url);
    }
  }

  return urls;
}

function rewriteRemoteImages(markdown, replacements) {
  let output = markdown;

  for (const [remoteUrl, localPath] of replacements.entries()) {
    output = output.split(remoteUrl).join(localPath);
  }

  return output;
}

function uniqueValues(values) {
  return [...new Set(values)];
}

function uniqueMediaFilename(imageUrl, usedFilenames) {
  const parsed = parseMediaUrl(imageUrl);
  const ext = parsed.ext || extensionFromImageUrl(imageUrl) || ".jpg";
  const base = slugify(parsed.name) || "image";
  let filename = `${base}${ext}`.toLowerCase();

  if (!usedFilenames.has(filename)) {
    usedFilenames.add(filename);
    return filename;
  }

  const hash = createHash("sha1").update(imageUrl).digest("hex").slice(0, 8);
  filename = `${base}-${hash}${ext}`.toLowerCase();
  usedFilenames.add(filename);
  return filename;
}

function downloadCandidates(imageUrl) {
  const candidates = [imageUrl];

  try {
    const url = new URL(imageUrl);

    if (url.hostname === "www.thezeal.net" || url.hostname === "thezeal.net") {
      url.protocol = "https:";
      url.hostname = "www.kaizen.ist";
      candidates.push(url.toString());
    }

    if (/^i\d\.wp\.com$/i.test(url.hostname) && url.pathname.startsWith("/www.kaizen.ist/")) {
      candidates.push(`https://${url.pathname.slice(1)}`);
    }
  } catch {
    // Keep the original URL as the only candidate.
  }

  return uniqueValues(candidates);
}

function parseMediaUrl(imageUrl) {
  try {
    const url = new URL(imageUrl);
    const basename = path.basename(url.pathname);
    const ext = path.extname(basename);
    const name = ext ? basename.slice(0, -ext.length) : basename;

    return {
      name,
      ext: normalizeImageExtension(ext),
    };
  } catch {
    const ext = path.extname(imageUrl);
    return {
      name: ext ? imageUrl.slice(0, -ext.length) : imageUrl,
      ext: normalizeImageExtension(ext),
    };
  }
}

function extensionFromImageUrl(imageUrl) {
  const match = imageUrl.match(/\.(jpe?g|png|gif|webp|avif|svg)(?:[?#]|$)/i);
  return match ? normalizeImageExtension(`.${match[1]}`) : "";
}

function normalizeImageExtension(ext) {
  if (!ext) {
    return "";
  }

  const lower = ext.toLowerCase();
  return lower === ".jpeg" ? ".jpg" : lower;
}

function isImageUrl(value) {
  return /\.(jpe?g|png|gif|webp|avif|svg)(?:[?#]|$)/i.test(value);
}

function uniqueSlug(slug) {
  let candidate = slug;
  let suffix = 2;

  while (usedSlugs.has(candidate)) {
    candidate = `${slug}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(candidate);
  return candidate;
}

function slugify(value) {
  return decodeXml(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function quoteYaml(value) {
  return JSON.stringify(String(value));
}

function yamlList(key, values) {
  if (!values || values.length === 0) {
    return undefined;
  }

  return [`${key}:`, ...values.map((value) => `  - ${quoteYaml(value)}`)].join("\n");
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeInline(value) {
  return decodeXml(normalizeWhitespace(value));
}

function escapeMarkdown(value) {
  return String(value).replace(/[[\]]/g, "\\$&");
}

function titleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function markdownContainsImage(markdown, imageUrl) {
  if (markdown.includes(imageUrl)) {
    return true;
  }

  const filename = filenameFromUrl(imageUrl);
  return filename ? markdown.toLowerCase().includes(filename.toLowerCase()) : false;
}

function filenameFromUrl(value) {
  try {
    return path.basename(new URL(value).pathname);
  } catch {
    return "";
  }
}
