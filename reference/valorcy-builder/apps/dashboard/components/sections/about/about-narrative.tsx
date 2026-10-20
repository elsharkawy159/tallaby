"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, propTextOverride, stretchItems, textItemsBlock } from "@/components/sections/about/about-parts"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Paragraph = { text?: string }

/**
 * The pull-quote's accent rule belongs to the quote and its attribution, not to
 * a wrapper around them: each carries the rule itself, so the two can be
 * reordered or hidden independently and the rule follows them.
 */
const QUOTE_RULE = "border-s-[3px] border-primary ps-6"

function narrativeEntryClass (entry: SlotEntry): string | undefined {
  if (entry.kind === "block" && entry.block.id === "pullQuote") return QUOTE_RULE
  if (entry.kind === "block" && entry.block.id === "attribution") return `${QUOTE_RULE} pt-4`
  return stretchItems(entry)
}

/**
 * Essay — editorial archetype.
 *
 * Long-form, magazine-style: a pull-quote on an accent rule, a hairline, then
 * the story in a comfortable reading column. One slot — the eyebrow, the quote,
 * its attribution and the paragraphs reorder as one column.
 */
function AboutNarrative ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col"
          align="left"
          entryClassName={narrativeEntryClass}
          overrides={{
            eyebrow: propTextOverride(
              "eyebrow",
              "mb-10 text-[12px] font-semibold text-primary",
              { as: "div", isPreview }
            ),
            pullQuote: propTextOverride(
              "pullQuote",
              "text-[clamp(1.35rem,2vw+0.75rem,1.75rem)] font-semibold italic leading-[1.4] text-foreground text-pretty",
              { as: "p", isPreview }
            ),
            attribution: propTextOverride(
              "attribution",
              "text-sm text-muted-foreground not-italic font-medium",
              { as: "footer", isPreview }
            ),
          }}
          renderItems={({ instance: inst }) => {
            const paragraphs = (inst.props.paragraphs as Paragraph[] | undefined) ?? []
            return (
              <div className="mt-12">
                <hr className="mb-12 border-border" />
                <div className="space-y-7">
                  {paragraphs.map((p, i) => (
                    <ItemText
                      key={i}
                      as="p"
                      instance={inst}
                      collection="paragraphs"
                      index={i}
                      field="text"
                      value={p.text}
                      isPreview={isPreview}
                      className="text-[17px] leading-[1.75] text-muted-foreground text-pretty"
                    />
                  ))}
                </div>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const aboutNarrativeSection = defineSection({
  id: "about-narrative",
  displayName: "Essay",
  description: "Long-form story — a pull-quote on an accent rule, then the narrative in a reading column.",
  category: "about",
  layoutArchetype: "editorial",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["photography", "podcast", "saas", "startup", "agency", "portfolio", "creative", "nonprofit", "generic", "restaurant", "law", "dentist", "real_estate"],
  trustWeight: 50,
  conversionWeight: 20,
  funnelStage: "consideration",
  styles: ["editorial", "minimal", "modern"],
  goals: ["brand", "trust"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return aboutNarrativeSection.defaultProps
    return oldProps
  },
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "eyebrow",
        field: { key: "eyebrow", aiHint: "Short label above the headline (1–3 words, sentence case)", maxLength: 30 },
      },
      {
        kind: "note",
        id: "pullQuote",
        label: "Pull-quote",
        field: { key: "pullQuote", label: "Pull-quote", type: "textarea", maxLength: 240 },
      },
      {
        kind: "note",
        id: "attribution",
        label: "Attribution",
        field: {
          key: "attribution",
          label: "Attribution",
          canonical: "body",
          aiHint: "Attribution line — name or source",
          maxLength: 60,
          group: "content",
        },
      },
      textItemsBlock({
        key: "paragraphs",
        label: "Body paragraphs",
        itemLabel: "Paragraph text",
        type: "textarea",
        minItems: 1,
        maxItems: 8,
        newText: "Add a paragraph about your company story.",
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Our story",
    pullQuote: "We started with a simple belief: good work should feel effortless for the people it is made for.",
    attribution: "— Maya Collins, Co-founder",
    paragraphs: [
      {
        text: "In 2016 we were two designers working out of a borrowed studio, taking on the projects nobody else wanted. Those early clients taught us that the hardest problems are usually the most rewarding ones.",
      },
      {
        text: "Today we are a team of specialists across strategy, design and engineering. We still work the same way: small teams, close collaboration and an honest view of what will actually move the needle.",
      },
      {
        text: "We measure our success by the long relationships we build. Many of the companies we worked with in our first year are still with us — and that is the part of the story we are proudest of.",
      },
    ],
  },
  Component: AboutNarrative,
})
