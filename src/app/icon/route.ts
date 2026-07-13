import { readFile } from "node:fs/promises";
import path from "node:path";

import { tryOpenArchive } from "@/lib/life";
import { resolveArchivePath, resolveWithin } from "@/lib/life/paths";
import { rendererDefaults } from "@/defaults";
import { getArchivePathForRequest } from "../archiveSelection";

export async function GET(request: Request) {
  const archivePath = getArchivePathForRequest(request);
  const archiveResult = await tryOpenArchive(archivePath);
  const favicon = archiveResult.ok
    ? archiveResult.archive.resolveFile("favicon.ico")
    : undefined;

  if (favicon) {
    try {
      const filesRoot = resolveWithin(resolveArchivePath(archivePath), "files");
      const faviconPath = resolveWithin(filesRoot, favicon.relativePath);
      const body = await readFile(faviconPath);

      return new Response(body, {
        headers: {
          "Cache-Control": rendererDefaults.cacheControl.icon,
          "Content-Type": "image/x-icon",
        },
      });
    } catch {
      // Fall back to the generic renderer icon.
    }
  }

  const fallbackPath = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "public",
    "laf",
    "favicon.svg",
  );
  const fallback = await readFile(fallbackPath);

  return new Response(fallback, {
    headers: {
      "Cache-Control": rendererDefaults.cacheControl.icon,
      "Content-Type": "image/svg+xml",
    },
  });
}
