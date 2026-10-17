"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H1 } from "@/components/sections/_primitives/type-scale"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type FactItem = { label?: string; value?: string }

/**
 * Atlas — full-bleed archetype.
 *
 * Edge-to-edge photograph with the copy anchored to the bottom-start corner and a
 * fact strip riding the baseline. Deliberately *not* centered — that is Spotlight's
 * job. Replaces `hero-real-estate` and `hero-travel`, which were the same
 * full-bleed-photo-with-centered-text layout tuned for two industries.
 *
 * Copy sits on a dark photograph, so every text block is tinted white rather than
 * using the shared foreground tokens — which is why this section overrides the
 * eyebrow and the fact strip instead of taking the default renderers.
 */
function HeroAtlas ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({
    instanceId: instance.id,
    rootOptions: { applySectionPadding: false, defaultBackground: false },
  })
  const store = useBuilderStore.getState

  return (
    <section className="relative isolate flex min-h-[clamp(30rem,80svh,48rem)] flex-col justify-end overflow-hidden" style={rootStyle}>
      <SectionSlot
        instance={instance}
        definition={definition}
        isPreview={isPreview}
        slotId="background"
        overrides={{
          imageUrl: ({ block, instance: inst }) => (
            <SectionMedia
              instanceId={inst.id}
              elementKey={block.id}
              src={inst.props.imageUrl as string | undefined}
              alt={String(inst.props.imageAlt ?? "")}
              ratio="auto"
              placeholder="landscape"
              rounded="none"
              priority
              isPreview={isPreview}
              sizes="100vw"
              className="absolute inset-0 -z-20 h-full w-full"
              imgClassName="h-full w-full object-cover"
            />
          ),
        }}
      />
      {/* Directional scrim — heavier at the start/bottom where the copy sits. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/10"
      />

      <SectionContainer className="relative z-10 flex flex-col gap-8 pb-14 pt-28 text-white sm:pb-20">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex max-w-2xl flex-col gap-5"
          headingLevel={1}
          align="left"
          headingClassName={TYPE_H1}
          ctaClassName="mt-2"
          bodyClassName="max-w-xl text-lg leading-[1.6] text-white/85"
          overrides={{
            eyebrow: ({ instance: inst }) => {
              const eyebrow = inst.props.eyebrow as string | undefined
              if (!eyebrow) return null
              return (
                <InlineEditableText
                  as="span"
                  data-element-id={`${inst.id}::eyebrow`}
                  data-element-type="text"
                  className="text-sm font-medium text-white/80"
                  value={eyebrow}
                  isPreview={isPreview}
                  onChange={(t) => store().updateSectionProps(inst.id, { eyebrow: t })}
                  onCommit={(t) => store().updateSectionProps(inst.id, { eyebrow: t })}
                />
              )
            },
          }}
        />

        {/* Fact strip on the baseline — the element that makes Atlas structurally
            distinct from every other photo hero. */}
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="facts"
          renderItems={({ instance: inst }) => {
            const facts = (inst.props.facts as FactItem[]) ?? []
            if (facts.length === 0) return null
            return (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/20 pt-6 sm:grid-cols-4">
                {facts.map((fact, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <dt className="font-heading text-2xl font-semibold leading-tight">
                      <InlineEditableText
                        as="span"
                        data-element-id={`${inst.id}::facts.${i}.value`}
                        data-element-type="text"
                        value={String(fact.value ?? "")}
                        isPreview={isPreview}
                        onChange={(t) => store().updateItem(inst.id, "facts", i, { value: t })}
                        onCommit={(t) => store().updateItem(inst.id, "facts", i, { value: t })}
                      />
                    </dt>
                    <dd className="text-sm text-white/70">
                      <InlineEditableText
                        as="span"
                        data-element-id={`${inst.id}::facts.${i}.label`}
                        data-element-type="text"
                        value={String(fact.label ?? "")}
                        isPreview={isPreview}
                        onChange={(t) => store().updateItem(inst.id, "facts", i, { label: t })}
                        onCommit={(t) => store().updateItem(inst.id, "facts", i, { label: t })}
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

export const heroAtlasSection = defineSection({
  id: "hero-atlas",
  displayName: "Atlas",
  description: "Full-bleed photograph with bottom-anchored copy and a fact strip.",
  category: "hero",
  layoutArchetype: "full-bleed",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 4,
  rootStyleOptions: { applySectionPadding: false, defaultBackground: false },
  industries: ["real_estate", "travel", "hotel", "tour_package", "property_broker", "architecture", "event"],
  styles: ["editorial", "bold", "dark"],
  goals: ["bookings", "leads", "brand", "awareness"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 93,
  editable: true,
  trustWeight: 35,
  conversionWeight: 40,
  funnelStage: "awareness",
  tags: ["full-bleed", "photo", "immersive"],
  defaultOptions: { align: "start", paddingY: "none" },
  schema: {
    slots: [
      {
        id: "background",
        label: "Background image",
        accepts: ["media"],
        max: 1,
        acceptsElements: false,
        eject: { overlay: true },
      },
      { id: "copy", label: "Copy", isDefault: true },
      { id: "facts", label: "Fact strip", accepts: ["items"], acceptsElements: false },
    ],
    blocks: [
      { kind: "eyebrow" },
      { kind: "heading", level: 1, accent: false },
      { kind: "body" },
      { kind: "ctaRow", minItems: 1, maxItems: 2 },
      { kind: "media", slot: "background", ratio: "wide", placeholder: "landscape" },
      {
        kind: "items",
        slot: "facts",
        key: "facts",
        canonical: "stats",
        label: "Fact strip",
        pick: ["value", "label"],
        minItems: 2,
        maxItems: 4,
      },
    ],
  },
  defaultProps: {
    eyebrow: "Featured destination",
    headline: "Find the place you have been picturing",
    description:
      "Handpicked stays and properties, verified by our team and ready when you are.",
    buttons: [
      { label: "Start your search", href: "#", variant: "primary" },
      { label: "Talk to an expert", href: "#", variant: "ghost" },
    ],
    imageAlt: "Destination photograph",
    facts: [
      { value: "1,200+", label: "Listings" },
      { value: "48 hrs", label: "Avg. response" },
      { value: "4.9/5", label: "Guest rating" },
      { value: "12", label: "Regions" },
    ],
  },
  Component: HeroAtlas,
})
