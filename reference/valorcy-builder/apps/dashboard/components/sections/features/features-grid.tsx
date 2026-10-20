"use client"

import { Zap, Shield, Globe, Star, Layers, ArrowRight, type LucideIcon } from "lucide-react"
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

const ICONS: Record<string, LucideIcon> = { Zap, Shield, Globe, Star, Layers, ArrowRight }

type FeatureItem = { icon?: string; title?: string; body?: string }

/**
 * Lattice — grid archetype.
 *
 * Centered header over a three-column grid of icon cards on a faint top glow.
 * The glow and the card chrome are identity; the header lines and the card
 * collection are slot entries.
 */
function FeaturesGrid ({ instance, isPreview, definition }: SectionComponentProps) {
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
              <div className="mt-11 grid grid-cols-1 gap-5 text-start sm:grid-cols-2 lg:grid-cols-3">
                {items.map((it, i) => {
                  const Icon = iconFor(ICONS, it.icon, Zap)
                  return (
                    <div
                      key={i}
                      className="group relative rounded-2xl border border-border bg-card p-7 transition-all hover:border-primary/30"
                    >
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <ItemText
                        as="h3"
                        instance={inst}
                        collection="items"
                        index={i}
                        field="title"
                        value={it.title}
                        elementId={`title${i}`}
                        isPreview={isPreview}
                        className="mt-5 text-lg font-semibold tracking-tight text-foreground"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="items"
                        index={i}
                        field="body"
                        value={it.body}
                        elementId={`body${i}`}
                        isPreview={isPreview}
                        className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground"
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

export const featuresGridSection = defineSection({
  id: "features-grid",
  displayName: "Lattice",
  description: "Centered header over a three-column grid of icon cards.",
  category: "features",
  layoutArchetype: "grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["app_landing", "saas", "startup", "agency", "enterprise", "generic"],
  trustWeight: 40,
  conversionWeight: 30,
  funnelStage: 'consideration',
  styles: ["modern", "minimal", "corporate"],
  goals: ["education", "trust", "awareness"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  recommendedNeighbors: { before: ["hero-center", "hero-gradient"], after: ["cta-simple", "cta-banner"] },
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
        label: "Feature cards",
        pick: [],
        itemFields: [
          iconField(ICONS),
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: HINTS.itemTitle, maxLength: 60, group: "content" },
          { key: "body", label: "Body", type: "textarea", canonical: "body", aiHint: HINTS.itemBody, maxLength: 300, group: "content" },
        ],
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ icon: "Zap", title: "Feature", body: "Describe this feature." }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Platform",
    headline: "Everything your team needs to",
    accentWord: "ship faster",
    description: "A focused set of tools that removes busywork, so your team spends its time on the work that matters.",
    items: [
      { icon: "Zap", title: "Instant performance", body: "Pages load in milliseconds on every device, with no tuning required." },
      { icon: "Shield", title: "Security built in", body: "SSL, backups and role-based access are on from day one." },
      { icon: "Globe", title: "Global by default", body: "Serve every visitor from the edge location closest to them." },
      { icon: "Star", title: "Polished templates", body: "Start from layouts designed to convert, then make them yours." },
      { icon: "Layers", title: "Reusable components", body: "Build once and reuse blocks across every page you publish." },
      { icon: "ArrowRight", title: "One-click publishing", body: "Go from draft to live in a single step, with instant rollback." },
    ],
  },
  Component: FeaturesGrid,
})
