import type { MetadataRoute } from "next";

import { getSiteUrlFromRequest, tryOpenSiteArchive } from "./archiveSelection";
import { manifestSiteUrl } from "./pageMetadata";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const archiveResult = await tryOpenSiteArchive();
  const siteUrl =
    (await getSiteUrlFromRequest(
      archiveResult.ok
        ? manifestSiteUrl(archiveResult.archive.getManifest())
        : undefined,
    )) ?? "http://localhost:3000";

  return {
    rules: {
      allow: "/",
      userAgent: "*",
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
