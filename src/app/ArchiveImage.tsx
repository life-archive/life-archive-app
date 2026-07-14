import Image, { type ImageProps } from "next/image";

import { rendererDefaults } from "@/defaults";

const isMultiHostMode = rendererDefaults.archiveRouting.mode === "multi-host";

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
