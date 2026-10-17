"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, statCellsBlock, stretchItems, type StatCell } from "@/components/sections/stats/stats-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Eclipse — inverted archetype.
 *
 * A full-width inverted band (foreground fill, background ink) carrying one row
 * of figures split by hairlines. The band is chrome; the row is the slot, so a
 * heading or a button can be dropped in beside the figures.
 */
function StatsBanner ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <div className="bg-foreground">
        <SectionContainer>
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="row"
            className="flex flex-col items-center gap-6 text-background"
            align="center"
            headingClassName={`${TYPE_H2_SM} text-background`}
            bodyClassName="text-base text-background/70"
            entryClassName={stretchItems}
            renderItems={({ instance: inst }) => {
              const cells = (inst.props.cells as StatCell[] | undefined) ?? []
              if (cells.length === 0) return null
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-background/10">
                  {cells.map((cell, i) => (
                    <div key={i} className="flex flex-col items-center text-center px-8 py-10 gap-2">
                      <div className="flex items-baseline gap-1">
                        <ItemText
                          instance={inst}
                          collection="cells"
                          index={i}
                          field="value"
                          value={cell.value}
                          isPreview={isPreview}
                          className="font-heading text-[46px] font-semibold tracking-[-0.04em] leading-none tabular-nums text-background"
                        />
                        {cell.unit ? (
                          <ItemText
                            instance={inst}
                            collection="cells"
                            index={i}
                            field="unit"
                            value={cell.unit}
                            isPreview={isPreview}
                            className="text-[18px] font-semibold text-background/60"
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
                        className="text-[13px] text-background/55 leading-[1.4] max-w-[140px] mx-auto"
                      />
                    </div>
                  ))}
                </div>
              )
            }}
          />
        </SectionContainer>
      </div>
    </section>
  )
}

export const statsBannerSection = defineSection({
  id: "stats-banner",
  displayName: "Eclipse",
  description: "Inverted full-width band with one row of large figures split by hairlines.",
  category: "stats",
  layoutArchetype: "inverted",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "enterprise", "nonprofit", "generic", "finance"],
  trustWeight: 65,
  conversionWeight: 35,
  funnelStage: 'consideration',
  styles: ["bold", "dark", "minimal"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 82,
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
        accent: false,
        newItem: () => ({ value: "100+", unit: "", label: "Describe this stat.", accent: false }),
      }),
    ],
  },
  defaultProps: {
    cells: [
      { value: "12k", unit: "+", label: "Teams on the platform", accent: false },
      { value: "99.9", unit: "%", label: "Uptime over the last year", accent: false },
      { value: "140", unit: "", label: "Countries served", accent: false },
      { value: "4.9", unit: "★", label: "Average customer rating", accent: false },
    ],
  },
  Component: StatsBanner,
})
