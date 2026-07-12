import path from "node:path";
import { readFile } from "node:fs/promises";

import { rendererDefaults } from "@/defaults";
import { resolveArchivePath, resolveWithin } from "@/lib/life/paths";
import {
  redirectToImageFallback,
  requestAcceptsImage,
} from "@/app/imageFallback";

const filesRoot = resolveWithin(resolveArchivePath(), "files");

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
  const requestedPath = params.path.join("/");

  try {
    const filePath = resolveWithin(filesRoot, requestedPath);
    const body = await readFile(filePath);
    const extension = path.extname(filePath).slice(1).toLowerCase();

    return new Response(body, {
      headers: {
        "Cache-Control": rendererDefaults.cacheControl.asset,
        "Content-Type": contentTypes[extension] ?? "application/octet-stream",
      },
    });
  } catch {
    if (requestAcceptsImage(request)) {
      return redirectToImageFallback(request, rendererDefaults.fallbackImages.hero);
    }

    return new Response("Not found", { status: 404 });
  }
}
