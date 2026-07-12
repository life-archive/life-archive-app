"use client";

import { localeOptions } from "./i18n/dictionaries";
import { useI18n } from "./i18n/I18nProvider";

export function LanguageSwitcher({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useI18n();
  const selectedLocale =
    localeOptions.find((item) => item.code === locale) ?? localeOptions[0];
  const buttonClassName = compact
    ? "h-6 min-w-7 px-1.5 text-[10px]"
    : "h-7 min-w-8 px-2 text-[11px]";

  return (
    <div>
      <div
        aria-label={t("language.language")}
        className={`flex flex-wrap items-center ${compact ? "gap-1.5" : "gap-2"}`}
        role="group"
      >
        {localeOptions.map((item) => (
          <button
            aria-label={t("language.useLanguage", {
              label: item.label,
            })}
            aria-pressed={locale === item.code}
            className={`grid cursor-pointer place-items-center rounded-full border font-semibold uppercase transition ${buttonClassName} ${
              locale === item.code
                ? "border-ink bg-ink text-page ring-2 ring-ink/15"
                : "border-border-strong text-muted hover:border-ink/40 hover:text-ink"
            }`}
            key={item.code}
            onClick={() => setLocale(item.code)}
            title={item.label}
            type="button"
          >
            {item.code}
          </button>
        ))}
      </div>
      <p className={`${compact ? "mt-1.5 text-[12px]" : "mt-2 text-[13px]"} leading-5 text-muted`}>
        {selectedLocale.nativeLabel}
      </p>
    </div>
  );
}
