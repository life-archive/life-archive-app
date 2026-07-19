import type { LafHomeSettings } from "./types";

export type ResolvedHomeSettings = {
  albumLimit: number;
  collectionLimit: number;
  entryLimit: number;
  timelineEntryLimit: number;
};

const homeSettingsFallback: ResolvedHomeSettings = {
  albumLimit: 20,
  collectionLimit: 25,
  entryLimit: 3,
  timelineEntryLimit: 6,
};

export function resolveHomeSettings(
  home?: LafHomeSettings,
): ResolvedHomeSettings {
  return {
    albumLimit: home?.albumLimit ?? homeSettingsFallback.albumLimit,
    collectionLimit:
      home?.collectionLimit ?? homeSettingsFallback.collectionLimit,
    entryLimit: home?.entryLimit ?? homeSettingsFallback.entryLimit,
    timelineEntryLimit:
      home?.timelineEntryLimit ?? homeSettingsFallback.timelineEntryLimit,
  };
}
