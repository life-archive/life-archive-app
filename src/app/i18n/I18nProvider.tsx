"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

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
  children,
  defaultLocale,
}: {
  children: ReactNode;
  defaultLocale?: string;
}) {
  const fallbackLocale = normalizeLocale(defaultLocale);
  const locale = useSyncExternalStore(
    subscribeToLanguage,
    () => getBrowserLocale(fallbackLocale),
    () => fallbackLocale,
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, values) => translate(locale, key, values),
    }),
    [locale],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
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
