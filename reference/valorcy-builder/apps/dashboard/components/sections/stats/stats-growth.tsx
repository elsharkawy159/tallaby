"use client"

import { Minus, TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, stretchItems } from "@/components/sections/stats/stats-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type GrowthStat = {
  value?: string
  label?: string
  trend?: "up" | "down" | "flat"
  trendValue?: string
  description?: string
}

/** Trend pill tone — semantic status tokens, so a site's palette carries through. */
const TREND_TONE = {
  up: "bg-success/10 text-success",
  down: "bg-destructive/10 text-destructive",
  flat: "bg-muted-foreground/10 text-muted-foreground",
} as const

/**
 * Trajectory — dashboard archetype.
 *
 * KPI tiles under a centred header: each tile pairs a big figure with a trend
 * pill (up / down / flat), a label and one line of context. The header and the
 * tiles share one slot.
 */
function StatsGrowth ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-5 text-center"
          align="center"
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const stats = (inst.props.stats as GrowthStat[] | undefined) ?? []
            if (stats.length === 0) return null
            return (
              <div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 text-start">
                {stats.map((stat, i) => {
                  const trend = stat.trend === "up" || stat.trend === "down" ? stat.trend : "flat"
                  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
                  return (
                    <div key={i} className="rounded-2xl border border-border bg-card p-7">
                      <div className="flex items-start justify-between">
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="stats"
                          index={i}
                          field="value"
                          elementId={`value${i}`}
                          value={stat.value}
                          isPreview={isPreview}
                          className="font-heading text-4xl font-semibold tracking-tight text-foreground"
                        />
                        {stat.trendValue ? (
                          <span
                            className={cn(
                              "flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold",
                              TREND_TONE[trend]
                            )}
                          >
                            <TrendIcon className="size-3" aria-hidden />
                            <ItemText
                              instance={inst}
                              collection="stats"
                              index={i}
                              field="trendValue"
                              value={stat.trendValue}
                              isPreview={isPreview}
                            />
                          </span>
                        ) : null}
                      </div>
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="stats"
                        index={i}
                        field="label"
                        elementId={`label${i}`}
                        value={stat.label}
                        isPreview={isPreview}
                        className="mt-1 text-sm font-semibold text-foreground"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="stats"
                        index={i}
                        field="description"
                        elementId={`desc${i}`}
                        value={stat.description}
                        isPreview={isPreview}
                        className="mt-1 text-xs text-muted-foreground"
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

export const statsGrowthSection = defineSection({
  id: "stats-growth",
  displayName: "Trajectory",
  description: "KPI tiles with a trend pill, label and one line of context under a centred header.",
  category: "stats",
  layoutArchetype: "dashboard",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "ecommerce", "finance"],
  styles: ["modern", "corporate", "minimal"],
  goals: ["trust", "sales", "conversion"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 65,
  trustWeight: 80,
  tags: ["stats", "growth", "metrics", "business", "numbers", "trend"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", maxLength: 30 } },
      { kind: "heading", level: 2, accent: false, fields: { headline: { key: "headline", maxLength: 70 } } },
      { kind: "body", field: { key: "description", maxLength: 200 } },
      {
        kind: "items",
        key: "stats",
        canonical: "stats",
        label: "Stats",
        pick: [],
        itemFields: [
          {
            key: "value",
            label: "Stat value",
            type: "text",
            canonical: "headline",
            aiHint: "Big number or metric value (e.g. 14K+, $2.4M, 99.9%)",
            maxLength: 20,
          },
          { key: "label", label: "Label", type: "text", aiHint: "What this number measures (3-6 words)", maxLength: 50 },
          {
            key: "trend",
            label: "Trend direction",
            type: "select",
            options: [
              { label: "Up ↑", value: "up" },
              { label: "Down ↓", value: "down" },
              { label: "Flat →", value: "flat" },
            ],
          },
          { key: "trendValue", label: "Trend label (e.g. +38%)", type: "text", aiHint: "Short trend badge text", maxLength: 15 },
          { key: "description", label: "Description", type: "text", aiHint: "One line of context", maxLength: 80 },
        ],
        minItems: 2,
        maxItems: 8,
        newItem: () => ({ value: "0", label: "Metric", trend: "up", trendValue: "+0%", description: "Context for this metric" }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Performance",
    headline: "Growth that compounds quarter after quarter",
    description: "The metrics our customers track most closely, measured across every account on the platform.",
    stats: [
      { value: "$2.4M", label: "Revenue influenced", trend: "up", trendValue: "+38%", description: "Compared with the previous quarter" },
      { value: "14k", label: "New sign-ups", trend: "up", trendValue: "+21%", description: "Across all acquisition channels" },
      { value: "1.2%", label: "Monthly churn", trend: "down", trendValue: "−0.4 pts", description: "The lowest rate on record" },
      { value: "4.8", label: "Customer satisfaction", trend: "flat", trendValue: "", description: "Steady across the last four surveys" },
    ],
  },
  Component: StatsGrowth,
})
