import "server-only";

import crypto from "node:crypto";
import path from "node:path";
import { mkdir, stat } from "node:fs/promises";

import sharp from "sharp";

import { rendererDefaults } from "@/defaults";

import { type LafAlbumFile } from "./types";
import { resolveArchivePath, resolveSystemPath, resolveWithin } from "./paths";

const thumbnailInputExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
type ThumbnailSource = Pick<LafAlbumFile, "extension" | "relativePath">;

export type ThumbnailOptions = {
  archivePath?: string;
  width?: number;
};

export type ThumbnailResult = {
  path: string;
  contentType: string;
};

export async function getAlbumThumbnail(
  file: ThumbnailSource,
  options: ThumbnailOptions = {},
): Promise<ThumbnailResult> {
  if (!thumbnailInputExtensions.has(file.extension)) {
    throw new Error(`Unsupported thumbnail input type: ${file.extension}`);
  }

  const archiveRoot = resolveDefaultArchiveRoot(options.archivePath);
  const albumsRoot = resolveWithin(archiveRoot, "albums");
  const cacheRoot = resolveWithin(
    resolveSystemPath(),
    path.join("cache", "thumbnails", "albums"),
  );
  const sourcePath = resolveWithin(albumsRoot, file.relativePath);
  const sourceStats = await stat(sourcePath);
  const width = normalizeThumbnailWidth(options.width);
  const cacheKey = [
    "proportional-v1",
    sha256(file.relativePath),
    sourceStats.size,
    Math.trunc(sourceStats.mtimeMs),
    width,
  ].join("-");
  const cacheFilePath = resolveWithin(
    cacheRoot,
    path.join(cacheKey.slice(0, 2), `${cacheKey}.jpg`),
  );

  try {
    await stat(cacheFilePath);
  } catch {
    await mkdir(path.dirname(cacheFilePath), { recursive: true });
    await sharp(sourcePath)
      .rotate()
      .resize({
        width,
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 92,
        mozjpeg: true,
      })
      .toFile(cacheFilePath);
  }

  return {
    path: cacheFilePath,
    contentType: "image/jpeg",
  };
}

export function normalizeThumbnailWidth(width: unknown): number {
  const parsed =
    typeof width === "string" || typeof width === "number"
      ? Number(width)
      : 960;

  if (!Number.isFinite(parsed)) {
    return 960;
  }

  return Math.min(2048, Math.max(320, Math.round(parsed)));
}

function resolveDefaultArchiveRoot(
  archivePath: string = rendererDefaults.archivePath,
) {
  return resolveArchivePath(archivePath);
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
