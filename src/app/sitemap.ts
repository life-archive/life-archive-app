import type { MetadataRoute } from "next";

import { getSiteUrlFromRequest, tryOpenSiteArchive } from "./archiveSelection";
import { manifestSiteUrl } from "./pageMetadata";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return [];
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();
  const siteUrl =
    (await getSiteUrlFromRequest(manifestSiteUrl(manifest))) ??
    "http://localhost:3000";
  const staticRoutes = ["/", "/entries", "/albums", "/collections"];
  const entryRoutes = archive
    .getEntries()
    .map((entry) => `/entries/${encodeURIComponent(entry.id)}`);
  const albumRoutes = archive
    .getAlbums()
    .map((album) => `/albums/${encodeURIComponent(album.id)}`);
  const collectionRoutes = archive
    .getCollections()
    .filter((collection) => collection.kind === "board")
    .map((collection) => `/collections/${encodeURIComponent(collection.id)}`);

  return [
    ...staticRoutes,
    ...entryRoutes,
    ...albumRoutes,
    ...collectionRoutes,
  ].map((route) => ({
    url: absoluteUrl(siteUrl, route),
  }));
}

function absoluteUrl(siteUrl: string, route: string) {
  return new URL(route, siteUrl).toString();
}
