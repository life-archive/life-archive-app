import Link from "next/link";
import { notFound } from "next/navigation";

import { tryOpenArchive, type LafFileAsset } from "@/lib/life";

import { getSiteUrlFromRequest, tryOpenSiteArchive } from "../../archiveSelection";
import { ArchiveUnavailable } from "../../ArchiveUnavailable";
import { ArchivePageFooter } from "../../ArchivePageFooter";
import { ArchiveNav } from "../../ArchiveNav";
import { pillActionLink } from "../../design";
import { I18nProvider, T } from "../../i18n/I18nProvider";
import {
  archivePageMetadata,
  archiveUnavailableMetadata,
  manifestSiteUrl,
} from "../../pageMetadata";

type EntryPageProps = {
  params: Promise<{ id: string }>;
};

const imageExtensions = new Set(["gif", "jpg", "jpeg", "png", "svg", "webp"]);

export async function generateMetadata({ params }: EntryPageProps) {
  const { id } = await params;
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return archiveUnavailableMetadata();
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();
  const entry = archive.getEntry(id);
  const previewFile = entry
    ? entry.files
        .map((filename) => archive.resolveFile(filename))
        .filter((file): file is LafFileAsset => Boolean(file))
        .find((file) => imageExtensions.has(file.extension))
    : undefined;

  return archivePageMetadata(
    manifest.title,
    entry?.title ?? "Entry not found",
    "Entry",
    {
      canonical: `/entries/${encodeURIComponent(id)}`,
      description: entry ? firstLine(entry) : undefined,
      image: previewFile ? fileSrc(previewFile) : undefined,
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

  return archive.getEntries().map((entry) => ({
    id: entry.id,
  }));
}

export default async function EntryPage({ params }: EntryPageProps) {
  const { id } = await params;
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return <ArchiveUnavailable error={archiveResult.error} />;
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();
  const entry = archive.getEntry(id);

  if (!entry) {
    notFound();
  }

  return (
    <I18nProvider defaultLocale={manifest.language}>
    <main className="min-h-screen bg-page text-ink">
      <ArchiveNav
        active="entries"
        showAlbums={archive.getAlbums().length > 0}
        showCollections={archive.getCollections().length > 0}
        title={manifest.title}
      />
      <article className="mx-auto max-w-[820px] px-5 py-6 lg:px-8 lg:py-8">
        <Link
          className={pillActionLink}
          href="/entries"
        >
          <T k="common.entries" />
        </Link>

        <header className="border-b border-border-strong pb-12 pt-16">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] leading-[1.7] text-muted">
            {entry.date && <span>{formatDate(entry.date)}</span>}
            {entry.kind && <span>{entry.kind}</span>}
            {entry.sourcePath && <span>{entry.sourcePath}</span>}
          </div>
          <h1 className="mt-6 font-serif text-[clamp(4rem,8vw,7rem)] font-semibold leading-[0.92] tracking-[-0.04em]">
            {entry.title}
          </h1>
        </header>

        <div
          className="entry-body py-12 text-[18px] leading-[1.75] text-prose"
          dangerouslySetInnerHTML={{ __html: entry.body.html }}
        />
      </article>
      <ArchivePageFooter title={manifest.title} />
    </main>
    </I18nProvider>
  );
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

function firstLine(entry: { body: { markdown: string } }) {
  return (
    entry.body.markdown
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"))
      .map((line) =>
        line
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .replace(/[*_`>#-]/g, "")
          .trim(),
      )
      .find(Boolean) ?? undefined
  );
}

function fileSrc(file: LafFileAsset) {
  return `/life-files/${file.relativePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
