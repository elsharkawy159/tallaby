"use client"

import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Roster — minimal archetype.
 *
 * A small "trusted by" line over a row of customer wordmarks. Deliberately quiet:
 * it sits between louder sections as a credibility beat.
 *
 * The wordmarks used to be hardcoded. They are now a `logos` collection, and a
 * page saved before the slot migration (which carries no `logos` prop) still
 * renders the original four names — editing one writes the whole list.
 */

type Wordmark = { name?: string }

const LEGACY_WORDMARKS: Wordmark[] = [
  { name: "Acme" },
  { name: "Vertex" },
  { name: "Nimbus" },
  { name: "Orbit" },
]

function TestimonialsLogos ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle, sectionStyle } = useSectionSurface({ instanceId: instance.id })
  const store = useBuilderStore.getState

  return (
    <section style={rootStyle}>
      <SectionContainer className="text-center">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col items-center gap-6"
          align="center"
          overrides={{
            // Keeps the inline format bar the title has always had.
            title: ({ instance: inst }) => {
              const raw = inst.props.title
              if (typeof raw !== "string") return null
              return (
                <InlineEditableText
                  as="h2"
                  data-element-id={`${inst.id}::title`}
                  data-element-type="text"
                  className="text-sm font-medium text-muted-foreground"
                  value={raw}
                  isPreview={isPreview}
                  formatStyle={sectionStyle}
                  onFormatStyle={(p) => store().updateSectionStyle(inst.id, p)}
                  onChange={(t) => store().updateSectionProps(inst.id, { title: t })}
                  onCommit={(t) => store().updateSectionProps(inst.id, { title: t })}
                />
              )
            },
          }}
          renderItems={({ instance: inst }) => {
            const stored = inst.props.logos
            const logos = Array.isArray(stored) ? (stored as Wordmark[]) : LEGACY_WORDMARKS
            if (logos.length === 0) return null
            const writeName = (i: number) => (t: string) => {
              if (Array.isArray(stored)) {
                store().updateItem(inst.id, "logos", i, { name: t })
              } else {
                store().updateSectionProps(inst.id, {
                  logos: LEGACY_WORDMARKS.map((w, j) => (j === i ? { name: t } : w)),
                })
              }
            }
            return (
              <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
                {logos.map((logo, i) => (
                  <InlineEditableText
                    key={i}
                    as="span"
                    data-element-collection="logos"
                    data-element-index={String(i)}
                    data-element-item-label-prop="name"
                    className="text-lg font-semibold"
                    value={String(logo.name ?? "")}
                    isPreview={isPreview}
                    onChange={writeName(i)}
                    onCommit={writeName(i)}
                  />
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const testimonialsLogosSection = defineSection({
  id: "testimonials-logos",
  displayName: "Roster",
  description: "Quiet trusted-by line over a row of customer wordmarks.",
  category: "testimonials",
  layoutArchetype: "minimal",
  industries: ["saas", "agency", "startup", "enterprise", "generic"],
  styles: ["modern", "minimal"],
  goals: ["trust", "brand", "awareness"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 92,
  editable: true,
  tags: ["testimonials", "logos", "social-proof"],
  trustWeight: 80,
  funnelStage: "consideration",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      {
        kind: "heading",
        id: "title",
        label: "Title",
        level: 2,
        accent: false,
        fields: {
          headline: {
            key: "title",
            label: "Title",
            canonical: "headline",
            aiHint: "Section title (4–8 words)",
            maxLength: 60,
            group: "content",
          },
        },
      },
      {
        kind: "items",
        key: "logos",
        canonical: "logos",
        label: "Wordmarks",
        pick: ["name"],
        itemFields: [{ key: "name", label: "Name", maxLength: 30 }],
        minItems: 0,
        maxItems: 8,
        newItem: () => ({ name: "Company" }),
      },
    ],
  },
  defaultProps: {
    title: "Trusted by teams at leading companies",
    logos: [{ name: "Northwind" }, { name: "Brightline" }, { name: "Lumen" }, { name: "Harbor & Co" }],
  },
  Component: TestimonialsLogos,
})
