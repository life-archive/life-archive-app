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
  },
  metadata: {
    defaultTitle: "Life Archive",
    description: "Reference renderer for Life Archive Format archives.",
  },
  links: {
    project: "https://github.com/life-archive/life-archive-app",
  },
  cacheControl: {
    asset: "public, max-age=31536000, immutable",
    icon: "public, max-age=3600",
  },
} as const;
