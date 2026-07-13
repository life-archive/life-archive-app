import Image from "next/image";
import NextLink from "next/link";
import { ArrowRight } from "lucide-react";

import {
  type LafCollection,
  type LafFileAsset,
} from "@/lib/life";
import { rendererDefaults } from "@/defaults";

import { getSiteUrlFromRequest, tryOpenSiteArchive } from "../archiveSelection";
import { ArchiveUnavailable } from "../ArchiveUnavailable";
import { ArchivePageFooter } from "../ArchivePageFooter";
import { ArchiveNav } from "../ArchiveNav";
import { featureMediaCard, overlayChip } from "../design";
import { I18nProvider, T } from "../i18n/I18nProvider";
import {
  archivePageMetadata,
  archiveUnavailableMetadata,
  manifestSiteUrl,
} from "../pageMetadata";

type DisplayCollection = {
  id: string;
  title: string;
  description: string;
  count: number;
  image: string;
  tags: string[];
  kind?: string;
  href?: string;
  external?: boolean;
};

export async function generateMetadata() {
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return archiveUnavailableMetadata();
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();

  return archivePageMetadata(manifest.title, "Collections", undefined, {
    canonical: "/collections",
    description: `Browse ${archive.getCollections().length.toLocaleString()} curated collections from ${manifest.title}.`,
    siteUrl: await getSiteUrlFromRequest(manifestSiteUrl(manifest)),
  });
}

export default async function CollectionsPage() {
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return <ArchiveUnavailable error={archiveResult.error} />;
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();
  const collections = getDisplayCollections(
    archive.getCollections(),
    archive.getFiles(),
  );
  const totalItems = collections.reduce(
    (total, collection) => total + collection.count,
    0,
  );

  return (
    <I18nProvider defaultLocale={manifest.language}>
    <main className="min-h-screen bg-page text-ink">
      <ArchiveNav
        active="collections"
        showAlbums={archive.getAlbums().length > 0}
        showCollections={collections.length > 0}
        title={manifest.title}
      />
      <section className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-10 max-w-[820px]">
            <h1 className="font-serif text-[clamp(4.5rem,10vw,8rem)] font-semibold leading-[0.9] tracking-[-0.04em]">
              <T k="common.collections" />
            </h1>
            <p className="mt-6 max-w-[680px] text-[22px] leading-[1.45] text-muted">
              {collections.length.toLocaleString()} collections with{" "}
              {totalItems.toLocaleString()} curated items.
            </p>
          </header>

          {collections.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {collections.map((collection) => (
                <CollectionCard collection={collection} key={collection.id} />
              ))}
            </div>
          ) : (
            <div className="rounded-[8px] border border-border bg-surface p-6 text-[17px] leading-[1.7] text-muted">
              <T k="empty.noCollections" />
            </div>
          )}
        </div>
      </section>
      <ArchivePageFooter title={manifest.title} />
    </main>
    </I18nProvider>
  );
}

function CollectionCard({
  collection,
}: {
  collection: DisplayCollection;
}) {
  const content = (
    <>
      <Image
        alt={`${collection.title} collection cover`}
        className="object-cover opacity-90 transition duration-500 group-hover:scale-105"
        fill
        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
        src={collection.image}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {(collection.tags.length > 0
            ? collection.tags.slice(0, 2)
            : [collection.kind ?? "collection"]
          ).map((tag) => (
            <span
              className={overlayChip}
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>

        <h2 className="font-serif text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-white">
          {collection.title}
        </h2>

        <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-white/85">
          {collection.description}
        </p>

        <div className="mt-5 flex items-center justify-between text-sm font-medium text-white">
          <span>{collection.count} items</span>
          {collection.href ? (
            <span className="inline-flex items-center gap-2">
              <T k="common.explore" />
              <ArrowRight
                aria-hidden="true"
                className="transition group-hover:translate-x-0.5"
                size={15}
                strokeWidth={1.8}
              />
            </span>
          ) : (
            <span className="text-white/70">
              <T k="common.previewOnly" />
            </span>
          )}
        </div>
      </div>
    </>
  );

  const className = featureMediaCard;

  if (!collection.href) {
    return <div className={className}>{content}</div>;
  }

  if (collection.external) {
    return (
      <a
        className={`${className} cursor-pointer`}
        href={collection.href}
        rel="noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  return (
    <NextLink className={`${className} cursor-pointer`} href={collection.href}>
      {content}
    </NextLink>
  );
}

function getDisplayCollections(
  collections: LafCollection[],
  files: LafFileAsset[],
): DisplayCollection[] {
  return collections
    .filter((collection) => collection.kind === "board" || collection.kind === "link")
    .map((collection) => {
      const coverRef =
        collection.cover ??
        collection.items.find((item) => item.startsWith("file:")) ??
        (collection.files.length > 0
          ? `file:${collection.files[0]}`
          : undefined);
      const filename = coverRef?.replace(/^file:/, "");
      const coverFile = filename
        ? files.find((file) => matchesFileReference(file, filename))
        : undefined;
      const count =
        collection.items.length ||
        collection.entries.length +
          collection.files.length +
          collection.people.length +
          collection.places.length;

      const linkTarget =
        collection.kind === "link"
          ? resolveCollectionLink(collection)
          : undefined;

      return {
        id: collection.id,
        title: collection.title,
        description:
          collection.description ||
          firstMarkdownLine(collection.body.markdown) ||
          `${count} curated items.`,
        count,
        image: coverFile
          ? fileSrc(coverFile)
          : rendererDefaults.fallbackImages.collection,
        tags: collection.tags,
        kind: collection.kind,
        href: linkTarget?.href ?? `/collections/${collection.id}`,
        external: linkTarget?.external,
      };
    });
}

function resolveCollectionLink(collection: LafCollection) {
  const raw =
    stringMetadata(collection, "href") ??
    stringMetadata(collection, "link") ??
    stringMetadata(collection, "url");

  if (!raw) {
    return undefined;
  }

  return resolveLinkTarget(raw);
}

function resolveLinkTarget(raw: string) {
  const trimmed = raw.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return {
      external: true,
      href: trimmed,
    };
  }

  if (trimmed.startsWith("/")) {
    return {
      external: false,
      href: trimmed,
    };
  }

  const prefixed = trimmed.match(/^(entry|album|collection):(.+)$/);

  if (prefixed) {
    const [, type, id] = prefixed;
    const route = type === "entry" ? "entries" : `${type}s`;

    return {
      external: false,
      href: `/${route}/${encodeURIComponent(id.trim())}`,
    };
  }

  const normalized = trimmed.replace(/\.md$/i, "");

  if (/^(entries|albums|collections)\//.test(normalized)) {
    return {
      external: false,
      href: `/${normalized
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
    };
  }

  return undefined;
}

function stringMetadata(collection: LafCollection, key: string) {
  const value = collection.metadata[key];

  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function firstMarkdownLine(markdown: string) {
  return (
    markdown
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0 && !line.startsWith("#")) ?? ""
  );
}

function fileSrc(file: LafFileAsset) {
  return `/life-files/${file.relativePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function matchesFileReference(file: LafFileAsset, reference: string) {
  const normalized = reference.replace(/^files\//, "");

  return file.relativePath === normalized || file.filename === normalized;
}
