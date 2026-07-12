import path from "node:path";
import { readdir, stat } from "node:fs/promises";

import fg from "fast-glob";
import sharp from "sharp";

import type { LafAlbum, LafAlbumFile } from "./types";
import { toArchivePath } from "./files";
import { resolveWithin } from "./paths";

const imageExtensions = new Set(["gif", "jpg", "jpeg", "png", "svg", "webp"]);
const ignoredAlbumFilenames = new Set([".ds_store", "thumbs.db"]);

export async function indexAlbums(archivePath: string): Promise<LafAlbum[]> {
  const albumsRoot = resolveWithin(archivePath, "albums");
  const albumDirs = await readAlbumDirectories(albumsRoot);

  const albums = await Promise.all(
    albumDirs.map(async (folderName) => {
      const albumRoot = resolveWithin(albumsRoot, folderName);
      const files = await indexAlbumFiles(albumRoot, folderName);
      const byteSize = files.reduce((total, file) => total + file.byteSize, 0);

      return {
        id: slugFromFolderName(folderName),
        title: titleFromFolderName(folderName),
        sourcePath: toArchivePath(path.join("albums", folderName)),
        relativePath: toArchivePath(folderName),
        files,
        cover: files.find(isImageAlbumFile) ?? files[0],
        byteSize,
      };
    }),
  );

  return albums.sort((a, b) => a.title.localeCompare(b.title));
}

async function readAlbumDirectories(albumsRoot: string): Promise<string[]> {
  try {
    const entries = await readdir(albumsRoot, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

async function indexAlbumFiles(
  albumRoot: string,
  albumFolderName: string,
): Promise<LafAlbumFile[]> {
  const filePaths = await fg("**/*", {
    cwd: albumRoot,
    onlyFiles: true,
    dot: true,
    suppressErrors: true,
  });

  const files = await Promise.all(
    filePaths.filter(isAlbumImagePath).map(async (relativePath) => {
      const absolutePath = resolveWithin(albumRoot, relativePath);
      const stats = await stat(absolutePath);
      const filename = path.basename(relativePath);
      const extension = path.extname(filename).slice(1).toLowerCase();
      const albumRelativePath = toArchivePath(path.join(albumFolderName, relativePath));
      const dimensions = imageExtensions.has(extension)
        ? await readImageDimensions(absolutePath)
        : {};

      return {
        id: albumRelativePath,
        filename,
        extension,
        sourcePath: toArchivePath(path.join("albums", albumFolderName, relativePath)),
        relativePath: albumRelativePath,
        byteSize: stats.size,
        ...dimensions,
      };
    }),
  );

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function isAlbumImagePath(relativePath: string): boolean {
  const filename = path.basename(relativePath).toLowerCase();

  if (ignoredAlbumFilenames.has(filename)) {
    return false;
  }

  return imageExtensions.has(path.extname(filename).slice(1).toLowerCase());
}

function isImageAlbumFile(file: LafAlbumFile): boolean {
  return imageExtensions.has(file.extension);
}

async function readImageDimensions(
  absolutePath: string,
): Promise<Pick<LafAlbumFile, "width" | "height">> {
  try {
    const metadata = await sharp(absolutePath).metadata();

    if (metadata.width && metadata.height) {
      return {
        width: metadata.width,
        height: metadata.height,
      };
    }
  } catch {
    return {};
  }

  return {};
}

function titleFromFolderName(folderName: string): string {
  return folderName
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugFromFolderName(folderName: string): string {
  return folderName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
