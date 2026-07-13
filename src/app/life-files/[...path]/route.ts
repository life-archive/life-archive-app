import path from "node:path";

import { rendererDefaults } from "@/defaults";
import { resolveArchivePath, resolveWithin } from "@/lib/life/paths";
import {
  redirectToImageFallback,
  requestAcceptsImage,
} from "@/app/imageFallback";
import { getArchivePathForRequest } from "@/app/archiveSelection";
import { archiveAssetResponse } from "@/app/archiveAssetResponse";

const contentTypes: Record<string, string> = {
  gif: "image/gif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  const requestedPath = stripArchiveCacheKey(params.path).join("/");
  const archivePath = getArchivePathForRequest(request);
  const filesRoot = resolveWithin(resolveArchivePath(archivePath), "files");

  try {
    const filePath = resolveWithin(filesRoot, requestedPath);
    const extension = path.extname(filePath).slice(1).toLowerCase();

    return await archiveAssetResponse(
      request,
      filePath,
      contentTypes[extension] ?? "application/octet-stream",
    );
  } catch {
    if (requestAcceptsImage(request)) {
      return redirectToImageFallback(request, rendererDefaults.fallbackImages.hero);
    }

    return new Response("Not found", { status: 404 });
  }
}

function stripArchiveCacheKey(pathSegments: string[]) {
  return pathSegments[0] === "_archive" && pathSegments.length > 2
    ? pathSegments.slice(2)
    : pathSegments;
}
