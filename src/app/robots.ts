import type { MetadataRoute } from "next";

import { tryOpenArchive } from "@/lib/life";

import { manifestSiteUrl } from "./pageMetadata";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const archiveResult = await tryOpenArchive();
  const siteUrl = archiveResult.ok
    ? siteUrlFromManifest(archiveResult.archive.getManifest())
    : siteUrlFromEnvironment() ?? "http://localhost:3000";

  return {
    rules: {
      allow: "/",
      userAgent: "*",
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
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
