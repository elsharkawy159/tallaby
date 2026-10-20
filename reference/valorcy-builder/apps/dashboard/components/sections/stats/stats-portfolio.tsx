"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  lgColsFor,
  statItemsBlock,
  stretchItems,
  type StatItem,
} from "@/components/sections/stats/stats-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Folio — minimal archetype.
 *
 * Figures and nothing else: brand-coloured numbers over short labels, no cards,
 * no rules, no header. The row is the only slot, so a heading can be dropped in
 * above it when a page needs one.
 */
function StatsPortfolio ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="row"
          className="flex flex-col items-center gap-8 text-center"
          align="center"
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const stats = (inst.props.stats as StatItem[] | undefined) ?? []
            if (stats.length === 0) return null
            return (
              <div className={cn("grid grid-cols-2 gap-8", lgColsFor(stats.length))}>
                {stats.map((s, i) => (
                  <div key={i} className="flex flex-col items-center text-center">
                    <ItemText
                      instance={inst}
                      collection="stats"
                      index={i}
                      field="value"
                      value={s.value}
                      isPreview={isPreview}
                      className="font-heading text-4xl font-semibold text-primary sm:text-5xl"
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

export const statsPortfolioSection = defineSection({
  id: "stats-portfolio",
  displayName: "Folio",
  description: "Brand-coloured figures over short labels — no cards, no rules, no header.",
  category: "stats",
  layoutArchetype: "minimal",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["portfolio", "creative", "agency", "creative"],
  styles: ["minimal", "modern", "editorial"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  funnelStage: "awareness",
  conversionWeight: 45,
  trustWeight: 70,
  tags: ["stats", "portfolio", "numbers", "experience"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "row", label: "Figures", isDefault: true }],
    blocks: [
      statItemsBlock({
        valueHint: "e.g. 80+, 8",
        newItem: () => ({ value: "10+", label: "Label", description: "" }),
      }),
    ],
  },
  defaultProps: {
    stats: [
      { value: "80+", label: "Projects shipped", description: "For brands large and small." },
      { value: "40", label: "Happy clients", description: "Many of them returning." },
      { value: "8", label: "Years of practice", description: "Independent since 2017." },
      { value: "12", label: "Design awards", description: "Across web and identity." },
    ],
  },
  Component: StatsPortfolio,
})
