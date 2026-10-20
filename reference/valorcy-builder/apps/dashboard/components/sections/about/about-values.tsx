"use client"

import { Heart, Compass, Shield, Zap, Globe, Layers, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, stretchItems } from "@/components/sections/about/about-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const ICONS: Record<string, LucideIcon> = { Heart, Compass, Shield, Zap, Globe, Layers }
const ICON_OPTIONS = Object.keys(ICONS).map((k) => ({ label: k, value: k }))

type ValueItem = { icon?: string; title?: string; body?: string }

/**
 * Compass — grid archetype.
 *
 * What the company stands for: a centred header over a three-column grid of
 * value cards, each an icon, a name and a sentence or two. The glow and the
 * cards are chrome; the header blocks and the values are slot entries.
 */
function AboutValues ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          align="center"
          headingClassName={`${TYPE_H2} text-foreground`}
          bodyClassName={`${TYPE_BODY} mt-5`}
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const values = (inst.props.values as ValueItem[] | undefined) ?? []
            if (values.length === 0) return null
            return (
              <div className="mt-14 grid grid-cols-1 gap-5 text-start sm:grid-cols-2 lg:grid-cols-3">
                {values.map((v, i) => {
                  const Icon = ICONS[v.icon ?? ""] ?? Heart
                  return (
                    <div
                      key={i}
                      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30"
                    >
                      <div className="inline-flex text-foreground">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <div>
                        <ItemText
                          as="h3"
                          instance={inst}
                          collection="values"
                          index={i}
                          field="title"
                          value={v.title}
                          isPreview={isPreview}
                          className="text-[17px] font-semibold tracking-tight text-foreground"
                        />
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="values"
                          index={i}
                          field="body"
                          value={v.body}
                          isPreview={isPreview}
                          className="mt-2 text-[14px] leading-relaxed text-muted-foreground"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const aboutValuesSection = defineSection({
  id: "about-values",
  displayName: "Compass",
  description: "What the company stands for — a centred header over a grid of icon-led value cards.",
  category: "about",
  layoutArchetype: "grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "nonprofit", "startup", "enterprise", "generic"],
  trustWeight: 50,
  conversionWeight: 20,
  funnelStage: "consideration",
  styles: ["modern", "minimal", "corporate"],
  goals: ["brand", "trust"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "md" },
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
        accent: true,
        fields: {
          headline: { key: "headline", aiHint: "Primary section headline (6–10 words, no period)", maxLength: 80 },
          accentWord: { key: "accentWord", aiHint: "Highlighted word or phrase in the headline (1–3 words)", maxLength: 30 },
        },
      },
      {
        kind: "body",
        field: { key: "description", aiHint: "Short descriptive paragraph (1–3 sentences, 20–60 words)", maxLength: 280 },
      },
      {
        kind: "items",
        key: "values",
        canonical: "items",
        label: "Values",
        pick: [],
        itemFields: [
          { key: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Section title (4–8 words)", maxLength: 60, group: "content" },
          { key: "body", label: "Description", type: "textarea", canonical: "body", aiHint: "Body copy (1–3 sentences)", maxLength: 300, group: "content" },
        ],
        minItems: 1,
        maxItems: 9,
        newItem: () => ({ icon: "Heart", title: "Value name", body: "Describe this value in 1–2 sentences." }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Our values",
    headline: "The principles that guide",
    accentWord: "every decision.",
    description: "They shape who we hire, how we work with clients, and what we are willing to say no to.",
    values: [
      { icon: "Heart", title: "Care first", body: "We treat every project as if our own name were on the front door." },
      { icon: "Compass", title: "Clear direction", body: "We set goals together and say plainly when a plan needs to change." },
      { icon: "Shield", title: "Earn trust", body: "We keep our promises, protect your data and own our mistakes." },
      { icon: "Zap", title: "Move with intent", body: "We ship in small steps so progress is visible every single week." },
      { icon: "Globe", title: "Think wider", body: "We design for every user, every market and every device." },
      { icon: "Layers", title: "Build to last", body: "We choose durable foundations over quick fixes that age badly." },
    ],
  },
  Component: AboutValues,
})
