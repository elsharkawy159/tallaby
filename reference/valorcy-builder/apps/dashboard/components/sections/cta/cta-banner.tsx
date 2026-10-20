"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { CtaLinkButton } from "@/components/sections/cta/cta-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Ribbon — banner archetype.
 *
 * A full-bleed band in the flat brand colour: copy on the start side, one action
 * on the end side. Signature move: the solid colour band itself, no gradient or
 * orbs on it. Text is inverted onto the primary fill,
 * so every block's type scale is passed in rather than inherited from the
 * defaults.
 *
 * The action keeps the flat `primaryLabel` / `primaryHref` props it has always
 * stored — pages saved before the slot migration keep their button. The href
 * block is an inspector field only; the button carries it.
 */
function CtaBanner ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({
    instanceId: instance.id,
    rootOptions: { defaultBackground: false, defaultColor: "var(--primary-foreground)" },
  })

  return (
    <section
      className="relative overflow-x-clip"
      style={{
        ...rootStyle,
        ...(!rootStyle.background && !rootStyle.backgroundColor
          ? { backgroundColor: "var(--primary)" }
          : {}),
      }}
    >
      <SectionContainer className="relative flex flex-col items-center gap-6 md:flex-row md:justify-between md:gap-8">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-1 flex-col items-center gap-2 text-center md:items-start md:text-start"
          align="left"
          badgeVariant="solid"
          headingClassName={`${TYPE_H2_SM} text-primary-foreground`}
          bodyClassName="text-base text-primary-foreground/80"
          noteClassName="text-sm text-primary-foreground/70"
        />

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="action"
          className="flex shrink-0 flex-col items-center gap-3 md:items-end"
          overrides={{
            primaryLabel: ({ instance: inst }) => (
              <CtaLinkButton
                instance={inst}
                isPreview={isPreview}
                labelProp="primaryLabel"
                hrefProp="primaryHref"
                elementKey="primaryCta"
                fallback="Start building free"
                className="h-11 bg-primary-foreground px-6 text-sm text-primary hover:bg-primary-foreground/90"
              />
            ),
            // Carried by the button above; edited in the inspector.
            primaryHref: () => null,
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const ctaBannerSection = defineSection({
  id: "cta-banner",
  displayName: "Ribbon",
  description: "Brand-colour band — headline on one side, a single bold action on the other.",
  category: "cta",
  layoutArchetype: "banner",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["app_landing", "saas", "startup", "agency", "ecommerce", "generic", "enterprise", "event", "fitness", "restaurant", "travel", "dentist", "real_estate", "law"],
  trustWeight: 15,
  conversionWeight: 90,
  funnelStage: "decision",
  styles: ["bold", "modern", "corporate"],
  goals: ["conversion", "sales", "leads"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 96,
  editable: true,
  tags: ["banner", "inverted", "single-action"],
  recommendedNeighbors: { before: ["features-grid", "pricing-table", "testimonials-grid"], after: ["footer-minimal"] },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "action", label: "Action", eject: { direction: "column" } },
    ],
    blocks: [
      { kind: "heading", level: 2, accent: false },
      { kind: "body" },
      {
        kind: "note",
        id: "primaryLabel",
        label: "Button label",
        slot: "action",
        field: { key: "primaryLabel", canonical: "ctaPrimary", maxLength: 30, group: "cta" },
      },
      {
        kind: "note",
        id: "primaryHref",
        label: "Button link",
        slot: "action",
        field: { key: "primaryHref", type: "url", canonical: "ctaLink", group: "cta" },
      },
    ],
  },
  defaultProps: {
    headline: "Build your site. Ship it today.",
    description: "The fastest path from a blank page to a live, professional site.",
    primaryLabel: "Start building free",
    primaryHref: "#",
  },
  Component: CtaBanner,
})
