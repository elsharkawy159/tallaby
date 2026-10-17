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
  MENU_EYEBROW_CLASS,
  eyebrowBlock,
  headingBlock,
  itemField,
  itemsOf,
  menuItemsBlock,
  stretchItems,
  textOverride,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type MenuItem = { name?: string; description?: string; price?: string; dietary?: string; image?: string }

const PHOTO = placeholderFor("product")

/**
 * Plated — media-cards archetype.
 *
 * Photo-first dish cards: each image carries its price as a brand-coloured
 * pill in the corner, the name, dietary tag and description sit below.
 */
function MenuCards ({ instance, isPreview, definition }: SectionComponentProps) {
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
            eyebrow: textOverride("eyebrow", `mb-2 ${MENU_EYEBROW_CLASS}`, isPreview),
          }}
          renderItems={({ instance: inst }) => {
            const items = itemsOf<MenuItem>(inst, "items")
            if (items.length === 0) return null
            return (
              <div className="mt-12 grid grid-cols-1 gap-5 text-start sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, i) => (
                  <div key={i} className="group overflow-hidden rounded-2xl border border-border bg-card transition">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {item.image ? (
                        <SectionEditableImage
                          instanceId={inst.id}
                          elementKey={`item-img-${i}`}
                          src={item.image}
                          alt={item.name ?? ""}
                          collectionKey="items"
                          collectionIndex={i}
                          itemSrcProp="image"
                          isPreview={isPreview}
                          className="absolute inset-0 size-full object-cover transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground/40">No image</div>
                      )}
                      <div className="absolute bottom-3 end-3 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                        <ItemText instance={inst} collection="items" index={i} field="price" value={item.price} isPreview={isPreview} />
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="mb-1 flex items-baseline gap-2">
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
                        {item.dietary && <span className="text-xs font-medium italic text-muted-foreground/70">{item.dietary}</span>}
                      </div>
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="items"
                        index={i}
                        field="description"
                        value={item.description}
                        isPreview={isPreview}
                        className="text-sm leading-relaxed text-muted-foreground"
                      />
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

export const menuCardsSection = defineSection({
  id: "menu-cards",
  displayName: "Plated",
  description: "Photo-first dish cards with the price pinned to each image.",
  category: "menu",
  layoutArchetype: "media-cards",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "cafe", "catering", "food_delivery"],
  styles: ["modern", "bold", "playful"],
  goals: ["sales", "engagement", "brand"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  tags: ["menu", "cards", "photos", "restaurant"],
  funnelStage: "consideration",
  conversionWeight: 60,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Menu headline (4–8 words)", maxLength: 70 }),
      menuItemsBlock({
        key: "items",
        label: "Menu items",
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ name: "Dish name", description: "Description.", price: "$0", dietary: "", image: "" }),
        fields: [
          itemField("image", "Dish photo", { type: "image" }),
          itemField("name", "Name", { canonical: "headline", aiHint: "Dish name", maxLength: 50, group: "content" }),
          itemField("description", "Description", { type: "textarea", canonical: "body", aiHint: "Ingredients (1 sentence)", maxLength: 120, group: "content" }),
          itemField("price", "Price", { aiHint: "e.g. $18", maxLength: 15, group: "content" }),
          itemField("dietary", "Dietary", { aiHint: "e.g. V, GF", maxLength: 30, group: "content" }),
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Kitchen favourites",
    headline: "The dishes our regulars order again",
    items: [
      { name: "Wood-fired margherita", description: "San Marzano tomato, fior di latte, basil.", price: "$16", dietary: "V", image: PHOTO },
      { name: "Lamb kofta", description: "Charred flatbread, tzatziki, pickled onion.", price: "$19", dietary: "", image: PHOTO },
      { name: "Miso-glazed salmon", description: "Sesame greens, jasmine rice.", price: "$26", dietary: "GF", image: PHOTO },
      { name: "Smash burger", description: "Aged cheddar, house pickles, brioche bun.", price: "$18", dietary: "", image: PHOTO },
      { name: "Roasted squash bowl", description: "Farro, feta, toasted seeds, herbs.", price: "$15", dietary: "V", image: PHOTO },
      { name: "Grilled prawns", description: "Garlic butter, lemon, chilli.", price: "$24", dietary: "GF", image: PHOTO },
    ],
  },
  Component: MenuCards,
})
