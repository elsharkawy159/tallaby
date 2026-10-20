"use client"

import type { ImgHTMLAttributes } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { resolveSectionMediaUrl } from "@/lib/builder/section-navigation"
import { useBuilderStore } from "@/lib/builder/store"
import { usePublicSiteContext } from "@/components/website-builder/public-site-context"
import { OptimizedImage, isOptimizableImageSrc } from "@/components/sections/optimized-image"
import { placeholderFor } from "@/components/sections/placeholders"

export type SectionEditableImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  instanceId: string
  elementKey: string
  /** Top-level section prop key → popover `src` */
  srcProp?: string
  /** Top-level section prop key → popover `alt` */
  altProp?: string
  collectionKey?: string
  collectionIndex?: number
  /** Collection item prop key → popover `src` */
  itemSrcProp?: string
  /** Collection item prop key → popover `alt` */
  itemAltProp?: string
  /** Pass true when rendering outside the builder (published site, email preview, etc.) */
  isPreview?: boolean
  /** Use next/image fill mode (parent must be positioned + sized). */
  fill?: boolean
  /** Responsive sizes hint for next/image. */
  sizes?: string
  /** Marks this as the LCP image — forwarded to next/image on public surfaces. */
  priority?: boolean
}

const elementId = (instanceId: string, elementKey: string) => `${instanceId}::${elementKey}`

function classNameImpliesFill (className?: string): boolean {
  if (!className) return false
  return (
    /\binset-0\b/.test(className) ||
    /\bsize-full\b/.test(className) ||
    (/\bh-full\b/.test(className) && /\bw-full\b/.test(className))
  )
}

/**
 * Reusable section image component.
 *
 * In the builder editor it:
 *  - Shows a hover-preview from Explore Images (via imagePreviewFor store state)
 *  - Highlights with a primary ring while previewing
 *  - On click in Explore Images applies the image immediately via commitImageUrl
 *  - Carries all data-element-* metadata for canvas selection + image popover
 *
 * On published/preview surfaces it renders via next/image when fill layout applies.
 */
export function SectionEditableImage ({
  instanceId,
  elementKey,
  srcProp,
  altProp,
  collectionKey,
  collectionIndex,
  itemSrcProp,
  itemAltProp,
  className,
  alt = "",
  src,
  onClick,
  isPreview = false,
  fill = false,
  sizes = "100vw",
  // Destructured out of imgProps: `priority` is a next/image concept, and
  // spreading it onto a raw <img> would emit an invalid DOM attribute.
  priority = false,
  ...imgProps
}: SectionEditableImageProps) {
  const eid = elementId(instanceId, elementKey)
  const publicSite = usePublicSiteContext()
  const onPublic = publicSite != null || isPreview

  // Only subscribe to preview state in editor mode — zero overhead in published rendering
  const imagePreviewUrl = useBuilderStore((s) =>
    !isPreview && s.imagePreviewFor?.elementId === eid ? s.imagePreviewFor.url : null
  )

  const resolvedSrc = imagePreviewUrl ?? resolveSectionMediaUrl(src)
  // Empty slots fall back to a local placeholder rather than a stock mockup, so
  // an unconfigured image always reads as "replace me". See ./placeholders.ts.
  const displaySrc = resolvedSrc || placeholderFor()

  const builderAttrs: Record<string, string> = {
    "data-element-id": eid,
    "data-element-type": "image",
    "data-element-kind": "image",
    "data-builder-tag": "Image",
  }
  if (srcProp) builderAttrs["data-element-src-prop"] = srcProp
  if (altProp) builderAttrs["data-element-alt-prop"] = altProp
  if (collectionKey) builderAttrs["data-element-collection"] = collectionKey
  if (collectionIndex !== undefined)
    builderAttrs["data-element-index"] = String(collectionIndex)
  if (itemSrcProp) builderAttrs["data-element-item-src-prop"] = itemSrcProp
  if (itemAltProp) builderAttrs["data-element-item-alt-prop"] = itemAltProp

  const mergedClassName = cn(
    className,
    imagePreviewUrl && "ring-2 ring-primary/70 ring-inset transition-all"
  )

  const canFill = fill || classNameImpliesFill(className)
  const useOptimized =
    onPublic &&
    canFill &&
    !imagePreviewUrl &&
    isOptimizableImageSrc(displaySrc)

  if (useOptimized) {
    // `fill` sizes the image from its container, so <img> width/height don't apply.
    const { width: _width, height: _height, ...optimizedProps } = imgProps
    return (
      <OptimizedImage
        src={displaySrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={mergedClassName}
        onClick={onClick}
        {...builderAttrs}
        {...optimizedProps}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...imgProps}
      {...builderAttrs}
      src={displaySrc}
      alt={alt}
      className={mergedClassName}
      onClick={onClick}
    />
  )
}
