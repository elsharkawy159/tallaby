"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionEditableImage } from "@/components/sections/section-editable-image"
import {
  resolveMediaSrc,
  type PlaceholderKind,
} from "@/components/sections/placeholders"
import type { MediaRatio } from "@/components/sections/schema/section-schema"

/**
 * The single media primitive for sections.
 *
 * Replaces both the ad-hoc raw `<img>` tags (48 section files had them, so those
 * images were neither AI-replaceable nor selectable in the builder) and the
 * narrower SectionImageSlot. Every image slot in a migrated section goes through
 * here, which is what guarantees:
 *
 *   • a local placeholder renders when the slot is unset (never a stock photo,
 *     never an external URL) — see components/sections/placeholders.ts
 *   • the media picker opens with the right prop/collection metadata
 *   • next/image optimization on public surfaces
 *   • the AI image search can target it, because the prop keys are declared
 *   • a consistent aspect ratio, so swapping an image never shifts the layout
 */

const ASPECT: Record<MediaRatio, string> = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[21/9]",
  auto: "",
}

const ROUNDED = {
  none: "rounded-none",
  sm: "rounded-md",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  full: "rounded-full",
} as const

export type SectionMediaProps = {
  instanceId: string
  /** Element key for the canvas selector id (`${instanceId}::${elementKey}`). */
  elementKey: string
  src?: string
  alt?: string
  /** Section prop key holding the URL. Defaults to `imageUrl`. */
  srcProp?: string
  /** Section prop key holding the alt text. Defaults to `imageAlt`. */
  altProp?: string
  /** Set when the image lives inside an item collection. */
  collectionKey?: string
  collectionIndex?: number
  itemSrcProp?: string
  itemAltProp?: string
  ratio?: MediaRatio
  /** Which placeholder art to show while the slot is empty. */
  placeholder?: PlaceholderKind
  rounded?: keyof typeof ROUNDED
  className?: string
  imgClassName?: string
  /** Responsive sizes hint forwarded to next/image. */
  sizes?: string
  priority?: boolean
  isPreview?: boolean
}

export function SectionMedia ({
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
  ratio = "video",
  placeholder,
  rounded = "lg",
  className,
  imgClassName,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  isPreview,
}: SectionMediaProps) {
  const resolved = resolveMediaSrc(src, placeholder, ratio)

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/40",
        ASPECT[ratio],
        ROUNDED[rounded],
        className,
      )}
    >
      <SectionEditableImage
        instanceId={instanceId}
        elementKey={elementKey}
        src={resolved}
        alt={alt}
        srcProp={srcProp}
        altProp={altProp}
        collectionKey={collectionKey}
        collectionIndex={collectionIndex}
        itemSrcProp={itemSrcProp}
        itemAltProp={itemAltProp}
        isPreview={isPreview}
        fill={ratio !== "auto"}
        sizes={sizes}
        priority={priority}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
    </div>
  )
}
