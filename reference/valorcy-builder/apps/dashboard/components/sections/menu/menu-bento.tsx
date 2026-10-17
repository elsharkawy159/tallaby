"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { placeholderFor } from "@/components/sections/placeholders"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, SectionEditableImage, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  headingBlock,
  itemField,
  itemsOf,
  menuItemsBlock,
  stretchItems,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type MenuItem = { name?: string; description?: string; price?: string; image?: string; span?: "1" | "2" }

const PHOTO = placeholderFor("product")

/**
 * Mosaic — bento archetype.
 *
 * Mixed-width photo tiles (each dish chooses a one- or two-column span) with
 * the name, description and price laid over a dark scrim at the foot of the
 * photo. The scrim stays dark in both themes so the white type always reads.
 */
function MenuBento ({ instance, isPreview, definition }: SectionComponentProps) {
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
          headingClassName={`${TYPE_H2_SM} mb-8 text-foreground`}
          renderItems={({ instance: inst }) => {
            const items = itemsOf<MenuItem>(inst, "items")
            if (items.length === 0) return null
            return (
              <div className="grid auto-rows-[200px] grid-cols-2 gap-4 sm:grid-cols-3">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className={`group relative overflow-hidden rounded-2xl bg-muted ${item.span === "2" ? "col-span-2" : "col-span-1"}`}
                  >
                    {item.image ? (
                      <SectionEditableImage
                        instanceId={inst.id}
                        elementKey={`bento-${i}`}
                        src={item.image}
                        alt={item.name ?? ""}
                        collectionKey="items"
                        collectionIndex={i}
                        itemSrcProp="image"
                        isPreview={isPreview}
                        className="absolute inset-0 size-full object-cover transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-muted" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 end-0 start-0 p-4">
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <ItemText
                            as="h3"
                            instance={inst}
                            collection="items"
                            index={i}
                            field="name"
                            value={item.name}
                            isPreview={isPreview}
                            className="font-semibold leading-tight text-white"
                          />
                          <ItemText
                            as="p"
                            instance={inst}
                            collection="items"
                            index={i}
                            field="description"
                            value={item.description}
                            isPreview={isPreview}
                            className="mt-0.5 line-clamp-1 text-xs text-white/70"
                          />
                        </div>
                        <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                          <ItemText instance={inst} collection="items" index={i} field="price" value={item.price} isPreview={isPreview} />
                        </span>
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

export const menuBentoSection = defineSection({
  id: "menu-bento",
  displayName: "Mosaic",
  description: "Mixed-width photo tiles with each dish's name and price over the image.",
  category: "menu",
  layoutArchetype: "bento",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "cafe", "food_delivery", "catering"],
  styles: ["bold", "editorial", "modern"],
  goals: ["sales", "brand", "engagement"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["menu", "bento", "grid", "photos"],
  funnelStage: "consideration",
  conversionWeight: 65,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      headingBlock({ aiHint: "Menu section headline (3–6 words)", maxLength: 50 }),
      menuItemsBlock({
        key: "items",
        label: "Dishes",
        minItems: 1,
        maxItems: 8,
        newItem: () => ({ name: "Dish name", description: "Description.", price: "$0", image: "", span: "1" as const }),
        fields: [
          itemField("image", "Photo", { type: "image" }),
          itemField("name", "Name", { canonical: "headline", aiHint: "Dish name", maxLength: 40, group: "content" }),
          itemField("description", "Description", { canonical: "body", aiHint: "Short ingredient list", maxLength: 80, group: "content" }),
          itemField("price", "Price", { aiHint: "e.g. $24", maxLength: 12, group: "content" }),
          itemField("span", "Card width", {
            type: "select",
            options: [{ value: "1", label: "Standard (1 col)" }, { value: "2", label: "Wide (2 cols)" }],
            group: "layout",
          }),
        ],
      }),
    ],
  },
  defaultProps: {
    headline: "Straight from the pass",
    items: [
      { name: "Double cheeseburger", description: "Aged beef, American cheese, pickles.", price: "$18", image: PHOTO, span: "2" },
      { name: "Truffle fries", description: "Parmesan, rosemary salt.", price: "$9", image: PHOTO, span: "1" },
      { name: "Fried chicken bao", description: "Gochujang mayo, slaw.", price: "$12", image: PHOTO, span: "1" },
      { name: "Poke bowl", description: "Ahi tuna, edamame, sushi rice.", price: "$17", image: PHOTO, span: "1" },
      { name: "Wood-fired pepperoni", description: "Hot honey, mozzarella, oregano.", price: "$19", image: PHOTO, span: "2" },
    ],
  },
  Component: MenuBento,
})
