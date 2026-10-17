"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  groupByCategory,
  headingBlock,
  itemField,
  itemsOf,
  menuItemsBlock,
  noteBlock,
  stretchItems,
  textOverride,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type MenuItem = { name?: string; description?: string; price?: string; category?: string }

/**
 * Noir — minimal archetype.
 *
 * Fine-dining restraint: a narrow column on a near-black surface (dark in
 * either site theme), light wide-tracked type, accent-coloured course labels
 * and nothing else.
 */
function MenuMinimalDark ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false, defaultColor: "var(--background)" } })

  return (
    <section className="bg-foreground text-background" style={rootStyle}>
      <SectionContainer className="max-w-xl">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          entryClassName={stretchItems}
          align="center"
          headingClassName={`${TYPE_H2} text-background`}
          overrides={{
            tagline: textOverride("tagline", "mt-2 text-xs text-background/40", isPreview),
          }}
          renderItems={({ instance: inst }) => {
            const items = itemsOf<MenuItem>(inst, "items")
            if (items.length === 0) return null
            return (
              <div className="mt-12 space-y-10 text-start">
                {groupByCategory(items, "Menu").map(([cat, dishes]) => (
                  <div key={cat}>
                    <p className="mb-5 text-center text-xs font-semibold text-accent">{cat}</p>
                    <div className="space-y-5">
                      {dishes.map(({ item: dish, index: gi }) => (
                        <div key={gi} className="flex items-start gap-3">
                          <div className="flex-1 border-b border-background/10 pb-5">
                            <ItemText
                              as="p"
                              instance={inst}
                              collection="items"
                              index={gi}
                              field="name"
                              value={dish.name}
                              isPreview={isPreview}
                              className="font-light text-background"
                            />
                            <ItemText
                              as="p"
                              instance={inst}
                              collection="items"
                              index={gi}
                              field="description"
                              value={dish.description}
                              isPreview={isPreview}
                              className="mt-0.5 text-xs italic text-background/40"
                            />
                          </div>
                          <ItemText
                            instance={inst}
                            collection="items"
                            index={gi}
                            field="price"
                            value={dish.price}
                            isPreview={isPreview}
                            className="shrink-0 pb-5 text-sm font-light text-background/70"
                          />
                        </div>
                      ))}
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

export const menuMinimalDarkSection = defineSection({
  id: "menu-minimal-dark",
  displayName: "Noir",
  description: "Fine-dining restraint — light, wide-tracked type on a near-black surface.",
  category: "menu",
  layoutArchetype: "minimal",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "hotel", "catering"],
  styles: ["dark", "minimal", "editorial"],
  goals: ["sales", "brand"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 96,
  editable: true,
  tags: ["menu", "dark", "minimal", "fine-dining"],
  funnelStage: "consideration",
  conversionWeight: 50,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      headingBlock({ label: "Menu title", aiHint: "Menu title (1–3 words)", maxLength: 30 }),
      noteBlock(
        { key: "tagline", label: "Tagline", canonical: "subheadline", aiHint: "Short cuisine description (2–5 words)", maxLength: 50 },
        { label: "Tagline" }
      ),
      menuItemsBlock({
        key: "items",
        label: "Menu items",
        minItems: 1,
        maxItems: 30,
        newItem: () => ({ name: "Dish name", description: "Description.", price: "$0", category: "Menu" }),
        fields: [
          itemField("name", "Name", { canonical: "headline", aiHint: "Dish name", maxLength: 60, group: "content" }),
          itemField("description", "Description", { type: "textarea", canonical: "body", aiHint: "Ingredients or preparation (1 sentence)", maxLength: 120, group: "content" }),
          itemField("price", "Price", { aiHint: "e.g. $28", maxLength: 15, group: "content" }),
          itemField("category", "Category", { aiHint: "e.g. Premiers, Plats, Desserts", maxLength: 40, group: "content" }),
        ],
      }),
    ],
  },
  defaultProps: {
    headline: "Dîner",
    tagline: "Modern French, seasonal produce",
    items: [
      { name: "Oyster, cucumber, dill", description: "Champagne mignonette.", price: "$18", category: "Premiers" },
      { name: "Beetroot tartare", description: "Smoked crème fraîche, rye.", price: "$16", category: "Premiers" },
      { name: "Duck breast", description: "Cherry, endive, jus gras.", price: "$38", category: "Plats" },
      { name: "Turbot", description: "Brown shrimp, sea herbs, beurre noisette.", price: "$44", category: "Plats" },
      { name: "Tarte au citron", description: "Torched meringue, basil.", price: "$14", category: "Desserts" },
    ],
  },
  Component: MenuMinimalDark,
})
