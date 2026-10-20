"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, statCellsBlock, type StatCell } from "@/components/sections/stats/stats-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Matrix — divided-grid archetype.
 *
 * Eyebrow and headline above one bordered panel that is ruled into a
 * three-column matrix of large figures. The panel and its hairlines are chrome;
 * the eyebrow, headline and the figures are slot entries.
 */
function StatsGrid ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })

  return (
    <section className="bg-muted/30 border-y border-border" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col"
          align="left"
          headingClassName={`${TYPE_H2} text-foreground`}
          renderItems={({ instance: inst }) => {
            const cells = (inst.props.cells as StatCell[] | undefined) ?? []
            if (cells.length === 0) return null
            const totalRows = Math.ceil(cells.length / 3)
            return (
              <div className="mt-16 rounded-2xl border border-border bg-card overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {cells.map((cell, i) => {
                  const col = i % 3
                  const row = Math.floor(i / 3)
                  return (
                    <div
                      key={i}
                      className={cn(
                        "p-10 flex flex-col gap-4 min-h-[220px]",
                        col < 2 && "sm:border-r border-border/60",
                        row < totalRows - 1 && "border-b border-border/60"
                      )}
                    >
                      <div className="flex items-baseline gap-2.5">
                        <ItemText
                          instance={inst}
                          collection="cells"
                          index={i}
                          field="value"
                          value={cell.value}
                          isPreview={isPreview}
                          className={cn(
                            "font-heading text-[58px] font-semibold tracking-[-0.045em] leading-[0.95] tabular-nums",
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
                            className="text-[16px] font-semibold text-muted-foreground tracking-[-0.01em]"
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
                        className="text-[15.5px] leading-[1.5] text-muted-foreground mt-auto max-w-[280px]"
                      />
                    </div>
                  )
                })}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const statsGridSection = defineSection({
  id: "stats-grid",
  displayName: "Matrix",
  description: "Headline over one bordered panel ruled into a three-column matrix of large figures.",
  category: "stats",
  layoutArchetype: "divided-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["app_landing", "saas", "startup", "agency", "enterprise", "nonprofit", "generic", "dentist", "fitness", "real_estate", "law", "event", "restaurant", "travel"],
  trustWeight: 65,
  conversionWeight: 35,
  funnelStage: 'consideration',
  styles: ["modern", "minimal", "corporate"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 80,
  editable: true,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return statsGridSection.defaultProps
    return oldProps
  },
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "eyebrow",
        field: { key: "eyebrow", aiHint: "Short label above the headline (1–3 words, sentence case)", maxLength: 30 },
      },
      { kind: "heading", level: 2, accent: false },
      statCellsBlock({
        label: "Stat cells",
        minItems: 1,
        maxItems: 12,
        labelType: "textarea",
        newItem: () => ({ value: "100+", unit: "", label: "Describe this stat.", accent: true }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "By the numbers",
    headline: "The results our customers see in their first year",
    cells: [
      { value: "3.2x", unit: "", label: "Average return on investment within twelve months.", accent: true },
      { value: "98", unit: "%", label: "Of customers renew after their first year.", accent: false },
      { value: "40", unit: "hrs", label: "Saved per team, every month, on manual work.", accent: true },
      { value: "12k", unit: "+", label: "Teams running their business on the platform.", accent: false },
      { value: "99.9", unit: "%", label: "Uptime, backed by a service-level agreement.", accent: true },
      { value: "24/7", unit: "", label: "Support from people who know the product.", accent: false },
    ],
  },
  Component: StatsGrid,
})
