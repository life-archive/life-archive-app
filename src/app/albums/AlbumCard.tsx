import Image from "next/image";

import { ArrowRight } from "lucide-react";

export type DisplayAlbum = {
  id: string;
  title: string;
  count: number;
  image: string;
};

export function AlbumCard({ album }: { album: DisplayAlbum }) {
  return (
    <a
      className="group block cursor-pointer overflow-hidden rounded-xl bg-surface ring-1 ring-border transition hover:-translate-y-0.5 hover:shadow-xl"
      href={`/albums/${album.id}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-media">
        <Image
          alt={`${album.title} album cover`}
          className="object-cover transition duration-500 group-hover:scale-105"
          fill
          sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
          src={album.image}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="font-serif text-2xl font-semibold text-white">
            {album.title}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4">
        <span className="text-sm text-muted">
          {album.count} photos
        </span>

        <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
          View album
          <ArrowRight
            size={15}
            strokeWidth={1.8}
            className="transition group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </a>
  );
}
