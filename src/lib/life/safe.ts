import "server-only";

import {
  ArchiveContentError,
  openArchive,
  type LifeArchive,
} from "./archive";

export type ArchiveLoadResult =
  | {
      archive: LifeArchive;
      ok: true;
    }
  | {
      error: ArchiveContentError;
      ok: false;
    };

export async function tryOpenArchive(
  archivePath?: string,
): Promise<ArchiveLoadResult> {
  try {
    return {
      archive: await openArchive(archivePath),
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
