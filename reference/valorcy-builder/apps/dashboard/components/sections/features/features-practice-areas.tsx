"use client"

import { Scale, Shield, Briefcase, Home, Users, Heart, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  FlatLinkAction,
  ItemText,
  descriptionBlock,
  eyebrowBlock,
  flatActionBlocks,
  headingBlock,
  iconField,
  iconFor,
  stretchItems,
  textOr,
} from "@/components/sections/features/features-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const ICONS: Record<string, LucideIcon> = { Scale, Shield, Briefcase, Home, Users, Heart }

type PracticeArea = { icon?: string; title?: string; description?: string; href?: string }

/** Pre-migration pages rendered this literal at the foot of every card. */
const AREA_LINK_FALLBACK = "Learn more"

/**
 * Disciplines — link-grid archetype.
 *
 * Centered header over a grid in which every card is itself a link to its
 * practice area, closed by one consultation button. Card chrome is identity;
 * the header lines, the areas collection and the button are slot entries.
 */
function FeaturesPracticeAreas ({ instance, isPreview, definition }: SectionComponentProps) {
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
          overrides={{
            ctaLabel: ({ instance: inst }) => (
              <div className="mt-5">
                <FlatLinkAction
                  instance={inst}
                  isPreview={isPreview}
                  labelProp="ctaLabel"
                  hrefProp="ctaHref"
                  fallback="Schedule a consultation"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                />
              </div>
            ),
            // Carried by the button above; edited in the inspector.
            ctaHref: () => null,
          }}
          renderItems={({ instance: inst }) => {
            const areas = (inst.props.areas as PracticeArea[] | undefined) ?? []
            if (areas.length === 0) return null
            const linkLabel = textOr(inst, "areaLinkLabel", AREA_LINK_FALLBACK)
            return (
              <div className="mt-5 grid grid-cols-1 gap-5 text-start sm:grid-cols-2 lg:grid-cols-3">
                {areas.map((area, i) => {
                  const Icon = iconFor(ICONS, area.icon, Scale)
                  return (
                    <a
                      key={i}
                      href={area.href || "#"}
                      data-element-collection="areas"
                      data-element-index={String(i)}
                      data-element-item-href-prop="href"
                      className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
                    >
                      <Icon className="size-6 text-foreground" aria-hidden />
                      <div>
                        <ItemText
                          as="h3"
                          instance={inst}
                          collection="areas"
                          index={i}
                          field="title"
                          value={area.title}
                          isPreview={isPreview}
                          className="font-semibold text-foreground group-hover:underline"
                        />
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="areas"
                          index={i}
                          field="description"
                          value={area.description}
                          isPreview={isPreview}
                          className="mt-1.5 text-sm leading-relaxed text-muted-foreground"
                        />
                      </div>
                      {linkLabel !== "" && (
                        <span className="mt-auto text-xs font-semibold text-primary">{linkLabel} →</span>
                      )}
                    </a>
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

export const featuresPracticeAreasSection = defineSection({
  id: "features-practice-areas",
  displayName: "Disciplines",
  description: "A grid of linked practice-area cards closed by one consultation button.",
  category: "features",
  layoutArchetype: "link-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["law"],
  styles: ["corporate", "modern", "minimal"],
  goals: ["leads", "trust", "conversion"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  funnelStage: "awareness",
  conversionWeight: 70,
  trustWeight: 75,
  tags: ["practice-areas", "law", "legal", "services", "attorney"],
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
        key: "areas",
        canonical: "cards",
        label: "Practice Areas",
        pick: [],
        itemFields: [
          iconField(ICONS),
          { key: "title", label: "Area title", type: "text", canonical: "headline", maxLength: 50 },
          { key: "description", label: "Description", type: "textarea", canonical: "body", maxLength: 120 },
          { key: "href", label: "Link", type: "url", canonical: "ctaLink" },
        ],
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ icon: "Scale", title: "Practice Area", description: "Description of this area.", href: "#" }),
      },
      ...flatActionBlocks({ labelKey: "ctaLabel", hrefKey: "ctaHref", maxLength: 50 }),
    ],
    settings: [
      { key: "areaLinkLabel", label: "Card link label", type: "text", aiHint: "Short link text at the foot of each card", maxLength: 30, group: "content" },
    ],
  },
  defaultProps: {
    eyebrow: "Practice areas",
    headline: "We fight for what matters most",
    description: "Our attorneys bring deep expertise across a broad range of legal disciplines.",
    ctaLabel: "Schedule a consultation",
    ctaHref: "#",
    areaLinkLabel: AREA_LINK_FALLBACK,
    areas: [
      { icon: "Shield", title: "Criminal defense", description: "Vigorous representation at every stage, from arrest through trial.", href: "#" },
      { icon: "Briefcase", title: "Business law", description: "Formation, contracts and disputes handled with commercial sense.", href: "#" },
      { icon: "Home", title: "Real estate", description: "Purchases, leases and title issues resolved without delay.", href: "#" },
      { icon: "Users", title: "Family law", description: "Divorce, custody and support matters handled with discretion.", href: "#" },
      { icon: "Heart", title: "Personal injury", description: "We pursue the full compensation you are owed — no win, no fee.", href: "#" },
      { icon: "Scale", title: "Civil litigation", description: "Experienced trial lawyers for complex disputes in every court.", href: "#" },
    ],
  },
  Component: FeaturesPracticeAreas,
})
