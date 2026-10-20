"use client"

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

/**
 * Centerpiece — asymmetric archetype.
 *
 * The first image is the feature: two-thirds of the width with its title and
 * caption on a scrim. Up to three more images stack in the remaining third,
 * each revealing its caption on hover. The 2:1 split is chrome; the eyebrow,
 * headline and images are slot entries.
 */
function GallerySpotlight ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col"
          align="left"
          headingClassName={`${TYPE_H2} text-foreground`}
          overrides={{ eyebrow: mutedEyebrow("mb-1", isPreview) }}
          renderItems={({ instance: inst }) => {
            const [featured, ...thumbs] = itemsOf<GalleryImage>(inst)
            if (!featured) return null
            return (
              <div className="mt-8 flex flex-col gap-3 md:flex-row md:gap-4">
                {/* Featured — 2/3 */}
                <div className="group relative overflow-hidden rounded-2xl border border-border bg-muted md:flex-[2]">
                  <ItemImage
                    instance={inst}
                    index={0}
                    src={featured.imageUrl}
                    alt={featured.alt}
                    altProp="alt"
                    ratio="video"
                    rounded="lg"
                    className="md:aspect-auto md:h-full md:min-h-[480px]"
                    sizes="(max-width: 768px) 100vw, 66vw"
                    isPreview={isPreview}
                  />
                  {(featured.title || featured.caption) && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                      {featured.title && (
                        <ItemText
                          instance={inst}
                          index={0}
                          field="title"
                          value={featured.title}
                          isPreview={isPreview}
                          className="text-base font-semibold text-white"
                        />
                      )}
                      {featured.caption && (
                        <ItemText
                          instance={inst}
                          index={0}
                          field="caption"
                          value={featured.caption}
                          isPreview={isPreview}
                          className="mt-0.5 text-xs text-white/80"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Thumbnails — 1/3 */}
                <div className="flex flex-row gap-3 md:flex-[1] md:flex-col md:gap-4">
                  {thumbs.slice(0, 3).map((item, idx) => {
                    const i = idx + 1
                    return (
                      <div key={i} className="group relative flex-1 overflow-hidden rounded-2xl border border-border bg-muted">
                        <ItemImage
                          instance={inst}
                          index={i}
                          src={item.imageUrl}
                          alt={item.alt}
                          altProp="alt"
                          ratio="square"
                          rounded="lg"
                          sizes="(max-width: 768px) 33vw, 22vw"
                          isPreview={isPreview}
                        />
                        {item.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <ItemText
                              instance={inst}
                              index={i}
                              field="caption"
                              value={item.caption}
                              isPreview={isPreview}
                              className="text-xs text-white"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const gallerySpotlightSection = defineSection({
  id: "gallery-spotlight",
  displayName: "Centerpiece",
  description: "One featured image across two-thirds of the width beside a column of three thumbnails.",
  category: "gallery",
  layoutArchetype: "asymmetric",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["photography", "podcast", "portfolio", "agency", "creative", "travel", "real_estate", "generic"],
  trustWeight: 45,
  conversionWeight: 25,
  funnelStage: "consideration",
  styles: ["modern", "editorial", "bold"],
  goals: ["brand", "engagement", "awareness"],
  complexity: "low",
  density: "medium",
  imageRequired: true,
  mobileScore: 85,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      galleryEyebrowBlock(),
      galleryHeadingBlock(),
      galleryImagesBlock({ label: "Images (first = featured)", minItems: 1, maxItems: 4 }),
    ],
  },
  defaultProps: {
    eyebrow: "Featured project",
    headline: "The Harbour House, restored",
    items: [
      { imageUrl: "", alt: "Restored seaside house at golden hour", title: "The Harbour House", caption: "Residential · 2025" },
      { imageUrl: "", alt: "Open-plan kitchen with oak cabinetry", caption: "Kitchen" },
      { imageUrl: "", alt: "Reading nook beneath a dormer window", caption: "Reading nook" },
      { imageUrl: "", alt: "Terrace overlooking the harbour", caption: "Terrace" },
    ],
  },
  Component: GallerySpotlight,
})
