import Image from "next/image";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileText, ImageIcon } from "lucide-react";

import {
  tryOpenArchive,
  type LafCollection,
  type LafEntry,
  type LafFileAsset,
} from "@/lib/life";
import { rendererDefaults } from "@/defaults";

import { getSiteUrlFromRequest, tryOpenSiteArchive } from "../../archiveSelection";
import { ArchiveUnavailable } from "../../ArchiveUnavailable";
import { ArchivePageFooter } from "../../ArchivePageFooter";
import { ArchiveNav } from "../../ArchiveNav";
import { elevatedCardLink, pillActionLink } from "../../design";
import { I18nProvider, T } from "../../i18n/I18nProvider";
import {
  archivePageMetadata,
  archiveUnavailableMetadata,
  manifestSiteUrl,
} from "../../pageMetadata";

const imageExtensions = new Set(["gif", "jpg", "jpeg", "png", "svg", "webp"]);

type CollectionPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: CollectionPageProps) {
  const { id } = await params;
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return archiveUnavailableMetadata();
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();
  const collection = archive.getCollection(id);
  const coverFile = collection
    ? getCoverFile(collection, archive.getFiles())
    : undefined;

  return archivePageMetadata(
    manifest.title,
    collection?.title ?? "Collection not found",
    "Collection",
    {
      canonical: `/collections/${encodeURIComponent(id)}`,
      description: collection
        ? collection.description || firstMarkdownLine(collection.body.markdown)
        : undefined,
      image: coverFile ? fileSrc(coverFile) : undefined,
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

  return archive
    .getCollections()
    .filter((collection) => collection.kind === "board")
    .map((collection) => ({
      id: collection.id,
    }));
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params;
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return <ArchiveUnavailable error={archiveResult.error} />;
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();
  const collection = archive.getCollection(id);

  if (!collection || collection.kind !== "board") {
    notFound();
  }

  const entries = collection.entries
    .map((entryId) => archive.getEntry(entryId))
    .filter((entry): entry is LafEntry => Boolean(entry));

  const files = collection.files
    .map((filename) => archive.resolveFile(filename))
    .filter((file): file is LafFileAsset => Boolean(file));

  const imageFiles = files.filter(isImageFile);
  const coverFile = getCoverFile(collection, archive.getFiles()) ?? imageFiles[0];
  const heroImage = coverFile
    ? fileSrc(coverFile)
    : rendererDefaults.fallbackImages.collection;
  const description =
    collection.description || firstMarkdownLine(collection.body.markdown);

  return (
    <I18nProvider defaultLocale={manifest.language}>
    <main className="min-h-screen bg-page text-ink">
      <ArchiveNav
        active="collections"
        showCollections={archive.getCollections().length > 0}
        title={manifest.title}
      />

      <header className="relative min-h-[520px] overflow-hidden bg-photo-shell text-white">
        <Image
          alt={`${collection.title} collection cover`}
          className="object-cover opacity-80"
          fill
          priority
          sizes="100vw"
          src={heroImage}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.76)_0%,rgba(0,0,0,0.46)_46%,rgba(0,0,0,0.12)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="relative mx-auto flex min-h-[520px] max-w-[1440px] items-end px-5 py-6 lg:px-8 lg:py-8">
          <div className="max-w-[1240px] pb-4">
            <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/64">
              <T k="common.collection" />
            </p>
            <h1 className="mt-4 font-serif text-[clamp(4rem,9vw,8.5rem)] font-semibold leading-[0.9] tracking-[-0.04em]">
              {collection.title}
            </h1>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[14px] leading-[1.7] text-white/72">
              <span>
                <T
                  k="common.entriesCount"
                  values={{ count: entries.length.toLocaleString() }}
                />
              </span>
              <span>
                <T
                  k="common.filesCount"
                  values={{ count: files.length.toLocaleString() }}
                />
              </span>
              {collection.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-[1440px]">
          <NextLink
            className={pillActionLink}
            href="/collections"
          >
            <T k="common.collections" />
          </NextLink>

          <h2 className="mt-8 max-w-[1120px] font-serif text-[clamp(3rem,6vw,5.5rem)] font-semibold leading-[0.96] tracking-[-0.04em] text-ink">
            {description}
          </h2>

          {collection.body.html && (
            <div
              className="entry-body mt-7 max-w-[820px] text-[18px] leading-[1.75] text-prose"
              dangerouslySetInnerHTML={{ __html: collection.body.html }}
            />
          )}
        </div>
      </section>

      {(entries.length > 0 || imageFiles.length > 0) && (
        <section className="border-t border-border px-5 py-8 lg:px-8 lg:py-10">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-12">
            {entries.length > 0 && (
              <section>
                <div className="mb-5 flex items-center gap-2 text-ink">
                  <FileText aria-hidden="true" size={18} strokeWidth={1.8} />
                  <h2 className="text-[22px] font-semibold leading-tight">
                    <T k="common.entries" />
                  </h2>
                </div>
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <NextLink
                      className={`${elevatedCardLink} p-5`}
                      href={`/entries/${entry.id}`}
                      key={entry.id}
                    >
                      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                        {entry.date && <span>{formatDate(entry.date)}</span>}
                        {entry.kind && <span>{entry.kind}</span>}
                      </div>
                      <h3 className="font-serif text-[30px] font-semibold leading-[1.06] tracking-[-0.02em] text-ink">
                        {entry.title}
                      </h3>
                      {entry.body.markdown && (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
                          {firstMarkdownLine(entry.body.markdown)}
                        </p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink">
                        <T k="common.readEntry" />
                        <ArrowRight
                          aria-hidden="true"
                          className="transition group-hover:translate-x-0.5"
                          size={15}
                          strokeWidth={1.8}
                        />
                      </span>
                    </NextLink>
                  ))}
                </div>
              </section>
            )}

            {imageFiles.length > 0 && (
              <section>
                <div className="mb-5 flex items-center gap-2 text-ink">
                  <ImageIcon aria-hidden="true" size={18} strokeWidth={1.8} />
                  <h2 className="text-[22px] font-semibold leading-tight">
                    <T k="common.files" />
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {imageFiles.map((file) => (
                    <a
                      className="group relative block aspect-square cursor-pointer overflow-hidden rounded-[10px] bg-photo-shell"
                      href={fileSrc(file)}
                      key={file.id}
                    >
                      <Image
                        alt={`${collection.title} file: ${file.filename}`}
                        className="object-cover opacity-95 transition duration-500 group-hover:scale-105"
                        fill
                        sizes="(min-width: 1280px) 25vw, 50vw"
                        src={fileSrc(file)}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                        <p className="truncate text-sm font-medium text-white">
                          {file.filename}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>
      )}
      <ArchivePageFooter title={manifest.title} />
    </main>
    </I18nProvider>
  );
}

function getCoverFile(collection: LafCollection, files: LafFileAsset[]) {
  const cover = collection.cover?.replace(/^file:/, "");

  if (!cover) {
    return undefined;
  }

  return files.find((file) => matchesFileReference(file, cover));
}

function matchesFileReference(file: LafFileAsset, reference: string) {
  const normalized = reference.replace(/^files\//, "");

  return file.relativePath === normalized || file.filename === normalized;
}

function isImageFile(file: LafFileAsset) {
  return imageExtensions.has(file.extension);
}

function firstMarkdownLine(markdown: string) {
  return (
    markdown
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0 && !line.startsWith("#")) ??
    "A curated collection from this archive."
  );
}

function fileSrc(file: LafFileAsset) {
  return `/life-files/${file.relativePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
