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
  coverEntry,
  coverImageOverride,
  eyebrowBlock,
  headingBlock,
  itemField,
  itemsOf,
  menuItemsBlock,
  stretchItems,
  textOverride,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type MenuItem = { name?: string; description?: string; price?: string; dietary?: string }

/**
 * Folio — split archetype.
 *
 * A tall food photo that stays pinned while the dish list beside it scrolls.
 * Two slots: the photo frame and the menu column.
 */
function MenuSplitImage ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="media"
            className="sticky top-24 aspect-[4/5] overflow-hidden rounded-3xl bg-muted"
            entryClassName={coverEntry}
            overrides={{
              imageUrl: coverImageOverride({
                srcKey: "imageUrl",
                altKey: "headline",
                elementKey: "split-img",
                className: "absolute inset-0 size-full object-cover",
                isPreview,
                placeholder: "portrait",
              }),
            }}
          />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col items-start"
            entryClassName={stretchItems}
            align="left"
            headingClassName={`${TYPE_H2_SM} mb-8 text-foreground`}
            overrides={{
              eyebrow: textOverride("eyebrow", `mb-2 ${MENU_EYEBROW_CLASS}`, isPreview),
            }}
            renderItems={({ instance: inst }) => {
              const items = itemsOf<MenuItem>(inst, "items")
              if (items.length === 0) return null
              return (
                <div className="space-y-0 divide-y divide-border">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 py-5">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <ItemText
                            as="h3"
                            instance={inst}
                            collection="items"
                            index={i}
                            field="name"
                            value={item.name}
                            isPreview={isPreview}
                            className="font-semibold text-foreground"
                          />
                          {item.dietary && <span className="text-xs italic text-muted-foreground/70">{item.dietary}</span>}
                        </div>
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="items"
                          index={i}
                          field="description"
                          value={item.description}
                          isPreview={isPreview}
                          className="mt-0.5 text-sm text-muted-foreground"
                        />
                      </div>
                      <ItemText
                        instance={inst}
                        collection="items"
                        index={i}
                        field="price"
                        value={item.price}
                        isPreview={isPreview}
                        className="shrink-0 font-semibold text-foreground"
                      />
                    </div>
                  ))}
                </div>
              )
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const menuSplitImageSection = defineSection({
  id: "menu-split-image",
  displayName: "Folio",
  description: "A pinned food photo beside a scrolling dish list.",
  category: "menu",
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "cafe", "catering", "hotel"],
  styles: ["editorial", "modern", "minimal"],
  goals: ["sales", "brand", "engagement"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["menu", "split", "image", "restaurant"],
  funnelStage: "consideration",
  conversionWeight: 60,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "media", label: "Photo", accepts: ["media"], max: 1, acceptsElements: false },
      { id: "copy", label: "Menu", isDefault: true },
    ],
    blocks: [
      {
        kind: "media",
        slot: "media",
        ratio: "portrait",
        placeholder: "portrait",
        fields: { src: { key: "imageUrl", label: "Food photo", type: "image", group: "media" } },
      },
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Menu section headline (1–4 words)", maxLength: 40 }),
      menuItemsBlock({
        key: "items",
        label: "Menu items",
        minItems: 1,
        maxItems: 20,
        newItem: () => ({ name: "Dish name", description: "Description.", price: "$0", dietary: "" }),
        fields: [
          itemField("name", "Name", { canonical: "headline", aiHint: "Dish name", maxLength: 60, group: "content" }),
          itemField("description", "Description", { type: "textarea", canonical: "body", aiHint: "Ingredients (1 sentence)", maxLength: 120, group: "content" }),
          itemField("price", "Price", { aiHint: "e.g. $28", maxLength: 15, group: "content" }),
          itemField("dietary", "Dietary", { aiHint: "e.g. V, GF", maxLength: 30, group: "content" }),
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Dinner",
    headline: "From the grill",
    items: [
      { name: "Flat-iron steak", description: "Bone marrow butter, watercress.", price: "$29", dietary: "GF" },
      { name: "Charred hispi cabbage", description: "Miso butter, crispy onions.", price: "$16", dietary: "V" },
      { name: "Grilled octopus", description: "Romesco, potatoes, smoked paprika.", price: "$24", dietary: "GF" },
      { name: "Pork chop", description: "Apple mostarda, sage, greens.", price: "$27", dietary: "GF" },
      { name: "Halloumi skewers", description: "Peppers, red onion, herb yoghurt.", price: "$18", dietary: "V" },
    ],
  },
  Component: MenuSplitImage,
})
