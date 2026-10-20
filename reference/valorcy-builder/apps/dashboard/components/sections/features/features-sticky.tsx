"use client"

import { Zap, Shield, Globe, Star, Layers, Rocket, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  HINTS,
  ItemText,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  iconField,
  iconFor,
  pillEyebrow,
  stretchItems,
} from "@/components/sections/features/features-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const ICONS: Record<string, LucideIcon> = { Zap, Shield, Globe, Star, Layers, Rocket }

type Feature = { icon?: string; title?: string; body?: string }

/**
 * Anchor — split archetype.
 *
 * The argument pins to the start column while the feature cards scroll past it
 * on the end column. Two slots, one per column: the sticky copy (with its
 * decorative accent rule as chrome) and the card list.
 */
function FeaturesSticky ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="copy"
              className="flex flex-col items-start"
              align="left"
              headingClassName={`${TYPE_H2} mt-5 text-foreground`}
              bodyClassName={`${TYPE_BODY} mt-6`}
              overrides={{ eyebrow: pillEyebrow(isPreview) }}
            />
            <div aria-hidden className="mt-8 h-1 w-16 rounded-full bg-primary" />
          </div>

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="list"
            className="flex flex-col gap-10"
            entryClassName={stretchItems}
            renderItems={({ instance: inst }) => {
              const features = (inst.props.features as Feature[] | undefined) ?? []
              if (features.length === 0) return null
              return (
                <div className="space-y-10">
                  {features.map((feat, i) => {
                    const Icon = iconFor(ICONS, feat.icon, Zap)
                    return (
                      <div
                        key={i}
                        className="group flex gap-6 rounded-2xl border border-border bg-card p-7 transition-all hover:border-primary/30"
                      >
                        <div className="mt-1 flex shrink-0 text-foreground">
                          <Icon className="size-6" aria-hidden />
                        </div>
                        <div className="flex-1">
                          <ItemText
                            as="h3"
                            instance={inst}
                            collection="features"
                            index={i}
                            field="title"
                            value={feat.title}
                            elementId={`title${i}`}
                            isPreview={isPreview}
                            className="text-xl font-semibold tracking-tight text-foreground"
                          />
                          <ItemText
                            as="p"
                            instance={inst}
                            collection="features"
                            index={i}
                            field="body"
                            value={feat.body}
                            elementId={`body${i}`}
                            isPreview={isPreview}
                            className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const featuresStickySection = defineSection({
  id: "features-sticky",
  displayName: "Anchor",
  description: "The argument pins to one column while feature cards scroll past on the other.",
  category: "features",
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "enterprise", "startup", "creative"],
  trustWeight: 40,
  conversionWeight: 30,
  funnelStage: 'consideration',
  styles: ["editorial", "modern", "minimal"],
  goals: ["education", "trust", "brand"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  recommendedNeighbors: { before: ["hero-split", "hero-centered"], after: ["cta-banner", "testimonials-grid"] },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "list", label: "Feature list", eject: { direction: "column" } },
    ],
    blocks: [
      eyebrowBlock({ aiHint: HINTS.eyebrow }),
      headingBlock({ accent: true, suffix: true, headline: { aiHint: HINTS.headline } }),
      descriptionBlock({ key: "sideNote", label: "Side note" }),
      {
        kind: "items",
        key: "features",
        canonical: "items",
        label: "Features",
        slot: "list",
        pick: [],
        itemFields: [
          iconField(ICONS),
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: HINTS.itemTitle, maxLength: 60, group: "content" },
          { key: "body", label: "Body", type: "textarea", canonical: "body", aiHint: HINTS.itemBody, maxLength: 300, group: "content" },
        ],
        minItems: 1,
        maxItems: 8,
        newItem: () => ({ icon: "Zap", title: "Feature", body: "Describe this feature." }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Why us",
    headline: "Why teams",
    accentWord: "choose us",
    headlineSuffix: "",
    sideNote: "A full-featured platform with nothing unnecessary — just the tools that move the needle for your business.",
    features: [
      { icon: "Zap", title: "Speed you can feel", body: "Pages render instantly, so visitors stay and convert." },
      { icon: "Shield", title: "Peace of mind", body: "Automatic backups and security updates, handled for you." },
      { icon: "Globe", title: "Built for a global audience", body: "Localised content and edge delivery in every region." },
      { icon: "Star", title: "Five-star support", body: "Real people who answer quickly and know the product inside out." },
      { icon: "Layers", title: "Consistent by design", body: "Shared styles keep every page on-brand as you grow." },
      { icon: "Rocket", title: "Room to scale", body: "From a single landing page to hundreds — no migration needed." },
    ],
  },
  Component: FeaturesSticky,
})
