export function entryExcerpt(markdown: string) {
  const text = markdown
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*+] |\d+[.)] )/gm, "")
    .replace(/[`*_>#|~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return "No body text yet.";
  }

  return text.length > 180 ? `${text.slice(0, 177).trimEnd()}…` : text;
}
