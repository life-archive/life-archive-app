import type { LafArchiveLabels } from "./types";

export type ResolvedArchiveLabels = {
  collection: string;
  collections: string;
};

export function resolveArchiveLabels(
  labels?: LafArchiveLabels,
): ResolvedArchiveLabels {
  return {
    collection: labels?.collection?.trim() || "Collection",
    collections: labels?.collections?.trim() || "Collections",
  };
}
