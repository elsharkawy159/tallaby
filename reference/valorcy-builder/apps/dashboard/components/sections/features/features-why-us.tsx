"use client"

import { Check, X } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  PropText,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  stretchItems,
  styledEyebrow,
} from "@/components/sections/features/features-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type WhyUsPoint = { label?: string; us?: boolean; them?: boolean }

/**
 * Contrast — comparison archetype.
 *
 * The argument on the start side; on the end side a compact striped list with a
 * check or cross for "us" and "the rest" on every point. Two slots, one per
 * column. The column labels are section settings edited in place in the list
 * head; the points are the `points` collection.
 */
function FeaturesWhyUs ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col items-start"
            align="left"
            headingClassName={`${TYPE_H2} text-foreground`}
            bodyClassName={`${TYPE_LEAD} mt-4`}
            overrides={{ eyebrow: styledEyebrow("mb-3 text-xs", isPreview) }}
          />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="table"
            className="flex flex-col"
            entryClassName={stretchItems}
            renderItems={({ instance: inst }) => {
              const points = (inst.props.points as WhyUsPoint[] | undefined) ?? []
              if (points.length === 0) return null
              return (
                <div className="overflow-hidden rounded-2xl border border-border">
                  <div className="grid grid-cols-3 border-b border-border bg-muted/40">
                    <div className="p-4 text-sm font-medium text-muted-foreground">
                      <PropText instance={inst} propKey="featureLabel" fallback="Feature" isPreview={isPreview} />
                    </div>
                    <div className="p-4 text-center text-sm font-semibold text-primary">
                      <PropText instance={inst} propKey="ourLabel" fallback="Us" isPreview={isPreview} />
                    </div>
                    <div className="p-4 text-center text-sm font-medium text-muted-foreground">
                      <PropText instance={inst} propKey="themLabel" fallback="The rest" isPreview={isPreview} />
                    </div>
                  </div>
                  {points.map((pt, i) => (
                    <div key={i} className="grid grid-cols-3 border-b border-border last:border-0 odd:bg-muted/10">
                      <div className="p-4">
                        <ItemText
                          instance={inst}
                          collection="points"
                          index={i}
                          field="label"
                          value={pt.label}
                          elementId={`label${i}`}
                          isPreview={isPreview}
                          className="text-sm text-foreground"
                        />
                      </div>
                      <div className="flex items-center justify-center p-4">
                        {pt.us ? <Check className="size-5 text-primary" /> : <X className="size-5 text-muted-foreground/40" />}
                      </div>
                      <div className="flex items-center justify-center p-4">
                        {pt.them ? <Check className="size-5 text-muted-foreground" /> : <X className="size-5 text-muted-foreground/40" />}
                      </div>
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

export const featuresWhyUsSection = defineSection({
  id: "features-why-us",
  displayName: "Contrast",
  description: "The argument beside a compact striped list — a check or cross for you and the rest on every point.",
  category: "features",
  layoutArchetype: "comparison",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["agency", "saas", "startup", "enterprise", "it_support", "home_services", "fitness", "dentist"],
  styles: ["modern", "corporate", "minimal"],
  goals: ["conversion", "trust", "sales"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 85,
  editable: true,
  funnelStage: "decision",
  conversionWeight: 80,
  trustWeight: 70,
  tags: ["comparison", "why-us", "differentiation", "benefits", "vs"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "table", label: "Comparison", eject: { direction: "column" } },
    ],
    blocks: [
      eyebrowBlock(),
      headingBlock({ headline: { maxLength: 70 } }),
      descriptionBlock({ maxLength: 200 }),
      {
        kind: "items",
        key: "points",
        canonical: "items",
        label: "Comparison points",
        slot: "table",
        pick: [],
        itemFields: [
          { key: "label", label: "Feature label", type: "text", canonical: "headline", maxLength: 60 },
          { key: "us", label: "We offer this", type: "switch" },
          { key: "them", label: "Competitors offer this", type: "switch" },
        ],
        minItems: 2,
        maxItems: 12,
        newItem: () => ({ label: "Feature or benefit", us: true, them: false }),
      },
    ],
    settings: [
      { key: "featureLabel", label: "Feature column label", type: "text", aiHint: "Heading of the feature column", maxLength: 30, group: "content" },
      { key: "ourLabel", label: "Our label", type: "text", aiHint: "Your brand name in the table", maxLength: 30, group: "content" },
      { key: "themLabel", label: "Competitor label", type: "text", aiHint: "Generic competitor label", maxLength: 30, group: "content" },
    ],
  },
  defaultProps: {
    eyebrow: "Why choose us",
    headline: "The smarter choice for your business",
    description: "Not every provider is equal. Here is what sets us apart from the rest — point by point.",
    featureLabel: "Feature",
    ourLabel: "Us",
    themLabel: "The rest",
    points: [
      { label: "Dedicated account manager", us: true, them: false },
      { label: "Same-day response times", us: true, them: false },
      { label: "Transparent, fixed pricing", us: true, them: false },
      { label: "No long-term contracts", us: true, them: false },
      { label: "Certified specialists", us: true, them: true },
      { label: "Satisfaction guarantee", us: true, them: false },
    ],
  },
  Component: FeaturesWhyUs,
})
