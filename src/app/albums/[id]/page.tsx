import { notFound } from "next/navigation";

import { tryOpenArchive, type LafAlbumFile } from "@/lib/life";
import { rendererDefaults } from "@/defaults";

import { getSiteUrlFromRequest, tryOpenSiteArchive } from "../../archiveSelection";
import { ArchiveImage as Image } from "../../ArchiveImage";
import { ArchiveUnavailable } from "../../ArchiveUnavailable";
import { ArchivePageFooter } from "../../ArchivePageFooter";
import { ArchiveNav } from "../../ArchiveNav";
import { I18nProvider, T } from "../../i18n/I18nProvider";
import {
  archivePageMetadata,
  archiveUnavailableMetadata,
  manifestSiteUrl,
} from "../../pageMetadata";
import { AlbumPhotoGrid } from "./AlbumPhotoGrid";
import { AlbumViewSwitch } from "./AlbumViewSwitch";

const imageExtensions = new Set(["gif", "jpg", "jpeg", "png", "svg", "webp"]);
const thumbnailExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

type AlbumPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: AlbumPageProps) {
  const { id } = await params;
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return archiveUnavailableMetadata();
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();
  const album = archive.getAlbum(id);
  const coverFile =
    album?.cover && isImageFile(album.cover)
      ? album.cover
      : album?.files.find(isImageFile);

  return archivePageMetadata(
    manifest.title,
    album?.title ?? "Album not found",
    "Album",
    {
      canonical: `/albums/${encodeURIComponent(id)}`,
      description: album
        ? `Browse ${album.files.filter(isImageFile).length.toLocaleString()} photos from the ${album.title} album in ${manifest.title}.`
        : undefined,
      image: coverFile ? albumPreviewSrc(coverFile, 1600) : undefined,
      siteUrl: await getSiteUrlFromRequest(manifestSiteUrl(manifest)),
    },
  );
}

export async function generateStaticParams() {
  const archiveResult = await tryOpenArchive();

  if (!archiveResult.ok) {
    return [];
  }

  const archive = archiveResult.archive;

  return archive.getAlbums().map((album) => ({
    id: album.id,
  }));
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params;
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return <ArchiveUnavailable error={archiveResult.error} />;
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();
  const album = archive.getAlbum(id);

  if (!album) {
    notFound();
  }

  const photos = album.files.filter(isImageFile).map((file) => ({
    id: file.id,
    title: `${album.title} photo: ${humanizeFilename(file.filename)}`,
    src: albumFileSrc(file),
    thumbSrc: albumPreviewSrc(file, 960),
    width: file.width,
    height: file.height,
  }));

  const coverFile =
    album.cover && isImageFile(album.cover)
      ? album.cover
      : album.files.find(isImageFile);
  const coverSrc = coverFile
    ? albumPreviewSrc(coverFile, 1600)
    : rendererDefaults.fallbackImages.album;

  return (
    <I18nProvider
      archiveLabels={manifest.labels}
      defaultLocale={manifest.language}
    >
    <main className="min-h-screen bg-page text-ink">
      <ArchiveNav
        active="albums"
        showAlbums={archive.getAlbums().length > 0}
        showCollections={archive.getCollections().length > 0}
        title={manifest.title}
      />
      <header className="relative min-h-[520px] overflow-hidden bg-photo-shell text-white">
        <Image
          alt={`${album.title} album cover`}
          className="object-cover opacity-78"
          fill
          priority
          sizes="100vw"
          src={coverSrc}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.74)_0%,rgba(0,0,0,0.42)_45%,rgba(0,0,0,0.08)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />

        <div className="relative mx-auto flex min-h-[520px] max-w-[1440px] items-end px-5 py-6 lg:px-8 lg:py-8">
          <div className="w-full pb-4">
            <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/64">
              <T k="common.album" />
            </p>
            <h1 className="mt-4 max-w-[880px] font-serif text-[clamp(4rem,9vw,8.5rem)] font-semibold leading-[0.9] tracking-[-0.04em]">
              {album.title}
            </h1>
            <div className="mt-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] leading-[1.7] text-white/72">
                <span>{photos.length.toLocaleString()} photos</span>
                <span>{formatBytes(album.byteSize)}</span>
                <span>{album.sourcePath}</span>
              </div>

              {photos.length > 0 && (
                <AlbumViewSwitch />
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-[1440px]">
          {photos.length > 0 ? (
            <AlbumPhotoGrid photos={photos} />
          ) : (
            <div className="rounded-[8px] border border-border bg-surface p-6 text-[17px] leading-[1.7] text-muted">
              <T k="empty.noPhotos" />
            </div>
          )}
        </div>
      </section>
      <ArchivePageFooter theme={manifest.theme} title={manifest.title} />
    </main>
    </I18nProvider>
  );
}

function isImageFile(file: LafAlbumFile) {
  return imageExtensions.has(file.extension);
}

function albumFileSrc(file: LafAlbumFile) {
  return `/life-albums/${file.relativePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function albumThumbnailSrc(file: LafAlbumFile, width: number) {
  return `/life-album-thumbs/${width}/${file.relativePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function albumPreviewSrc(file: LafAlbumFile, width: number) {
  return thumbnailExtensions.has(file.extension)
    ? albumThumbnailSrc(file, width)
    : albumFileSrc(file);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function humanizeFilename(filename: string) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
