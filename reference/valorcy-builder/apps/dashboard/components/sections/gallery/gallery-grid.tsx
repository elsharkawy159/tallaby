"use client"

import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemImage,
  ItemText,
  galleryHeadingBlock,
  galleryImagesBlock,
  itemsOf,
  type GalleryImage,
} from "@/components/sections/gallery/gallery-parts"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Lattice — grid archetype.
 *
 * A uniform grid of square images (2 columns on mobile, 3 on desktop) under a
 * centred pill and headline. Titles and captions surface on a scrim on hover.
 * The pill keeps its outlined, uppercase chrome through an override; the
 * headline and the images are ordinary slot entries.
 */
function GalleryGrid ({ instance, isPreview, definition }: SectionComponentProps) {
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
          entryClassName={(entry) =>
            entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
          }
          overrides={{
            badgeText: ({ instance: inst }) => {
              const v = inst.props.badgeText
              if (typeof v !== "string") return null
              const write = (t: string) =>
                useBuilderStore.getState().updateSectionProps(inst.id, { badgeText: t })
              return (
                <div className="mb-4 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                  <InlineEditableText
                    as="span"
                    data-element-id={`${inst.id}::badgeText`}
                    data-element-type="text"
                    value={v}
                    isPreview={isPreview}
                    onChange={write}
                    onCommit={write}
                  />
                </div>
              )
            },
          }}
          renderItems={({ instance: inst }) => {
            const items = itemsOf<GalleryImage>(inst)
            if (items.length === 0) return null
            return (
              <div className="mt-12 grid grid-cols-2 gap-3 text-start md:grid-cols-3 md:gap-4">
                {items.map((item, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-2xl border border-border bg-muted">
                    <ItemImage
                      instance={inst}
                      index={i}
                      src={item.imageUrl}
                      alt={item.alt}
                      altProp="alt"
                      ratio="square"
                      rounded="lg"
                      sizes="(max-width: 768px) 50vw, 33vw"
                      isPreview={isPreview}
                    />
                    {(item.title || item.caption) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-end rounded-2xl bg-gradient-to-t from-black/70 to-transparent p-4 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
                            className="mt-0.5 text-xs text-white/80"
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

export const galleryGridSection = defineSection({
  id: "gallery-grid",
  displayName: "Lattice",
  description: "Uniform square grid under a centred pill and headline, captions revealed on hover.",
  category: "gallery",
  layoutArchetype: "grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return galleryGridSection.defaultProps
    return oldProps
  },
  industries: ["photography", "podcast", "portfolio", "ecommerce", "travel", "restaurant", "creative", "generic"],
  trustWeight: 45,
  conversionWeight: 25,
  funnelStage: "consideration",
  styles: ["modern", "minimal", "editorial"],
  goals: ["brand", "engagement", "awareness"],
  complexity: "low",
  density: "high",
  imageRequired: true,
  mobileScore: 92,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "badge", id: "badgeText", label: "Badge", field: { key: "badgeText", label: "Badge", type: "text" } },
      galleryHeadingBlock(),
      galleryImagesBlock({ label: "Images", minItems: 1, maxItems: 24 }),
    ],
  },
  defaultProps: {
    badgeText: "Gallery",
    headline: "A look inside our space",
    items: [
      { imageUrl: "", alt: "Sunlit dining room with timber tables", title: "Dining room", caption: "Seats forty" },
      { imageUrl: "", alt: "Chef plating a dish at the pass", title: "The pass", caption: "Open kitchen" },
      { imageUrl: "", alt: "Shelves of natural wine bottles", title: "Wine wall", caption: "Over 200 labels" },
      { imageUrl: "", alt: "Courtyard terrace strung with lights", title: "Terrace", caption: "Open spring to autumn" },
      { imageUrl: "", alt: "Fresh pasta drying on a rack", title: "Made daily", caption: "Hand-rolled pasta" },
      { imageUrl: "", alt: "Private room set for a celebration", title: "Private room", caption: "For up to twelve" },
    ],
  },
  Component: GalleryGrid,
})
