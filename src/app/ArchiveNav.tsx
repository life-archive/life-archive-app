"use client";

import NextLink from "next/link";
import {
  BookOpen,
  FolderOpen,
  HomeIcon,
  ImageIcon,
  Menu,
  Search,
  type LucideIcon,
} from "lucide-react";

import { useI18n } from "./i18n/I18nProvider";
import type { TranslationKey } from "./i18n/dictionaries";

const navItems: Array<{
  href: string;
  labelKey: TranslationKey;
  key: ArchiveNavActive;
  icon: LucideIcon;
  requiresAlbums?: boolean;
  requiresCollections?: boolean;
}> = [
  { href: "/", labelKey: "nav.home", key: "home", icon: HomeIcon },
  { href: "/entries", labelKey: "nav.entries", key: "entries", icon: BookOpen },
  {
    href: "/albums",
    labelKey: "nav.albums",
    key: "albums",
    icon: ImageIcon,
    requiresAlbums: true,
  },
  {
    href: "/collections",
    labelKey: "nav.collections",
    key: "collections",
    icon: FolderOpen,
    requiresCollections: true,
  },
];

export type ArchiveNavActive =
  | "home"
  | "entries"
  | "albums"
  | "collections"
  | "search"
  | "about";

export function ArchiveNav({
  active,
  showAlbums = false,
  showCollections = false,
  title,
}: {
  active: ArchiveNavActive;
  showAlbums?: boolean;
  showCollections?: boolean;
  title: string;
}) {
  const { t } = useI18n();
  const visibleNavItems = navItems.filter(
    (item) =>
      (!item.requiresAlbums || showAlbums) &&
      (!item.requiresCollections || showCollections),
  );

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-nav-glass px-5 backdrop-blur-xl lg:px-8">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between">
        <NextLink
          className="font-serif text-2xl font-semibold tracking-[-0.03em] text-ink"
          href="/"
        >
          {title}
        </NextLink>
        <nav className="hidden items-center gap-1 rounded-full border border-border bg-nav-pill p-1 text-[13px] font-medium text-nav-muted shadow-nav lg:flex">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <NextLink
                className={`inline-flex h-9 items-center gap-2 rounded-full px-3.5 transition ${
                  item.key === active
                    ? "bg-photo-shell text-white"
                    : "hover:bg-hover-soft hover:text-ink"
                }`}
                href={item.href}
                key={item.key}
              >
                <Icon aria-hidden="true" size={15} strokeWidth={1.8} />
                {t(item.labelKey)}
              </NextLink>
            );
          })}
          <NextLink
            aria-label={t("nav.search")}
            className={`grid size-9 place-items-center rounded-full transition ${
              active === "search"
                ? "bg-photo-shell text-white"
                : "hover:bg-hover-soft hover:text-ink"
            }`}
            href="/search"
            title={t("nav.search")}
          >
            <Search aria-hidden="true" size={16} strokeWidth={1.8} />
          </NextLink>
        </nav>
        <div className="flex items-center gap-2 lg:hidden">
          <NextLink
            aria-label={t("nav.search")}
            className={`grid size-10 place-items-center rounded-full border border-border-strong bg-glass-surface transition ${
              active === "search" ? "text-ink" : "text-soft"
            }`}
            href="/search"
            title={t("nav.search")}
          >
            <Search aria-hidden="true" size={18} strokeWidth={1.8} />
          </NextLink>
          <button
            aria-label={t("nav.openMenu")}
            className="grid size-10 place-items-center rounded-full border border-border-strong bg-glass-surface text-soft"
          >
            <Menu aria-hidden="true" size={20} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}
