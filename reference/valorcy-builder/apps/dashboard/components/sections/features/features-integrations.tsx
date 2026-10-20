"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import {
  SECTION_THUMB_PLACEHOLDER,
  SectionEditableImage,
  useSectionSurface,
} from "@/components/sections/shared"
import {
  FlatLinkAction,
  ItemText,
  descriptionBlock,
  eyebrowBlock,
  flatActionBlocks,
  headingBlock,
  stretchItems,
} from "@/components/sections/features/features-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Integration = { name?: string; category?: string; logoUrl?: string }

/**
 * Ecosystem — directory archetype.
 *
 * Centered header, the categories present in the collection as a row of tags,
 * then a dense grid of logo tiles and a closing link. The tags derive from the
 * items; the header lines, the integrations collection and the link are slot
 * entries.
 */
function FeaturesIntegrations ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-5 text-center"
          entryClassName={stretchItems}
          align="center"
          overrides={{
            ctaLabel: ({ instance: inst }) => (
              <div className="mt-5">
                <FlatLinkAction
                  instance={inst}
                  isPreview={isPreview}
                  labelProp="ctaLabel"
                  hrefProp="ctaHref"
                  fallback="See all integrations"
                  suffix=" →"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                />
              </div>
            ),
            // Carried by the link above; edited in the inspector.
            ctaHref: () => null,
          }}
          renderItems={({ instance: inst }) => {
            const items = (inst.props.items as Integration[] | undefined) ?? []
            if (items.length === 0) return null
            const categories = [...new Set(items.map((it) => it.category))].filter(
              (c): c is string => typeof c === "string" && c !== ""
            )
            return (
              <div>
                {categories.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {items.map((it, i) => (
                    <div
                      key={i}
                      className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30"
                    >
                      {it.logoUrl ? (
                        <SectionEditableImage
                          instanceId={inst.id}
                          elementKey={`logo${i}`}
                          src={it.logoUrl}
                          alt={it.name ?? ""}
                          collectionKey="items"
                          collectionIndex={i}
                          itemSrcProp="logoUrl"
                          itemAltProp="name"
                          className="size-10 rounded-lg object-contain"
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground">
                          {String(it.name ?? "").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="items"
                        index={i}
                        field="name"
                        value={it.name}
                        elementId={`name${i}`}
                        isPreview={isPreview}
                        className="text-center text-xs font-medium text-foreground"
                      />
                    </div>
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

export const featuresIntegrationsSection = defineSection({
  id: "features-integrations",
  displayName: "Ecosystem",
  description: "Category tags over a dense grid of integration logo tiles, closed by a link to the full directory.",
  category: "features",
  layoutArchetype: "directory",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "ai_startup", "software", "tech", "startup", "enterprise"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["trust", "education", "conversion"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 60,
  trustWeight: 70,
  tags: ["integrations", "ecosystem", "logos", "tools", "saas"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1-2 words)" }),
      headingBlock({ headline: { aiHint: "Integrations headline (5-9 words)", maxLength: 70 } }),
      descriptionBlock({ aiHint: "1-2 sentences about integration breadth", maxLength: 160 }),
      {
        kind: "items",
        key: "items",
        canonical: "logos",
        label: "Integrations",
        pick: [],
        itemFields: [
          { key: "name", label: "Tool name", type: "text", canonical: "headline", aiHint: "Tool or service name", maxLength: 30 },
          { key: "category", label: "Category", type: "text", aiHint: "Category label (e.g. CRM, Analytics)", maxLength: 30 },
          { key: "logoUrl", label: "Logo URL", type: "image", canonical: "image" },
        ],
        minItems: 3,
        maxItems: 24,
        newItem: () => ({ name: "Tool", category: "Category", logoUrl: "" }),
      },
      ...flatActionBlocks({ labelKey: "ctaLabel", hrefKey: "ctaHref", labelAiHint: "Link text to full integrations page", maxLength: 40 }),
    ],
  },
  defaultProps: {
    eyebrow: "Integrations",
    headline: "Connects with your entire stack",
    description: "Plug into the tools your team already relies on — no custom code needed.",
    ctaLabel: "See all integrations",
    ctaHref: "#",
    items: [
      { name: "Slack", category: "Communication", logoUrl: "" },
      { name: "Notion", category: "Productivity", logoUrl: "" },
      { name: "GitHub", category: "Development", logoUrl: "" },
      { name: "Stripe", category: "Payments", logoUrl: "" },
      { name: "HubSpot", category: "CRM", logoUrl: "" },
      { name: "Salesforce", category: "CRM", logoUrl: "" },
      { name: "Zapier", category: "Automation", logoUrl: "" },
      { name: "Figma", category: "Design", logoUrl: "" },
      { name: "Google Drive", category: "Productivity", logoUrl: "" },
      { name: "Intercom", category: "Support", logoUrl: "" },
      { name: "Mixpanel", category: "Analytics", logoUrl: "" },
      { name: "Segment", category: "Analytics", logoUrl: "" },
    ],
  },
  Component: FeaturesIntegrations,
})
