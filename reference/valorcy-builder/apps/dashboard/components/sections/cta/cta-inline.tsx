"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_INLINE } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { CtaEmailField, CtaLinkButton } from "@/components/sections/cta/cta-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Strip — strip archetype.
 *
 * One line between two hairlines: a short prompt, a field and a button. It is
 * the only CTA meant to sit *between* content sections rather than close a page,
 * so it is deliberately quiet. The whole row is a single slot, which means the
 * field, the button and the prompt each reorder independently.
 *
 * The action keeps its flat `submitLabel` / `submitHref` props so pages saved
 * before the slot migration keep their button.
 */
function CtaInline ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="border-y border-border" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="row"
          className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:text-start"
          align="center"
          headingClassName="shrink-0 font-heading text-base font-semibold text-foreground sm:me-2"
          noteClassName="text-sm text-muted-foreground"
          overrides={{
            emailPlaceholder: ({ instance: inst }) => (
              <CtaEmailField instance={inst} isPreview={isPreview} className="h-10 px-3 sm:w-56" />
            ),
            submitLabel: ({ instance: inst }) => (
              <CtaLinkButton
                instance={inst}
                isPreview={isPreview}
                labelProp="submitLabel"
                hrefProp="submitHref"
                elementKey="submitCta"
                fallback="Get started free"
                className="h-10 bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90"
              />
            ),
            // Carried by the button above; edited in the inspector.
            submitHref: () => null,
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const ctaInlineSection = defineSection({
  id: "cta-inline",
  displayName: "Strip",
  description: "One-line strip — a prompt, an email field and a button between two hairlines.",
  category: "cta",
  layoutArchetype: "strip",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas", "startup", "generic", "agency", "ecommerce"],
  trustWeight: 15,
  conversionWeight: 85,
  funnelStage: "decision",
  styles: ["minimal", "modern", "corporate"],
  goals: ["leads", "conversion", "engagement"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 94,
  editable: true,
  tags: ["inline", "email-capture", "compact"],
  recommendedNeighbors: { before: ["features-grid", "content-text"], after: ["pricing-table", "testimonials-grid"] },
  defaultStyle: SECTION_PADDING_INLINE,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "sm" },
  schema: {
    slots: [{ id: "row", label: "Row", isDefault: true, eject: { direction: "row" } }],
    blocks: [
      { kind: "heading", level: 2, accent: false, fields: { headline: { key: "headline", maxLength: 50 } } },
      {
        kind: "note",
        id: "emailPlaceholder",
        label: "Email placeholder",
        field: { key: "emailPlaceholder", maxLength: 40 },
      },
      {
        kind: "note",
        id: "submitLabel",
        label: "Button label",
        field: { key: "submitLabel", canonical: "ctaPrimary", maxLength: 30, group: "cta" },
      },
      {
        kind: "note",
        id: "submitHref",
        label: "Button link",
        field: { key: "submitHref", type: "url", canonical: "ctaLink", group: "cta" },
      },
    ],
  },
  defaultProps: {
    headline: "Get product updates in your inbox",
    emailPlaceholder: "Enter your email",
    submitLabel: "Subscribe",
    submitHref: "#",
  },
  Component: CtaInline,
})
