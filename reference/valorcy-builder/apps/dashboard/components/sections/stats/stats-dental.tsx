"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  lgColsFor,
  statItemsBlock,
  stretchItems,
  whenFilled,
  type StatItem,
} from "@/components/sections/stats/stats-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Keystone — grid archetype.
 *
 * An optional headline and description over a grid of figures, each hung from a
 * heavy start-side rule (patients treated, years in practice, satisfaction).
 * Signature move: the rule, not a card. The header blocks
 * render only when filled, exactly as before the slot migration.
 */
function StatsDental ({ instance, isPreview, definition }: SectionComponentProps) {
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
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          bodyClassName={`${TYPE_BODY} mt-2`}
          entryClassName={stretchItems}
          overrides={{
            headline: whenFilled("headline"),
            description: whenFilled("description"),
          }}
          renderItems={({ instance: inst }) => {
            const stats = (inst.props.stats as StatItem[] | undefined) ?? []
            if (stats.length === 0) return null
            const hasHeader = [inst.props.headline, inst.props.description].some(
              (v) => typeof v === "string" && v.trim() !== ""
            )
            return (
              <div className={cn("grid grid-cols-2 gap-6", lgColsFor(stats.length), hasHeader && "mt-10")}>
                {stats.map((s, i) => (
                  <div key={i} className="flex flex-col items-start border-s-2 border-foreground ps-5 text-start">
                    <ItemText
                      instance={inst}
                      collection="stats"
                      index={i}
                      field="value"
                      value={s.value}
                      isPreview={isPreview}
                      className="font-heading text-4xl font-semibold text-foreground sm:text-5xl"
                    />
                    <ItemText
                      instance={inst}
                      collection="stats"
                      index={i}
                      field="label"
                      value={s.label}
                      isPreview={isPreview}
                      className="mt-2 text-sm font-semibold text-foreground"
                    />
                    {s.description ? (
                      <ItemText
                        instance={inst}
                        collection="stats"
                        index={i}
                        field="description"
                        value={s.description}
                        isPreview={isPreview}
                        className="mt-1 text-xs text-muted-foreground"
                      />
                    ) : null}
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

export const statsDentalSection = defineSection({
  id: "stats-dental",
  displayName: "Keystone",
  description: "Optional headline over a grid of separate, centred figure cards.",
  category: "stats",
  layoutArchetype: "grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["dentist", "medical", "medical"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["trust", "conversion"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 55,
  trustWeight: 85,
  tags: ["stats", "dental", "patients", "trust", "numbers"],
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
        fields: { headline: { key: "headline", label: "Headline (optional)", maxLength: 60 } },
      },
      { kind: "body", field: { key: "description", label: "Description (optional)", maxLength: 160 } },
      statItemsBlock({
        valueHint: "e.g. 15,000+, 99%",
        newItem: () => ({ value: "100+", label: "Label", description: "" }),
      }),
    ],
  },
  defaultProps: {
    headline: "Care our patients come back for",
    description: "",
    stats: [
      { value: "15,000+", label: "Patients treated", description: "Since the practice opened." },
      { value: "20", label: "Years in practice", description: "Serving the same community." },
      { value: "99%", label: "Satisfaction rate", description: "From post-visit surveys." },
      { value: "6", label: "Specialists on staff", description: "Under one roof." },
    ],
  },
  Component: StatsDental,
})
