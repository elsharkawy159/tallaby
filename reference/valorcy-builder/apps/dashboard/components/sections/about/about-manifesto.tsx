"use client"

import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_XL } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, stretchItems } from "@/components/sections/about/about-parts"
import { useBuilderStore } from "@/lib/builder/store"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Principle = { number?: string; title?: string; body?: string }

/**
 * The headline is a two-tone sentence: the statement in foreground, then a
 * quieter continuation (`headlineMuted`). It compiles as a heading with a
 * suffix field bound to that key; the override draws the muted tone, which the
 * shared headline has no slot for.
 */
function twoToneHeadline (isPreview?: boolean): BlockOverride {
  return function TwoToneHeadline ({ instance }) {
    const p = instance.props
    const headline = typeof p.headline === "string" ? p.headline : ""
    const muted = typeof p.headlineMuted === "string" ? p.headlineMuted : ""
    const write = (key: string) => (t: string) =>
      useBuilderStore.getState().updateSectionProps(instance.id, { [key]: t })
    return (
      <h2 className="text-[clamp(2rem,3vw+1rem,3.5rem)] font-semibold tracking-[-0.035em] leading-[1.02] text-foreground text-balance">
        <InlineEditableText
          as="span"
          data-element-id={`${instance.id}::headline`}
          data-element-type="text"
          value={headline}
          isPreview={isPreview}
          onChange={write("headline")}
          onCommit={write("headline")}
        />
        {muted ? (
          <>
            {" "}
            <InlineEditableText
              as="span"
              data-element-id={`${instance.id}::headlineMuted`}
              data-element-type="text"
              className="text-muted-foreground"
              value={muted}
              isPreview={isPreview}
              onChange={write("headlineMuted")}
              onCommit={write("headlineMuted")}
            />
          </>
        ) : null}
      </h2>
    )
  }
}

/**
 * Manifesto — list archetype.
 *
 * Principles read as a numbered manifesto: each row an oversized gradient
 * numeral beside a statement and its explanation, rows separated by hairlines.
 * The rules and numerals are chrome; the header blocks and the principles are
 * slot entries.
 */
function AboutManifesto ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-start"
          align="left"
          entryClassName={stretchItems}
          overrides={{ headline: twoToneHeadline(isPreview) }}
          renderItems={({ instance: inst }) => {
            const principles = (inst.props.principles as Principle[] | undefined) ?? []
            if (principles.length === 0) return null
            return (
              <div className="mt-20 border-t border-border">
                {principles.map((p, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] gap-8 md:gap-12 py-12 md:py-14 border-b border-border items-start"
                  >
                    <div
                      className="text-[68px] md:text-[80px] font-semibold leading-[0.85] tabular-nums select-none"
                      aria-hidden
                    >
                      {p.number}
                    </div>
                    <div>
                      <ItemText
                        as="h3"
                        instance={inst}
                        collection="principles"
                        index={i}
                        field="title"
                        value={p.title}
                        isPreview={isPreview}
                        className="text-2xl md:text-[2.25rem] font-semibold tracking-[-0.025em] leading-[1.1] text-foreground max-w-2xl text-balance mb-5"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="principles"
                        index={i}
                        field="body"
                        value={p.body}
                        isPreview={isPreview}
                        className="text-[17px] leading-[1.65] text-muted-foreground max-w-2xl text-pretty"
                      />
                    </div>
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

export const aboutManifestoSection = defineSection({
  id: "about-manifesto",
  displayName: "Manifesto",
  description: "Numbered principles — an oversized gradient numeral beside each statement and its why.",
  category: "about",
  layoutArchetype: "list",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "creative", "nonprofit", "generic"],
  trustWeight: 50,
  conversionWeight: 20,
  funnelStage: "consideration",
  styles: ["editorial", "minimal", "modern"],
  goals: ["brand", "trust"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_XL,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "xl" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "eyebrow",
        field: { key: "eyebrow", aiHint: "Short label above the headline (1–3 words, sentence case)", maxLength: 30 },
      },
      {
        kind: "heading",
        level: 2,
        accent: false,
        suffix: true,
        fields: {
          headline: { key: "headline", aiHint: "Primary section headline (6–10 words, no period)", maxLength: 80 },
          headlineSuffix: { key: "headlineMuted", label: "Headline (muted part)" },
        },
      },
      {
        kind: "items",
        key: "principles",
        canonical: "steps",
        label: "Principles",
        pick: [],
        itemFields: [
          { key: "number", label: "Number (e.g. 01)", type: "text" },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Section title (4–8 words)", maxLength: 60, group: "content" },
          { key: "body", label: "Body", type: "textarea", canonical: "body", aiHint: "Body copy (1–3 sentences)", maxLength: 300, group: "content" },
        ],
        minItems: 1,
        maxItems: 10,
        newItem: () => ({ number: "01", title: "Principle title.", body: "Explain this principle." }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "What we believe",
    headline: "Five principles.",
    headlineMuted: "Every project, every client, every day.",
    principles: [
      { number: "01", title: "Clarity beats cleverness.", body: "We say what we mean, design what people need and cut whatever gets in the way of understanding." },
      { number: "02", title: "Small teams, real ownership.", body: "Every project is led by the people doing the work, so decisions are fast and nothing gets lost in hand-offs." },
      { number: "03", title: "Measure what matters.", body: "We agree on the outcomes up front and report on them honestly, including the ones we miss." },
      { number: "04", title: "Craft is a habit.", body: "Quality is not a final polish. It is the small, careful choices we make every single day." },
      { number: "05", title: "Leave it better.", body: "For our clients, our community and each other — we aim to leave every place better than we found it." },
    ],
  },
  Component: AboutManifesto,
})
