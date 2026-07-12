export const rendererDefaults = {
  archivePath: "content/demo.life",
  systemPath: ".laf-system",
  defaultLocale: "en",
  defaultTheme: "gallery",
  fallbackImages: {
    album: "/laf/albums.png",
    collection: "/laf/collections.png",
    hero: "/laf/hero.png",
  },
  metadata: {
    defaultTitle: "Life Archive",
    description: "Reference renderer for Life Archive Format archives.",
  },
  cacheControl: {
    asset: "public, max-age=31536000, immutable",
    icon: "public, max-age=3600",
  },
} as const;
