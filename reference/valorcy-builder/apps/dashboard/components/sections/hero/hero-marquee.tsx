"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SECTION_PADDING_XL } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_DISPLAY, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type DetailItem = { label?: string; value?: string }

/**
 * Marquee — banner archetype.
 *
 * Built like a bill poster: headline across the top, then a hard-ruled detail band
 * (date / venue / time) spanning the full width, with the CTA sitting inside the
 * band rather than under the copy. The band is the section's identity — no other
 * hero puts its metadata on the same baseline as its action. Replaces `hero-event`.
 *
 * The CTA row therefore declares `slot: "band"`: schema order is not render order
 * here, and a block without an explicit slot would fall into the copy column.
 */
function HeroMarquee ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const store = useBuilderStore.getState

  return (
    <section className="relative overflow-hidden" style={rootStyle}>
      <SectionContainer className="flex flex-col gap-10">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-start gap-5"
          headingLevel={1}
          align="left"
          headingClassName={`${TYPE_DISPLAY} max-w-5xl text-foreground`}
          bodyClassName={`${TYPE_LEAD} max-w-2xl`}
          badgeVariant="outline"
        />

        {/* Detail band — metadata and the CTA share one baseline. */}
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="band"
          className="flex flex-col gap-6 border-y border-foreground py-7 lg:flex-row lg:items-center lg:justify-between"
          align="left"
          ctaClassName="shrink-0"
          renderItems={({ instance: inst }) => {
            const details = (inst.props.details as DetailItem[]) ?? []
            if (details.length === 0) return null
            return (
              <dl className="grid grid-cols-2 gap-x-10 gap-y-5 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-center">
                {details.map((d, i) => (
                  <div key={i} className="flex flex-col gap-0.5 lg:pe-10">
                    <dt className="text-sm text-muted-foreground">
                      <InlineEditableText
                        as="span"
                        data-element-id={`${inst.id}::details.${i}.label`}
                        data-element-type="text"
                        value={String(d.label ?? "")}
                        isPreview={isPreview}
                        onChange={(t) => store().updateItem(inst.id, "details", i, { label: t })}
                        onCommit={(t) => store().updateItem(inst.id, "details", i, { label: t })}
                      />
                    </dt>
                    <dd className="font-heading text-lg font-semibold text-foreground">
                      <InlineEditableText
                        as="span"
                        data-element-id={`${inst.id}::details.${i}.value`}
                        data-element-type="text"
                        value={String(d.value ?? "")}
                        isPreview={isPreview}
                        onChange={(t) => store().updateItem(inst.id, "details", i, { value: t })}
                        onCommit={(t) => store().updateItem(inst.id, "details", i, { value: t })}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const heroMarqueeSection = defineSection({
  id: "hero-marquee",
  displayName: "Marquee",
  description: "Bill-poster hero — headline over a ruled detail band with the CTA inline.",
  category: "hero",
  layoutArchetype: "banner",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 4,
  defaultStyle: SECTION_PADDING_XL,
  industries: ["event", "wedding_planner", "education", "nonprofit", "online_course", "creative", "generic"],
  styles: ["bold", "editorial", "modern"],
  goals: ["bookings", "conversion", "engagement", "awareness"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 96,
  editable: true,
  trustWeight: 25,
  conversionWeight: 50,
  funnelStage: "decision",
  tags: ["event", "banner", "metadata"],
  defaultOptions: { align: "start", paddingY: "xl" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "band", label: "Detail band", eject: { direction: "row" } },
    ],
    blocks: [
      { kind: "badge" },
      { kind: "heading", level: 1, accent: false },
      { kind: "body" },
      // Declared before the CTA row because a slot renders its blocks in schema
      // order, and in the band the metadata sits ahead of the action.
      {
        kind: "items",
        slot: "band",
        key: "details",
        canonical: "stats",
        label: "Detail band",
        pick: ["label", "value"],
        minItems: 2,
        maxItems: 4,
      },
      { kind: "ctaRow", slot: "band", minItems: 1, maxItems: 2 },
    ],
  },
  defaultProps: {
    badge: "Early bird open",
    headline: "Two days. One room. Everyone building the same thing.",
    description:
      "Talks, workshops and hallway conversations with the people shaping the craft.",
    buttons: [{ label: "Get tickets", href: "#", variant: "primary" }],
    details: [
      { label: "Date", value: "14–15 March" },
      { label: "Venue", value: "The Foundry, Berlin" },
      { label: "Doors", value: "09:00 CET" },
    ],
  },
  Component: HeroMarquee,
})
