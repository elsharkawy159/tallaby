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
 * Cascade — masonry archetype.
 *
 * CSS-columns masonry (1 → 2 → 3 columns): every image keeps its natural
 * height and its title/caption sit underneath in the same card. The column
 * flow is chrome; the eyebrow, headline and the photos are slot entries.
 */
function GalleryMasonry ({ instance, isPreview, definition }: SectionComponentProps) {
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
          overrides={{ eyebrow: mutedEyebrow("mb-2", isPreview) }}
          renderItems={({ instance: inst }) => {
            const items = itemsOf<GalleryImage>(inst)
            if (items.length === 0) return null
            return (
              <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
                {items.map((item, i) => (
                  <div key={i} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card">
                    <ItemImage
                      instance={inst}
                      index={i}
                      src={item.imageUrl}
                      alt={item.alt}
                      altProp="alt"
                      ratio="auto"
                      placeholder="portrait"
                      rounded="none"
                      className="w-full"
                      imgClassName="w-full object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      isPreview={isPreview}
                    />
                    {(item.title || item.caption) && (
                      <div className="p-3">
                        {item.title && (
                          <ItemText
                            instance={inst}
                            index={i}
                            field="title"
                            value={item.title}
                            isPreview={isPreview}
                            className="text-sm font-semibold text-foreground"
                          />
                        )}
                        {item.caption && (
                          <ItemText
                            instance={inst}
                            index={i}
                            field="caption"
                            value={item.caption}
                            isPreview={isPreview}
                            className="mt-0.5 text-xs text-muted-foreground"
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

export const galleryMasonrySection = defineSection({
  id: "gallery-masonry",
  displayName: "Cascade",
  description: "Masonry columns of natural-height photos, each titled and captioned underneath.",
  category: "gallery",
  layoutArchetype: "masonry",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return galleryMasonrySection.defaultProps
    return oldProps
  },
  industries: ["photography", "podcast", "portfolio", "agency", "creative", "travel", "ecommerce", "generic"],
  trustWeight: 45,
  conversionWeight: 25,
  funnelStage: "consideration",
  styles: ["modern", "editorial", "minimal"],
  goals: ["brand", "engagement", "awareness"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      galleryEyebrowBlock(),
      galleryHeadingBlock(),
      galleryImagesBlock({ label: "Photos", minItems: 1, maxItems: 24 }),
    ],
  },
  defaultProps: {
    eyebrow: "Selected work",
    headline: "Moments we were lucky enough to capture",
    items: [
      { imageUrl: "", alt: "Couple walking along a windswept beach at dusk", title: "Coastline", caption: "Brittany, 2025" },
      { imageUrl: "", alt: "Morning light across a quiet studio", title: "Studio light", caption: "Lisbon, 2025" },
      { imageUrl: "", alt: "Close-up of hands shaping clay on a wheel", title: "Makers", caption: "Kyoto, 2024" },
      { imageUrl: "", alt: "City skyline reflected in a rain puddle", title: "After the rain", caption: "Copenhagen, 2024" },
      { imageUrl: "", alt: "Long table set for an outdoor dinner", title: "Long table", caption: "Puglia, 2024" },
      { imageUrl: "", alt: "Mountain ridge above a sea of clouds", title: "Above it all", caption: "Dolomites, 2023" },
    ],
  },
  Component: GalleryMasonry,
})
