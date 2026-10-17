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
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

/** One captioned card — the same markup in the mobile strip and the desktop grid. */
function RowCard ({
  instance,
  item,
  index,
  isPreview,
}: {
  instance: SectionInstance
  item: GalleryImage
  index: number
  isPreview?: boolean
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <ItemImage
        instance={instance}
        index={index}
        src={item.imageUrl}
        alt={item.alt}
        altProp="alt"
        ratio="square"
        rounded="lg"
        className="rounded-b-none"
        sizes="(max-width: 768px) 224px, 25vw"
        isPreview={isPreview}
      />
      {(item.title || item.caption) && (
        <div className="p-3">
          {item.title && (
            <ItemText
              as="p"
              instance={instance}
              index={index}
              field="title"
              value={item.title}
              isPreview={isPreview}
              className="text-sm font-medium text-foreground"
            />
          )}
          {item.caption && (
            <ItemText
              as="p"
              instance={instance}
              index={index}
              field="caption"
              value={item.caption}
              isPreview={isPreview}
              className="mt-0.5 text-xs text-muted-foreground"
            />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Filmstrip — captioned-grid archetype.
 *
 * Captioned square cards: a snap-scrolling strip on mobile, a four-column grid
 * from `md` up. The strip/grid switch is chrome; the eyebrow, headline and the
 * cards are slot entries.
 */
function GalleryRow ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const items = itemsOf<GalleryImage>(inst)
            if (items.length === 0) return null
            return (
              <div className="mt-8">
                {/* Mobile: horizontal snap strip */}
                <div className="flex snap-x gap-4 overflow-x-auto pb-4 md:hidden">
                  {items.map((item, i) => (
                    <div key={i} className="w-56 shrink-0 snap-start">
                      <RowCard instance={inst} item={item} index={i} isPreview={isPreview} />
                    </div>
                  ))}
                </div>
                {/* Desktop: four-column grid */}
                <div className="hidden grid-cols-4 gap-4 md:grid">
                  {items.map((item, i) => (
                    <RowCard key={i} instance={inst} item={item} index={i} isPreview={isPreview} />
                  ))}
                </div>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const galleryRowSection = defineSection({
  id: "gallery-row",
  displayName: "Filmstrip",
  description: "Captioned square cards — a snap-scroll strip on mobile, a four-column row on desktop.",
  category: "gallery",
  layoutArchetype: "captioned-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return galleryRowSection.defaultProps
    return oldProps
  },
  industries: ["portfolio", "agency", "creative", "travel", "ecommerce", "generic"],
  trustWeight: 45,
  conversionWeight: 25,
  funnelStage: "consideration",
  styles: ["modern", "minimal", "editorial"],
  goals: ["brand", "engagement", "awareness"],
  complexity: "low",
  density: "medium",
  imageRequired: true,
  mobileScore: 95,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      galleryEyebrowBlock(),
      galleryHeadingBlock(),
      galleryImagesBlock({ label: "Images", minItems: 1, maxItems: 12 }),
    ],
  },
  defaultProps: {
    eyebrow: "Recent projects",
    headline: "A few things we shipped this year",
    items: [
      { imageUrl: "", alt: "Brand identity system laid out on a desk", title: "Northwind rebrand", caption: "Identity" },
      { imageUrl: "", alt: "Mobile app screens for a banking product", title: "Ledger app", caption: "Product design" },
      { imageUrl: "", alt: "Packaging for a specialty coffee roaster", title: "Field Roasters", caption: "Packaging" },
      { imageUrl: "", alt: "Editorial website shown on a laptop", title: "Atlas Journal", caption: "Web" },
    ],
  },
  Component: GalleryRow,
})
