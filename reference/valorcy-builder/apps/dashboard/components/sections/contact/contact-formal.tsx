"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { noteBlock, textOverride } from "@/components/sections/contact/contact-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** What pages saved before the slot migration rendered while a prop was unset. */
const ORG_FALLBACK = "Ipsum Corp"
const ADDR_FALLBACK = "123 Lorem Street, Ipsum City"

/**
 * Letterhead — minimal archetype.
 *
 * The organisation's name over its postal address, set like the head of a
 * letter. Nothing else: it is the quiet sign-off for legal, financial and
 * institutional pages.
 */
function ContactFormal ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col"
          overrides={{
            org: textOverride("org", ORG_FALLBACK, "text-lg font-semibold", isPreview, "h2"),
            addr: textOverride("addr", ADDR_FALLBACK, "mt-2 text-sm text-muted-foreground", isPreview),
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const contactFormalSection = defineSection({
  id: "contact-formal",
  displayName: "Letterhead",
  description: "Organisation name over its postal address — a quiet, formal sign-off.",
  category: "contact",
  layoutArchetype: "minimal",
  industries: ["enterprise", "law", "finance", "real_estate", "medical", "generic"],
  styles: ["corporate", "minimal", "modern"],
  goals: ["leads", "bookings", "support"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  tags: ["contact", "formal", "form"],
  conversionWeight: 75,
  funnelStage: "decision",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Letterhead", isDefault: true }],
    blocks: [
      {
        kind: "heading",
        id: "org",
        label: "Organization",
        level: 2,
        accent: false,
        fields: {
          headline: {
            key: "org",
            label: "Organization",
            type: "text",
            canonical: "brandName",
            aiHint: "Registered name of the organisation",
            maxLength: 80,
          },
        },
      },
      noteBlock("addr", "Address", { type: "textarea", aiHint: "Full postal address", maxLength: 200 }),
    ],
  },
  defaultProps: {
    org: "Harrow & Vale Partners LLP",
    addr: "48 Fleet Street, London EC4Y 1BT, United Kingdom",
  },
  Component: ContactFormal,
})
