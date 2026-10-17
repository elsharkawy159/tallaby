"use client"

import { Zap, Shield, Globe, Star, Lock, Cpu, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  HINTS,
  ItemText,
  iconField,
  iconFor,
  standardHeader,
  stretchItems,
} from "@/components/sections/features/features-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const ICONS: Record<string, LucideIcon> = { Zap, Shield, Globe, Star, Lock, Cpu }

type FeatureItem = { icon?: string; title?: string; body?: string }

/**
 * Folio — editorial archetype.
 *
 * Centered header over a generous two-column list: a large icon tile beside
 * each title and body, no card borders, lots of air. The icon tiles are chrome;
 * the header lines and the collection are slot entries.
 */
function FeaturesIcons ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const items = (inst.props.items as FeatureItem[] | undefined) ?? []
            if (items.length === 0) return null
            return (
              <div className="mt-11 grid grid-cols-1 gap-x-12 gap-y-14 text-start sm:grid-cols-2">
                {items.map((item, i) => {
                  const Icon = iconFor(ICONS, item.icon, Zap)
                  return (
                    <div key={i} className="flex gap-6">
                      <div className="mt-1 flex shrink-0 text-foreground">
                        <Icon className="size-6" aria-hidden />
                      </div>
                      <div className="flex-1">
                        <ItemText
                          as="h3"
                          instance={inst}
                          collection="items"
                          index={i}
                          field="title"
                          value={item.title}
                          elementId={`title${i}`}
                          isPreview={isPreview}
                          className="text-lg font-semibold tracking-tight text-foreground"
                        />
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="items"
                          index={i}
                          field="body"
                          value={item.body}
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
      </SectionContainer>
    </section>
  )
}

export const featuresIconsSection = defineSection({
  id: "features-icons",
  displayName: "Folio",
  description: "Editorial two-column list — a large icon tile beside each title and body, with generous spacing.",
  category: "features",
  layoutArchetype: "editorial",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas", "startup", "agency", "enterprise", "finance", "generic"],
  trustWeight: 40,
  conversionWeight: 30,
  funnelStage: 'consideration',
  styles: ["minimal", "modern", "editorial", "corporate"],
  goals: ["education", "trust", "awareness", "conversion"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  recommendedNeighbors: { before: ["hero-center", "hero-split"], after: ["cta-simple", "testimonials-grid"] },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      ...standardHeader({ accent: true }),
      {
        kind: "items",
        key: "items",
        canonical: "items",
        label: "Features",
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
    eyebrow: "The toolkit",
    headline: "Everything you need,",
    accentWord: "nothing you don't",
    description: "A complete set of tools to build, ship and grow — designed to work together from the first day.",
    items: [
      { icon: "Zap", title: "Fast by default", body: "Optimised images, lean code and edge delivery keep every page quick." },
      { icon: "Shield", title: "Secure from the start", body: "Automatic SSL, daily backups and granular permissions for your team." },
      { icon: "Globe", title: "Ready for every language", body: "Publish localised pages with right-to-left support built in." },
      { icon: "Star", title: "Crafted details", body: "Typography, spacing and motion tuned to feel premium on every screen." },
      { icon: "Lock", title: "Private when you need it", body: "Password-protect pages and control exactly who sees what." },
      { icon: "Cpu", title: "Automation that helps", body: "Let routine updates run themselves while you focus on the big picture." },
    ],
  },
  Component: FeaturesIcons,
})
