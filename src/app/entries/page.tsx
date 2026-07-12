import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { tryOpenArchive, type LafEntry } from "@/lib/life";

import { ArchiveUnavailable } from "../ArchiveUnavailable";
import { ArchivePageFooter } from "../ArchivePageFooter";
import { ArchiveNav } from "../ArchiveNav";
import { I18nProvider, T } from "../i18n/I18nProvider";
import { archivePageMetadata, archiveUnavailableMetadata } from "../pageMetadata";

type EntryGroup = {
  year: string;
  entries: LafEntry[];
};

export async function generateMetadata() {
  const archiveResult = await tryOpenArchive();

  if (!archiveResult.ok) {
    return archiveUnavailableMetadata();
  }

  return archivePageMetadata(archiveResult.archive.getManifest().title, "Entries");
}

export default async function EntriesPage() {
  const archiveResult = await tryOpenArchive();

  if (!archiveResult.ok) {
    return <ArchiveUnavailable error={archiveResult.error} />;
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();
  const entries = archive.getEntries();
  const groups = groupEntriesByYear(entries);
  const datedEntries = entries.filter((entry) => entry.date);
  const yearSpan = getYearSpan(datedEntries);

  return (
    <I18nProvider defaultLocale={manifest.language}>
    <main className="min-h-screen bg-page text-ink">
      <ArchiveNav
        active="entries"
        showCollections={archive.getCollections().length > 0}
        title={manifest.title}
      />
      <div className="mx-auto max-w-[1040px] px-5 py-6 lg:px-8 lg:py-8">
        <header className="pb-12 pt-16">
          <h1 className="font-serif text-[clamp(4.5rem,10vw,8rem)] font-semibold leading-[0.9] tracking-[-0.04em]">
            <T k="common.entries" />
          </h1>
          <p className="mt-6 max-w-[680px] text-[22px] leading-[1.45] text-muted">
            {entries.length.toLocaleString()} entries written over {yearSpan}{" "}
            {yearSpan === 1 ? "year" : "years"}.
          </p>
        </header>

        <div className="space-y-16 border-t border-border-strong pt-12">
          {groups.map((group) => (
            <section
              className="grid gap-8 md:grid-cols-[140px_minmax(0,1fr)]"
              key={group.year}
            >
              <h2 className="font-serif text-[44px] font-semibold leading-none tracking-[-0.03em] text-ink md:sticky md:top-8 md:h-fit">
                {group.year}
              </h2>

              <div className="divide-y divide-border-strong">
                {group.entries.map((entry) => (
                  <Link
                    className="group grid gap-4 py-7 sm:grid-cols-[minmax(0,1fr)_auto]"
                    href={`/entries/${entry.id}`}
                    key={entry.id}
                  >
                    <div>
                      <h3 className="font-serif text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
                        {entry.title}
                      </h3>
                      <p className="mt-3 max-w-[720px] text-[17px] leading-[1.6] text-muted">
                        {firstLine(entry)}
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
            </section>
          ))}
        </div>
      </div>
      <ArchivePageFooter title={manifest.title} />
    </main>
    </I18nProvider>
  );
}

function groupEntriesByYear(entries: LafEntry[]): EntryGroup[] {
  const groups = new Map<string, LafEntry[]>();

  for (const entry of entries) {
    const year = entry.date?.slice(0, 4) || "Undated";
    const group = groups.get(year) ?? [];
    group.push(entry);
    groups.set(year, group);
  }

  return [...groups.entries()]
    .map(([year, groupedEntries]) => ({
      year,
      entries: groupedEntries.sort(compareEntries),
    }))
    .sort((a, b) => b.year.localeCompare(a.year));
}

function compareEntries(a: LafEntry, b: LafEntry) {
  return (b.date ?? "").localeCompare(a.date ?? "");
}

function firstLine(entry: LafEntry) {
  return (
    entry.body.markdown
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? "No body text yet."
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
