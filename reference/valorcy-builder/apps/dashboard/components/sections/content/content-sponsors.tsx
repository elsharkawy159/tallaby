"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, SectionEditableImage, useSectionSurface } from "@/components/sections/shared"
import { CENTERED_HEADER, labelSetting, stretchItems, textOf } from "@/components/sections/content/content-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Sponsor = { name?: string; tier?: string; logoUrl?: string; href?: string; description?: string }

const TIERS = ["Gold", "Silver", "Bronze"] as const

/** Logo scale shrinks tier by tier; the badge tone steps down from brand to neutral. */
const TIER_CONFIG: Record<(typeof TIERS)[number], { cols: string; logoSize: string; badge: string }> = {
  Gold: { cols: "grid-cols-2 sm:grid-cols-3", logoSize: "h-16", badge: "bg-primary/15 text-primary" },
  Silver: { cols: "grid-cols-3 sm:grid-cols-4", logoSize: "h-12", badge: "bg-muted text-muted-foreground" },
  Bronze: { cols: "grid-cols-4 sm:grid-cols-6", logoSize: "h-9", badge: "bg-accent text-accent-foreground" },
}

/**
 * Patrons — tiered archetype.
 *
 * A centered header over Gold, Silver and Bronze tiers, each introduced by a
 * ruled label, with logos shrinking tier by tier. Gold sponsors may carry a
 * one-line description. Logos are greyscale until hovered.
 */
function ContentSponsors ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className={CENTERED_HEADER}
          align="center"
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const sponsors = (inst.props.sponsors as Sponsor[] | undefined) ?? []
            if (sponsors.length === 0) return null
            const suffix = textOf(inst.props, "tierSuffix", "Sponsors")
            return (
              <div className="mt-7 space-y-12">
                {TIERS.map((tier) => {
                  const list = sponsors
                    .map((sponsor, index) => ({ sponsor, index }))
                    .filter(({ sponsor }) => sponsor.tier === tier)
                  if (list.length === 0) return null
                  const cfg = TIER_CONFIG[tier]
                  return (
                    <div key={tier}>
                      <div className="mb-6 flex items-center justify-center gap-3">
                        <div aria-hidden className="h-px flex-1 bg-border/50" />
                        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", cfg.badge)}>
                          {tier} {suffix}
                        </span>
                        <div aria-hidden className="h-px flex-1 bg-border/50" />
                      </div>
                      <div className={cn("grid items-center gap-6", cfg.cols)}>
                        {list.map(({ sponsor: s, index }) => (
                          <a
                            key={index}
                            href={s.href || "#"}
                            title={s.name}
                            className="group flex flex-col items-center gap-2 rounded-xl p-4 transition-colors hover:bg-muted/60"
                          >
                            {s.logoUrl ? (
                              <SectionEditableImage
                                instanceId={inst.id}
                                elementKey={`sponsors.${index}.logoUrl`}
                                src={s.logoUrl}
                                alt={s.name ?? ""}
                                collectionKey="sponsors"
                                collectionIndex={index}
                                itemSrcProp="logoUrl"
                                isPreview={isPreview}
                                className={cn(
                                  cfg.logoSize,
                                  "w-auto object-contain opacity-70 grayscale transition group-hover:opacity-100 group-hover:grayscale-0"
                                )}
                              />
                            ) : (
                              <div className={cn(cfg.logoSize, "flex w-full items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground")}>
                                {s.name}
                              </div>
                            )}
                            {s.description && tier === "Gold" ? (
                              <p className="text-center text-xs text-muted-foreground">{s.description}</p>
                            ) : null}
                          </a>
                        ))}
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

export const contentSponsorsSection = defineSection({
  id: "content-sponsors",
  displayName: "Patrons",
  description: "Gold, Silver and Bronze sponsor tiers with logos shrinking tier by tier.",
  category: "content",
  layoutArchetype: "tiered",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["event", "nonprofit", "education"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["trust", "brand", "engagement"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 40,
  trustWeight: 80,
  tags: ["sponsors", "partners", "logos", "event", "tiers"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 30 } },
      { kind: "heading", level: 2, accent: false, fields: { headline: { key: "headline", maxLength: 70 } } },
      { kind: "body", field: { key: "description", maxLength: 200 } },
      {
        kind: "items",
        key: "sponsors",
        canonical: "logos",
        label: "Sponsors",
        pick: [],
        itemPlaceholder: "logo",
        itemFields: [
          { key: "logoUrl", label: "Logo", type: "image", canonical: "image" },
          { key: "name", label: "Sponsor name", type: "text", canonical: "headline", maxLength: 60 },
          {
            key: "tier",
            label: "Tier",
            type: "select",
            options: [
              { label: "Gold", value: "Gold" },
              { label: "Silver", value: "Silver" },
              { label: "Bronze", value: "Bronze" },
            ],
          },
          { key: "description", label: "Description (Gold only)", type: "text", canonical: "body", maxLength: 80 },
          { key: "href", label: "Website link", type: "url", canonical: "ctaLink" },
        ],
        minItems: 1,
        maxItems: 30,
        newItem: () => ({ name: "Sponsor Name", tier: "Silver", logoUrl: "", href: "#", description: "" }),
      },
    ],
    settings: [labelSetting("tierSuffix", "Tier label suffix (e.g. Sponsors)", 20)],
  },
  defaultProps: {
    eyebrow: "Our sponsors",
    headline: "Made possible by our partners",
    description: "The organisations whose support keeps the conference independent and tickets affordable.",
    tierSuffix: "Sponsors",
    sponsors: [
      { name: "Northwind", tier: "Gold", logoUrl: "", href: "#", description: "Cloud infrastructure for growing teams." },
      { name: "Lumen", tier: "Gold", logoUrl: "", href: "#", description: "Product analytics without the guesswork." },
      { name: "Fieldstone", tier: "Silver", logoUrl: "", href: "#", description: "" },
      { name: "Harbor", tier: "Silver", logoUrl: "", href: "#", description: "" },
      { name: "Arcadia", tier: "Silver", logoUrl: "", href: "#", description: "" },
      { name: "Brightline", tier: "Bronze", logoUrl: "", href: "#", description: "" },
      { name: "Kestrel", tier: "Bronze", logoUrl: "", href: "#", description: "" },
      { name: "Meridian", tier: "Bronze", logoUrl: "", href: "#", description: "" },
    ],
  },
  Component: ContentSponsors,
})
