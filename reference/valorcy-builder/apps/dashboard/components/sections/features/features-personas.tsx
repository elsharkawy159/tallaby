"use client"

import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  HINTS,
  ItemText,
  pillEyebrow,
  standardHeader,
  stretchItems,
} from "@/components/sections/features/features-parts"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Persona = {
  glyph?: string
  who?: string
  title?: string
  description?: string
  ctaText?: string
  ctaHref?: string
}

/**
 * Audience — linked-cards archetype.
 *
 * Centered header over a row of audience cards on a faded grid backdrop; each
 * card names who it is for, why, and closes with its own link. The backdrop and
 * card chrome are identity; the header lines and the persona collection are
 * slot entries.
 */
function FeaturesPersonas ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })
  const store = useBuilderStore.getState

  return (
    <section className="relative overflow-x-clip bg-muted/30" style={rootStyle}>

      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          entryClassName={stretchItems}
          align="center"
          headingClassName={`${TYPE_H2} text-foreground`}
          bodyClassName={`${TYPE_BODY} mt-4`}
          overrides={{ eyebrow: pillEyebrow(isPreview, "mb-5") }}
          renderItems={({ instance: inst }) => {
            const personas = (inst.props.personas as Persona[] | undefined) ?? []
            if (personas.length === 0) return null
            const text = (i: number, field: keyof Persona, value: unknown, as: "span" | "div" | "h4" | "p", className?: string) => (
              <ItemText as={as} instance={inst} collection="personas" index={i} field={field} value={value} isPreview={isPreview} className={className} />
            )
            return (
              <div className="mt-14 grid grid-cols-1 gap-4 text-start sm:grid-cols-2 lg:grid-cols-4">
                {personas.map((p, i) => (
                  <div
                    key={i}
                    className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/30"
                  >
                    <div className="mb-5 font-heading text-[28px] leading-none text-foreground">
                      {text(i, "glyph", p.glyph, "span")}
                    </div>
                    {text(i, "who", p.who, "div", "mb-1 text-xs font-semibold text-muted-foreground")}
                    {text(i, "title", p.title, "h4", "mb-2 text-[17px] font-semibold tracking-tight text-foreground")}
                    {text(i, "description", p.description, "p", "mb-5 flex-1 text-[13.5px] leading-relaxed text-muted-foreground")}
                    <a
                      href={isPreview ? p.ctaHref : undefined}
                      data-element-collection="personas"
                      data-element-index={String(i)}
                      data-element-item-href-prop="ctaHref"
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary transition-colors"
                    >
                      <InlineEditableText
                        as="span"
                        value={String(p.ctaText ?? "")}
                        isPreview={isPreview}
                        onChange={(t) => store().updateItem(inst.id, "personas", i, { ctaText: t })}
                        onCommit={(t) => store().updateItem(inst.id, "personas", i, { ctaText: t })}
                      />
                    </a>
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

export const featuresPersonasSection = defineSection({
  id: "features-personas",
  displayName: "Audience",
  description: "Audience cards — who it's for, why it fits, and a link for each — over a faded grid.",
  category: "features",
  layoutArchetype: "linked-cards",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "enterprise", "generic"],
  styles: ["modern", "bold", "editorial"],
  goals: ["sales", "education", "trust"],
  complexity: 'high',
  density: 'high',
  imageRequired: true,
  mobileScore: 80,
  editable: true,
  tags: ["features", "personas", "audience"],
  funnelStage: 'consideration',
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      ...standardHeader(),
      {
        kind: "items",
        key: "personas",
        canonical: "cards",
        label: "Persona cards",
        pick: [],
        itemFields: [
          { key: "glyph", label: "Emoji / glyph", type: "text" },
          { key: "who", label: "Who label", type: "text" },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: HINTS.itemTitle, maxLength: 60, group: "content" },
          { key: "description", label: "Description", type: "textarea", canonical: "body", aiHint: HINTS.description, maxLength: 280, group: "content" },
          { key: "ctaText", label: "CTA label", type: "text", canonical: "ctaPrimary", aiHint: "CTA button text (1–4 words)", maxLength: 30, group: "cta" },
          { key: "ctaHref", label: "CTA link", type: "url", group: "cta" },
        ],
        minItems: 1,
        maxItems: 6,
        newItem: () => ({
          glyph: "✨",
          who: "Audience",
          title: "Card title",
          description: "Describe this audience.",
          ctaText: "Learn more",
          ctaHref: "#",
        }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Built for",
    headline: "Whatever you're building, start here",
    description: "From solo founders launching a first page to agencies shipping dozens of client sites a month.",
    personas: [
      { glyph: "🚀", who: "Founders", title: "Launch before the money runs out", description: "Validate an idea with a polished page in an afternoon, not a sprint.", ctaText: "For startups", ctaHref: "#" },
      { glyph: "🎨", who: "Designers", title: "Pixel control without code", description: "Fine-tune spacing, type and motion with the precision you expect.", ctaText: "For designers", ctaHref: "#" },
      { glyph: "🏢", who: "Agencies", title: "Ship client sites at scale", description: "Reuse your best sections across projects and hand off with confidence.", ctaText: "For agencies", ctaHref: "#" },
      { glyph: "✍️", who: "Creators", title: "A home for your work", description: "Publish a portfolio, blog or shop that grows with your audience.", ctaText: "For creators", ctaHref: "#" },
    ],
  },
  Component: FeaturesPersonas,
})
