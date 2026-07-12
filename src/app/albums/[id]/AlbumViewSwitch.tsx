"use client";

import { useEffect, useState } from "react";

import { useI18n } from "../../i18n/I18nProvider";
import type { TranslationKey } from "../../i18n/dictionaries";

export type AlbumViewMode = "masonry" | "grid" | "book";

export const albumViewChangeEvent = "laf:album-view-change";

export function dispatchAlbumViewChange(mode: AlbumViewMode) {
  window.dispatchEvent(
    new CustomEvent<AlbumViewMode>(albumViewChangeEvent, {
      detail: mode,
    }),
  );
}

export function AlbumViewSwitch() {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<AlbumViewMode>("masonry");
  const viewModes: Array<{
    labelKey: TranslationKey;
    mode: AlbumViewMode;
  }> = [
    { mode: "masonry", labelKey: "album.viewMasonry" },
    { mode: "grid", labelKey: "album.viewGrid" },
    { mode: "book", labelKey: "album.viewBook" },
  ];

  useEffect(() => {
    function onViewModeChange(event: Event) {
      const mode = (event as CustomEvent<AlbumViewMode>).detail;

      if (mode === "masonry" || mode === "grid" || mode === "book") {
        setViewMode(mode);
      }
    }

    window.addEventListener(albumViewChangeEvent, onViewModeChange);

    return () => {
      window.removeEventListener(albumViewChangeEvent, onViewModeChange);
    };
  }, []);

  function selectViewMode(mode: AlbumViewMode) {
    setViewMode(mode);
    dispatchAlbumViewChange(mode);
  }

  return (
    <div
      aria-label={t("album.view")}
      className="inline-flex w-fit rounded-full border border-white/20 bg-overlay-control-dark p-1 text-[13px] font-medium text-white/76 shadow-switch backdrop-blur-md"
      role="group"
    >
      {viewModes.map(({ labelKey, mode }) => (
        <button
          aria-pressed={viewMode === mode}
          className={`h-8 cursor-pointer rounded-full px-3 capitalize transition ${
            viewMode === mode
              ? "bg-page text-ink"
              : "hover:bg-overlay-control hover:text-white"
          }`}
          key={mode}
          onClick={() => selectViewMode(mode)}
          type="button"
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
