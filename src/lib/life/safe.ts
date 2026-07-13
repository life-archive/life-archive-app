import "server-only";

import { stat } from "node:fs/promises";
import path from "node:path";

import fg from "fast-glob";

import {
  ArchiveContentError,
  openArchive,
  type LifeArchive,
} from "./archive";
import { resolveArchivePath } from "./paths";

export type ArchiveLoadResult =
  | {
      archive: LifeArchive;
      ok: true;
    }
  | {
      error: ArchiveContentError;
      ok: false;
    };

type ArchiveCacheEntry = {
  archive: LifeArchive;
  signature: string;
};

const archiveCache = new Map<string, ArchiveCacheEntry>();
const pendingArchiveLoads = new Map<string, Promise<ArchiveCacheEntry>>();

export async function tryOpenArchive(
  archivePath?: string,
): Promise<ArchiveLoadResult> {
  try {
    return {
      archive: await openCachedArchive(archivePath),
      ok: true,
    };
  } catch (error) {
    if (error instanceof ArchiveContentError) {
      return {
        error,
        ok: false,
      };
    }

    throw error;
  }
}

async function openCachedArchive(archivePath?: string): Promise<LifeArchive> {
  const absoluteArchivePath = resolveArchivePath(archivePath);
  const signature = await getArchiveSignature(absoluteArchivePath);
  const cached = archiveCache.get(absoluteArchivePath);

  if (cached?.signature === signature) {
    return cached.archive;
  }

  const pending = pendingArchiveLoads.get(absoluteArchivePath);

  if (pending) {
    const pendingEntry = await pending;

    if (pendingEntry.signature === signature) {
      return pendingEntry.archive;
    }
  }

  const load = (async () => {
    const archive = await openArchive(archivePath);
    const entry = {
      archive,
      signature,
    };

    archiveCache.set(absoluteArchivePath, entry);

    return entry;
  })();

  pendingArchiveLoads.set(absoluteArchivePath, load);

  try {
    return (await load).archive;
  } finally {
    pendingArchiveLoads.delete(absoluteArchivePath);
  }
}

async function getArchiveSignature(absoluteArchivePath: string) {
  const files = await fg("**/*", {
    cwd: absoluteArchivePath,
    dot: true,
    onlyFiles: true,
    suppressErrors: true,
  });

  const parts = await Promise.all(
    files.sort().map(async (file) => {
      const stats = await stat(path.join(absoluteArchivePath, file));
      const normalizedPath = file.split(path.sep).join("/");

      return [
        normalizedPath,
        stats.size,
        Math.trunc(stats.mtimeMs),
      ].join(":");
    }),
  );

  return parts.join("|");
}
