import "server-only";

import { headers } from "next/headers";

import { tryOpenArchive } from "@/lib/life";
import { rendererConfig } from "@/rendererConfig";

const archiveRouting = rendererConfig.archiveRouting;

export async function tryOpenSiteArchive() {
  return tryOpenArchive(await getSiteArchivePath());
}

export function tryOpenDefaultArchive() {
  return tryOpenArchive(rendererConfig.archivePath);
}

export async function getSiteArchivePath() {
  if (archiveRouting.mode !== "multi-host") {
    return rendererConfig.archivePath;
  }

  return getArchivePathForHeaders(await headers());
}

export function getArchivePathForRequest(request: Request) {
  if (archiveRouting.mode !== "multi-host") {
    return rendererConfig.archivePath;
  }

  return getArchivePathForHeaders(request.headers);
}

export async function getSiteUrlFromRequest(fallback?: string) {
  if (archiveRouting.mode !== "multi-host" && rendererConfig.siteUrl) {
    return rendererConfig.siteUrl;
  }

  const headerList = await headers();
  const siteUrl = siteUrlFromRequestHeaders(
    firstHeaderValue(headerList.get("x-forwarded-proto")),
    firstHeaderValue(headerList.get("x-forwarded-host")) ??
      firstHeaderValue(headerList.get("host")),
  );

  return siteUrl ?? rendererConfig.siteUrl ?? fallback;
}

export function getSiteUrlFromRouteRequest(
  request: Request,
  fallback?: string,
) {
  if (archiveRouting.mode !== "multi-host" && rendererConfig.siteUrl) {
    return rendererConfig.siteUrl;
  }

  const url = new URL(request.url);
  const siteUrl = siteUrlFromRequestHeaders(
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ??
      url.protocol.replace(/:$/, ""),
    firstHeaderValue(request.headers.get("x-forwarded-host")) ??
      firstHeaderValue(request.headers.get("host")) ??
      url.host,
  );

  return siteUrl ?? rendererConfig.siteUrl ?? fallback;
}

function getArchivePathForHeaders(headerList: Headers) {
  const host = normalizeHost(
    firstHeaderValue(headerList.get("x-forwarded-host")) ??
      firstHeaderValue(headerList.get("host")),
  );

  if (!host) {
    return rendererConfig.archivePath;
  }

  return archiveRouting.hosts[host] ?? rendererConfig.archivePath;
}

function normalizeHost(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/:\d+$/, "");
}

function siteUrlFromRequestHeaders(
  protocolValue: string | undefined,
  hostValue: string | undefined,
) {
  if (!hostValue) {
    return undefined;
  }

  const protocol = protocolValue === "http" ? "http" : "https";
  const host = hostValue.trim().toLowerCase().replace(/\.$/, "");

  try {
    const url = new URL(`${protocol}://${host}`);

    return url.origin;
  } catch {
    return undefined;
  }
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || undefined;
}
