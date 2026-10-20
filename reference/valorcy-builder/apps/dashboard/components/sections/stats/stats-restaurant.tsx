"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
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
 * Crest — banner archetype.
 *
 * A band in the brand colour with an optional headline over a row of figures —
 * years open, covers served, awards. The band is chrome (always the primary
 * fill, as it always was); the headline and the figures share one slot.
 */
function StatsRestaurant ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultColor: "var(--primary-foreground)" } })

  return (
    <section
      className="relative isolate overflow-x-clip text-primary-foreground"
      style={{ ...rootStyle, background: "var(--primary)" }}
    >
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          align="center"
          headingClassName={`${TYPE_H2_SM} mb-10 text-center text-primary-foreground`}
          entryClassName={stretchItems}
          overrides={{ headline: whenFilled("headline") }}
          renderItems={({ instance: inst }) => {
            const stats = (inst.props.stats as StatItem[] | undefined) ?? []
            if (stats.length === 0) return null
            return (
              <div className={cn("grid grid-cols-2 gap-8", lgColsFor(stats.length))}>
                {stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <ItemText
                      as="p"
                      instance={inst}
                      collection="stats"
                      index={i}
                      field="value"
                      value={s.value}
                      isPreview={isPreview}
                      className="font-heading text-4xl font-semibold text-primary-foreground sm:text-5xl"
                    />
                    <ItemText
                      as="p"
                      instance={inst}
                      collection="stats"
                      index={i}
                      field="label"
                      value={s.label}
                      isPreview={isPreview}
                      className="mt-1 text-sm font-semibold text-primary-foreground/80"
                    />
                    {s.description ? (
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="stats"
                        index={i}
                        field="description"
                        value={s.description}
                        isPreview={isPreview}
                        className="mt-1 text-xs text-primary-foreground/60"
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

export const statsRestaurantSection = defineSection({
  id: "stats-restaurant",
  displayName: "Crest",
  description: "Brand-colour band with an optional headline over a row of milestone figures.",
  category: "stats",
  layoutArchetype: "banner",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "food_delivery", "catering"],
  styles: ["bold", "modern", "editorial"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  funnelStage: "awareness",
  conversionWeight: 40,
  trustWeight: 75,
  tags: ["stats", "restaurant", "numbers", "awards"],
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
        fields: { headline: { key: "headline", label: "Optional headline", maxLength: 60 } },
      },
      statItemsBlock({
        valueHint: "e.g. 22, 500K+",
        newItem: () => ({ value: "100+", label: "Stat Label", description: "" }),
      }),
    ],
  },
  defaultProps: {
    headline: "",
    stats: [
      { value: "22", label: "Years at the pass", description: "Family-run since day one." },
      { value: "500K+", label: "Covers served", description: "And counting, every night." },
      { value: "3", label: "Regional awards", description: "Including Best Neighbourhood Kitchen." },
      { value: "40", label: "Local suppliers", description: "Within fifty miles of our door." },
    ],
  },
  Component: StatsRestaurant,
})
