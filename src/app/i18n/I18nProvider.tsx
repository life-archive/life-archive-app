"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { resolveArchiveLabels } from "@/lib/life/labels";
import type { LafArchiveLabels } from "@/lib/life/types";

import {
  languageStorageKey,
  normalizeLocale,
  translate,
  type LocaleCode,
  type TranslationKey,
  type TranslationValues,
} from "./dictionaries";

const languageChangeEvent = "laf:language-change";

type I18nContextValue = {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  archiveLabels,
  children,
  defaultLocale,
}: {
  archiveLabels?: LafArchiveLabels;
  children: ReactNode;
  defaultLocale?: string;
}) {
  const fallbackLocale = normalizeLocale(defaultLocale);
  const labels = useMemo(
    () => resolveArchiveLabels(archiveLabels),
    [archiveLabels],
  );
  const locale = useSyncExternalStore(
    subscribeToLanguage,
    () => getBrowserLocale(fallbackLocale),
    () => fallbackLocale,
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, values) =>
        archiveLabelTranslation(key, labels) ??
        translate(locale, key, values),
    }),
    [labels, locale],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

function archiveLabelTranslation(
  key: TranslationKey,
  labels: ReturnType<typeof resolveArchiveLabels>,
) {
  if (key === "nav.collections" || key === "common.collections") {
    return labels.collections;
  }

  if (key === "common.collection") {
    return labels.collection;
  }

  if (key === "empty.noCollections") {
    return `No ${labels.collections} found in this archive yet.`;
  }

  return undefined;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}

export function T({
  k,
  values,
}: {
  k: TranslationKey;
  values?: TranslationValues;
}) {
  const { t } = useI18n();

  return t(k, values);
}

function subscribeToLanguage(onChange: () => void) {
  window.addEventListener(languageChangeEvent, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(languageChangeEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getBrowserLocale(fallbackLocale: LocaleCode) {
  const savedLocale = window.localStorage.getItem(languageStorageKey);

  return normalizeLocale(savedLocale ?? fallbackLocale);
}

function setLocale(locale: LocaleCode) {
  window.localStorage.setItem(languageStorageKey, locale);
  document.documentElement.lang = locale;
  document.documentElement.dataset.language = locale;
  window.dispatchEvent(new Event(languageChangeEvent));
}
