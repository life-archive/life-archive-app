import NextLink from "next/link";

import type { LafEntry } from "@/lib/life";

function formatDate(dateStr?: string): string {
  if (!dateStr) {
    return "Ongoing";
  }

  const normalized = /^\d{4}-\d{2}$/.test(dateStr)
    ? `${dateStr}-01`
    : dateStr;
  const date = new Date(`${normalized}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getExcerpt(entry: LafEntry): string {
  const lines = entry.body.markdown.split("\n");

  for (const line of lines) {
    const text = line.trim();

    if (
      text.length > 20 &&
      !text.startsWith("#") &&
      !text.startsWith("**") &&
      !text.startsWith("-") &&
      !text.startsWith("!")
    ) {
      const clean = text
        .replace(/\*\*/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .trim();

      return clean.length > 180 ? `${clean.slice(0, 177)}...` : clean;
    }
  }

  return "";
}

export function EntryTimeline({
  entries,
  limit,
}: {
  entries: LafEntry[];
  limit?: number;
}) {
  const sorted = [...entries].sort((a, b) => {
    if (!a.date) {
      return 1;
    }

    if (!b.date) {
      return -1;
    }

    return b.date.localeCompare(a.date);
  });
  const display = limit === undefined ? sorted : sorted.slice(0, limit);

  return (
    <div className="relative">
      <div className="absolute bottom-0 left-[7px] top-2 w-px bg-border" />
      <div className="space-y-8 pl-8">
        {display.map((entry) => {
          const excerpt = getExcerpt(entry);

          return (
            <NextLink
              className="group relative block"
              href={`/entries/${encodeURIComponent(entry.id)}`}
              key={entry.id}
            >
              <div className="absolute -left-8 top-[5px] size-[14px] rounded-full border-2 border-ink/30 bg-page transition group-hover:border-ink/60 group-hover:bg-ink/10" />
              <p className="mb-1 text-xs text-muted">
                {formatDate(entry.date)}
              </p>
              <h3 className="text-[15px] font-semibold leading-snug text-ink transition group-hover:opacity-70">
                {entry.title}
              </h3>
              {excerpt && (
                <p className="mt-1 text-[13px] leading-[1.65] text-muted">
                  {excerpt}
                </p>
              )}
            </NextLink>
          );
        })}
      </div>
    </div>
  );
}
