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
 * Contact Sheet — dense-grid archetype.
 *
 * Many small square tiles (2 → 3 → 4 columns) packed with tight gutters and no
 * borders, each revealing its title and caption on a scrim on hover. Denser
 * than Lattice by design: it is for volume, not for a curated handful.
 */
function GalleryTiles ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          align="center"
          headingClassName={`${TYPE_H2} text-foreground`}
          overrides={{ eyebrow: mutedEyebrow("mb-2", isPreview) }}
          entryClassName={(entry) =>
            entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
          }
          renderItems={({ instance: inst }) => {
            const items = itemsOf<GalleryImage>(inst)
            if (items.length === 0) return null
            return (
              <div className="mt-10 grid grid-cols-2 gap-2 text-start sm:grid-cols-3 md:grid-cols-4 md:gap-3">
                {items.map((item, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-xl bg-muted">
                    <ItemImage
                      instance={inst}
                      index={i}
                      src={item.imageUrl}
                      alt={item.alt}
                      altProp="alt"
                      ratio="square"
                      rounded="md"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      isPreview={isPreview}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex flex-col items-start justify-end rounded-xl bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {item.title && (
                        <ItemText
                          instance={inst}
                          index={i}
                          field="title"
                          value={item.title}
                          isPreview={isPreview}
                          className="text-sm font-semibold leading-tight text-white"
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

export const galleryTilesSection = defineSection({
  id: "gallery-tiles",
  displayName: "Contact Sheet",
  description: "Dense wall of small square tiles with tight gutters, titles and captions on hover.",
  category: "gallery",
  layoutArchetype: "dense-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["ecommerce", "portfolio", "creative", "travel", "restaurant", "generic"],
  trustWeight: 45,
  conversionWeight: 25,
  funnelStage: "consideration",
  styles: ["modern", "minimal", "bold"],
  goals: ["engagement", "brand", "awareness"],
  complexity: "low",
  density: "high",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      galleryEyebrowBlock(),
      galleryHeadingBlock(),
      galleryImagesBlock({ label: "Tiles", minItems: 1, maxItems: 24 }),
    ],
  },
  defaultProps: {
    eyebrow: "The collection",
    headline: "Pieces from the new season",
    items: [
      { imageUrl: "", alt: "Linen overshirt on a hanger", title: "Linen overshirt", caption: "Sand" },
      { imageUrl: "", alt: "Leather tote bag on a stool", title: "Market tote", caption: "Tan leather" },
      { imageUrl: "", alt: "Ceramic mugs stacked on a shelf", title: "Stoneware mug", caption: "Set of two" },
      { imageUrl: "", alt: "Wool throw folded on a bench", title: "Wool throw", caption: "Forest green" },
      { imageUrl: "", alt: "Brass desk lamp on a walnut desk", title: "Desk lamp", caption: "Brushed brass" },
      { imageUrl: "", alt: "Canvas sneakers on a concrete floor", title: "Canvas low-top", caption: "Off-white" },
      { imageUrl: "", alt: "Glass carafe filled with water", title: "Carafe", caption: "Hand-blown glass" },
      { imageUrl: "", alt: "Notebook with a cloth cover", title: "Field notebook", caption: "Dot grid" },
    ],
  },
  Component: GalleryTiles,
})
