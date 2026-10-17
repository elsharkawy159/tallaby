"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { HINTS, ItemText, headingBlock, stretchItems } from "@/components/sections/features/features-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Item = { title?: string; body?: string }

/**
 * Register — list archetype.
 *
 * A plain title over stacked rows separated by hairlines: the quietest
 * features section, meant for long capability lists. The title is bound to the
 * stored `title` key; the rows are the `items` collection.
 */
function FeaturesList ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-start"
          entryClassName={stretchItems}
          align="left"
          headingClassName={`${TYPE_H2_SM} mb-8`}
          renderItems={({ instance: inst }) => {
            const items = (inst.props.items as Item[] | undefined) ?? []
            if (items.length === 0) return null
            return (
              <ul className="flex flex-col gap-6">
                {items.map((it, i) => (
                  <li key={i} className="flex flex-col gap-1 border-b border-border pb-6 last:border-0">
                    <ItemText
                      as="h3"
                      instance={inst}
                      collection="items"
                      index={i}
                      field="title"
                      value={it.title}
                      elementId={`featureTitle${i}`}
                      isPreview={isPreview}
                      className="text-lg font-medium"
                    />
                    <ItemText
                      as="p"
                      instance={inst}
                      collection="items"
                      index={i}
                      field="body"
                      value={it.body}
                      elementId={`featureBody${i}`}
                      isPreview={isPreview}
                      className="text-sm text-muted-foreground"
                    />
                  </li>
                ))}
              </ul>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const featuresListSection = defineSection({
  id: "features-list",
  displayName: "Register",
  description: "A plain title over stacked rows divided by hairlines — for long capability lists.",
  category: "features",
  layoutArchetype: "list",
  industries: ["saas", "startup", "agency", "enterprise", "generic"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["education", "trust", "brand"],
  complexity: 'low',
  density: 'medium',
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["features", "list"],
  funnelStage: 'consideration',
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      headingBlock({
        id: "title",
        headline: { key: "title", label: "Title", aiHint: HINTS.itemTitle, maxLength: 60 },
      }),
      {
        kind: "items",
        key: "items",
        canonical: "items",
        label: "Items",
        pick: [],
        itemFields: [
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: HINTS.itemTitle, maxLength: 60, group: "content" },
          { key: "body", label: "Body", type: "textarea", canonical: "body", aiHint: HINTS.itemBody, maxLength: 300, group: "content" },
        ],
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ title: "Feature", body: "Description" }),
      },
    ],
  },
  defaultProps: {
    title: "What's included",
    items: [
      { title: "Unlimited pages", body: "Publish as many pages as your business needs, on every plan." },
      { title: "Custom domains", body: "Connect your own domain with free, automatically renewed SSL." },
      { title: "Built-in analytics", body: "See visits, sources and conversions without installing anything." },
    ],
  },
  Component: FeaturesList,
})
