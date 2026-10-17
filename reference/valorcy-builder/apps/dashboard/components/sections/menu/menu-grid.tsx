"use client"

import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, SectionEditableImage, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  bodyBlock,
  eyebrowBlock,
  headingBlock,
  itemField,
  itemsOf,
  menuItemsBlock,
  stretchItems,
  textOr,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

type MenuItem = { name?: string; description?: string; price?: string; image?: string; dietary?: string; category?: string }

/** The first filter tab rendered "All" before the label was editable. */
const ALL_LABEL_FALLBACK = "All"

/**
 * The filterable dish grid. Its own component so the active-tab state is a
 * real hook rather than one called from inside a render callback.
 */
function FilterableDishes ({ instance, isPreview }: { instance: SectionInstance; isPreview?: boolean }) {
  const items = itemsOf<MenuItem>(instance, "items")
  const allLabel = textOr(instance, "allLabel", ALL_LABEL_FALLBACK)
  const categories = [...new Set(items.map((i) => i?.category).filter((c): c is string => Boolean(c)))]
  const [active, setActive] = useState<string | null>(null)

  if (items.length === 0) return null

  const indexed = items.map((item, index) => ({ item, index }))
  const filtered = active === null ? indexed : indexed.filter(({ item }) => item.category === active)
  const tabs: { key: string | null; label: string }[] = [
    { key: null, label: allLabel },
    ...categories.map((c) => ({ key: c, label: c })),
  ]

  return (
    <div className="w-full">
      {categories.length > 1 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key ?? "__all"}
              type="button"
              onClick={() => setActive(tab.key)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                active === tab.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-5 text-start sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(({ item, index: i }) => (
          <div key={i} className="group overflow-hidden rounded-2xl border border-border bg-card">
            {item.image && (
              <div className="relative aspect-[4/3] overflow-hidden">
                <SectionEditableImage
                  instanceId={instance.id}
                  elementKey={`grid-img-${i}`}
                  src={item.image}
                  alt={item.name ?? ""}
                  collectionKey="items"
                  collectionIndex={i}
                  itemSrcProp="image"
                  isPreview={isPreview}
                  className="absolute inset-0 size-full object-cover transition-transform"
                />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <ItemText
                  as="h3"
                  instance={instance}
                  collection="items"
                  index={i}
                  field="name"
                  value={item.name}
                  elementId={`name${i}`}
                  isPreview={isPreview}
                  className="font-semibold text-foreground"
                />
                <ItemText
                  instance={instance}
                  collection="items"
                  index={i}
                  field="price"
                  value={item.price}
                  elementId={`price${i}`}
                  isPreview={isPreview}
                  className="shrink-0 font-semibold text-primary"
                />
              </div>
              <ItemText
                as="p"
                instance={instance}
                collection="items"
                index={i}
                field="description"
                value={item.description}
                elementId={`desc${i}`}
                isPreview={isPreview}
                className="mt-1.5 text-sm text-muted-foreground"
              />
              {item.dietary && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {item.dietary.split(",").map((d) => (
                    <span key={d} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {d.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Larder — tabs archetype.
 *
 * A centred header over category filter pills and a three-column grid of dish
 * cards. The pills are derived from each dish's `category`; the leading "all"
 * pill's label is a setting.
 */
function MenuGrid ({ instance, isPreview, definition }: SectionComponentProps) {
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
          renderItems={({ instance: inst }) => <FilterableDishes instance={inst} isPreview={isPreview} />}
        />
      </SectionContainer>
    </section>
  )
}

export const menuGridSection = defineSection({
  id: "menu-grid",
  displayName: "Larder",
  description: "Dish cards in a three-column grid, filtered by category pills.",
  category: "menu",
  layoutArchetype: "tabs",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "cafe", "bakery", "catering", "food_delivery"],
  styles: ["modern", "minimal", "bold"],
  goals: ["sales", "engagement", "conversion"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 70,
  trustWeight: 50,
  tags: ["menu", "food", "restaurant", "dishes", "grid"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      headingBlock({ maxLength: 70 }),
      bodyBlock({ maxLength: 200 }),
      menuItemsBlock({
        key: "items",
        label: "Menu items",
        minItems: 1,
        maxItems: 30,
        newItem: () => ({ name: "Dish name", description: "Description of the dish.", price: "$0", image: "", dietary: "", category: "" }),
        fields: [
          itemField("name", "Dish name", { canonical: "headline", maxLength: 60 }),
          itemField("description", "Description", { type: "textarea", canonical: "body", maxLength: 200 }),
          itemField("price", "Price", { aiHint: "e.g. $24 or €18", maxLength: 15 }),
          itemField("image", "Dish photo", { type: "image", canonical: "image" }),
          itemField("dietary", "Dietary tags (comma-separated)", { aiHint: "e.g. Vegetarian, Gluten-free", maxLength: 100 }),
          itemField("category", "Category (for filter tabs)", { aiHint: "e.g. Starters, Mains, Desserts", maxLength: 30 }),
        ],
      }),
    ],
    settings: [
      { key: "allLabel", label: "\"All\" filter label", type: "text", maxLength: 20, group: "content", default: ALL_LABEL_FALLBACK },
    ],
  },
  defaultProps: {
    eyebrow: "The menu",
    headline: "Made fresh, every service",
    description: "Seasonal ingredients from local growers, cooked to order in our open kitchen.",
    items: [
      { name: "Grilled ribeye", description: "Dry-aged 28 days, chimichurri, hand-cut fries.", price: "$34", image: "", dietary: "Gluten-free", category: "Mains" },
      { name: "Charred cauliflower", description: "Tahini, pomegranate, toasted pistachio.", price: "$19", image: "", dietary: "Vegetarian", category: "Mains" },
      { name: "Heirloom beet salad", description: "Whipped goat cheese, walnut, citrus dressing.", price: "$14", image: "", dietary: "Vegetarian, Gluten-free", category: "Starters" },
      { name: "Tuna tartare", description: "Avocado, sesame, crisp wonton.", price: "$17", image: "", dietary: "", category: "Starters" },
      { name: "Lemon olive-oil cake", description: "Crème fraîche, candied zest.", price: "$10", image: "", dietary: "Vegetarian", category: "Desserts" },
      { name: "Panna cotta", description: "Vanilla bean, macerated berries.", price: "$10", image: "", dietary: "Vegetarian, Gluten-free", category: "Desserts" },
    ],
  },
  Component: MenuGrid,
})
