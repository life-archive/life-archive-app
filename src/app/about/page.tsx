import { tryOpenSiteArchive } from "../archiveSelection";
import { ArchiveUnavailable } from "../ArchiveUnavailable";
import { ArchivePageFooter } from "../ArchivePageFooter";
import { ArchiveNav } from "../ArchiveNav";
import { I18nProvider, T } from "../i18n/I18nProvider";
import { archivePageMetadata, archiveUnavailableMetadata } from "../pageMetadata";

export async function generateMetadata() {
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return archiveUnavailableMetadata();
  }

  return archivePageMetadata(archiveResult.archive.getManifest().title, "About");
}

export default async function AboutPage() {
  const archiveResult = await tryOpenSiteArchive();

  if (!archiveResult.ok) {
    return <ArchiveUnavailable error={archiveResult.error} />;
  }

  const archive = archiveResult.archive;
  const manifest = archive.getManifest();
  const readme = archive.toJSON().readme;

  return (
    <I18nProvider defaultLocale={manifest.language}>
    <main className="min-h-screen bg-page text-ink">
      <ArchiveNav
        active="about"
        showCollections={archive.getCollections().length > 0}
        title={manifest.title}
      />
      <article className="mx-auto max-w-[820px] px-5 py-16 lg:px-8 lg:py-20">
        <header className="border-b border-border-strong pb-10">
          <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-muted">
            <T k="common.about" />
          </p>
          <h1 className="mt-4 font-serif text-[clamp(4rem,8vw,7rem)] font-semibold leading-[0.92] tracking-[-0.04em]">
            {manifest.title}
          </h1>
        </header>

        {readme ? (
          <div
            className="entry-body py-12 text-[18px] leading-[1.75] text-prose"
            dangerouslySetInnerHTML={{ __html: readme.html }}
          />
        ) : (
          <p className="py-12 text-[18px] leading-[1.75] text-muted">
            <T k="empty.noReadme" />
          </p>
        )}
      </article>
      <ArchivePageFooter title={manifest.title} />
    </main>
    </I18nProvider>
  );
}
