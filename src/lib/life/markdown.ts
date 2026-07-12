import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

import type { LafMarkdownDocument } from "./types";

type MarkdownUrlNode = {
  type?: string;
  url?: unknown;
  children?: MarkdownUrlNode[];
};

const safeUrlProtocols = new Set(["http:", "https:", "mailto:", "tel:"]);
const archiveMarkdownRoots = new Set([
  "entries",
  "collections",
  "people",
  "places",
]);

export async function renderMarkdown(markdown: string): Promise<string> {
  const rendered = await remark()
    .use(rewriteArchiveUrls)
    .use(remarkHtml)
    .process(markdown);

  return rendered.toString();
}

export async function parseMarkdownFile(raw: string): Promise<{
  frontmatter: Record<string, unknown>;
  body: LafMarkdownDocument;
}> {
  const parsed = matter(raw);
  const markdown = parsed.content.trim();

  return {
    frontmatter: normalizeForJson(parsed.data),
    body: {
      markdown,
      html: await renderMarkdown(markdown),
    },
  };
}

export function normalizeForJson(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      normalizeValue(entryValue),
    ]),
  );
}

function normalizeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        normalizeValue(entryValue),
      ]),
    );
  }

  return value;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rewriteArchiveUrls() {
  return (tree: MarkdownUrlNode) => {
    visitUrlNodes(tree, (node) => {
      if (typeof node.url !== "string") {
        return;
      }

      node.url = resolveMarkdownUrl(node.url);
    });
  };
}

function visitUrlNodes(
  node: MarkdownUrlNode | undefined,
  visitor: (node: MarkdownUrlNode) => void,
): void {
  if (!node) {
    return;
  }

  if (node.type === "link" || node.type === "image" || node.type === "definition") {
    visitor(node);
  }

  for (const child of node.children ?? []) {
    visitUrlNodes(child, visitor);
  }
}

function resolveMarkdownUrl(rawUrl: string): string {
  const trimmedUrl = rawUrl.trim();

  if (trimmedUrl.length === 0 || trimmedUrl.startsWith("#")) {
    return trimmedUrl;
  }

  const parsedExternal = parseExternalUrl(trimmedUrl);

  if (parsedExternal) {
    return parsedExternal;
  }

  if (
    trimmedUrl.startsWith("/") ||
    trimmedUrl.startsWith("\\") ||
    trimmedUrl.startsWith("//")
  ) {
    return "#";
  }

  const [pathPart, suffix = ""] = splitUrlSuffix(trimmedUrl);
  const normalizedPath = normalizeArchiveLinkPath(pathPart);

  if (!normalizedPath) {
    return "#";
  }

  const [root, ...segments] = normalizedPath.split("/");

  if (segments.length === 0) {
    return "#";
  }

  if (archiveMarkdownRoots.has(root)) {
    return `${routeMarkdownDocument(root, segments)}${suffix}`;
  }

  if (root === "files") {
    return `${routeArchiveAsset("life-files", segments)}${suffix}`;
  }

  if (root === "albums") {
    return `${routeAlbumPath(segments)}${suffix}`;
  }

  return "#";
}

function parseExternalUrl(rawUrl: string): string | undefined {
  try {
    const parsed = new URL(rawUrl);
    return safeUrlProtocols.has(parsed.protocol) ? rawUrl : "#";
  } catch {
    return undefined;
  }
}

function splitUrlSuffix(rawUrl: string): [pathPart: string, suffix: string] {
  const hashIndex = rawUrl.indexOf("#");
  const queryIndex = rawUrl.indexOf("?");
  const suffixIndex = [hashIndex, queryIndex]
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (suffixIndex === undefined) {
    return [rawUrl, ""];
  }

  return [rawUrl.slice(0, suffixIndex), rawUrl.slice(suffixIndex)];
}

function normalizeArchiveLinkPath(pathPart: string): string | undefined {
  const normalized = pathPart
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/\/+$/, "");
  const segments = normalized.split("/");

  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        decodeURIComponentSafely(segment) === "..",
    )
  ) {
    return undefined;
  }

  return segments.join("/");
}

function routeMarkdownDocument(root: string, segments: string[]): string {
  const markdownPath = segments.join("/").replace(/\.md$/i, "");
  const encodedPath = encodeRoutePath(markdownPath.split("/"));

  return `/${root}/${encodedPath}`;
}

function routeArchiveAsset(routeRoot: string, segments: string[]): string {
  return `/${routeRoot}/${encodeRoutePath(segments)}`;
}

function routeAlbumPath(segments: string[]): string {
  const lastSegment = segments.at(-1);

  if (!lastSegment || segments.length === 1 || lastSegment.length === 0) {
    return `/albums/${encodeRoutePath(segments.filter(Boolean))}`;
  }

  if (lastSegment.includes(".")) {
    return routeArchiveAsset("life-albums", segments);
  }

  return `/albums/${encodeRoutePath(segments)}`;
}

function encodeRoutePath(segments: string[]): string {
  return segments.map(encodeURIComponent).join("/");
}

function decodeURIComponentSafely(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
