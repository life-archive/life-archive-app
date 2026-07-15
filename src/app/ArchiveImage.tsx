import Image, { type ImageProps } from "next/image";

import { rendererDefaults } from "@/defaults";

type ArchiveRoutingMode = "single" | "multi-host";

const archiveRoutingMode = rendererDefaults.archiveRouting
  .mode as ArchiveRoutingMode;
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
