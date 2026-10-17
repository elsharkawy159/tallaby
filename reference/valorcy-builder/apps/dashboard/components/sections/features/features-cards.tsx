"use client"

import { Zap, Shield, Globe, Star, Layers, Rocket, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionImageSlot } from "@/components/sections/_primitives/section-image-slot"
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

const ICONS: Record<string, LucideIcon> = { Zap, Shield, Globe, Star, Layers, Rocket }

type Card = { icon?: string; title?: string; body?: string; imageUrl?: string }

/**
 * Showcase — media-cards archetype.
 *
 * Centered header over cards that each lead with an image (or a tinted icon
 * panel when none is set), then an icon badge, title and body. Card chrome is
 * identity; the header lines and the card collection are slot entries.
 */
function FeaturesCards ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const cards = (inst.props.cards as Card[] | undefined) ?? []
            if (cards.length === 0) return null
            return (
              <div className="mt-11 grid grid-cols-1 gap-6 text-start sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card, i) => {
                  const Icon = iconFor(ICONS, card.icon, Zap)
                  return (
                    <article
                      key={i}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30"
                    >
                      <div className="relative h-48 w-full overflow-hidden bg-muted">
                        {card.imageUrl ? (
                          <SectionImageSlot
                            instanceId={inst.id}
                            elementKey={`cardImage${i}`}
                            src={card.imageUrl}
                            alt={card.title ?? ""}
                            collectionKey="cards"
                            collectionIndex={i}
                            itemSrcProp="imageUrl"
                            itemAltProp="title"
                            aspect="video"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <Icon className="size-10 text-muted-foreground opacity-50" aria-hidden />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-6">
                        <div className="mb-4 flex text-foreground">
                          <Icon className="size-4" aria-hidden />
                        </div>
                        <ItemText
                          as="h3"
                          instance={inst}
                          collection="cards"
                          index={i}
                          field="title"
                          value={card.title}
                          elementId={`title${i}`}
                          isPreview={isPreview}
                          className="text-lg font-semibold tracking-tight text-foreground"
                        />
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="cards"
                          index={i}
                          field="body"
                          value={card.body}
                          elementId={`body${i}`}
                          isPreview={isPreview}
                          className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-muted-foreground"
                        />
                      </div>
                    </article>
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

export const featuresCardsSection = defineSection({
  id: "features-cards",
  displayName: "Showcase",
  description: "Centered header over cards that each lead with an image, then an icon, title and body.",
  category: "features",
  layoutArchetype: "media-cards",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "creative", "startup", "enterprise", "generic"],
  trustWeight: 40,
  conversionWeight: 30,
  funnelStage: 'consideration',
  styles: ["modern", "bold", "corporate"],
  goals: ["education", "trust", "brand"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  recommendedNeighbors: { before: ["hero-centered", "hero-split"], after: ["cta-banner", "testimonials-grid"] },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      ...standardHeader({ accent: true }),
      {
        kind: "items",
        key: "cards",
        canonical: "cards",
        label: "Feature cards",
        pick: [],
        itemFields: [
          iconField(ICONS),
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: HINTS.itemTitle, maxLength: 60, group: "content" },
          { key: "body", label: "Body", type: "textarea", canonical: "body", aiHint: HINTS.itemBody, maxLength: 300, group: "content" },
          { key: "imageUrl", label: "Image", type: "image" },
        ],
        minItems: 1,
        maxItems: 9,
        newItem: () => ({ icon: "Zap", title: "Feature", body: "Describe this feature." }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Capabilities",
    headline: "Built for teams that",
    accentWord: "move fast",
    description: "Premium building blocks assembled into one coherent, conversion-focused system.",
    cards: [
      { icon: "Zap", title: "Launch in an afternoon", body: "Go from idea to a live, polished page without waiting on a developer." },
      { icon: "Shield", title: "Enterprise-grade security", body: "Encryption, audit logs and single sign-on keep your data protected." },
      { icon: "Globe", title: "Reach every market", body: "Translate and localise every page from a single workspace." },
      { icon: "Star", title: "Designed to convert", body: "Every layout is built on patterns proven to turn visitors into customers." },
      { icon: "Layers", title: "A system, not a pile", body: "Shared styles keep every page consistent as your site grows." },
      { icon: "Rocket", title: "Scale without limits", body: "Handle launch-day traffic spikes without lifting a finger." },
    ],
  },
  Component: FeaturesCards,
})
