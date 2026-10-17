"use client"

import { Check, X } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  PropText,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  stretchItems,
} from "@/components/sections/features/features-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type ComparisonRow = { feature?: string; us?: boolean; competitorA?: boolean; competitorB?: boolean }

/**
 * Benchmark — matrix archetype.
 *
 * Centered header over a full comparison table: the product and two
 * competitors across the top, features down the side, a check or cross in each
 * cell. The column labels are section settings edited in place in the table
 * head; the rows are the `rows` collection.
 */
function FeaturesComparison ({ instance, isPreview, definition }: SectionComponentProps) {
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
          entryClassName={stretchItems}
          align="center"
          renderItems={({ instance: inst }) => {
            const rows = (inst.props.rows as ComparisonRow[] | undefined) ?? []
            if (rows.length === 0) return null
            const head = (propKey: string, fallback: string) => (
              <PropText instance={inst} propKey={propKey} fallback={fallback} isPreview={isPreview} />
            )
            return (
              <div className="mt-7 overflow-x-auto rounded-2xl border border-border">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-1/2 p-4 text-start font-medium text-muted-foreground">{head("featureLabel", "Feature")}</th>
                      <th className="p-4 text-center font-semibold text-primary">{head("ourLabel", "Us")}</th>
                      <th className="p-4 text-center font-medium text-muted-foreground">{head("competitorALabel", "Competitor A")}</th>
                      <th className="p-4 text-center font-medium text-muted-foreground">{head("competitorBLabel", "Competitor B")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0 odd:bg-muted/20">
                        <td className="p-4 text-start">
                          <ItemText
                            instance={inst}
                            collection="rows"
                            index={i}
                            field="feature"
                            value={row.feature}
                            elementId={`feat${i}`}
                            isPreview={isPreview}
                            className="font-medium text-foreground"
                          />
                        </td>
                        <td className="p-4 text-center">
                          {row.us ? (
                            <Check className="mx-auto size-5 text-primary" />
                          ) : (
                            <X className="mx-auto size-5 text-muted-foreground/50" />
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {row.competitorA ? (
                            <Check className="mx-auto size-5 text-muted-foreground" />
                          ) : (
                            <X className="mx-auto size-5 text-muted-foreground/40" />
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {row.competitorB ? (
                            <Check className="mx-auto size-5 text-muted-foreground" />
                          ) : (
                            <X className="mx-auto size-5 text-muted-foreground/40" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const featuresComparisonSection = defineSection({
  id: "features-comparison",
  displayName: "Benchmark",
  description: "Full comparison table — your product against two competitors, a check or cross per feature.",
  category: "features",
  layoutArchetype: "matrix",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "software", "tech", "startup", "enterprise"],
  styles: ["modern", "corporate", "minimal"],
  goals: ["conversion", "trust", "education"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 80,
  editable: true,
  funnelStage: "decision",
  conversionWeight: 80,
  trustWeight: 70,
  tags: ["comparison", "table", "competitors", "features", "saas"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      headingBlock({ headline: { maxLength: 70 } }),
      descriptionBlock({ maxLength: 160 }),
      {
        kind: "items",
        key: "rows",
        canonical: "items",
        label: "Comparison rows",
        pick: [],
        itemFields: [
          { key: "feature", label: "Feature name", type: "text", canonical: "headline", maxLength: 60 },
          { key: "us", label: "We have it", type: "switch" },
          { key: "competitorA", label: "Competitor A has it", type: "switch" },
          { key: "competitorB", label: "Competitor B has it", type: "switch" },
        ],
        minItems: 2,
        maxItems: 15,
        newItem: () => ({ feature: "New feature", us: true, competitorA: false, competitorB: false }),
      },
    ],
    settings: [
      { key: "featureLabel", label: "Feature column label", type: "text", aiHint: "Heading of the feature column", maxLength: 30, group: "content" },
      { key: "ourLabel", label: "Our product label", type: "text", aiHint: "Your product name in the table header", maxLength: 30, group: "content" },
      { key: "competitorALabel", label: "Competitor A label", type: "text", aiHint: "Competitor A name", maxLength: 30, group: "content" },
      { key: "competitorBLabel", label: "Competitor B label", type: "text", aiHint: "Competitor B name", maxLength: 30, group: "content" },
    ],
  },
  defaultProps: {
    eyebrow: "Compare",
    headline: "See how we stack up",
    description: "An honest, side-by-side look at the capabilities that matter most.",
    featureLabel: "Feature",
    ourLabel: "Us",
    competitorALabel: "Competitor A",
    competitorBLabel: "Competitor B",
    rows: [
      { feature: "Visual drag-and-drop editor", us: true, competitorA: false, competitorB: false },
      { feature: "Custom domains with free SSL", us: true, competitorA: true, competitorB: false },
      { feature: "Mobile-responsive layouts", us: true, competitorA: true, competitorB: true },
      { feature: "Built-in analytics", us: true, competitorA: false, competitorB: true },
      { feature: "AI-assisted copywriting", us: true, competitorA: false, competitorB: false },
      { feature: "Multilingual pages", us: true, competitorA: false, competitorB: false },
    ],
  },
  Component: FeaturesComparison,
})
