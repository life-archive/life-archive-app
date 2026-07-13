import {
  getAlbumThumbnail,
  normalizeThumbnailWidth,
} from "@/lib/life";
import { redirectToImageFallback } from "@/app/imageFallback";
import { getArchivePathForRequest } from "@/app/archiveSelection";
import { archiveAssetResponse } from "@/app/archiveAssetResponse";

const thumbnailExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  const [widthSegment, ...filePathSegments] = params.path;
  const requestedPath = filePathSegments.join("/");
  const width = normalizeThumbnailWidth(widthSegment);
  const archivePath = getArchivePathForRequest(request);
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
      { archivePath, width },
    );

    return await archiveAssetResponse(
      request,
      thumbnail.path,
      thumbnail.contentType,
    );
  } catch {
    return redirectToImageFallback(request);
  }
}
