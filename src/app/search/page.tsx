import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import type { LafCollection, LafEntry } from "@/lib/life";

import { getSiteUrlFromRequest, tryOpenSiteArchive } from "../archiveSelection";
import { ArchiveNav } from "../ArchiveNav";
import { ArchivePageFooter } from "../ArchivePageFooter";
import { ArchiveUnavailable } from "../ArchiveUnavailable";
import { I18nProvider } from "../i18n/I18nProvider";
import {
  archivePageMetadata,
  archiveUnavailableMetadata,
  manifestSiteUrl,
} from "../pageMetadata";

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

type SearchResult = {
  collectionTitles: string[];
  entry: LafEntry;
  excerpt: string;
  score: number;
};

export async function generateMetadata() {
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return archiveUnavailableMetadata();
  }

  const manifest = archiveResult.archive.getManifest();

  return archivePageMetadata(manifest.title, "Search", undefined, {
    canonical: "/search",
    description: `Search entries in ${manifest.title}.`,
    siteUrl: await getSiteUrlFromRequest(manifestSiteUrl(manifest)),
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return <ArchiveUnavailable error={archiveResult.error} />;
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();
  const rawQuery = (await searchParams).q;
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim() ?? "";
  const results = query
    ? searchEntries(archive.getEntries(), archive.getCollections(), query)
    : [];

  return (
    <I18nProvider defaultLocale={manifest.language}>
      <main className="min-h-screen bg-page text-ink">
        <ArchiveNav
          active="search"
          showAlbums={archive.getAlbums().length > 0}
          showCollections={archive.getCollections().length > 0}
          title={manifest.title}
        />

        <div className="mx-auto max-w-[1040px] px-5 py-12 lg:px-8 lg:py-16">
          <header className="max-w-[760px]">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
              Find an entry
            </p>
            <h1 className="mt-4 font-serif text-[clamp(3.5rem,8vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.04em]">
              Search
            </h1>
            <p className="mt-5 text-[19px] leading-[1.65] text-muted">
              Search titles, collections, tags, and the full text of every entry.
            </p>
          </header>

          <form
            action="/search"
            className="mt-10 flex max-w-[760px] gap-3"
            method="get"
          >
            <label className="sr-only" htmlFor="archive-search">
              Search this archive
            </label>
            <input
              autoFocus
              className="min-w-0 flex-1 rounded-[10px] border border-border-strong bg-surface px-4 py-3.5 text-[17px] text-ink outline-none transition placeholder:text-faint focus:border-ink"
              defaultValue={query}
              id="archive-search"
              name="q"
              placeholder="Search recipes and entries"
              type="search"
            />
            <button
              className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-photo-shell px-5 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
              type="submit"
            >
              <Search aria-hidden="true" size={17} strokeWidth={1.9} />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {query ? (
            <section className="mt-14 border-t border-border-strong pt-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-serif text-[32px] font-semibold tracking-[-0.03em]">
                  Results for “{query}”
                </h2>
                <p className="text-sm text-muted">
                  {results.length.toLocaleString()} {results.length === 1 ? "entry" : "entries"}
                </p>
              </div>

              {results.length > 0 ? (
                <div className="mt-6 divide-y divide-border-strong">
                  {results.map(({ collectionTitles, entry, excerpt }) => (
                    <Link
                      className="group grid gap-5 py-7 sm:grid-cols-[minmax(0,1fr)_auto]"
                      href={`/entries/${entry.id}`}
                      key={entry.id}
                    >
                      <div>
                        <h3 className="font-serif text-[30px] font-semibold leading-tight tracking-[-0.025em]">
                          {entry.title}
                        </h3>
                        {collectionTitles.length > 0 && (
                          <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-soft">
                            {collectionTitles.join(" · ")}
                          </p>
                        )}
                        <p className="mt-3 max-w-[760px] text-[16px] leading-[1.65] text-muted">
                          {excerpt}
                        </p>
                      </div>
                      <ArrowRight
                        aria-hidden="true"
                        className="hidden self-center text-faint transition group-hover:translate-x-1 group-hover:text-ink sm:block"
                        size={20}
                        strokeWidth={1.8}
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-8 rounded-[10px] border border-border bg-paper-subtle p-6">
                  <p className="text-[17px] text-muted">
                    No entries matched “{query}”. Try a recipe name, ingredient, or collection.
                  </p>
                </div>
              )}
            </section>
          ) : (
            <p className="mt-10 text-[15px] text-muted">
              Try a dish, ingredient, or category such as chicken, dosa, rice, or chutney.
            </p>
          )}
        </div>

        <ArchivePageFooter title={manifest.title} />
      </main>
    </I18nProvider>
  );
}

function searchEntries(
  entries: LafEntry[],
  collections: LafCollection[],
  query: string,
): SearchResult[] {
  const normalizedQuery = normalizeText(query);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const collectionTitles = new Map(
    collections.map((collection) => [collection.id, collection.title]),
  );

  return entries
    .map((entry) => {
      const titles = entry.collections.map(
        (collectionId) => collectionTitles.get(collectionId) ?? collectionId,
      );
      const title = normalizeText(entry.title);
      const metadata = normalizeText(
        [...entry.tags, ...entry.collections, ...titles].join(" "),
      );
      const body = normalizeText(entry.body.markdown);
      const searchable = `${title} ${metadata} ${body}`;

      if (!terms.every((term) => searchable.includes(term))) {
        return undefined;
      }

      let score = terms.reduce((total, term) => {
        if (title.includes(term)) {
          return total + 30;
        }

        if (metadata.includes(term)) {
          return total + 10;
        }

        return total + 1;
      }, 0);

      if (title === normalizedQuery) {
        score += 100;
      } else if (title.startsWith(normalizedQuery)) {
        score += 50;
      }

      return {
        collectionTitles: titles,
        entry,
        excerpt: matchingExcerpt(entry.body.markdown, terms),
        score,
      };
    })
    .filter((result): result is SearchResult => Boolean(result))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.entry.date ?? "").localeCompare(a.entry.date ?? "") ||
        a.entry.title.localeCompare(b.entry.title),
    );
}

function matchingExcerpt(markdown: string, terms: string[]) {
  const text = markdownToPlainText(markdown);
  const normalized = normalizeText(text);
  const matchIndex = terms
    .map((term) => normalized.indexOf(term))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  const start = Math.max(0, (matchIndex ?? 0) - 70);
  const end = Math.min(text.length, start + 220);
  const excerpt = text.slice(start, end).trim();

  return `${start > 0 ? "…" : ""}${excerpt}${end < text.length ? "…" : ""}`;
}

function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_>#|~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
