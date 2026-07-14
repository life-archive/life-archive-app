export const rendererDefaults = {
  archivePath: "content/magical.life",
  archiveRouting: {
    mode: "multi-host",
  hosts: {
    "madhan.xyz.com": "content/madhan.life",
    "priya.xyz.com": "content/priya.life",
    },
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
    project: "https://github.com/life-archive/life-archive-app",
  },
  cacheControl: {
    asset: "public, no-cache",
    icon: "public, max-age=3600",
  },
} as const;
