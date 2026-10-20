"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemImage,
  ItemText,
  galleryEyebrowBlock,
  galleryHeadingBlock,
  galleryImagesBlock,
  itemsOf,
  mutedEyebrow,
  type GalleryImage,
} from "@/components/sections/gallery/gallery-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const ARROW_CLASS =
  "flex size-10 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-all"

/**
 * Glide — carousel archetype.
 *
 * A snap-scrolling track of wide image cards with prev/next arrows beside the
 * header and no visible scrollbar. Two slots: the header copy shares its row
 * with the arrows, while the track is its own full-width region. The arrows
 * are chrome — they only drive the track.
 */
function GalleryCarousel ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const itemCount = itemsOf<GalleryImage>(instance).length

  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    updateArrows()
    el.addEventListener("scroll", updateArrows, { passive: true })
    // Not every environment ships ResizeObserver (jsdom, old embeds).
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateArrows) : null
    ro?.observe(el)
    return () => {
      el.removeEventListener("scroll", updateArrows)
      ro?.disconnect()
    }
  }, [updateArrows, itemCount])

  function scroll (dir: "prev" | "next") {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>("[data-carousel-card]")
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.85
    el.scrollBy({ left: dir === "next" ? step : -step, behavior: "smooth" })
  }

  return (
    <section className="relative bg-background" style={rootStyle}>
      <SectionContainer>
        {/* Header row with arrows */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex min-w-0 flex-col"
            align="left"
            headingClassName={`${TYPE_H2} text-foreground`}
            overrides={{ eyebrow: mutedEyebrow("mb-1", isPreview) }}
          />

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => scroll("prev")}
              disabled={!canPrev}
              className={cn(
                ARROW_CLASS,
                canPrev
                  ? "text-foreground hover:border-foreground/20 hover:bg-muted"
                  : "cursor-not-allowed text-muted-foreground/40 opacity-50"
              )}
            >
              <ChevronLeft className="size-5 rtl:rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => scroll("next")}
              disabled={!canNext}
              className={cn(
                ARROW_CLASS,
                canNext
                  ? "text-foreground hover:border-foreground/20 hover:bg-muted"
                  : "cursor-not-allowed text-muted-foreground/40 opacity-50"
              )}
            >
              <ChevronRight className="size-5 rtl:rotate-180" />
            </button>
          </div>
        </div>

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="slides"
          className="flex flex-col gap-4"
          renderItems={({ instance: inst }) => {
            const items = itemsOf<GalleryImage>(inst)
            return (
              // Scroll track — hidden scrollbar, no visible overflow.
              <div
                ref={trackRef}
                className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {items.map((item, i) => (
                  <div
                    key={i}
                    data-carousel-card
                    className="group relative w-[80vw] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-muted md:w-[40vw]"
                  >
                    <ItemImage
                      instance={inst}
                      index={i}
                      src={item.imageUrl}
                      alt={item.alt}
                      altProp="alt"
                      ratio="video"
                      rounded="lg"
                      sizes="(max-width: 768px) 80vw, 40vw"
                      isPreview={isPreview}
                    />
                    {(item.title || item.caption) && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        {item.title && (
                          <ItemText
                            instance={inst}
                            index={i}
                            field="title"
                            value={item.title}
                            isPreview={isPreview}
                            className="text-sm font-semibold text-white"
                          />
                        )}
                        {item.caption && (
                          <ItemText
                            instance={inst}
                            index={i}
                            field="caption"
                            value={item.caption}
                            isPreview={isPreview}
                            className="mt-0.5 text-xs text-white/75"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const galleryCarouselSection = defineSection({
  id: "gallery-carousel",
  displayName: "Glide",
  description: "Snap-scrolling track of wide image cards with prev/next arrows beside the header.",
  category: "gallery",
  layoutArchetype: "carousel",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["travel", "portfolio", "creative", "ecommerce", "event", "generic"],
  trustWeight: 45,
  conversionWeight: 25,
  funnelStage: "consideration",
  styles: ["modern", "editorial", "bold"],
  goals: ["engagement", "brand", "awareness"],
  complexity: "low",
  density: "medium",
  imageRequired: true,
  mobileScore: 96,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "slides", label: "Slides", eject: { direction: "row" } },
    ],
    blocks: [
      galleryEyebrowBlock(),
      galleryHeadingBlock(),
      galleryImagesBlock({ label: "Slides", minItems: 1, maxItems: 20, slot: "slides" }),
    ],
  },
  defaultProps: {
    eyebrow: "On the road",
    headline: "Stories from this season's journeys",
    items: [
      { imageUrl: "", alt: "Winding coastal road above turquoise water", title: "The Amalfi Coast", caption: "Italy" },
      { imageUrl: "", alt: "Lantern-lit lane in an old town at night", title: "Old-town evenings", caption: "Japan" },
      { imageUrl: "", alt: "Desert dunes at sunrise", title: "Dawn in the dunes", caption: "Morocco" },
      { imageUrl: "", alt: "Fjord framed by steep green cliffs", title: "Into the fjords", caption: "Norway" },
      { imageUrl: "", alt: "Terraced rice fields in morning mist", title: "Terraces at first light", caption: "Indonesia" },
    ],
  },
  Component: GalleryCarousel,
})
