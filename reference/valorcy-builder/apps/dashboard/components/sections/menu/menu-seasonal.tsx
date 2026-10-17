"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  eyebrowBlock,
  headingBlock,
  itemField,
  itemsOf,
  menuItemsBlock,
  noteBlock,
  stretchItems,
  textOverride,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type MenuItem = { name?: string; description?: string; price?: string; dietary?: string }

/**
 * Harvest — contained archetype.
 *
 * A seasonal menu held in one bordered card under a brand-tinted season pill,
 * closed by a sourcing note.
 */
function MenuSeasonal ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer className="max-w-2xl">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-3 text-center"
          entryClassName={stretchItems}
          align="center"
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          overrides={{
            season: textOverride(
              "season",
              "inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary",
              isPreview,
              { as: "span" }
            ),
            eyebrow: textOverride("eyebrow", "text-xs font-semibold text-muted-foreground", isPreview),
            note: textOverride("note", "mt-3 text-center text-xs italic text-muted-foreground/70", isPreview),
          }}
          renderItems={({ instance: inst }) => {
            const items = itemsOf<MenuItem>(inst, "items")
            if (items.length === 0) return null
            return (
              <div className="mt-7 space-y-0 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card text-start">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 p-5">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <ItemText as="h3" instance={inst} collection="items" index={i} field="name" value={item.name} isPreview={isPreview} className="font-semibold text-foreground" />
                        {item.dietary && <span className="text-xs italic text-muted-foreground/70">{item.dietary}</span>}
                      </div>
                      <ItemText as="p" instance={inst} collection="items" index={i} field="description" value={item.description} isPreview={isPreview} className="mt-0.5 text-sm text-muted-foreground" />
                    </div>
                    <ItemText instance={inst} collection="items" index={i} field="price" value={item.price} isPreview={isPreview} className="shrink-0 font-semibold text-primary" />
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

export const menuSeasonalSection = defineSection({
  id: "menu-seasonal",
  displayName: "Harvest",
  description: "Seasonal dishes in one contained card under a season pill, closed by a sourcing note.",
  category: "menu",
  layoutArchetype: "contained",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "cafe", "catering", "hotel"],
  styles: ["minimal", "modern", "editorial"],
  goals: ["sales", "brand", "engagement"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 96,
  editable: true,
  tags: ["menu", "seasonal", "farm-to-table", "restaurant"],
  funnelStage: "consideration",
  conversionWeight: 55,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "badge",
        id: "season",
        label: "Season badge",
        field: { key: "season", label: "Season badge", type: "text", aiHint: "e.g. Spring 2025, Summer Menu", maxLength: 20, group: "content" },
      },
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Seasonal headline (4–8 words)", maxLength: 70 }),
      menuItemsBlock({
        key: "items",
        label: "Menu items",
        minItems: 1,
        maxItems: 20,
        newItem: () => ({ name: "Dish name", description: "Description.", price: "$0", dietary: "" }),
        fields: [
          itemField("name", "Name", { canonical: "headline", aiHint: "Dish name", maxLength: 60, group: "content" }),
          itemField("description", "Description", { type: "textarea", canonical: "body", aiHint: "Ingredients (1 sentence)", maxLength: 120, group: "content" }),
          itemField("price", "Price", { aiHint: "e.g. $24", maxLength: 15, group: "content" }),
          itemField("dietary", "Dietary", { aiHint: "e.g. V, GF, Vegan", maxLength: 30, group: "content" }),
        ],
      }),
      noteBlock(
        { key: "note", label: "Footer note", canonical: "body", aiHint: "Sourcing or sustainability note (1 sentence)", maxLength: 120 },
        { label: "Footer note" }
      ),
    ],
  },
  defaultProps: {
    season: "Autumn menu",
    eyebrow: "In season now",
    headline: "Built around this week's harvest",
    note: "Our produce comes from farms within 50 miles. The menu changes as the season does.",
    items: [
      { name: "Roast pumpkin soup", description: "Sage brown butter, toasted seeds.", price: "$10", dietary: "V, GF" },
      { name: "Wild mushroom tagliatelle", description: "Chestnut, thyme, parmesan.", price: "$22", dietary: "V" },
      { name: "Venison loin", description: "Celeriac, blackberry, juniper jus.", price: "$34", dietary: "GF" },
      { name: "Spiced pear tarte tatin", description: "Cinnamon crème fraîche.", price: "$11", dietary: "V" },
    ],
  },
  Component: MenuSeasonal,
})
