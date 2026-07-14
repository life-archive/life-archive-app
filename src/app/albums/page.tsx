import {
  type LafAlbum,
  type LafAlbumFile,
} from "@/lib/life";
import { rendererDefaults } from "@/defaults";

import { getSiteUrlFromRequest, tryOpenSiteArchive } from "../archiveSelection";
import { ArchiveUnavailable } from "../ArchiveUnavailable";
import { ArchivePageFooter } from "../ArchivePageFooter";
import { ArchiveNav } from "../ArchiveNav";
import { I18nProvider, T } from "../i18n/I18nProvider";
import {
  archivePageMetadata,
  archiveUnavailableMetadata,
  manifestSiteUrl,
} from "../pageMetadata";
import { AlbumCard, type DisplayAlbum } from "./AlbumCard";

const thumbnailExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

export async function generateMetadata() {
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return archiveUnavailableMetadata();
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();

  return archivePageMetadata(manifest.title, "Albums", undefined, {
    canonical: "/albums",
    description: `Browse ${archive.getAlbums().length.toLocaleString()} photo albums from ${manifest.title}.`,
    siteUrl: await getSiteUrlFromRequest(manifestSiteUrl(manifest)),
  });
}

export default async function AlbumsPage() {
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return <ArchiveUnavailable error={archiveResult.error} />;
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();
  const albums = getDisplayAlbums(archive.getAlbums());
  const totalPhotos = albums.reduce((total, album) => total + album.count, 0);

  return (
    <I18nProvider defaultLocale={manifest.language}>
    <main className="min-h-screen bg-page text-ink">
      <ArchiveNav
        active="albums"
        showAlbums={albums.length > 0}
        showCollections={archive.getCollections().length > 0}
        title={manifest.title}
      />
      <section className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-10 max-w-[820px]">
            <h1 className="font-serif text-[clamp(4.5rem,10vw,8rem)] font-semibold leading-[0.9] tracking-[-0.04em]">
              <T k="common.albums" />
            </h1>
            <p className="mt-6 max-w-[680px] text-[22px] leading-[1.45] text-muted">
              {albums.length.toLocaleString()} albums with{" "}
              {totalPhotos.toLocaleString()} photos.
            </p>
          </header>

          {albums.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
              {albums.map((album) => (
                <AlbumCard album={album} key={album.id} />
              ))}
            </div>
          ) : (
            <div className="rounded-[8px] border border-border bg-surface p-6 text-[17px] leading-[1.7] text-muted">
              <T k="empty.noAlbums" />
            </div>
          )}
        </div>
      </section>
      <ArchivePageFooter theme={manifest.theme} title={manifest.title} />
    </main>
    </I18nProvider>
  );
}

function getDisplayAlbums(albums: LafAlbum[]): DisplayAlbum[] {
  return albums.map((album) => ({
    id: album.id,
    title: album.title,
    count: album.files.length,
    image: album.cover
      ? albumPreviewSrc(album.cover, 960)
      : rendererDefaults.fallbackImages.album,
  }));
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
