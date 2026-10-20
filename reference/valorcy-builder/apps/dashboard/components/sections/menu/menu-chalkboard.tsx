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
  stretchItems,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type MenuItem = { name?: string; description?: string; price?: string; category?: string }

/**
 * Chalkboard — inverted archetype.
 *
 * A bistro blackboard: a dark surface in either site theme, serif type,
 * accent-coloured category labels and prices, and dashed dot leaders running
 * from each dish to its price.
 */
function MenuChalkboard ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false, defaultColor: "var(--background)" } })

  return (
    <section className="bg-foreground text-background" style={rootStyle}>
      <SectionContainer className="max-w-3xl">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          entryClassName={stretchItems}
          align="center"
          headingClassName={`${TYPE_H2} mb-10 text-center text-background`}
          renderItems={({ instance: inst }) => {
            const items = itemsOf<MenuItem>(inst, "items")
            if (items.length === 0) return null
            return (
              <div className="space-y-10 text-start">
                {groupByCategory(items, "Menu").map(([cat, dishes]) => (
                  <div key={cat}>
                    <h3 className="mb-5 border-b border-background/20 pb-2 text-center text-xs font-semibold text-accent">{cat}</h3>
                    <div className="space-y-4">
                      {dishes.map(({ item: dish, index: gi }) => (
                        <div key={gi} className="flex items-start gap-3">
                          <div className="flex-1">
                            <ItemText
                              as="p"
                              instance={inst}
                              collection="items"
                              index={gi}
                              field="name"
                              value={dish.name}
                              isPreview={isPreview}
                              className="font-semibold text-background [font-family:Georgia,serif]"
                            />
                            <ItemText
                              as="p"
                              instance={inst}
                              collection="items"
                              index={gi}
                              field="description"
                              value={dish.description}
                              isPreview={isPreview}
                              className="text-sm italic text-background/60"
                            />
                          </div>
                          <div className="mx-2 mt-1.5 flex-1 border-b border-dashed border-background/20" aria-hidden />
                          <ItemText
                            instance={inst}
                            collection="items"
                            index={gi}
                            field="price"
                            value={dish.price}
                            isPreview={isPreview}
                            className="shrink-0 font-semibold text-accent"
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

export const menuChalkboardSection = defineSection({
  id: "menu-chalkboard",
  displayName: "Chalkboard",
  description: "Bistro blackboard — serif type on a dark surface with dashed dot leaders to each price.",
  category: "menu",
  layoutArchetype: "inverted",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "cafe", "bakery", "catering"],
  styles: ["dark", "editorial", "bold"],
  goals: ["sales", "engagement", "brand"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  tags: ["menu", "chalkboard", "dark", "restaurant"],
  funnelStage: "consideration",
  conversionWeight: 55,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      headingBlock({ aiHint: "Menu headline (2–4 words)", maxLength: 40 }),
      menuItemsBlock({
        key: "items",
        label: "Menu items",
        minItems: 1,
        maxItems: 40,
        newItem: () => ({ name: "Item name", description: "", price: "$0", category: "Menu" }),
        fields: [
          itemField("name", "Dish name", { canonical: "headline", aiHint: "Dish name", maxLength: 60, group: "content" }),
          itemField("description", "Description", { type: "textarea", canonical: "body", aiHint: "Ingredients (1 sentence)", maxLength: 120, group: "content" }),
          itemField("price", "Price", { aiHint: "e.g. $18", maxLength: 15, group: "content" }),
          itemField("category", "Category", { aiHint: "e.g. Starters, Mains", maxLength: 40, group: "content" }),
        ],
      }),
    ],
  },
  defaultProps: {
    headline: "Today's board",
    items: [
      { name: "French onion soup", description: "Gruyère crouton, thyme.", price: "$11", category: "To start" },
      { name: "Chicken liver pâté", description: "Cornichons, toasted brioche.", price: "$12", category: "To start" },
      { name: "Steak frites", description: "Bavette, peppercorn sauce, fries.", price: "$28", category: "Plats" },
      { name: "Moules marinières", description: "White wine, garlic, parsley, bread.", price: "$24", category: "Plats" },
      { name: "Crème brûlée", description: "Tahitian vanilla, shortbread.", price: "$10", category: "Sweet" },
    ],
  },
  Component: MenuChalkboard,
})
