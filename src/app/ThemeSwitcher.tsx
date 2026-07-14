"use client";

import { useEffect, useSyncExternalStore } from "react";

import { rendererDefaults } from "@/defaults";
import {
  isLafTheme,
  normalizeLafTheme,
  type LafTheme,
} from "@/lib/life/themes";

import { useI18n } from "./i18n/I18nProvider";

const storageKey = "laf-theme";
const configuredDefaultTheme = normalizeLafTheme(rendererDefaults.defaultTheme);
const themeChangeEvent = "laf:theme-change";
const themes = [
  {
    name: "light",
    labelKey: "theme.light",
    swatch: "bg-[#ffffff]",
  },
  {
    name: "dusk",
    labelKey: "theme.dusk",
    swatch: "bg-[#f1ede4]",
  },
  {
    name: "gallery",
    labelKey: "theme.gallery",
    swatch: "bg-[#f4f6f7]",
  },
  {
    name: "dark",
    labelKey: "theme.dark",
    swatch: "bg-[#08090b]",
  },
] as const;

type ThemeName = LafTheme;

export function ThemeSwitcher({
  defaultTheme: archiveDefaultTheme,
}: {
  defaultTheme?: LafTheme;
}) {
  const { t } = useI18n();
  const defaultTheme = normalizeLafTheme(
    archiveDefaultTheme,
    configuredDefaultTheme,
  );
  const theme = useSyncExternalStore(
    subscribeToTheme,
    () => getBrowserTheme(defaultTheme),
    () => defaultTheme,
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function selectTheme(nextTheme: ThemeName) {
    window.localStorage.setItem(storageKey, nextTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  const selectedTheme = themes.find((item) => item.name === theme) ?? themes[0];

  return (
    <div>
      <div
        className="flex items-center gap-2"
        role="group"
        aria-label={t("theme.theme")}
      >
        {themes.map((item) => (
          <button
            aria-label={t("theme.useTheme", {
              label: t(item.labelKey),
            })}
            aria-pressed={theme === item.name}
            className={`grid size-7 cursor-pointer place-items-center rounded-full border transition ${
              theme === item.name
                ? "border-ink ring-2 ring-ink/15"
                : "border-border-strong hover:border-ink/40"
            }`}
            key={item.name}
            onClick={() => selectTheme(item.name)}
            title={t(item.labelKey)}
            type="button"
          >
            <span
              aria-hidden="true"
              className={`size-4 rounded-full border border-black/10 ${item.swatch}`}
            />
          </button>
        ))}
      </div>
      <p className="mt-2 text-[13px] leading-5 text-muted">
        {t(selectedTheme.labelKey)}
      </p>
    </div>
  );
}

function getBrowserTheme(defaultTheme: ThemeName): ThemeName {
  const savedTheme = window.localStorage.getItem(storageKey);

  return isThemeName(savedTheme) ? savedTheme : getDocumentTheme(defaultTheme);
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(themeChangeEvent, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(themeChangeEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getDocumentTheme(defaultTheme: ThemeName): ThemeName {
  const documentTheme = document.documentElement.dataset.theme;

  return isThemeName(documentTheme) ? documentTheme : defaultTheme;
}

function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
}

function isThemeName(value: unknown): value is ThemeName {
  return isLafTheme(value);
}
