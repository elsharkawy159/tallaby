"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemImage, ItemText } from "@/components/sections/social-proof/social-proof-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type StackEntry = { logoUrl?: string; company?: string; name?: string; role?: string }

/**
 * Lineup — chips archetype.
 *
 * A quiet trust line over a wrapping row of pill chips, each pairing a customer's
 * logo (or company name) with the person who uses the product and their role —
 * logos with a face attached. The line and the chip row are one slot.
 */
function SocialProofStack ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-muted/30" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-8"
          align="center"
          headingClassName="text-center text-sm font-medium text-muted-foreground"
          renderItems={({ instance: inst }) => {
            const items = (inst.props.items as StackEntry[] | undefined) ?? []
            if (items.length === 0) return null
            return (
              <div className="flex flex-wrap justify-center gap-3">
                {items.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5"
                  >
                    <ItemImage
                      instance={inst}
                      collection="items"
                      index={i}
                      srcField="logoUrl"
                      alt={String(entry.company ?? "")}
                      className="h-5 w-auto object-contain grayscale"
                      isPreview={isPreview}
                      fallback={
                        <ItemText
                          instance={inst}
                          collection="items"
                          index={i}
                          field="company"
                          as="span"
                          className="text-sm font-semibold text-foreground"
                          isPreview={isPreview}
                        />
                      }
                    />
                    {(entry.name || entry.role) && (
                      <div className="border-s border-border ps-3">
                        <ItemText
                          instance={inst}
                          collection="items"
                          index={i}
                          field="name"
                          elementKey={`name${i}`}
                          labelProp
                          className="text-xs font-semibold text-foreground"
                          isPreview={isPreview}
                        />
                        <ItemText
                          instance={inst}
                          collection="items"
                          index={i}
                          field="role"
                          elementKey={`role${i}`}
                          labelProp
                          className="text-xs text-muted-foreground"
                          isPreview={isPreview}
                        />
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

export const socialProofStackSection = defineSection({
  id: "social-proof-stack",
  displayName: "Lineup",
  description: "Trust line over pill chips pairing each customer's logo with the person who uses it.",
  category: "social-proof",
  layoutArchetype: "chips",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "software", "ai_startup", "tech", "enterprise"],
  styles: ["modern", "minimal"],
  goals: ["trust", "conversion"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  funnelStage: "awareness",
  conversionWeight: 55,
  trustWeight: 80,
  tags: ["logos", "trust", "saas", "customers", "stack"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "heading",
        level: 2,
        accent: false,
        fields: {
          headline: {
            key: "headline",
            label: "Headline",
            canonical: "headline",
            aiHint: "Short trust statement (5-10 words)",
            maxLength: 80,
            group: "content",
          },
        },
      },
      {
        kind: "items",
        key: "items",
        canonical: "items",
        label: "Customer entries",
        pick: [],
        itemFields: [
          { key: "logoUrl", label: "Company logo", type: "image", canonical: "image" },
          { key: "company", label: "Company name", type: "text", canonical: "brandName", maxLength: 40 },
          { key: "name", label: "Person name", type: "text", aiHint: "First name and last initial", maxLength: 40 },
          { key: "role", label: "Role / title", type: "text", aiHint: "Job title (e.g. Head of Growth)", maxLength: 50 },
        ],
        itemPlaceholder: "logo",
        minItems: 2,
        maxItems: 12,
        newItem: () => ({ logoUrl: "", company: "Company", name: "Name", role: "Role" }),
      },
    ],
  },
  defaultProps: {
    headline: "The tool of choice for teams that ship every week",
    items: [
      { logoUrl: "", company: "Northwind", name: "Priya S.", role: "Head of Growth" },
      { logoUrl: "", company: "Lumen Labs", name: "Daniel K.", role: "CTO" },
      { logoUrl: "", company: "Halcyon", name: "Sofia M.", role: "Design Lead" },
      { logoUrl: "", company: "Brightline", name: "Marcus T.", role: "VP Engineering" },
      { logoUrl: "", company: "Fieldstone", name: "Aiko N.", role: "Product Manager" },
      { logoUrl: "", company: "Corvid", name: "Omar R.", role: "Founder" },
    ],
  },
  Component: SocialProofStack,
})
