"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  albumViewChangeEvent,
  dispatchAlbumViewChange,
  type AlbumViewMode,
} from "./AlbumViewSwitch";
import { ArchiveImage as Image } from "../../ArchiveImage";
import {
  darkOverlayIconButtonBase,
  overlayIconButton,
} from "../../design";
import { useI18n } from "../../i18n/I18nProvider";

type AlbumPhoto = {
  id: string;
  title: string;
  src: string;
  thumbSrc: string;
  width?: number;
  height?: number;
};

type BookSpread = {
  layout: "solo" | "duo" | "gallery";
  photos: Array<AlbumPhoto & { index: number }>;
};

export function AlbumPhotoGrid({ photos }: { photos: AlbumPhoto[] }) {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<AlbumViewMode>("masonry");
  const [bookSpreadIndex, setBookSpreadIndex] = useState(0);
  const activePhoto = activeIndex === null ? undefined : photos[activeIndex];
  const bookSpreads = useMemo(() => buildBookSpreads(photos), [photos]);

  const controls = useMemo(
    () => ({
      previous: () =>
        setActiveIndex((index) =>
          index === null ? index : (index - 1 + photos.length) % photos.length,
        ),
      next: () =>
        setActiveIndex((index) =>
          index === null ? index : (index + 1) % photos.length,
        ),
      close: () => setActiveIndex(null),
    }),
    [photos.length],
  );

  useEffect(() => {
    if (activeIndex === null && viewMode !== "book") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex, viewMode]);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        controls.close();
      }

      if (event.key === "ArrowLeft") {
        controls.previous();
      }

      if (event.key === "ArrowRight") {
        controls.next();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, controls]);

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

  return (
    <>
      {viewMode === "book" ? (
        <PhotoBookView
          currentSpreadIndex={bookSpreadIndex}
          onClose={() => dispatchAlbumViewChange("masonry")}
          onOpenPhoto={setActiveIndex}
          onSelectSpread={setBookSpreadIndex}
          spreads={bookSpreads}
        />
      ) : viewMode === "masonry" ? (
        <div className="columns-1 gap-5 md:columns-2 2xl:columns-3">
          {photos.map((photo, index) => (
            <button
              className="group mb-5 block w-full break-inside-avoid cursor-pointer overflow-hidden rounded-[8px] bg-media text-left shadow-media ring-1 ring-border transition hover:-translate-y-0.5 hover:shadow-media-hover"
              key={photo.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {/* The archive already serves cached thumbnails here; native image sizing keeps masonry aspect ratios accurate. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={photo.title}
                className="h-auto w-full transition duration-500 group-hover:scale-[1.018]"
                loading="lazy"
                src={photo.thumbSrc}
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
          {photos.map((photo, index) => (
            <button
              className="group relative aspect-square min-h-[400px] cursor-pointer overflow-hidden rounded-[8px] bg-media text-left shadow-media ring-1 ring-border transition hover:-translate-y-0.5 hover:shadow-media-hover"
              key={photo.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <Image
                alt={photo.title}
                className="object-cover transition duration-500 group-hover:scale-[1.025]"
                fill
                sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                src={photo.thumbSrc}
              />
            </button>
          ))}
        </div>
      )}

      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black text-white">
          <div className="absolute inset-0">
            <Image
              alt={activePhoto.title}
              className="object-contain"
              fill
              priority
              sizes="100vw"
              src={activePhoto.src}
            />
          </div>

          <button
            aria-label={t("album.closeSlideshow")}
            className={`absolute right-5 top-5 size-11 ${overlayIconButton}`}
            onClick={controls.close}
            type="button"
          >
            <X aria-hidden="true" size={22} strokeWidth={1.8} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                aria-label={t("album.previousImage")}
                className={`absolute left-5 top-1/2 size-12 -translate-y-1/2 ${overlayIconButton}`}
                onClick={controls.previous}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={28} strokeWidth={1.7} />
              </button>
              <button
                aria-label={t("album.nextImage")}
                className={`absolute right-5 top-1/2 size-12 -translate-y-1/2 ${overlayIconButton}`}
                onClick={controls.next}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={28} strokeWidth={1.7} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

function PhotoBookView({
  currentSpreadIndex,
  onClose,
  onOpenPhoto,
  onSelectSpread,
  spreads,
}: {
  currentSpreadIndex: number;
  onClose: () => void;
  onOpenPhoto: (index: number) => void;
  onSelectSpread: (index: number) => void;
  spreads: BookSpread[];
}) {
  const { t } = useI18n();
  const spread = spreads[currentSpreadIndex] ?? spreads[0];

  const previousSpread = useCallback(() => {
    if (spreads.length === 0) {
      return;
    }

    onSelectSpread(
      (currentSpreadIndex - 1 + spreads.length) % spreads.length,
    );
  }, [currentSpreadIndex, onSelectSpread, spreads.length]);

  const nextSpread = useCallback(() => {
    if (spreads.length === 0) {
      return;
    }

    onSelectSpread((currentSpreadIndex + 1) % spreads.length);
  }, [currentSpreadIndex, onSelectSpread, spreads.length]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft") {
        previousSpread();
      }

      if (event.key === "ArrowRight") {
        nextSpread();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [nextSpread, onClose, previousSpread]);

  if (!spread) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-overlay p-3 text-white sm:p-5">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-4 text-[13px] font-medium text-white/68 sm:mb-4">
        <span>
          {t("album.spreadProgress", {
            current: currentSpreadIndex + 1,
            total: spreads.length,
          })}
        </span>

        <div className="flex items-center gap-2">
          {spreads.length > 1 && (
            <>
              <button
                aria-label={t("album.previousSpread")}
                className={`size-10 ${overlayIconButton}`}
                onClick={previousSpread}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={21} strokeWidth={1.8} />
              </button>
              <button
                aria-label={t("album.nextSpread")}
                className={`size-10 ${overlayIconButton}`}
                onClick={nextSpread}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={21} strokeWidth={1.8} />
              </button>
            </>
          )}
          <button
            aria-label={t("album.closeBook")}
            className={`size-10 ${overlayIconButton}`}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={20} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {spreads.length > 1 && (
          <>
            <button
              aria-label={t("album.previousSpread")}
              className={`absolute left-2 top-1/2 z-10 hidden size-12 -translate-y-1/2 md:grid ${darkOverlayIconButtonBase}`}
              onClick={previousSpread}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={28} strokeWidth={1.7} />
            </button>
            <button
              aria-label={t("album.nextSpread")}
              className={`absolute right-2 top-1/2 z-10 hidden size-12 -translate-y-1/2 md:grid ${darkOverlayIconButtonBase}`}
              onClick={nextSpread}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={28} strokeWidth={1.7} />
            </button>
          </>
        )}

        <div
          className="mx-auto h-full w-full max-w-[1800px] overflow-hidden rounded-[8px] bg-paper p-2 shadow-book ring-1 ring-white/10 sm:p-4 lg:p-5"
          key={`${currentSpreadIndex}-${spread.layout}`}
        >
          <PhotoBookSpread onOpenPhoto={onOpenPhoto} spread={spread} />
        </div>
      </div>
    </div>
  );
}

function PhotoBookSpread({
  onOpenPhoto,
  spread,
}: {
  onOpenPhoto: (index: number) => void;
  spread: BookSpread;
}) {
  if (spread.layout === "solo") {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        <BookPhotoFrame
          className="h-full w-full"
          onOpenPhoto={onOpenPhoto}
          photo={spread.photos[0]}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-wrap content-center items-center justify-center gap-2 overflow-auto sm:gap-4">
      {spread.photos.map((photo) => (
        <BookPhotoFrame
          className="max-h-full min-h-[160px] min-w-[min(100%,180px)]"
          key={photo.id}
          onOpenPhoto={onOpenPhoto}
          photo={photo}
          style={photoFrameStyle(photo, spread.layout)}
        />
      ))}
    </div>
  );
}

function BookPhotoFrame({
  className = "",
  onOpenPhoto,
  photo,
  style,
}: {
  className?: string;
  onOpenPhoto: (index: number) => void;
  photo: BookSpread["photos"][number];
  style?: CSSProperties;
}) {
  return (
    <button
      className={`group flex cursor-pointer items-center justify-center overflow-hidden rounded-[8px] bg-photo-shell ${className}`}
      onClick={() => onOpenPhoto(photo.index)}
      style={style}
      type="button"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={photo.title}
        className="max-h-full max-w-full object-contain transition duration-700 group-hover:scale-[1.018]"
        loading="lazy"
        src={photo.thumbSrc}
      />
    </button>
  );
}

function buildBookSpreads(photos: AlbumPhoto[]): BookSpread[] {
  const indexedPhotos = photos.map((photo, index) => ({ ...photo, index }));
  const spreads: BookSpread[] = [];
  let cursor = 0;

  while (cursor < indexedPhotos.length) {
    const remaining = indexedPhotos.length - cursor;
    const firstPhoto = indexedPhotos[cursor];
    const firstRatio = getPhotoAspectRatio(firstPhoto);
    const size =
      firstRatio > 2.1 || firstRatio < 0.55
        ? 1
        : Math.min(remaining, spreads.length % 3 === 0 ? 2 : 4);
    const photosForSpread = indexedPhotos.slice(cursor, cursor + size);

    spreads.push({
      layout:
        photosForSpread.length === 1
          ? "solo"
          : photosForSpread.length === 2
            ? "duo"
            : "gallery",
      photos: photosForSpread,
    });

    cursor += size;
  }

  return spreads;
}

function photoFrameStyle(
  photo: AlbumPhoto,
  layout: BookSpread["layout"],
): CSSProperties {
  const ratio = getPhotoAspectRatio(photo);
  const basis = layout === "duo" ? ratio * 34 : ratio * 22;

  return {
    aspectRatio: `${ratio}`,
    flexBasis: `${Math.max(14, Math.min(44, basis))}rem`,
    flexGrow: ratio,
  };
}

function getPhotoAspectRatio(photo: AlbumPhoto) {
  if (photo.width && photo.height) {
    return photo.width / photo.height;
  }

  return 4 / 3;
}
