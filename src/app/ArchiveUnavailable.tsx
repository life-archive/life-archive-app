import type { ArchiveContentError } from "@/lib/life";
import { rendererConfig } from "@/rendererConfig";

export function ArchiveUnavailable({
  error,
}: {
  error: ArchiveContentError;
}) {
  return (
    <main className="min-h-screen bg-page px-5 py-16 text-ink lg:px-8">
      <section className="mx-auto max-w-[760px] rounded-[8px] border border-border-strong bg-surface p-6 shadow-card">
        <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-muted">
          Archive validation failed
        </p>
        <h1 className="mt-4 font-serif text-[clamp(3rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
          This archive cannot be rendered yet.
        </h1>
        <p className="mt-5 max-w-[620px] text-[17px] leading-[1.7] text-muted">
          The renderer found a problem while reading the archive at{" "}
          <code className="rounded bg-chip px-1.5 py-0.5 text-sm text-ink">
            {rendererConfig.archivePath}
          </code>
          . Fix the archive content and rebuild or restart the app.
        </p>

        <div className="mt-7 space-y-3">
          {error.issues.map((issue, index) => (
            <div
              className="rounded-[8px] border border-border bg-paper-subtle p-4"
              key={`${issue.code}-${issue.path ?? "archive"}-${index}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-chip px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  {issue.code.replaceAll("_", " ")}
                </span>
                {issue.path && (
                  <code className="text-[12px] text-soft">{issue.path}</code>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-muted">
                {issue.message}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
