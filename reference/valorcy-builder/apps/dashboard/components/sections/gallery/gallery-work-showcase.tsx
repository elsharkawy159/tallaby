"use client"

import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { SectionLink } from "@/components/website-builder/section-link"
import { linkValueFromProp } from "@/lib/builder/links"
import {
  ItemImage,
  ItemText,
  itemsOf,
  labelSetting,
  propOr,
} from "@/components/sections/gallery/gallery-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type WorkItem = { title?: string; category?: string; description?: string; imageUrl?: string; href?: string }

/** Labels that were hardcoded before the slot migration. */
const ALL_LABEL_FALLBACK = "All"
const LINK_LABEL_FALLBACK = "View project"

/**
 * Casebook — tabs archetype.
 *
 * A two-column project grid under category filter pills derived from the
 * projects themselves. Hovering a card swaps its caption for a scrim with the
 * category, title, description and a "view project" cue. The centred header
 * leads the slot; the filters and the grid travel together as one items entry,
 * since the filters only make sense beside the cards they filter.
 */
function GalleryWorkShowcase ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  // `null` = every category. Kept apart from the editable "All" label so
  // renaming the label never changes which projects are shown.
  const [active, setActive] = useState<string | null>(null)

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-5 text-center"
          align="center"
          headingClassName={`${TYPE_H2} text-foreground`}
          entryClassName={(entry) =>
            entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
          }
          renderItems={({ instance: inst }) => {
            const items = itemsOf<WorkItem>(inst)
            if (items.length === 0) return null
            const categories = [...new Set(items.map((p) => p.category).filter((c): c is string => Boolean(c)))]
            const current = active !== null && categories.includes(active) ? active : null
            // Keep each project's index in the stored collection, so editing a
            // filtered card writes to the right item.
            const shown = items
              .map((item, index) => ({ item, index }))
              .filter(({ item }) => current === null || item.category === current)
            const allLabel = propOr(inst, "filterAllLabel", ALL_LABEL_FALLBACK)
            const linkLabel = propOr(inst, "linkLabel", LINK_LABEL_FALLBACK)
            const pill = (selected: boolean) =>
              cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                selected ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              )

            return (
              <div className="flex flex-col">
                {categories.length > 1 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={() => setActive(null)} className={pill(current === null)}>
                      {allLabel}
                    </button>
                    {categories.map((cat) => (
                      <button key={cat} type="button" onClick={() => setActive(cat)} className={pill(current === cat)}>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={cn(
                    "grid grid-cols-1 gap-6 text-start md:grid-cols-2",
                    categories.length > 1 ? "mt-10" : "mt-5"
                  )}
                >
                  {shown.map(({ item, index: i }) => (
                    <SectionLink
                      key={i}
                      link={linkValueFromProp(item.href)}
                      isPreview={isPreview}
                      className="group relative block overflow-hidden rounded-2xl border border-border bg-card"
                    >
                      <ItemImage
                        instance={inst}
                        index={i}
                        src={item.imageUrl}
                        alt={item.title}
                        ratio="video"
                        rounded="none"
                        className="aspect-[16/10]"
                        imgClassName="transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        isPreview={isPreview}
                      />
                      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="text-xs font-semibold text-white/70">{item.category}</span>
                        <p className="mt-1 text-lg font-semibold text-white">{item.title}</p>
                        {item.description && (
                          <ItemText
                            as="p"
                            instance={inst}
                            index={i}
                            field="description"
                            value={item.description}
                            isPreview={isPreview}
                            className="mt-1 text-sm text-white/80"
                          />
                        )}
                        {linkLabel && (
                          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-white">
                            {linkLabel}
                          </div>
                        )}
                      </div>
                      <div className="p-5 group-hover:hidden">
                        <ItemText
                          as="span"
                          instance={inst}
                          index={i}
                          field="category"
                          value={item.category}
                          isPreview={isPreview}
                          className="text-xs font-medium text-muted-foreground"
                        />
                        <ItemText
                          as="p"
                          instance={inst}
                          index={i}
                          field="title"
                          value={item.title}
                          isPreview={isPreview}
                          elementId={`title${i}`}
                          className="mt-0.5 font-semibold text-foreground"
                        />
                      </div>
                    </SectionLink>
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

export const galleryWorkShowcaseSection = defineSection({
  id: "gallery-work-showcase",
  displayName: "Casebook",
  description: "Two-column project grid with category filter pills and a hover reveal of each project.",
  category: "gallery",
  layoutArchetype: "tabs",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["portfolio", "creative", "agency", "photography", "web_dev_service"],
  styles: ["modern", "editorial", "minimal"],
  goals: ["brand", "leads", "engagement"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 65,
  trustWeight: 75,
  tags: ["portfolio", "gallery", "work", "projects", "showcase"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 30, group: "content" } },
      {
        kind: "heading",
        level: 2,
        accent: false,
        fields: { headline: { key: "headline", canonical: "headline", maxLength: 70, group: "content" } },
      },
      { kind: "body", field: { key: "description", type: "textarea", canonical: "body", maxLength: 200, group: "content" } },
      {
        kind: "items",
        key: "items",
        canonical: "cards",
        label: "Projects",
        pick: [],
        itemFields: [
          { key: "imageUrl", label: "Project image", type: "image", canonical: "image" },
          { key: "title", label: "Project title", type: "text", canonical: "headline", maxLength: 60 },
          { key: "category", label: "Category (for filter)", type: "text", aiHint: "e.g. Branding, Web, Product", maxLength: 30 },
          { key: "description", label: "Short description", type: "textarea", canonical: "body", maxLength: 120 },
          { key: "href", label: "Project link", type: "url", canonical: "ctaLink" },
        ],
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ title: "Project name", category: "Category", description: "Brief description.", imageUrl: "", href: "#" }),
      },
    ],
    settings: [
      labelSetting("filterAllLabel", "\"All\" filter label", ALL_LABEL_FALLBACK),
      labelSetting("linkLabel", "Card link label", LINK_LABEL_FALLBACK),
    ],
  },
  defaultProps: {
    eyebrow: "Selected work",
    headline: "Projects we are proud of",
    description: "A cross-section of identity, web and product work for clients from early-stage startups to global brands.",
    items: [
      { title: "Northwind rebrand", category: "Branding", description: "A calmer identity for a logistics leader.", imageUrl: "", href: "#" },
      { title: "Ledger banking app", category: "Product", description: "Everyday banking, redesigned around clarity.", imageUrl: "", href: "#" },
      { title: "Atlas Journal", category: "Web", description: "An editorial site built for long reads.", imageUrl: "", href: "#" },
      { title: "Field Roasters", category: "Branding", description: "Packaging and voice for a specialty roaster.", imageUrl: "", href: "#" },
    ],
  },
  Component: GalleryWorkShowcase,
})
