"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, propText, stretchItems } from "@/components/sections/content/content-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Pillar = { label?: string; title?: string; description?: string }

/**
 * Tenets — pillars archetype.
 *
 * A centred statement under a soft brand glow, over equal cards for mission,
 * vision and values — each card led by a pill label. The glow and cards are
 * chrome; the statement and the pillars are slot entries.
 */
function ContentMission ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          align="center"
          entryClassName={stretchItems}
          headingClassName={`${TYPE_H2} max-w-2xl text-foreground`}
          bodyClassName={`${TYPE_LEAD} mt-5 max-w-2xl`}
          overrides={{
            eyebrow: propText("eyebrow", {
              className: "mb-3 text-xs font-semibold text-primary",
            }),
          }}
          renderItems={({ instance: inst }) => {
            const pillars = (inst.props.pillars as Pillar[] | undefined) ?? []
            if (pillars.length === 0) return null
            return (
              <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
                {pillars.map((pillar, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-8 text-center">
                    {pillar.label ? (
                      <ItemText
                        as="div"
                        instance={inst}
                        collection="pillars"
                        index={i}
                        field="label"
                        value={pillar.label}
                        isPreview={isPreview}
                        className="mx-auto mb-4 w-fit rounded-xl bg-primary/[0.12] px-3 py-1 text-xs font-semibold text-primary"
                      />
                    ) : null}
                    <ItemText
                      as="h3"
                      instance={inst}
                      collection="pillars"
                      index={i}
                      field="title"
                      value={pillar.title}
                      elementId={`ptitle${i}`}
                      isPreview={isPreview}
                      className="text-xl font-semibold text-foreground"
                    />
                    <ItemText
                      as="p"
                      instance={inst}
                      collection="pillars"
                      index={i}
                      field="description"
                      value={pillar.description}
                      elementId={`pdesc${i}`}
                      isPreview={isPreview}
                      className="mt-3 text-sm leading-relaxed text-muted-foreground"
                    />
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

export const contentMissionSection = defineSection({
  id: "content-mission",
  displayName: "Tenets",
  description: "A centred statement over equal cards for mission, vision and values.",
  category: "content",
  layoutArchetype: "pillars",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["agency", "startup", "enterprise", "nonprofit", "generic", "saas"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["brand", "trust", "awareness"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  funnelStage: "awareness",
  conversionWeight: 40,
  trustWeight: 75,
  tags: ["mission", "vision", "values", "about", "brand"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 30 } },
      { kind: "heading", level: 2, accent: false, fields: { headline: { key: "headline", maxLength: 70 } } },
      { kind: "body", field: { key: "description", maxLength: 240 } },
      {
        kind: "items",
        key: "pillars",
        canonical: "cards",
        label: "Pillars",
        pick: [],
        itemFields: [
          { key: "label", label: "Pill label (e.g. Mission)", type: "text", aiHint: "Short label for the pill badge", maxLength: 20 },
          { key: "title", label: "Title", type: "text", canonical: "headline", maxLength: 50 },
          { key: "description", label: "Description", type: "textarea", canonical: "body", maxLength: 200 },
        ],
        minItems: 1,
        maxItems: 4,
        newItem: () => ({ label: "Pillar", title: "Title", description: "Describe this pillar." }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "What drives us",
    headline: "Built on a few things we refuse to compromise",
    description: "The principles that shape every decision, from who we hire to what we choose not to build.",
    pillars: [
      { label: "Mission", title: "Make good work easier", description: "Give small teams the tools that used to belong only to the largest companies." },
      { label: "Vision", title: "Software that gets out of the way", description: "A future where tools fit the way people work, not the other way around." },
      { label: "Values", title: "Candour, craft and care", description: "We say what we think, sweat the details, and look after the people we work with." },
    ],
  },
  Component: ContentMission,
})
