import "server-only";

import { rendererDefaults } from "@/defaults";

export type ArchiveRoutingMode = "single" | "multi-host";

export const rendererConfig = {
  archivePath: readOptionalValue(
    process.env.LAF_ARCHIVE_PATH,
    rendererDefaults.archivePath,
  ),
  archiveRouting: {
    mode: readArchiveRoutingMode(
      process.env.NEXT_PUBLIC_LAF_ARCHIVE_ROUTING_MODE,
    ),
    hosts: readArchiveHosts(process.env.LAF_ARCHIVE_HOSTS),
  },
  systemPath: readOptionalValue(
    process.env.LAF_SYSTEM_PATH,
    rendererDefaults.systemPath,
  ),
} as const;

function readOptionalValue(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function readArchiveRoutingMode(
  value: string | undefined,
): ArchiveRoutingMode {
  const mode = value?.trim() || rendererDefaults.archiveRouting.mode;

  if (mode === "single" || mode === "multi-host") {
    return mode;
  }

  throw new Error(
    `Invalid NEXT_PUBLIC_LAF_ARCHIVE_ROUTING_MODE: ${JSON.stringify(mode)}. ` +
      'Expected "single" or "multi-host".',
  );
}

function readArchiveHosts(value: string | undefined): Record<string, string> {
  if (!value?.trim()) {
    return rendererDefaults.archiveRouting.hosts;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("LAF_ARCHIVE_HOSTS must be a valid JSON object.");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    Object.values(parsed).some((archivePath) => typeof archivePath !== "string")
  ) {
    throw new Error(
      "LAF_ARCHIVE_HOSTS must map hostnames to archive path strings.",
    );
  }

  return parsed as Record<string, string>;
}
