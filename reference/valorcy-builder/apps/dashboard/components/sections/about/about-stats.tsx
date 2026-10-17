"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, stretchItems } from "@/components/sections/about/about-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type StatItem = { value?: string; label?: string; sublabel?: string }

/**
 * Footprint — captioned-grid archetype.
 *
 * The company in numbers: a centred header over a row of figure cards, each
 * figure captioned by a label and an optional sub-label. The faint grid and the
 * cards are chrome; the header blocks and the figures are slot entries.
 */
function AboutStats ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({
    instanceId: instance.id,
    rootOptions: { defaultBackground: false },
  })

  return (
    <section className="relative overflow-x-clip bg-muted/40" style={rootStyle}>
      <div aria-hidden className="absolute inset-0 -z-10 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)] pointer-events-none" />

      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          align="center"
          headingClassName={`${TYPE_H2} text-foreground`}
          bodyClassName={`${TYPE_BODY} mt-5`}
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const stats = (inst.props.stats as StatItem[] | undefined) ?? []
            if (stats.length === 0) return null
            return (
              <div className={cn("mt-14 grid gap-4 grid-cols-2", stats.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
                {stats.map((s, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-8 text-center transition-all"
                  >
                    <ItemText
                      as="div"
                      instance={inst}
                      collection="stats"
                      index={i}
                      field="value"
                      value={s.value}
                      isPreview={isPreview}
                      className="text-[clamp(2.5rem,5vw,3.5rem)] font-semibold tracking-tight leading-none tabular-nums"
                    />
                    <ItemText
                      as="div"
                      instance={inst}
                      collection="stats"
                      index={i}
                      field="label"
                      value={s.label}
                      isPreview={isPreview}
                      className="mt-3 text-[15px] font-semibold text-foreground"
                    />
                    {s.sublabel ? (
                      <ItemText
                        as="div"
                        instance={inst}
                        collection="stats"
                        index={i}
                        field="sublabel"
                        value={s.sublabel}
                        isPreview={isPreview}
                        className="mt-1 text-[13px] text-muted-foreground"
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

export const aboutStatsSection = defineSection({
  id: "about-stats",
  displayName: "Footprint",
  description: "The company in numbers — a centred header over a row of captioned figure cards.",
  category: "about",
  layoutArchetype: "captioned-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas", "startup", "agency", "nonprofit", "enterprise", "generic"],
  trustWeight: 50,
  conversionWeight: 20,
  funnelStage: "consideration",
  styles: ["modern", "corporate", "minimal"],
  goals: ["brand", "trust"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return aboutStatsSection.defaultProps
    return oldProps
  },
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "eyebrow",
        field: { key: "eyebrow", aiHint: "Short label above the headline (1–3 words, sentence case)", maxLength: 30 },
      },
      {
        kind: "heading",
        level: 2,
        accent: false,
        fields: {
          headline: { key: "headline", aiHint: "Primary section headline (6–10 words, no period)", maxLength: 80 },
        },
      },
      {
        kind: "body",
        field: { key: "description", aiHint: "Short descriptive paragraph (1–3 sentences, 20–60 words)", maxLength: 280 },
      },
      {
        kind: "items",
        key: "stats",
        canonical: "stats",
        label: "Stats",
        pick: [],
        itemFields: [
          {
            key: "value",
            label: "Value (e.g. 42 or $2M)",
            type: "text",
            canonical: "body",
            aiHint: "Numeric value or metric (e.g. 99.9% or 10k+)",
            maxLength: 20,
            group: "content",
          },
          { key: "label", label: "Label", type: "text" },
          { key: "sublabel", label: "Sub-label (optional)", type: "text" },
        ],
        minItems: 2,
        maxItems: 4,
        newItem: () => ({ value: "100+", label: "Stat label", sublabel: "" }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "By the numbers",
    headline: "A decade of doing the work well",
    description: "What started as a two-person studio is now a team trusted by companies around the world.",
    stats: [
      { value: "2015", label: "Founded", sublabel: "In Austin, Texas" },
      { value: "120+", label: "Team members", sublabel: "Across 4 offices" },
      { value: "30", label: "Countries", sublabel: "Where our clients work" },
      { value: "900+", label: "Customers", sublabel: "And counting" },
    ],
  },
  Component: AboutStats,
})
