import { readFile, stat } from "node:fs/promises";

import { rendererDefaults } from "@/defaults";

export async function archiveAssetResponse(
  request: Request,
  filePath: string,
  contentType: string,
) {
  const stats = await stat(filePath);
  const etag = `W/"${stats.size}-${Math.trunc(stats.mtimeMs)}"`;
  const headers = {
    "Cache-Control": rendererDefaults.cacheControl.asset,
    "Content-Type": contentType,
    ETag: etag,
    "Last-Modified": stats.mtime.toUTCString(),
  };

  if (etagMatches(request.headers.get("if-none-match"), etag)) {
    return new Response(null, { headers, status: 304 });
  }

  return new Response(await readFile(filePath), { headers });
}

function etagMatches(ifNoneMatch: string | null, etag: string) {
  return ifNoneMatch
    ?.split(",")
    .some((candidate) => candidate.trim() === etag || candidate.trim() === "*");
}
