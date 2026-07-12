import { readFile } from "node:fs/promises";

import {
  getAlbumThumbnail,
  normalizeThumbnailWidth,
} from "@/lib/life";
import { rendererDefaults } from "@/defaults";
import { redirectToImageFallback } from "@/app/imageFallback";

const thumbnailExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  const [widthSegment, ...filePathSegments] = params.path;
  const requestedPath = filePathSegments.join("/");
  const width = normalizeThumbnailWidth(widthSegment);
  const filename = filePathSegments.at(-1) ?? "";
  const extension = filename.split(".").at(-1)?.toLowerCase() ?? "";

  if (!thumbnailExtensions.has(extension) || requestedPath.length === 0) {
    return redirectToImageFallback(request);
  }

  try {
    const thumbnail = await getAlbumThumbnail(
      {
        extension,
        relativePath: requestedPath,
      },
      { width },
    );
    const body = await readFile(thumbnail.path);

    return new Response(body, {
      headers: {
        "Cache-Control": rendererDefaults.cacheControl.asset,
        "Content-Type": thumbnail.contentType,
      },
    });
  } catch {
    return redirectToImageFallback(request);
  }
}
