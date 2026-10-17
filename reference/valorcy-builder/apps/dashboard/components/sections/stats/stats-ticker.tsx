"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, statCellsBlock, stretchItems, type StatCell } from "@/components/sections/stats/stats-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Tally — strip archetype.
 *
 * One centred row of oversized figures between two hairlines, no cards and no
 * grid lines — meant to sit directly under a hero. The row is the only slot.
 */
function StatsTicker ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative bg-background border-y border-border" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="row"
          className="flex flex-col items-center gap-6 text-center"
          align="center"
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const cells = (inst.props.cells as StatCell[] | undefined) ?? []
            if (cells.length === 0) return null
            return (
              <div className="flex flex-wrap justify-center gap-x-14 gap-y-8 py-4">
                {cells.map((cell, i) => (
                  <div key={i} className="flex flex-col items-center text-center">
                    <div className="flex items-end gap-1 leading-none mb-2">
                      <ItemText
                        instance={inst}
                        collection="cells"
                        index={i}
                        field="value"
                        value={cell.value}
                        isPreview={isPreview}
                        className={cn(
                          "font-heading text-[56px] font-semibold tracking-[-0.045em] tabular-nums leading-[0.9]",
                          cell.accent ? "text-primary" : "text-foreground"
                        )}
                      />
                      {cell.unit ? (
                        <ItemText
                          instance={inst}
                          collection="cells"
                          index={i}
                          field="unit"
                          value={cell.unit}
                          isPreview={isPreview}
                          className="text-[22px] font-semibold text-muted-foreground pb-1"
                        />
                      ) : null}
                    </div>
                    <ItemText
                      as="p"
                      instance={inst}
                      collection="cells"
                      index={i}
                      field="label"
                      value={cell.label}
                      isPreview={isPreview}
                      className="text-[13px] text-muted-foreground leading-[1.4] max-w-[120px]"
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

export const statsTickerSection = defineSection({
  id: "stats-ticker",
  displayName: "Tally",
  description: "One centred row of oversized figures between hairlines — made to sit under a hero.",
  category: "stats",
  layoutArchetype: "strip",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "creative", "generic", "nonprofit"],
  trustWeight: 72,
  conversionWeight: 35,
  funnelStage: 'consideration',
  styles: ["minimal", "modern", "bold"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "row", label: "Figures", isDefault: true }],
    blocks: [
      statCellsBlock({
        label: "Stats",
        minItems: 2,
        maxItems: 6,
        newItem: () => ({ value: "100", unit: "+", label: "Stat label", accent: true }),
      }),
    ],
  },
  defaultProps: {
    cells: [
      { value: "10k", unit: "+", label: "Active customers", accent: true },
      { value: "99.9", unit: "%", label: "Platform uptime", accent: false },
      { value: "4.9", unit: "★", label: "Average rating", accent: true },
      { value: "24/7", unit: "", label: "Human support", accent: false },
    ],
  },
  Component: StatsTicker,
})
