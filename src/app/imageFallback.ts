import { rendererDefaults } from "@/defaults";

export function redirectToImageFallback(
  request: Request,
  fallbackPath: string = rendererDefaults.fallbackImages.album,
) {
  return Response.redirect(new URL(fallbackPath, request.url), 302);
}

export function requestAcceptsImage(request: Request) {
  return request.headers.get("accept")?.includes("image/") ?? false;
}
