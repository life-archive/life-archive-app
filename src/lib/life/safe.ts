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
      timing: ArchiveLoadTiming;
      ok: true;
    }
  | {
      error: ArchiveContentError;
      ok: false;
    };

export type ArchiveLoadTiming = {
  cache: "hit" | "miss";
  durationMs: number;
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
    const result = await openCachedArchive(archivePath);

    return {
      archive: result.archive,
      timing: result.timing,
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

async function openCachedArchive(archivePath?: string): Promise<{
  archive: LifeArchive;
  timing: ArchiveLoadTiming;
}> {
  const startedAt = performance.now();
  const absoluteArchivePath = resolveArchivePath(archivePath);
  const signature = await getArchiveSignature(absoluteArchivePath);
  const cached = archiveCache.get(absoluteArchivePath);

  if (cached?.signature === signature) {
    return {
      archive: cached.archive,
      timing: {
        cache: "hit",
        durationMs: Math.round(performance.now() - startedAt),
      },
    };
  }

  const pending = pendingArchiveLoads.get(absoluteArchivePath);

  if (pending) {
    const pendingEntry = await pending;

    if (pendingEntry.signature === signature) {
      return {
        archive: pendingEntry.archive,
        timing: {
          cache: "miss",
          durationMs: Math.round(performance.now() - startedAt),
        },
      };
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
    return {
      archive: (await load).archive,
      timing: {
        cache: "miss",
        durationMs: Math.round(performance.now() - startedAt),
      },
    };
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
