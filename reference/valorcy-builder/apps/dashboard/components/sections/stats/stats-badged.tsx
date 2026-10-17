"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, PropText, statCellsBlock, stretchItems, type StatCell } from "@/components/sections/stats/stats-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Trend-badge tone. One quiet tone for every figure: cycling four colours made the
 * row read as decoration rather than data (§6.5). Kept as an array so the
 * per-card lookup stays unchanged.
 */
const BADGE_TONES = ["bg-muted text-muted-foreground"] as const

/**
 * Pulse — centered archetype.
 *
 * A centred header over one ruled row of figures divided by hairlines, each with
 * a quiet trend badge beside its number ("↑ 23% YoY"). The header is one slot
 * with the cards, so a description or a button can be dropped between them.
 */
function StatsBadged ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-5 text-center"
          align="center"
          headingClassName={`${TYPE_H2} text-foreground`}
          entryClassName={stretchItems}
          overrides={{
            eyebrow: ({ instance: inst }) =>
              typeof inst.props.eyebrow === "string" && inst.props.eyebrow ? (
                <div className="text-sm font-medium text-muted-foreground">
                  <PropText as="span" instance={inst} propKey="eyebrow" isPreview={isPreview} />
                </div>
              ) : null,
          }}
          renderItems={({ instance: inst }) => {
            const cells = (inst.props.cells as StatCell[] | undefined) ?? []
            if (cells.length === 0) return null
            return (
              <div className="mt-12 grid w-full grid-cols-1 divide-y divide-border border-y border-border text-start sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x rtl:lg:divide-x-reverse">
                {cells.map((cell, i) => (
                  <div key={i} className="flex flex-col gap-3 px-6 py-8">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-baseline gap-1">
                        <ItemText
                          instance={inst}
                          collection="cells"
                          index={i}
                          field="value"
                          value={cell.value}
                          isPreview={isPreview}
                          className={cn(
                            "font-heading text-[42px] font-semibold tracking-[-0.04em] leading-none tabular-nums",
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
                            className="text-[16px] font-semibold text-muted-foreground"
                          />
                        ) : null}
                      </div>
                      {cell.badge ? (
                        <ItemText
                          instance={inst}
                          collection="cells"
                          index={i}
                          field="badge"
                          value={cell.badge}
                          isPreview={isPreview}
                          className={cn(
                            "mt-1 shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                            BADGE_TONES[i % BADGE_TONES.length]
                          )}
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
      </SectionContainer>
    </section>
  )
}

export const statsBadgedSection = defineSection({
  id: "stats-badged",
  displayName: "Pulse",
  description: "Centred header over a ruled row of figures, each with a trend badge beside its number.",
  category: "stats",
  layoutArchetype: "centered",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "finance", "startup", "agency", "enterprise", "generic"],
  trustWeight: 65,
  conversionWeight: 35,
  funnelStage: 'consideration',
  styles: ["modern", "playful", "bold"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 82,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "badge",
        id: "eyebrow",
        label: "Eyebrow",
        field: {
          key: "eyebrow",
          label: "Eyebrow",
          canonical: "eyebrow",
          aiHint: "Short label above the headline (1–3 words, sentence case)",
          maxLength: 30,
        },
      },
      {
        kind: "heading",
        level: 2,
        accent: true,
        fields: {
          accentWord: {
            key: "accentWord",
            label: "Accent word",
            aiHint: "Highlighted word or phrase in the headline (1–3 words)",
            maxLength: 30,
          },
        },
      },
      statCellsBlock({
        label: "Stats",
        minItems: 2,
        maxItems: 6,
        extra: [
          {
            key: "badge",
            label: "Badge text (e.g. ↑ 23% YoY)",
            type: "text",
            canonical: "badge",
            aiHint: "Pill label (1–4 words)",
            maxLength: 30,
            group: "content",
          },
        ],
        newItem: () => ({ value: "100+", unit: "", label: "Describe this stat.", badge: "↑ 10% YoY", accent: true }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Growth",
    headline: "Momentum you can",
    accentWord: "measure",
    cells: [
      { value: "38", unit: "%", label: "Faster time to launch", badge: "↑ 12% YoY", accent: true },
      { value: "2.1", unit: "x", label: "More qualified leads", badge: "↑ 23% YoY", accent: false },
      { value: "4.8", unit: "★", label: "Average customer rating", badge: "Top rated", accent: true },
      { value: "15k", unit: "", label: "Sites live today", badge: "↑ 4k this year", accent: false },
    ],
  },
  Component: StatsBadged,
})
