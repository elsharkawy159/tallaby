"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/utils";

interface ImageWithFallbackProps extends Omit<ImageProps, "src" | "onError"> {
  src: ImageProps["src"];
  fallbackSrc?: string;
}

export function ImageWithFallback({
  src,
  fallbackSrc = PRODUCT_IMAGE_FALLBACK,
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setHasFailed(false);
  }, [src, fallbackSrc]);

  return (
    <Image
      {...props}
      src={hasFailed ? fallbackSrc : currentSrc}
      alt={alt}
      onError={() => {
        if (!hasFailed) {
          setHasFailed(true);
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
