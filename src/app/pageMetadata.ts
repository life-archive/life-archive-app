import type { Metadata } from "next";

type ArchiveMetadataOptions = {
  canonical?: string;
  description?: string;
  image?: string;
  siteUrl?: string;
};

export function archiveHomeMetadata(
  title: string,
  options: ArchiveMetadataOptions = {},
): Metadata {
  return {
    ...baseMetadata(title, options),
    alternates: { canonical: "/" },
  };
}

export function archivePageMetadata(
  archiveTitle: string,
  pageTitle: string,
  pageType?: string,
  options: ArchiveMetadataOptions = {},
): Metadata {
  const scopedTitle = pageType ? `${pageTitle} : ${pageType}` : pageTitle;

  return baseMetadata(`${scopedTitle} | ${archiveTitle}`, options);
}

export function archiveUnavailableMetadata(): Metadata {
  return {
    robots: {
      follow: false,
      index: false,
    },
    title: "Archive validation failed",
  };
}

export function manifestSiteUrl(manifest: Record<string, unknown>) {
  const value =
    stringField(manifest, "website") ??
    stringField(manifest, "site") ??
    stringField(manifest, "url");

  return normalizeSiteUrl(value);
}

function baseMetadata(
  title: string,
  { canonical, description, image, siteUrl }: ArchiveMetadataOptions,
): Metadata {
  const images = image ? [{ url: image, alt: title }] : undefined;

  return {
    alternates: canonical ? { canonical } : undefined,
    description,
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    openGraph: {
      description,
      images,
      title,
      type: "website",
      url: canonical,
    },
    robots: {
      follow: true,
      index: true,
    },
    title,
    twitter: {
      card: image ? "summary_large_image" : "summary",
      description,
      images: image ? [image] : undefined,
      title,
    },
  };
}

function stringField(manifest: Record<string, unknown>, key: string) {
  const value = manifest[key];

  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function normalizeSiteUrl(value: string | undefined) {
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
