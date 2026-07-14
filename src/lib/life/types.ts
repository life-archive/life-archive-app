import type { LafTheme } from "./themes";

export const LAF_ENTITY_TYPES = [
  "entry",
  "person",
  "place",
  "collection",
] as const;

export type LafEntityType = (typeof LAF_ENTITY_TYPES)[number];

export type LafWarningCode =
  | "archive_missing_folder"
  | "duplicate_entity_id"
  | "duplicate_file_name"
  | "invalid_entity"
  | "missing_reference"
  | "unexpected_entity_type";

export type LafWarning = {
  code: LafWarningCode;
  message: string;
  path?: string;
  details?: Record<string, unknown>;
};

export type LafArchiveManifest = {
  format: string;
  title: string;
  owner?: string;
  language?: string;
  theme?: LafTheme;
  [key: string]: unknown;
};

export type LafMarkdownDocument = {
  markdown: string;
  html: string;
};

export type LafBaseEntity = {
  id: string;
  type: LafEntityType;
  sourcePath: string;
  slug: string;
  body: LafMarkdownDocument;
  metadata: Record<string, unknown>;
};

export type LafEntry = LafBaseEntity & {
  type: "entry";
  kind?: string;
  title: string;
  date?: string;
  people: string[];
  places: string[];
  files: string[];
  collections: string[];
  tags: string[];
};

export type LafPerson = LafBaseEntity & {
  type: "person";
  name: string;
};

export type LafPlace = LafBaseEntity & {
  type: "place";
  name: string;
};

export type LafCollection = LafBaseEntity & {
  type: "collection";
  kind?: string;
  title: string;
  description?: string;
  layout?: string;
  pos?: number;
  featured: boolean;
  items: string[];
  entries: string[];
  people: string[];
  places: string[];
  files: string[];
  tags: string[];
  // Optional explicit cover image
  cover?: string;
};

export type LafEntity = LafEntry | LafPerson | LafPlace | LafCollection;

export type LafFileAsset = {
  id: string;
  filename: string;
  extension: string;
  sourcePath: string;
  relativePath: string;
  byteSize: number;
  references: {
    entries: string[];
    collections: string[];
  };
};

export type LafAlbumFile = {
  id: string;
  filename: string;
  extension: string;
  sourcePath: string;
  relativePath: string;
  byteSize: number;
  width?: number;
  height?: number;
};

export type LafAlbum = {
  id: string;
  title: string;
  sourcePath: string;
  relativePath: string;
  files: LafAlbumFile[];
  cover?: LafAlbumFile;
  byteSize: number;
};

export type LafEntityGraph = {
  entryPeople: Record<string, string[]>;
  entryPlaces: Record<string, string[]>;
  entryFiles: Record<string, string[]>;
  entryCollections: Record<string, string[]>;
  collectionEntries: Record<string, string[]>;
};

export type LafArchiveJSON = {
  manifest: LafArchiveManifest;
  readme?: LafMarkdownDocument & {
    sourcePath: string;
  };
  entries: LafEntry[];
  people: LafPerson[];
  places: LafPlace[];
  collections: LafCollection[];
  albums: LafAlbum[];
  files: LafFileAsset[];
  graph: LafEntityGraph;
  warnings: LafWarning[];
};
