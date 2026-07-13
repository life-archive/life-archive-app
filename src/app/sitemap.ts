import type { MetadataRoute } from "next";

import { tryOpenArchive } from "@/lib/life";

import { manifestSiteUrl } from "./pageMetadata";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const archiveResult = await tryOpenArchive();

  if (!archiveResult.ok) {
    return [];
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();
  const siteUrl = siteUrlFromManifest(manifest);
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

function siteUrlFromManifest(manifest: Record<string, unknown>) {
  return (
    manifestSiteUrl(manifest) ??
    siteUrlFromEnvironment() ??
    "http://localhost:3000"
  );
}

function siteUrlFromEnvironment() {
  const value = process.env.NEXT_PUBLIC_SITE_URL;

  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    return `${url.protocol}//${url.host}`;
  } catch {
    return undefined;
  }
}

function absoluteUrl(siteUrl: string, route: string) {
  return new URL(route, siteUrl).toString();
}
