"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_XL } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { DotBadge, propTextOverride } from "@/components/sections/about/about-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Founder = { initials?: string; hue?: number }

/**
 * Origin — statement archetype.
 *
 * The opening line of an about page set large over layered light (mesh, a
 * masked grid and a brand glow), then a chip that puts faces to the company:
 * founder monograms beside a byline. Two slots — the copy column, and the chip,
 * whose pill surface is chrome while the monograms and byline are entries.
 */
function AboutHero ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative overflow-x-clip bg-background" style={rootStyle}>
      <div aria-hidden className="absolute inset-0 -z-10 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_70%_at_50%_20%,black_20%,transparent_80%)] pointer-events-none" />

      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-start"
          align="left"
          headingLevel={1}
          headingClassName={`${TYPE_H2} text-foreground`}
          bodyClassName={`${TYPE_LEAD} mt-6 max-w-[580px]`}
          overrides={{
            badgeText: ({ instance: inst }) => (
              <DotBadge instance={inst} isPreview={isPreview} className="mb-7" />
            ),
          }}
        />

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="strip"
          className="mt-10 inline-flex items-center gap-3 rounded-full border border-border bg-card/80 px-4 py-2"
          overrides={{
            byline: propTextOverride("byline", "text-[13px] text-muted-foreground font-medium", {
              as: "span",
              isPreview,
            }),
          }}
          renderItems={({ instance: inst }) => {
            const founders = (inst.props.founders as Founder[] | undefined) ?? []
            if (founders.length === 0) return null
            return (
              <div className="flex -space-x-2">
                {founders.map((f, i) => (
                  <div
                    key={i}
                    className="size-7 rounded-full border-2 border-card grid place-items-center text-xs font-semibold text-primary-foreground"
                    style={{ background: `linear-gradient(135deg, oklch(0.7 0.16 ${f.hue ?? 277}), oklch(0.5 0.22 ${f.hue ?? 277}))` }}
                  >
                    {f.initials}
                  </div>
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const aboutHeroSection = defineSection({
  id: "about-hero",
  displayName: "Origin",
  description: "Oversized opening line over layered light, with a founder chip that puts faces to the company.",
  category: "about",
  layoutArchetype: "statement",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "portfolio", "creative", "nonprofit", "generic"],
  trustWeight: 50,
  conversionWeight: 20,
  funnelStage: "consideration",
  styles: ["modern", "minimal", "editorial"],
  goals: ["brand", "trust"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_XL,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "xl" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "strip", label: "Founder chip", eject: { direction: "row" } },
    ],
    blocks: [
      {
        kind: "badge",
        id: "badgeText",
        field: { key: "badgeText", label: "Badge" },
      },
      {
        kind: "heading",
        id: "headlinePrefix",
        level: 1,
        accent: true,
        fields: {
          headline: { key: "headlinePrefix", label: "Headline prefix" },
          accentWord: { key: "accentPhrase", label: "Accent phrase" },
        },
      },
      {
        kind: "body",
        field: { key: "description", aiHint: "Short descriptive paragraph (1–3 sentences, 20–60 words)", maxLength: 280 },
      },
      {
        kind: "items",
        slot: "strip",
        key: "founders",
        canonical: "members",
        label: "Founder avatars",
        pick: [],
        itemFields: [
          { key: "initials", label: "Initials", type: "text" },
          { key: "hue", label: "Hue (0–360)", type: "number", min: 0, max: 360 },
        ],
        minItems: 0,
        maxItems: 5,
        newItem: () => ({ initials: "AB", hue: 277 }),
      },
      {
        kind: "note",
        id: "byline",
        slot: "strip",
        label: "Byline",
        field: { key: "byline", label: "Byline text" },
      },
    ],
  },
  defaultProps: {
    badgeText: "About us",
    headlinePrefix: "We build the tools we always wanted.",
    accentPhrase: "Together.",
    description: "A small, senior team helping ambitious companies design, build and launch products their customers love.",
    byline: "Founded by Maya Collins & Daniel Reyes",
    founders: [
      { initials: "MC", hue: 277 },
      { initials: "DR", hue: 195 },
    ],
  },
  Component: AboutHero,
})
