export const LAF_THEMES = ["light", "dusk", "gallery", "dark"] as const;

export type LafTheme = (typeof LAF_THEMES)[number];

export function isLafTheme(value: unknown): value is LafTheme {
  return (
    typeof value === "string" &&
    LAF_THEMES.some((theme) => theme === value)
  );
}

export function normalizeLafTheme(
  value: unknown,
  fallback: LafTheme = "gallery",
): LafTheme {
  return isLafTheme(value) ? value : fallback;
}
