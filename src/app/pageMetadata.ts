import type { Metadata } from "next";

export function archiveHomeMetadata(title: string): Metadata {
  return {
    alternates: {
      canonical: "/",
    },
    robots: {
      follow: true,
      index: true,
    },
    title,
  };
}

export function archivePageMetadata(
  archiveTitle: string,
  pageTitle: string,
  pageType?: string,
): Metadata {
  const scopedTitle = pageType ? `${pageTitle} : ${pageType}` : pageTitle;

  return {
    robots: {
      follow: true,
      index: true,
    },
    title: `${scopedTitle} | ${archiveTitle}`,
  };
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
