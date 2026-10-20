"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionEditableImage } from "@/components/sections/section-editable-image"

type Aspect = "square" | "video" | "portrait" | "wide" | "auto"

type SectionImageSlotProps = {
  instanceId: string
  /** Element key used to build the canvas selector id (`${instanceId}::${elementKey}`). */
  elementKey: string
  src?: string
  alt?: string
  /** Prop key holding the image URL on the section instance. */
  srcProp?: string
  /** Prop key holding the alt text on the section instance. */
  altProp?: string
  /** When the image lives inside a collection (e.g. tiles[2].imageUrl). */
  collectionKey?: string
  collectionIndex?: number
  itemSrcProp?: string
  itemAltProp?: string
  aspect?: Aspect
  rounded?: "lg" | "xl" | "2xl" | "3xl"
  className?: string
  imgClassName?: string
  /** Responsive sizes hint forwarded to next/image on public surfaces. */
  sizes?: string
}

const ASPECT_MAP: Record<Aspect, string> = {
  square:   "aspect-square",
  video:    "aspect-video",
  portrait: "aspect-[3/4]",
  wide:     "aspect-[21/9]",
  auto:     "",
}

const ROUNDED_MAP: Record<NonNullable<SectionImageSlotProps["rounded"]>, string> = {
  lg:  "rounded-lg",
  xl:  "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
}

/**
 * Image slot with consistent aspect ratio + placeholder fallback. Wraps
 * `SectionEditableImage` so the builder editor can open the media picker
 * with the right collection / prop metadata.
 */
export function SectionImageSlot ({
  instanceId,
  elementKey,
  src,
  alt = "",
  srcProp = "imageUrl",
  altProp = "imageAlt",
  collectionKey,
  collectionIndex,
  itemSrcProp,
  itemAltProp,
  aspect = "video",
  rounded = "2xl",
  className,
  imgClassName,
  sizes = "100vw",
}: SectionImageSlotProps) {
  const useFill = aspect !== "auto"

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        ASPECT_MAP[aspect],
        ROUNDED_MAP[rounded],
        className,
      )}
    >
      <SectionEditableImage
        instanceId={instanceId}
        elementKey={elementKey}
        src={src}
        alt={alt}
        srcProp={srcProp}
        altProp={altProp}
        collectionKey={collectionKey}
        collectionIndex={collectionIndex}
        itemSrcProp={itemSrcProp}
        itemAltProp={itemAltProp}
        fill={useFill}
        sizes={sizes}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
    </div>
  )
}
