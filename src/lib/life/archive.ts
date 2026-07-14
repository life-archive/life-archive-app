import "server-only";

import path from "node:path";
import { readFile } from "node:fs/promises";

import fg from "fast-glob";
import { z } from "zod";

import { indexAlbums } from "./albums";
import { indexFileAssets, toArchivePath } from "./files";
import { parseMarkdownFile, renderMarkdown } from "./markdown";
import { resolveArchivePath, resolveWithin } from "./paths";
import { LAF_THEMES } from "./themes";
import {
  type LafAlbum,
  type LafArchiveJSON,
  type LafArchiveManifest,
  type LafCollection,
  type LafEntity,
  type LafEntityGraph,
  type LafEntityType,
  type LafEntry,
  type LafFileAsset,
  type LafPerson,
  type LafPlace,
  type LafWarning,
} from "./types";

export type ArchiveContentIssue = {
  code:
    | "archive_unreadable"
    | "invalid_manifest"
    | "missing_manifest";
  message: string;
  path?: string;
};

export class ArchiveContentError extends Error {
  readonly issues: ArchiveContentIssue[];

  constructor(message: string, issues: ArchiveContentIssue[]) {
    super(message);
    this.name = "ArchiveContentError";
    this.issues = issues;
  }
}

const manifestSchema = z
  .object({
    format: z.string(),
    title: z.string(),
    owner: z.string().optional(),
    language: z.string().optional(),
    theme: z.enum(LAF_THEMES).optional(),
  })
  .passthrough();

const baseEntitySchema = z
  .object({
    id: z.string().min(1).optional(),
    type: z.enum(["entry", "person", "place", "collection"]),
  })
  .passthrough();

export type OpenArchiveOptions = {
  path?: string;
};

export class LifeArchive {
  constructor(private readonly data: LafArchiveJSON) {}

  getManifest(): LafArchiveManifest {
    return this.data.manifest;
  }

  getEntries(): LafEntry[] {
    return this.data.entries;
  }

  getEntry(id: string): LafEntry | undefined {
    return this.data.entries.find((entry) => entry.id === id);
  }

  getPeople(): LafPerson[] {
    return this.data.people;
  }

  getPerson(id: string): LafPerson | undefined {
    return this.data.people.find((person) => person.id === id);
  }

  getPlaces(): LafPlace[] {
    return this.data.places;
  }

  getPlace(id: string): LafPlace | undefined {
    return this.data.places.find((place) => place.id === id);
  }

  getCollections(): LafCollection[] {
    return this.data.collections;
  }

  getCollection(id: string): LafCollection | undefined {
    return this.data.collections.find((collection) => collection.id === id);
  }

  getAlbums(): LafAlbum[] {
    return this.data.albums;
  }

  getAlbum(id: string): LafAlbum | undefined {
    const decodedId = decodeURIComponent(id);

    return this.data.albums.find(
      (album) => album.id === id || album.relativePath === decodedId,
    );
  }

  getFiles(): LafFileAsset[] {
    return this.data.files;
  }

  resolveFile(filename: string): LafFileAsset | undefined {
    return this.data.files.find(
      (file) => file.filename.toLowerCase() === filename.toLowerCase(),
    );
  }

  getGraph(): LafEntityGraph {
    return this.data.graph;
  }

  getWarnings(): LafWarning[] {
    return this.data.warnings;
  }

  toJSON(): LafArchiveJSON {
    return this.data;
  }
}

export async function openArchive(
  archivePath?: string,
): Promise<LifeArchive> {
  const absoluteArchivePath = resolveArchivePath(archivePath);
  const warnings: LafWarning[] = [];

  try {
    const manifest = await readManifest(absoluteArchivePath);
    const [entries, people, places, collections, albums, readme] = await Promise.all([
      readEntityFolder<LafEntry>(absoluteArchivePath, "entries", "entry", warnings),
      readEntityFolder<LafPerson>(absoluteArchivePath, "people", "person", warnings),
      readEntityFolder<LafPlace>(absoluteArchivePath, "places", "place", warnings),
      readEntityFolder<LafCollection>(
        absoluteArchivePath,
        "collections",
        "collection",
        warnings,
      ),
      indexAlbums(absoluteArchivePath),
      readReadme(absoluteArchivePath),
    ]);

    warnForDuplicateEntityIds(
      [...entries, ...people, ...places, ...collections],
      warnings,
    );

    const graph = buildGraph(entries, collections);
    const fileIndex = await indexFileAssets(absoluteArchivePath, {
      entries: graph.entryFiles,
      collections: Object.fromEntries(
        collections.map((collection) => [collection.id, collection.files]),
      ),
    });

    warnings.push(...fileIndex.warnings);
    warnForMissingReferences(
      { entries, people, places, collections },
      fileIndex.files,
      warnings,
    );

    return new LifeArchive({
      manifest,
      readme,
      entries: entries.sort(compareDatedEntities),
      people: people.sort(compareNamedEntities),
      places: places.sort(compareNamedEntities),
      collections: collections.sort(compareCollectionEntities),
      albums,
      files: fileIndex.files,
      graph,
      warnings,
    });
  } catch (error) {
    if (error instanceof ArchiveContentError) {
      throw error;
    }

    throw new ArchiveContentError("Could not read the archive content.", [
      {
        code: "archive_unreadable",
        message: error instanceof Error ? error.message : String(error),
      },
    ]);
  }
}

async function readManifest(
  archivePath: string,
): Promise<LafArchiveManifest> {
  const manifestPath = "life.json";
  let raw: string;
  let json: unknown;

  try {
    raw = await readFile(resolveWithin(archivePath, manifestPath), "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      throw new ArchiveContentError("Archive manifest is missing.", [
        {
          code: "missing_manifest",
          message: "life.json was not found in the archive root.",
          path: manifestPath,
        },
      ]);
    }

    throw error;
  }

  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new ArchiveContentError("Archive manifest is not valid JSON.", [
      {
        code: "invalid_manifest",
        message: error instanceof Error ? error.message : String(error),
        path: manifestPath,
      },
    ]);
  }

  const parsed = manifestSchema.safeParse(json);

  if (!parsed.success) {
    throw new ArchiveContentError("Archive manifest is invalid.", [
      {
        code: "invalid_manifest",
        message: z.prettifyError(parsed.error),
        path: manifestPath,
      },
    ]);
  }

  return parsed.data;
}

async function readReadme(
  archivePath: string,
): Promise<LafArchiveJSON["readme"]> {
  const sourcePath = resolveWithin(archivePath, "README.md");

  try {
    const markdown = (await readFile(sourcePath, "utf8")).trim();

    return {
      sourcePath: "README.md",
      markdown,
      html: await renderMarkdown(markdown),
    };
  } catch {
    return undefined;
  }
}

async function readEntityFolder<T extends LafEntity>(
  archivePath: string,
  folder: string,
  expectedType: LafEntityType,
  warnings: LafWarning[],
): Promise<T[]> {
  const folderPath = resolveWithin(archivePath, folder);
  const markdownFiles = await fg("**/*.md", {
    cwd: folderPath,
    onlyFiles: true,
    dot: true,
    suppressErrors: true,
  });

  if (markdownFiles.length === 0) {
    return [];
  }

  const entities: Array<T | undefined> = await Promise.all(
    markdownFiles.map(async (relativePath) => {
      const sourcePath = toArchivePath(path.join(folder, relativePath));

      try {
        const raw = await readFile(resolveWithin(folderPath, relativePath), "utf8");
        const parsed = await parseMarkdownFile(raw);
        const frontmatter = baseEntitySchema.parse(parsed.frontmatter);

        if (frontmatter.type !== expectedType) {
          warnings.push({
            code: "unexpected_entity_type",
            message: `Expected ${expectedType} in ${sourcePath}, found ${frontmatter.type}.`,
            path: sourcePath,
          });
        }

        return buildEntity(
          frontmatter,
          parsed.body,
          sourcePath,
          relativePath,
        ) as T;
      } catch (error) {
        warnings.push({
          code: "invalid_entity",
          message: `Could not parse ${sourcePath}.`,
          path: sourcePath,
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
        });

        return undefined;
      }
    }),
  );

  return entities.filter((entity): entity is T => Boolean(entity));
}

function buildEntity(
  frontmatter: Record<string, unknown> & { id?: string; type: LafEntityType },
  body: LafEntity["body"],
  sourcePath: string,
  relativePath: string,
): LafEntity {
  const slug = stripMarkdownExtension(relativePath);
  const id = frontmatter.id || slug;
  const base = {
    id,
    type: frontmatter.type,
    sourcePath,
    slug,
    body,
    metadata: frontmatter,
  };

  if (frontmatter.type === "entry") {
    return {
      ...base,
      type: "entry",
      kind: optionalString(frontmatter.kind),
      title: stringValue(frontmatter.title, id),
      date: optionalString(frontmatter.date),
      people: stringArray(frontmatter.people),
      places: stringArray(frontmatter.places),
      files: stringArray(frontmatter.files),
      collections: stringArray(frontmatter.collections),
      tags: stringArray(frontmatter.tags),
    };
  }

  if (frontmatter.type === "person") {
    return {
      ...base,
      type: "person",
      name: stringValue(frontmatter.name, id),
    };
  }

  if (frontmatter.type === "place") {
    return {
      ...base,
      type: "place",
      name: stringValue(frontmatter.name, id),
    };
  }

  return {
    ...base,
    type: "collection",
    kind: optionalString(frontmatter.kind),
    title: stringValue(frontmatter.title, id),
    description: optionalString(frontmatter.description),
    layout: optionalString(frontmatter.layout),
    pos: optionalNumber(frontmatter.pos),
    featured: booleanValue(frontmatter.featured),
    items: stringArray(frontmatter.items),
    entries: [
      ...stringArray(frontmatter.entries),
      ...prefixedItemIds(frontmatter.items, "entry"),
    ],
    people: [
      ...stringArray(frontmatter.people),
      ...prefixedItemIds(frontmatter.items, "person"),
    ],
    places: [
      ...stringArray(frontmatter.places),
      ...prefixedItemIds(frontmatter.items, "place"),
    ],
    files: [
      ...stringArray(frontmatter.files),
      ...prefixedItemIds(frontmatter.items, "file"),
    ],
    tags: stringArray(frontmatter.tags),
    cover: optionalString(frontmatter.cover),
  };
}

function buildGraph(
  entries: LafEntry[],
  collections: LafCollection[],
): LafEntityGraph {
  return {
    entryPeople: Object.fromEntries(
      entries.map((entry) => [entry.id, entry.people]),
    ),
    entryPlaces: Object.fromEntries(
      entries.map((entry) => [entry.id, entry.places]),
    ),
    entryFiles: Object.fromEntries(
      entries.map((entry) => [entry.id, entry.files]),
    ),
    entryCollections: Object.fromEntries(
      entries.map((entry) => [entry.id, entry.collections]),
    ),
    collectionEntries: Object.fromEntries(
      collections.map((collection) => [collection.id, collection.entries]),
    ),
  };
}

function warnForDuplicateEntityIds(
  entities: LafEntity[],
  warnings: LafWarning[],
): void {
  const ids = new Map<string, LafEntity[]>();

  for (const entity of entities) {
    const matches = ids.get(entity.id) ?? [];
    matches.push(entity);
    ids.set(entity.id, matches);
  }

  for (const [id, matches] of ids.entries()) {
    if (matches.length > 1) {
      warnings.push({
        code: "duplicate_entity_id",
        message: `Multiple entities use id "${id}".`,
        details: {
          id,
          paths: matches.map((entity) => entity.sourcePath),
        },
      });
    }
  }
}

function warnForMissingReferences(
  archive: {
    entries: LafEntry[];
    people: LafPerson[];
    places: LafPlace[];
    collections: LafCollection[];
  },
  files: LafFileAsset[],
  warnings: LafWarning[],
): void {
  const peopleIds = new Set(archive.people.map((person) => person.id));
  const placeIds = new Set(archive.places.map((place) => place.id));
  const entryIds = new Set(archive.entries.map((entry) => entry.id));
  const collectionIds = new Set(
    archive.collections.map((collection) => collection.id),
  );
  const fileNames = new Set(files.map((file) => file.filename.toLowerCase()));

  for (const entry of archive.entries) {
    warnMissing(entry.people, peopleIds, "person", entry.sourcePath, warnings);
    warnMissing(entry.places, placeIds, "place", entry.sourcePath, warnings);
    warnMissing(entry.collections, collectionIds, "collection", entry.sourcePath, warnings);
    warnMissingFiles(entry.files, fileNames, entry.sourcePath, warnings);
  }

  for (const collection of archive.collections) {
    warnMissing(collection.entries, entryIds, "entry", collection.sourcePath, warnings);
    warnMissing(collection.people, peopleIds, "person", collection.sourcePath, warnings);
    warnMissing(collection.places, placeIds, "place", collection.sourcePath, warnings);
    warnMissingFiles(collection.files, fileNames, collection.sourcePath, warnings);
  }
}

function warnMissing(
  references: string[],
  knownIds: Set<string>,
  type: LafEntityType,
  sourcePath: string,
  warnings: LafWarning[],
): void {
  for (const id of references) {
    if (!knownIds.has(id)) {
      warnings.push({
        code: "missing_reference",
        message: `${sourcePath} references missing ${type} "${id}".`,
        path: sourcePath,
        details: { type, id },
      });
    }
  }
}

function warnMissingFiles(
  filenames: string[],
  knownFilenames: Set<string>,
  sourcePath: string,
  warnings: LafWarning[],
): void {
  for (const filename of filenames) {
    if (!knownFilenames.has(filename.toLowerCase())) {
      warnings.push({
        code: "missing_reference",
        message: `${sourcePath} references missing file "${filename}".`,
        path: sourcePath,
        details: { type: "file", filename },
      });
    }
  }
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
}

function booleanValue(value: unknown): boolean {
  return value === true;
}

function prefixedItemIds(value: unknown, prefix: string): string[] {
  return stringArray(value)
    .filter((item) => item.startsWith(`${prefix}:`))
    .map((item) => item.slice(prefix.length + 1));
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function stripMarkdownExtension(filePath: string): string {
  return toArchivePath(filePath).replace(/\.md$/i, "");
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function compareDatedEntities(a: LafEntry, b: LafEntry): number {
  return (b.date ?? "").localeCompare(a.date ?? "");
}

function compareNamedEntities(
  a: LafPerson | LafPlace,
  b: LafPerson | LafPlace,
): number {
  return a.name.localeCompare(b.name);
}

function compareCollectionEntities(
  a: LafCollection,
  b: LafCollection,
): number {
  const posComparison = compareOptionalNumbers(a.pos, b.pos);

  if (posComparison !== 0) {
    return posComparison;
  }

  return a.title.localeCompare(b.title);
}

function compareOptionalNumbers(
  a: number | undefined,
  b: number | undefined,
): number {
  if (a === undefined && b === undefined) {
    return 0;
  }

  if (a === undefined) {
    return 1;
  }

  if (b === undefined) {
    return -1;
  }

  return a - b;
}
