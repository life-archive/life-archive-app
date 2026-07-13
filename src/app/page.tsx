import Image from "next/image";
import NextLink from "next/link";
import {
  ArrowRight,
  GitBranch,
  Link,
  type LucideIcon,
} from "lucide-react";

import {
  type LafAlbum,
  type LafAlbumFile,
  type LafArchiveJSON,
  type LafEntry,
  type LafFileAsset,
} from "@/lib/life";
import { tryOpenArchive } from "@/lib/life";
import { rendererDefaults } from "@/defaults";

import { ArchiveNav } from "./ArchiveNav";
import { ArchiveUnavailable } from "./ArchiveUnavailable";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { RevealEmailLink } from "./RevealEmailLink";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { AlbumCard, type DisplayAlbum } from "./albums/AlbumCard";
import {
  elevatedCardLink,
  featureMediaCard,
  overlayChip,
  sectionActionLinkBase,
  sectionActionLink,
} from "./design";
import { I18nProvider, T } from "./i18n/I18nProvider";
import { archiveHomeMetadata, archiveUnavailableMetadata } from "./pageMetadata";

const thumbnailExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

export async function generateMetadata() {
  const archiveResult = await tryOpenArchive();

  if (!archiveResult.ok) {
    return archiveUnavailableMetadata();
  }

  return archiveHomeMetadata(archiveResult.archive.getManifest().title);
}

export default async function Home() {
  const renderStartedAt = performance.now();
  const archiveResult = await tryOpenArchive();

  if (!archiveResult.ok) {
    return <ArchiveUnavailable error={archiveResult.error} />;
  }

  const archive = archiveResult.archive;
  const data = archive.toJSON();
  const title = data.manifest.title;
  const entries = getDisplayEntries(data.entries);
  const files = archive.getFiles();
  const heroFile = resolveFirstFile(archive, [
    "hero.jpg",
    "hero.jpeg",
    "hero.png",
    "hero.webp",
  ]);
  const profileFile = archive.resolveFile("profile.png");
  const heroImage = heroFile ? fileSrc(heroFile) : rendererDefaults.fallbackImages.hero;
  const profileImage = profileFile ? fileSrc(profileFile) : undefined;
  const collections = getDisplayCollections(data, files, "board");
  const albums = getDisplayAlbums(data.albums);
  const archiveSize = getArchiveSize(data);
  const yearSpan = getYearSpan(data.entries);
  const hasHomeContent =
    collections.length > 0 || entries.length > 0 || albums.length > 0;
  const footerLinks = getFooterLinks(data.manifest);
  const footerEmail = manifestString(data.manifest, "email");
  const renderTimeMs = Math.round(performance.now() - renderStartedAt);

  const heroMetadata = [
    entries.length > 0
      ? {
          href: "/entries",
          label: `${data.entries.length.toLocaleString()} entries`,
        }
      : undefined,
    albums.length > 0
      ? {
          href: "/albums",
          label: `${albums.length.toLocaleString()} albums`,
        }
      : undefined,
    collections.length > 0
      ? {
          href: "/collections",
          label: `${collections.length} collections`,
        }
      : undefined,
    yearSpan > 0
      ? {
          href: "/entries",
          label: `${yearSpan} ${yearSpan === 1 ? "year" : "years"}`,
        }
      : undefined,
  ].filter((item): item is { href: string; label: string } => Boolean(item));

  return (
    <I18nProvider defaultLocale={data.manifest.language}>
    <main className="min-h-screen bg-page text-ink">
      <ArchiveNav
        active="home"
        showCollections={data.collections.length > 0}
        title={title}
      />

      <section className="px-5 pb-8 pt-4 lg:px-8 lg:pb-10 lg:pt-6">
        <div className="mx-auto max-w-[1440px]">
          <div className="relative min-h-[460px] overflow-hidden rounded-[8px] bg-hero-fallback shadow-hero ring-1 ring-border">
            <Image
              alt="A reflective traveler looking over a mountain valley"
              className="object-cover"
              fill
              priority
              sizes="100vw"
              src={heroImage}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,18,34,0.72)_0%,rgba(8,18,34,0.43)_42%,rgba(8,18,34,0.08)_78%)]" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/42 to-transparent" />

            <div className="relative flex min-h-[460px] items-end p-6 text-white sm:p-8 lg:p-10">
              <div className="max-w-[760px]">
                <div className="mb-4 flex items-end gap-5">
                  {profileImage && (
                    <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-white/30 bg-white/20 shadow-profile backdrop-blur-md sm:size-28">
                      <Image
                        alt={title}
                        className="object-cover"
                        fill
                        sizes="112px"
                        src={profileImage}
                      />
                    </div>
                  )}
                  <div className="pb-2">
                    <p className="text-[13px] font-medium text-white/70">
                      <T k="home.lifeArchive" />
                    </p>
                    <h1 className="mt-2 font-serif text-[clamp(3.875rem,5.4vw,5.25rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
                      {title}
                    </h1>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {heroMetadata.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2 px-1 text-[14px] leading-[1.7] text-muted">
              {heroMetadata.map((item) => (
                <NextLink
                  className="cursor-pointer transition hover:text-ink"
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </NextLink>
              ))}
            </div>
          )}
        </div>
      </section>

      {!hasHomeContent && <EmptyHomePlaceholder />}

      {data.readme && (
        <section className="border-t border-border px-5 py-8 lg:px-8 lg:py-10">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-5">
              <h2 className="text-[22px] font-semibold leading-tight text-ink">
                <T k="common.about" />
              </h2>
            </div>
            <div
              className="entry-body text-left text-[18px] leading-[1.75] text-prose"
              dangerouslySetInnerHTML={{ __html: data.readme.html }}
            />
          </div>
        </section>
      )}

{collections.length > 0 && (
<section className="px-5 py-8 lg:px-8 lg:py-10" id="collections">
  <div className="mx-auto max-w-[1440px]">
    <div className="mb-5 flex items-center justify-between gap-6">
      <div>
        <h2 className="text-[22px] font-semibold leading-tight text-ink">
          <T k="common.collections" />
        </h2>
        
      </div>

      <NextLink
        className={`hidden ${sectionActionLinkBase} sm:inline-flex`}
        href="/collections"
      >
        <T k="common.viewAll" />
        <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} />
      </NextLink>
    </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {collections.slice(0, 3).map((collection) => (
          <a
            className={featureMediaCard}
            href={`/collections/${collection.id}`}
            key={collection.id}
          >
            <Image
              alt=""
              className="object-cover opacity-90 transition duration-500 group-hover:scale-105"
              fill
              sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
              src={collection.image}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6">
              <div className="mb-3 flex flex-wrap gap-2">
                {collection.tags.slice(0, 2).map((tag) => (
                  <span
                    className={overlayChip}
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h3 className="font-serif text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-white">
                {collection.title}
              </h3>

              {collection.description && (
                <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-white/85">
                  {collection.description}
                </p>
              )}

              <div className="mt-5 flex items-center justify-between text-sm font-medium text-white">
                <span>{collection.count} items</span>
                <span className="inline-flex items-center gap-2">
                  <T k="common.explore" />
                  <ArrowRight
                    aria-hidden="true"
                    className="transition group-hover:translate-x-0.5"
                    size={15}
                    strokeWidth={1.8}
                  />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-6 flex sm:hidden">
        <NextLink
          className={sectionActionLink}
          href="/collections"
        >
          <T k="common.viewAll" />
          <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} />
        </NextLink>
      </div>
  </div>
</section>
)}


      {entries.length > 0 && (
      <section className="border-t border-border px-5 py-8 lg:px-8 lg:py-10">
  <div className="mx-auto max-w-[1440px]">
    <div className="mb-5 flex items-end justify-between gap-6">
      <div>
        <h2 className="text-[22px] font-semibold leading-tight text-ink">
          <T k="home.recentEntries" />
        </h2>
      </div>

      <NextLink
        className={`hidden ${sectionActionLinkBase} sm:inline-flex`}
        href="/entries"
      >
        <T k="common.viewAll" />
        <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} />
      </NextLink>
    </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.slice(0, 6).map((entry) => (
          <NextLink
            className={`${elevatedCardLink} p-6`}
            href={`/entries/${entry.id}`}
            key={entry.id}
          >
            <div className="mb-5 flex items-center justify-between gap-4 text-xs text-muted">
              <span>
                {entry.date ?? <T k="common.undated" />}
              </span>
              {entry.kind && (
                <span className="rounded-full bg-chip px-2 py-1 text-[11px] font-medium text-muted">
                  {entry.kind}
                </span>
              )}
            </div>

            <h3 className="font-serif text-3xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink">
              {entry.title}
            </h3>

            {entry.body.markdown && (
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">
                {entryExcerpt(entry)}
              </p>
            )}

            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink">
              <T k="common.readStory" />
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

      <div className="mt-6 flex sm:hidden">
        <NextLink
          className={sectionActionLink}
          href="/entries"
        >
          <T k="common.viewAll" />
          <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} />
        </NextLink>
      </div>
  </div>
</section>
)}



{albums.length > 0 && (
<section
  className="border-t border-border px-5 py-8 lg:px-8 lg:py-10"
  id="albums"
>
  <div className="mx-auto max-w-[1440px]">
    <div className="mb-5 flex items-center justify-between gap-6">
      <h2 className="text-[22px] font-semibold leading-tight text-ink">
        <T k="common.albums" />
      </h2>
      <NextLink
        className={`hidden ${sectionActionLinkBase} sm:inline-flex`}
        href="/albums"
      >
        <T k="common.viewAll" />
        <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} />
      </NextLink>
    </div>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
  {albums.map((album) => (
    <AlbumCard
      album={album}
      key={album.id}
    />
  ))}
</div>

      <div className="mt-6 flex sm:hidden">
        <NextLink
          className={sectionActionLink}
          href="/albums"
        >
          <T k="common.viewAll" />
          <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} />
        </NextLink>
      </div>
  </div>
</section>
)}

      <footer className="border-t border-border bg-paper-warm px-5 py-8 text-ink lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_0.8fr]">
          <section>
            <h2 className="font-serif text-[34px] font-semibold leading-[1.05] tracking-[-0.03em]">
              <T k="home.archiveOffer" />
            </h2>
            <p className="mt-3 max-w-[360px] text-[17px] leading-[1.7] text-muted">
              <T k="home.archiveValue" />
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                className="inline-flex h-10 items-center rounded-[7px] border border-border-strong bg-glass-surface px-4 text-sm font-medium text-ink"
                href="#"
              >
                <T k="home.learnMore" />
              </a>
            </div>
          </section>

          {(footerEmail || footerLinks.length > 0) && (
            <FooterGroup title={<T k="footer.connect" />}>
              {footerEmail && (
                <RevealEmailLink encodedEmail={encodeEmail(footerEmail)} />
              )}
              {footerLinks.map((link) => (
                <FooterLink
                  href={link.href}
                  icon={link.icon}
                  key={link.label}
                  label={link.label}
                />
              ))}
            </FooterGroup>
          )}

          <FooterGroup title={<T k="footer.details" />} id="archive-details">
            <p>Format: {data.manifest.format}</p>
            <p><T k="footer.archiveSize" />: {formatBytes(archiveSize)}</p>
            <p><T k="footer.archiveLanguage" />: {data.manifest.language ?? "en-US"}</p>
            <p>Render time: {renderTimeMs.toLocaleString()} ms</p>
          </FooterGroup>

          <FooterGroup title={<T k="theme.theme" />}>
            <ThemeSwitcher />
          </FooterGroup>

          <FooterGroup title={<T k="language.language" />}>
            <LanguageSwitcher />
          </FooterGroup>
        </div>
        <div className="mx-auto mt-8 flex max-w-[1440px] flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-border pt-4 text-[13px] leading-[1.7] text-muted">
          <span><T k="footer.builtWith" /></span>
        </div>
      </footer>
    </main>
    </I18nProvider>
  );
}

function getDisplayEntries(entries: LafEntry[]) {
  return entries.slice(0, 3);
}

function entryExcerpt(entry: LafEntry) {
  return markdownExcerpt(entry.body.markdown, "No body text yet.");
}

function resolveFirstFile(
  archive: { resolveFile(filename: string): LafFileAsset | undefined },
  filenames: string[],
) {
  for (const filename of filenames) {
    const file = archive.resolveFile(filename);

    if (file) {
      return file;
    }
  }

  return undefined;
}

function manifestString(
  manifest: LafArchiveJSON["manifest"],
  key: string,
): string | undefined {
  const value = manifest[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function getFooterLinks(manifest: LafArchiveJSON["manifest"]) {
  const links: Array<{ href: string; icon: LucideIcon; label: string }> = [];
  const website =
    manifestString(manifest, "website") ??
    manifestString(manifest, "site") ??
    manifestString(manifest, "url");

  if (website) {
    links.push({
      href: website,
      icon: Link,
      label: "Website",
    });
  }

  const socialFields: Array<{ key: string; label: string; icon: LucideIcon }> = [
    { key: "linkedin", label: "LinkedIn", icon: Link },
    { key: "github", label: "GitHub", icon: GitBranch },
    { key: "instagram", label: "Instagram", icon: Link },
    { key: "twitter", label: "Twitter", icon: Link },
    { key: "x", label: "X", icon: Link },
    { key: "youtube", label: "YouTube", icon: Link },
    { key: "facebook", label: "Facebook", icon: Link },
    { key: "threads", label: "Threads", icon: Link },
    { key: "mastodon", label: "Mastodon", icon: Link },
    { key: "bluesky", label: "Bluesky", icon: Link },
    { key: "newsletter", label: "Newsletter", icon: Link },
  ];

  for (const field of socialFields) {
    const href = manifestString(manifest, field.key);

    if (href) {
      links.push({
        href,
        icon: field.icon,
        label: field.label,
      });
    }
  }

  return links;
}

function encodeEmail(email: string) {
  return [...email].map((character) => character.charCodeAt(0) + 7);
}

function EmptyHomePlaceholder() {
  return (
    <section className="border-t border-border px-5 py-10 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-[1440px] rounded-[10px] border border-dashed border-border-dashed bg-paper-subtle px-6 py-10 text-center">
        <h2 className="font-serif text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
          <T k="empty.homeTitle" />
        </h2>
        <p className="mx-auto mt-3 max-w-[520px] text-[17px] leading-[1.7] text-muted">
          <T k="empty.homeBody" />
        </p>
      </div>
    </section>
  );
}

function getYearSpan(entries: LafEntry[]) {
  const years = entries
    .map((entry) => Number(entry.date?.slice(0, 4)))
    .filter((year) => Number.isFinite(year));

  if (years.length === 0) {
    return 0;
  }

  return Math.max(...years) - Math.min(...years) + 1;
}

function getArchiveSize(data: LafArchiveJSON) {
  const binaryFilesSize = data.files.reduce(
    (total, file) => total + file.byteSize,
    0,
  );
  const albumFilesSize = data.albums.reduce(
    (total, album) => total + album.byteSize,
    0,
  );
  const manifestSize = byteLength(JSON.stringify(data.manifest));
  const readmeSize = data.readme ? byteLength(data.readme.markdown) : 0;
  const entitySize = [
    ...data.entries,
    ...data.people,
    ...data.places,
    ...data.collections,
  ].reduce(
    (total, entity) =>
      total + byteLength(JSON.stringify(entity.metadata)) + byteLength(entity.body.markdown),
    0,
  );

  return binaryFilesSize + albumFilesSize + manifestSize + readmeSize + entitySize;
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function getDisplayCollections(
  data: LafArchiveJSON,
  files: LafFileAsset[],
  kind?: "board" | "album" | string
) {
  const source = kind
    ? data.collections.filter((collection) => collection.kind === kind)
    : data.collections;

  const featured = source.filter((collection) => collection.featured);
  const collections = featured.length > 0 ? featured : source;

  return collections.slice(0, 6).map((collection) => {
    const coverRef =
      collection.cover ??
      collection.items.find((item) => item.startsWith("file:")) ??
      (collection.files.length > 0 ? `file:${collection.files[0]}` : undefined);

    const filename = coverRef?.replace(/^file:/, "");

    const coverFile = filename
      ? files.find((file) => matchesFileReference(file, filename))
      : undefined;

    return {
      id: collection.id,
      title: collection.title,
      description:
        collection.description ||
        markdownExcerpt(collection.body.markdown, "") ||
        `${collection.entries.length} entries, ${collection.files.length} files, and ${collection.tags.length} tags.`,
      count:
        collection.items.length ||
        collection.entries.length +
          collection.files.length +
          collection.people.length +
          collection.places.length,
      image: coverFile
        ? fileSrc(coverFile)
        : rendererDefaults.fallbackImages.collection,
      tags: collection.tags,
    };
  });
}

function markdownExcerpt(markdown: string, fallback: string) {
  const text = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("!"))
    .map((line) =>
      line
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_`>#-]/g, "")
        .trim(),
    )
    .find(Boolean);

  if (!text) {
    return fallback;
  }

  return text.length > 180 ? `${text.slice(0, 177).trimEnd()}...` : text;
}

function getDisplayAlbums(albums: LafAlbum[]): DisplayAlbum[] {
  return albums.slice(0, rendererDefaults.home.albumLimit).map((album) => ({
    id: album.id,
    title: album.title,
    count: album.files.length,
    image: album.cover
      ? albumPreviewSrc(album.cover, 960)
      : rendererDefaults.fallbackImages.album,
  }));
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

function albumThumbnailSrc(file: LafAlbumFile, width: number) {
  return `/life-album-thumbs/${width}/${file.relativePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function albumFileSrc(file: LafAlbumFile) {
  return `/life-albums/${file.relativePath
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

function FooterGroup({
  title,
  children,
  id,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section className="border-border-strong lg:border-l lg:pl-8" id={id}>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <div className="mt-4 space-y-2 text-[14px] leading-[1.7] text-muted">
        {children}
      </div>
    </section>
  );
}

function FooterLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <a
      className="flex cursor-pointer items-center gap-2 hover:text-ink"
      href={href}
      rel="noreferrer"
      target={href.startsWith("http") ? "_blank" : undefined}
    >
      <Icon aria-hidden="true" size={15} strokeWidth={1.8} />
      {label}
    </a>
  );
}
