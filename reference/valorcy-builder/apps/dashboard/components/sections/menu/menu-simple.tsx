"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  eyebrowBlock,
  groupByCategory,
  headingBlock,
  itemField,
  itemsOf,
  menuItemsBlock,
  stretchItems,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type SimpleMenuItem = { name?: string; description?: string; price?: string; dietary?: string; category?: string }

/**
 * Carte — list archetype.
 *
 * The classic printed menu: a centred header over dishes grouped under
 * brand-coloured category rules, name and description on the start side, price
 * on the end side. The grouping is derived from each dish's `category`.
 */
function MenuSimple ({ instance, isPreview, definition }: SectionComponentProps) {
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
          renderItems={({ instance: inst }) => {
            const items = itemsOf<SimpleMenuItem>(inst, "items")
            if (items.length === 0) return null
            return (
              <div className="mx-auto mt-9 max-w-2xl space-y-12 text-start">
                {groupByCategory(items, "Menu").map(([category, dishes]) => (
                  <div key={category}>
                    <h3 className="mb-6 border-b border-border pb-2 text-lg font-semibold text-primary">
                      {category}
                    </h3>
                    <div className="space-y-5">
                      {dishes.map(({ item: dish, index }) => (
                        <div key={index} className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <ItemText
                              as="p"
                              instance={inst}
                              collection="items"
                              index={index}
                              field="name"
                              value={dish.name}
                              elementId={`name${index}`}
                              isPreview={isPreview}
                              className="font-medium text-foreground"
                            />
                            {dish.description && (
                              <ItemText
                                as="p"
                                instance={inst}
                                collection="items"
                                index={index}
                                field="description"
                                value={dish.description}
                                elementId={`desc${index}`}
                                isPreview={isPreview}
                                className="mt-0.5 text-sm text-muted-foreground"
                              />
                            )}
                            {dish.dietary && (
                              <p className="mt-1 text-xs italic text-muted-foreground/70">{dish.dietary}</p>
                            )}
                          </div>
                          <ItemText
                            instance={inst}
                            collection="items"
                            index={index}
                            field="price"
                            value={dish.price}
                            elementId={`price${index}`}
                            isPreview={isPreview}
                            className="shrink-0 font-semibold text-foreground"
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

export const menuSimpleSection = defineSection({
  id: "menu-simple",
  displayName: "Carte",
  description: "Printed-menu list — dishes grouped by category with name, description and price.",
  category: "menu",
  layoutArchetype: "list",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "cafe", "bakery", "catering"],
  styles: ["minimal", "editorial", "modern"],
  goals: ["sales", "engagement"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 98,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 60,
  trustWeight: 45,
  tags: ["menu", "list", "restaurant", "simple", "prices"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      headingBlock({ maxLength: 70 }),
      menuItemsBlock({
        key: "items",
        label: "Menu items",
        minItems: 1,
        maxItems: 50,
        newItem: () => ({ name: "Item name", description: "", price: "$0", dietary: "", category: "Menu" }),
        fields: [
          itemField("name", "Item name", { canonical: "headline", maxLength: 60 }),
          itemField("description", "Description", { type: "textarea", canonical: "body", maxLength: 160 }),
          itemField("price", "Price", { aiHint: "e.g. $18", maxLength: 15 }),
          itemField("dietary", "Dietary notes", { aiHint: "e.g. V, GF, Vegan", maxLength: 50 }),
          itemField("category", "Category section", { aiHint: "e.g. Starters, Mains, Desserts", maxLength: 40 }),
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Our menu",
    headline: "Seasonal plates, simply done",
    items: [
      { name: "Burrata & heirloom tomato", description: "Basil oil, aged balsamic, grilled sourdough.", price: "$14", dietary: "V", category: "Starters" },
      { name: "Crispy calamari", description: "Lemon aioli, pickled chilli, fresh herbs.", price: "$13", dietary: "", category: "Starters" },
      { name: "Pan-seared sea bass", description: "Crushed new potatoes, samphire, beurre blanc.", price: "$29", dietary: "GF", category: "Mains" },
      { name: "Wild mushroom risotto", description: "Carnaroli rice, parmesan, truffle oil.", price: "$22", dietary: "V", category: "Mains" },
      { name: "Dark chocolate fondant", description: "Salted caramel, vanilla bean ice cream.", price: "$11", dietary: "V", category: "Desserts" },
    ],
  },
  Component: MenuSimple,
})
