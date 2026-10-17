"use client"

import { Building2, ShoppingBag, HeartPulse, Landmark, Plane, Zap, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  iconField,
  iconFor,
  stretchItems,
} from "@/components/sections/features/features-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const ICONS: Record<string, LucideIcon> = { Building2, ShoppingBag, HeartPulse, Landmark, Plane, Zap }

type Industry = { icon?: string; name?: string; stat?: string; description?: string }

/**
 * Verticals — dense-grid archetype.
 *
 * Centered header over a dense six-across grid of small square tiles, one per
 * industry served: icon, name, an optional stat and a one-line note. Tile chrome
 * is identity; the header lines and the industries collection are slot entries.
 */
function FeaturesIndustryExpertise ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const industries = (inst.props.industries as Industry[] | undefined) ?? []
            if (industries.length === 0) return null
            return (
              <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {industries.map((ind, i) => {
                  const Icon = iconFor(ICONS, ind.icon, Zap)
                  return (
                    <div
                      key={i}
                      className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center transition-all hover:border-primary/30"
                    >
                      <div className="flex text-foreground">
                        <Icon className="size-6" aria-hidden />
                      </div>
                      <div>
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="industries"
                          index={i}
                          field="name"
                          value={ind.name}
                          elementId={`iname${i}`}
                          isPreview={isPreview}
                          className="text-sm font-semibold text-foreground"
                        />
                        {ind.stat && (
                          <ItemText
                            as="p"
                            instance={inst}
                            collection="industries"
                            index={i}
                            field="stat"
                            value={ind.stat}
                            isPreview={isPreview}
                            className="mt-0.5 text-xs font-semibold text-primary"
                          />
                        )}
                        {ind.description && (
                          <ItemText
                            as="p"
                            instance={inst}
                            collection="industries"
                            index={i}
                            field="description"
                            value={ind.description}
                            isPreview={isPreview}
                            className="mt-1 text-xs text-muted-foreground"
                          />
                        )}
                      </div>
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

export const featuresIndustryExpertiseSection = defineSection({
  id: "features-industry-expertise",
  displayName: "Verticals",
  description: "A dense grid of small industry tiles — icon, name and an optional stat for each sector served.",
  category: "features",
  layoutArchetype: "dense-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["agency", "web_dev_service", "it_support", "creative", "enterprise"],
  styles: ["modern", "corporate", "minimal"],
  goals: ["trust", "education"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  funnelStage: "awareness",
  conversionWeight: 45,
  trustWeight: 70,
  tags: ["industries", "expertise", "verticals", "agency", "experience"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      headingBlock({ headline: { maxLength: 70 } }),
      descriptionBlock({ maxLength: 200 }),
      {
        kind: "items",
        key: "industries",
        canonical: "items",
        label: "Industries",
        pick: [],
        itemFields: [
          iconField(ICONS),
          { key: "name", label: "Industry name", type: "text", canonical: "headline", maxLength: 30 },
          { key: "stat", label: "Stat (optional)", type: "text", aiHint: "e.g. 80+ projects", maxLength: 30 },
          { key: "description", label: "Description (optional)", type: "text", canonical: "body", maxLength: 60 },
        ],
        minItems: 2,
        maxItems: 12,
        newItem: () => ({ icon: "Zap", name: "Industry", stat: "", description: "" }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Industries",
    headline: "Deep expertise across verticals",
    description: "We have shipped for companies in every major industry — and that domain knowledge shows in every project.",
    industries: [
      { icon: "Building2", name: "Real estate", stat: "120+ projects", description: "" },
      { icon: "ShoppingBag", name: "Retail", stat: "90+ projects", description: "" },
      { icon: "HeartPulse", name: "Healthcare", stat: "60+ projects", description: "" },
      { icon: "Landmark", name: "Finance", stat: "75+ projects", description: "" },
      { icon: "Plane", name: "Travel", stat: "40+ projects", description: "" },
      { icon: "Zap", name: "Technology", stat: "150+ projects", description: "" },
    ],
  },
  Component: FeaturesIndustryExpertise,
})
