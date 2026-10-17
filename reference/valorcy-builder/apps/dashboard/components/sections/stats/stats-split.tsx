"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, statCellsBlock, type StatCell } from "@/components/sections/stats/stats-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Dossier — split archetype.
 *
 * The argument on the start side (eyebrow, headline, description), the proof on
 * the end side as a 2×2 grid of figures under hairline rules (no cards). Two slots, one per column: the
 * copy can take free elements; the figures column holds the collection.
 */
function StatsSplit ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })

  return (
    <section className="bg-muted/30" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col items-start"
            align="left"
            headingClassName={`${TYPE_H2} text-foreground mb-5`}
            bodyClassName={`${TYPE_BODY} max-w-md`}
          />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="figures"
            className="flex flex-col gap-5"
            renderItems={({ instance: inst }) => {
              const cells = (inst.props.cells as StatCell[] | undefined) ?? []
              if (cells.length === 0) return null
              return (
                <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                  {cells.slice(0, 4).map((cell, i) => (
                    <div key={i} className="flex flex-col gap-3 border-t border-foreground pt-5">
                      <div className="flex items-baseline gap-1.5">
                        <ItemText
                          instance={inst}
                          collection="cells"
                          index={i}
                          field="value"
                          value={cell.value}
                          isPreview={isPreview}
                          className={cn(
                            "font-heading text-[44px] font-semibold tracking-[-0.04em] leading-none tabular-nums",
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
                            className="text-[15px] font-semibold text-muted-foreground"
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
                        className="text-[13px] text-muted-foreground leading-[1.5]"
                      />
                    </div>
                  ))}
                </div>
              )
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const statsSplitSection = defineSection({
  id: "stats-split",
  displayName: "Dossier",
  description: "Split proof — the argument on one side, a 2×2 grid of figure cards on the other.",
  category: "stats",
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "enterprise", "finance", "generic", "law", "real_estate", "fitness"],
  trustWeight: 65,
  conversionWeight: 35,
  funnelStage: 'consideration',
  styles: ["modern", "minimal", "corporate"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 85,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "figures", label: "Figures", eject: { direction: "column" } },
    ],
    blocks: [
      {
        kind: "eyebrow",
        field: { key: "eyebrow", aiHint: "Short label above the headline (1–3 words, sentence case)", maxLength: 30 },
      },
      { kind: "heading", level: 2, accent: false },
      {
        kind: "body",
        field: { key: "description", aiHint: "Short descriptive paragraph (1–3 sentences, 20–60 words)", maxLength: 280 },
      },
      statCellsBlock({
        label: "Stats",
        minItems: 2,
        maxItems: 4,
        slot: "figures",
        newItem: () => ({ value: "100+", unit: "", label: "Describe this stat.", accent: true }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Proven results",
    headline: "Numbers that speak for the work",
    description:
      "We measure every engagement against the outcomes that matter to your business — and we publish the results, good and bad.",
    cells: [
      { value: "250", unit: "+", label: "Projects delivered on time", accent: true },
      { value: "97", unit: "%", label: "Client retention rate", accent: false },
      { value: "15", unit: "yrs", label: "Experience in the field", accent: true },
      { value: "4.9", unit: "★", label: "Average client rating", accent: false },
    ],
  },
  Component: StatsSplit,
})
