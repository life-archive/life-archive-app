import path from "node:path";
import { stat } from "node:fs/promises";

import fg from "fast-glob";

import type { LafFileAsset, LafWarning } from "./types";
import { resolveWithin } from "./paths";

export async function indexFileAssets(
  archivePath: string,
  referencedFiles: {
    entries: Record<string, string[]>;
    collections: Record<string, string[]>;
  },
): Promise<{
  files: LafFileAsset[];
  filesByName: Map<string, LafFileAsset>;
  warnings: LafWarning[];
}> {
  const filesRoot = resolveWithin(archivePath, "files");
  const filePaths = await fg("**/*", {
    cwd: filesRoot,
    onlyFiles: true,
    dot: true,
    suppressErrors: true,
  });

  const files: LafFileAsset[] = await Promise.all(
    filePaths.map(async (relativePath) => {
      const absolutePath = resolveWithin(filesRoot, relativePath);
      const stats = await stat(absolutePath);
      const filename = path.basename(relativePath);

      return {
        id: relativePath.split(path.sep).join("/"),
        filename,
        extension: path.extname(filename).slice(1).toLowerCase(),
        sourcePath: toArchivePath(path.join("files", relativePath)),
        relativePath: toArchivePath(relativePath),
        byteSize: stats.size,
        references: {
          entries: ownersForFile(filename, referencedFiles.entries),
          collections: ownersForFile(filename, referencedFiles.collections),
        },
      };
    }),
  );

  const warnings: LafWarning[] = [];
  const filesByName = new Map<string, LafFileAsset>();
  const seen = new Map<string, LafFileAsset[]>();

  for (const file of files) {
    const key = file.filename.toLowerCase();
    const matches = seen.get(key) ?? [];
    matches.push(file);
    seen.set(key, matches);

    if (!filesByName.has(key)) {
      filesByName.set(key, file);
    }
  }

  for (const [filename, matches] of seen.entries()) {
    if (matches.length > 1) {
      warnings.push({
        code: "duplicate_file_name",
        message: `Multiple files named "${filename}" exist. The first match will be used for filename resolution.`,
        details: {
          filename,
          paths: matches.map((file) => file.sourcePath),
          selected: matches[0]?.sourcePath,
        },
      });
    }
  }

  return {
    files: files.sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
    filesByName,
    warnings,
  };
}

export function toArchivePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function ownersForFile(
  filename: string,
  owners: Record<string, string[]>,
): string[] {
  const key = filename.toLowerCase();

  return Object.entries(owners)
    .filter(([, filenames]) =>
      filenames.some((candidate) => candidate.toLowerCase() === key),
    )
    .map(([id]) => id);
}
