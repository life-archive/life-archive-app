import Image, { type ImageProps } from "next/image";

import { rendererDefaults } from "@/defaults";

const archiveRoutingMode =
  process.env.NEXT_PUBLIC_LAF_ARCHIVE_ROUTING_MODE ??
  rendererDefaults.archiveRouting.mode;
const isMultiHostMode = archiveRoutingMode === "multi-host";

export function ArchiveImage(props: ImageProps) {
  const { alt, unoptimized, ...imageProps } = props;

  return (
    <Image
      {...imageProps}
      alt={alt}
      unoptimized={isMultiHostMode || unoptimized}
    />
  );
}
