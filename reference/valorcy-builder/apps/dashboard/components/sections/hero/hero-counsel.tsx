"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { SECTION_PADDING_XL } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H1, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type CredentialItem = { value?: string; label?: string }

/**
 * Counsel — asymmetric archetype.
 *
 * A tall portrait column set against a narrower copy column, with a credential
 * card overlapping the seam between them. The overlap is what distinguishes it
 * from Momentum's clean split — trust-oriented pages want the proof physically
 * bridging the person and the promise. Replaces `hero-lawyer` and `hero-personal`.
 */
function HeroCounsel ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const store = useBuilderStore.getState

  return (
    <section className="relative overflow-hidden" style={rootStyle}>
      <SectionContainer className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-20">
        {/* Portrait column, with the credential card breaking out of its end edge. */}
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="media"
          className="relative"
          overrides={{
            imageUrl: ({ block, instance: inst }) => (
              <SectionMedia
                instanceId={inst.id}
                elementKey={block.id}
                src={inst.props.imageUrl as string | undefined}
                alt={String(inst.props.imageAlt ?? "")}
                ratio="portrait"
                placeholder="portrait"
                rounded="xl"
                priority
                isPreview={isPreview}
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            ),
          }}
          renderItems={({ instance: inst }) => {
            const credentials = (inst.props.credentials as CredentialItem[]) ?? []
            if (credentials.length === 0) return null
            return (
              <dl className="absolute -bottom-6 end-4 flex gap-8 rounded-xl border border-border bg-background px-6 py-4 lg:-end-10">
                {credentials.map((c, i) => (
                  <div key={i} className="flex flex-col">
                    <dt className="font-heading text-xl font-semibold leading-tight text-foreground">
                      <InlineEditableText
                        as="span"
                        data-element-id={`${inst.id}::credentials.${i}.value`}
                        data-element-type="text"
                        value={String(c.value ?? "")}
                        isPreview={isPreview}
                        onChange={(t) => store().updateItem(inst.id, "credentials", i, { value: t })}
                        onCommit={(t) => store().updateItem(inst.id, "credentials", i, { value: t })}
                      />
                    </dt>
                    <dd className="whitespace-nowrap text-sm text-muted-foreground">
                      <InlineEditableText
                        as="span"
                        data-element-id={`${inst.id}::credentials.${i}.label`}
                        data-element-type="text"
                        value={String(c.label ?? "")}
                        isPreview={isPreview}
                        onChange={(t) => store().updateItem(inst.id, "credentials", i, { label: t })}
                        onCommit={(t) => store().updateItem(inst.id, "credentials", i, { label: t })}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
            )
          }}
        />

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col gap-6 pt-8 lg:pt-0"
          headingLevel={1}
          align="left"
          headingClassName={`${TYPE_H1} text-foreground`}
          bodyClassName={`${TYPE_LEAD} max-w-xl`}
          ctaClassName="mt-2"
          overrides={{
            eyebrow: ({ instance: inst }) => {
              const eyebrow = inst.props.eyebrow as string | undefined
              if (!eyebrow) return null
              return (
                <InlineEditableText
                  as="span"
                  data-element-id={`${inst.id}::eyebrow`}
                  data-element-type="text"
                  className="text-sm font-medium text-muted-foreground"
                  value={eyebrow}
                  isPreview={isPreview}
                  onChange={(t) => store().updateSectionProps(inst.id, { eyebrow: t })}
                  onCommit={(t) => store().updateSectionProps(inst.id, { eyebrow: t })}
                />
              )
            },
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const heroCounselSection = defineSection({
  id: "hero-counsel",
  displayName: "Counsel",
  description: "Portrait-led authority hero with a credential card breaking the seam.",
  category: "hero",
  layoutArchetype: "asymmetric",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 4,
  defaultStyle: SECTION_PADDING_XL,
  industries: ["law", "finance", "medical", "dentist", "therapy", "portfolio", "creative", "photography"],
  styles: ["corporate", "editorial", "modern"],
  goals: ["trust", "leads", "bookings"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 94,
  editable: true,
  trustWeight: 65,
  conversionWeight: 35,
  funnelStage: "consideration",
  tags: ["portrait", "authority", "personal"],
  defaultOptions: { align: "start", paddingY: "xl" },
  schema: {
    slots: [
      // The portrait and the credential card are one composed unit — the card is
      // absolutely positioned against the portrait's box — so they share a slot
      // and it takes no free elements.
      { id: "media", label: "Portrait", accepts: ["media", "items"], acceptsElements: false },
      { id: "copy", label: "Copy", isDefault: true },
    ],
    blocks: [
      { kind: "eyebrow" },
      { kind: "heading", level: 1, accent: false },
      { kind: "body" },
      { kind: "ctaRow", minItems: 1, maxItems: 2 },
      { kind: "media", slot: "media", ratio: "portrait", placeholder: "portrait" },
      {
        kind: "items",
        slot: "media",
        key: "credentials",
        canonical: "stats",
        label: "Credentials",
        pick: ["value", "label"],
        minItems: 1,
        maxItems: 3,
      },
    ],
  },
  defaultProps: {
    eyebrow: "Practising since 2009",
    headline: "Straight answers when the stakes are high",
    description:
      "Direct access to a senior advisor from the first call — no handoffs, no call centre, no billing surprises.",
    buttons: [
      { label: "Book a consultation", href: "#", variant: "primary" },
      { label: "Call the office", href: "#", variant: "outline" },
    ],
    imageAlt: "Portrait",
    credentials: [
      { value: "15+", label: "Years" },
      { value: "400+", label: "Cases" },
    ],
  },
  Component: HeroCounsel,
})
