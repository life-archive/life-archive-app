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
  if (archiveRouting.mode !== "multi-host") {
    return fallback;
  }

  const headerList = await headers();
  const protocol = firstHeaderValue(headerList.get("x-forwarded-proto")) ?? "https";
  const host = normalizeHost(
    firstHeaderValue(headerList.get("x-forwarded-host")) ??
      firstHeaderValue(headerList.get("host")),
  );

  return host ? `${protocol}://${host}` : fallback;
}

export function getSiteUrlFromRouteRequest(
  request: Request,
  fallback?: string,
) {
  if (archiveRouting.mode !== "multi-host") {
    return fallback;
  }

  const url = new URL(request.url);
  const host = normalizeHost(
    firstHeaderValue(request.headers.get("x-forwarded-host")) ??
      firstHeaderValue(request.headers.get("host")) ??
      url.host,
  );
  const protocol =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ?? url.protocol.replace(/:$/, "");

  return host ? `${protocol}://${host}` : fallback;
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

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || undefined;
}
