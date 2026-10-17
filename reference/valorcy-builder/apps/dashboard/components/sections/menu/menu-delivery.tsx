"use client"

import { Plus } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { placeholderFor } from "@/components/sections/placeholders"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, SectionEditableImage, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  bodyBlock,
  headingBlock,
  itemField,
  itemsOf,
  menuItemsBlock,
  stretchItems,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type MenuItem = { name?: string; description?: string; price?: string; dietary?: string; image?: string; calories?: string }

const PHOTO = placeholderFor("product")

/**
 * Order Up — grid archetype.
 *
 * Delivery-app ordering tiles: a square thumbnail beside the dish, a short
 * description, price, calories and dietary tags, and an add button.
 */
function MenuDelivery ({ instance, isPreview, definition }: SectionComponentProps) {
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
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          bodyClassName={`${TYPE_BODY} mt-1.5`}
          renderItems={({ instance: inst }) => {
            const items = itemsOf<MenuItem>(inst, "items")
            if (items.length === 0) return null
            return (
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, i) => (
                  <div key={i} className="group flex gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {item.image ? (
                        <SectionEditableImage
                          instanceId={inst.id}
                          elementKey={`del-${i}`}
                          src={item.image}
                          alt={item.name ?? ""}
                          collectionKey="items"
                          collectionIndex={i}
                          itemSrcProp="image"
                          isPreview={isPreview}
                          className="absolute inset-0 size-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <ItemText as="h3" instance={inst} collection="items" index={i} field="name" value={item.name} isPreview={isPreview} className="text-sm font-semibold leading-snug text-foreground" />
                        <button type="button" className="shrink-0 rounded-full bg-primary p-1 transition hover:opacity-80" aria-label={`Add ${item.name ?? ""}`}>
                          <Plus className="size-4 text-primary-foreground" />
                        </button>
                      </div>
                      <ItemText as="p" instance={inst} collection="items" index={i} field="description" value={item.description} isPreview={isPreview} className="line-clamp-2 text-xs leading-relaxed text-muted-foreground" />
                      <div className="mt-auto flex items-center gap-2">
                        <ItemText instance={inst} collection="items" index={i} field="price" value={item.price} isPreview={isPreview} className="text-sm font-semibold text-primary" />
                        {item.calories && <span className="text-xs text-muted-foreground">{item.calories}</span>}
                        {item.dietary && <span className="text-xs italic text-muted-foreground/70">{item.dietary}</span>}
                      </div>
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

export const menuDeliverySection = defineSection({
  id: "menu-delivery",
  displayName: "Order Up",
  description: "Delivery-app ordering tiles — thumbnail, price, calories and an add button per dish.",
  category: "menu",
  layoutArchetype: "grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["food_delivery", "restaurant", "cafe", "catering"],
  styles: ["modern", "playful", "minimal"],
  goals: ["sales", "conversion", "engagement"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 92,
  editable: true,
  tags: ["menu", "delivery", "online-order", "food"],
  funnelStage: "decision",
  conversionWeight: 75,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      headingBlock({ aiHint: "Order section headline (2–4 words)", maxLength: 40 }),
      bodyBlock({ type: "text", aiHint: "Short delivery promise (1 sentence)", maxLength: 100 }),
      menuItemsBlock({
        key: "items",
        label: "Menu items",
        minItems: 1,
        maxItems: 18,
        newItem: () => ({ name: "Item name", description: "Description.", price: "$0", dietary: "", image: "", calories: "" }),
        fields: [
          itemField("image", "Photo", { type: "image" }),
          itemField("name", "Name", { canonical: "headline", aiHint: "Dish name", maxLength: 50, group: "content" }),
          itemField("description", "Description", { type: "textarea", canonical: "body", aiHint: "Ingredients (1 sentence)", maxLength: 120, group: "content" }),
          itemField("price", "Price", { aiHint: "e.g. $16", maxLength: 12, group: "content" }),
          itemField("calories", "Calories", { aiHint: "e.g. 680 kcal (optional)", maxLength: 20, group: "content" }),
          itemField("dietary", "Dietary", { aiHint: "e.g. V, GF, Vegan", maxLength: 30, group: "content" }),
        ],
      }),
    ],
  },
  defaultProps: {
    headline: "Order for delivery",
    description: "Hot to your door in 30 minutes or less, packed in compostable boxes.",
    items: [
      { name: "Classic cheeseburger", description: "Beef patty, cheddar, lettuce, house sauce.", price: "$14", dietary: "", image: PHOTO, calories: "720 kcal" },
      { name: "Margherita pizza", description: "Tomato, mozzarella, basil, olive oil.", price: "$16", dietary: "V", image: PHOTO, calories: "880 kcal" },
      { name: "Chicken katsu curry", description: "Panko chicken, curry sauce, steamed rice.", price: "$15", dietary: "", image: PHOTO, calories: "910 kcal" },
      { name: "Falafel wrap", description: "Hummus, pickles, tahini, salad.", price: "$12", dietary: "V, GF", image: PHOTO, calories: "560 kcal" },
      { name: "Salmon poke", description: "Sushi rice, avocado, edamame, ponzu.", price: "$17", dietary: "GF", image: PHOTO, calories: "640 kcal" },
      { name: "Chocolate brownie", description: "Fudgy, sea salt, walnuts.", price: "$6", dietary: "V", image: PHOTO, calories: "420 kcal" },
    ],
  },
  Component: MenuDelivery,
})
