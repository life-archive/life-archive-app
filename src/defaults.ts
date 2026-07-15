export const rendererDefaults = {
  archivePath: "content/demo.life",
  archiveRouting: {
    mode: "single",
  hosts: {},
  },
  systemPath: ".laf-system",
  defaultLocale: "en",
  defaultTheme: "gallery",
  fallbackImages: {
    album: "/laf/albums.png",
    collection: "/laf/collections.png",
    hero: "/laf/hero.png",
  },
  home: {
    albumLimit: 20,
    collectionLimit: 25,
  },
  metadata: {
    defaultTitle: "Life Archive",
    description: "Reference renderer for Life Archive Format archives.",
  },
  links: {
    project: "https://openlaf.org",
  },
  cacheControl: {
    asset: "public, no-cache",
    icon: "public, max-age=3600",
  },
} as const;
