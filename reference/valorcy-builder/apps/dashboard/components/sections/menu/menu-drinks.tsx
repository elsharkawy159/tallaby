"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  MENU_EYEBROW_CLASS,
  eyebrowBlock,
  groupByCategory,
  headingBlock,
  itemField,
  itemsOf,
  menuItemsBlock,
  stretchItems,
  textOverride,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

type DrinkItem = { name?: string; description?: string; price?: string; category?: string }

/** Categories split across two balanced columns, each flowing independently. */
function DrinkColumns ({ instance, isPreview }: { instance: SectionInstance; isPreview?: boolean }) {
  const items = itemsOf<DrinkItem>(instance, "items")
  if (items.length === 0) return null
  const groups = groupByCategory(items, "Drinks")
  const half = Math.ceil(groups.length / 2)

  const renderCategory = ([cat, drinks]: (typeof groups)[number]) => (
    <div key={cat} className="mb-8">
      <h3 className="mb-4 border-b border-border pb-2 text-xs font-semibold text-primary">{cat}</h3>
      <div className="space-y-3">
        {drinks.map(({ item: drink, index: gi }) => (
          <div key={gi} className="flex items-start gap-2">
            <div className="flex-1">
              <ItemText as="p" instance={instance} collection="items" index={gi} field="name" value={drink.name} isPreview={isPreview} className="text-sm font-semibold text-foreground" />
              <ItemText as="p" instance={instance} collection="items" index={gi} field="description" value={drink.description} isPreview={isPreview} className="text-xs text-muted-foreground" />
            </div>
            <ItemText instance={instance} collection="items" index={gi} field="price" value={drink.price} isPreview={isPreview} className="shrink-0 text-sm font-semibold text-foreground" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="grid gap-6 text-start sm:grid-cols-2">
      <div>{groups.slice(0, half).map(renderCategory)}</div>
      <div>{groups.slice(half).map(renderCategory)}</div>
    </div>
  )
}

/**
 * Bar Card — masonry archetype.
 *
 * A drinks list whose categories (cocktails, wine, beer, zero-proof) are dealt
 * into two independent columns, so short and long categories pack together.
 */
function MenuDrinks ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          entryClassName={stretchItems}
          align="center"
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          overrides={{
            eyebrow: textOverride("eyebrow", `mb-1 ${MENU_EYEBROW_CLASS}`, isPreview),
          }}
          renderItems={({ instance: inst }) => (
            <div className="mt-10">
              <DrinkColumns instance={inst} isPreview={isPreview} />
            </div>
          )}
        />
      </SectionContainer>
    </section>
  )
}

export const menuDrinksSection = defineSection({
  id: "menu-drinks",
  displayName: "Bar Card",
  description: "Drinks list with categories packed into two independent columns.",
  category: "menu",
  layoutArchetype: "masonry",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "cafe", "hotel", "catering"],
  styles: ["minimal", "editorial", "modern"],
  goals: ["sales", "engagement"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  tags: ["menu", "drinks", "cocktails", "wine", "bar"],
  funnelStage: "consideration",
  conversionWeight: 50,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–2 words)", maxLength: 20 }),
      headingBlock({ aiHint: "Drinks section headline (3–6 words)", maxLength: 60 }),
      menuItemsBlock({
        key: "items",
        label: "Drinks",
        minItems: 1,
        maxItems: 40,
        newItem: () => ({ name: "Drink name", description: "Ingredients.", price: "$0", category: "Cocktails" }),
        fields: [
          itemField("name", "Name", { canonical: "headline", aiHint: "Drink name", maxLength: 60, group: "content" }),
          itemField("description", "Description", { type: "textarea", canonical: "body", aiHint: "Ingredients or tasting note", maxLength: 120, group: "content" }),
          itemField("price", "Price", { aiHint: "e.g. $14 / glass · $52 / bottle", maxLength: 30, group: "content" }),
          itemField("category", "Category", { aiHint: "e.g. Cocktails, Red Wine, Beer", maxLength: 40, group: "content" }),
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "The bar",
    headline: "Something to sip",
    items: [
      { name: "Smoked old fashioned", description: "Bourbon, demerara, orange bitters.", price: "$15", category: "Cocktails" },
      { name: "Garden spritz", description: "Elderflower, cucumber, prosecco.", price: "$13", category: "Cocktails" },
      { name: "Sauvignon blanc", description: "Marlborough — citrus, passionfruit.", price: "$12 / $48", category: "Wine" },
      { name: "Tempranillo", description: "Rioja — cherry, vanilla, spice.", price: "$13 / $52", category: "Wine" },
      { name: "Local pale ale", description: "Hoppy, crisp, sessionable.", price: "$8", category: "Beer" },
      { name: "Ginger & lime fizz", description: "House ginger syrup, soda, mint.", price: "$7", category: "Zero-proof" },
    ],
  },
  Component: MenuDrinks,
})
