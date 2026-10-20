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
  noteBlock,
  stretchItems,
  textOr,
  textOverride,
} from "@/components/sections/menu/menu-parts"
import type { FieldSpec } from "@/components/sections/schema/section-schema"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type CoffeeItem = { name?: string; description?: string; sizeS?: string; sizeM?: string; sizeL?: string; category?: string }

/** Size column headings — hardcoded before they were settings, so these are the fallbacks. */
const SIZE_LABELS = [
  { key: "labelSizeS", field: "sizeS", label: "Column: small", fallback: "S" },
  { key: "labelSizeM", field: "sizeM", label: "Column: medium", fallback: "M" },
  { key: "labelSizeL", field: "sizeL", label: "Column: large", fallback: "L" },
] as const

const ROW = "grid grid-cols-[1fr_4rem_4rem_4rem] gap-2"

/**
 * Roastery — price-columns archetype.
 *
 * A coffee-bar board: drinks grouped by style, each priced across small /
 * medium / large columns (an em dash where a size isn't offered), closed by a
 * milk-alternatives note.
 */
function MenuCoffee ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer className="max-w-2xl">
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
            milkNote: textOverride("milkNote", "mt-8 text-center text-xs italic text-muted-foreground/70", isPreview),
          }}
          renderItems={({ instance: inst }) => {
            const items = itemsOf<CoffeeItem>(inst, "items")
            if (items.length === 0) return null
            return (
              <div className="mt-10 text-start">
                <div className={`mb-2 pe-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 ${ROW}`}>
                  <span />
                  {SIZE_LABELS.map((s) => (
                    <span key={s.key} className="text-center">{textOr(inst, s.key, s.fallback)}</span>
                  ))}
                </div>
                <div className="space-y-8">
                  {groupByCategory(items, "Coffee").map(([cat, coffees]) => (
                    <div key={cat}>
                      <h3 className="mb-3 border-b border-border pb-2 text-xs font-semibold text-primary">{cat}</h3>
                      <div className="space-y-3">
                        {coffees.map(({ item, index: gi }) => (
                          <div key={gi} className={`items-center ${ROW}`}>
                            <div>
                              <ItemText as="p" instance={inst} collection="items" index={gi} field="name" value={item.name} isPreview={isPreview} className="text-sm font-semibold text-foreground" />
                              <ItemText as="p" instance={inst} collection="items" index={gi} field="description" value={item.description} isPreview={isPreview} className="text-xs text-muted-foreground" />
                            </div>
                            {SIZE_LABELS.map((s) => (
                              <span key={s.field} className="text-center text-sm font-medium text-foreground">
                                {item[s.field] || "—"}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const menuCoffeeSection = defineSection({
  id: "menu-coffee",
  displayName: "Roastery",
  description: "Coffee-bar board — drinks priced across small, medium and large columns.",
  category: "menu",
  layoutArchetype: "price-columns",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["cafe", "bakery", "restaurant"],
  styles: ["minimal", "modern", "editorial"],
  goals: ["sales", "engagement"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 94,
  editable: true,
  tags: ["menu", "coffee", "cafe", "drinks", "sizes"],
  funnelStage: "consideration",
  conversionWeight: 55,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–2 words)", maxLength: 20 }),
      headingBlock({ aiHint: "Drinks headline (3–6 words)", maxLength: 60 }),
      menuItemsBlock({
        key: "items",
        label: "Drinks",
        minItems: 1,
        maxItems: 30,
        newItem: () => ({ name: "Drink name", description: "Description.", sizeS: "$0", sizeM: "", sizeL: "", category: "Coffee" }),
        fields: [
          itemField("name", "Name", { canonical: "headline", aiHint: "Drink name", maxLength: 40, group: "content" }),
          itemField("description", "Description", { canonical: "body", aiHint: "Short description", maxLength: 80, group: "content" }),
          itemField("sizeS", "Small price", { aiHint: "e.g. $4.5", maxLength: 10, group: "content" }),
          itemField("sizeM", "Medium price", { aiHint: "e.g. $5.5 (leave blank if n/a)", maxLength: 10, group: "content" }),
          itemField("sizeL", "Large price", { aiHint: "e.g. $6.5 (leave blank if n/a)", maxLength: 10, group: "content" }),
          itemField("category", "Category", { aiHint: "e.g. Espresso, Filter, Specialty", maxLength: 30, group: "content" }),
        ],
      }),
      noteBlock(
        { key: "milkNote", label: "Milk note", canonical: "body", aiHint: "Milk alternatives note (1 sentence)", maxLength: 80 },
        { label: "Milk note" }
      ),
    ],
    settings: SIZE_LABELS.map(
      (s): FieldSpec => ({ key: s.key, label: s.label, type: "text", maxLength: 10, group: "content", default: s.fallback })
    ),
  },
  defaultProps: {
    eyebrow: "Coffee bar",
    headline: "Roasted in-house, pulled to order",
    milkNote: "Oat, almond and soy milk available at no extra charge.",
    items: [
      { name: "Espresso", description: "Double shot, seasonal single origin.", sizeS: "$3.5", sizeM: "", sizeL: "", category: "Espresso" },
      { name: "Flat white", description: "Velvety micro-foam, double ristretto.", sizeS: "$4.5", sizeM: "$5.2", sizeL: "", category: "Espresso" },
      { name: "Cappuccino", description: "Equal parts espresso, milk, foam.", sizeS: "$4.5", sizeM: "$5.2", sizeL: "$5.8", category: "Espresso" },
      { name: "Batch brew", description: "Rotating filter roast.", sizeS: "$3.8", sizeM: "$4.4", sizeL: "", category: "Filter" },
      { name: "Iced oat latte", description: "Cold milk, espresso, vanilla optional.", sizeS: "$5.5", sizeM: "$6.2", sizeL: "", category: "Specialty" },
      { name: "Matcha latte", description: "Ceremonial-grade matcha, steamed milk.", sizeS: "$5", sizeM: "$5.8", sizeL: "", category: "Specialty" },
    ],
  },
  Component: MenuCoffee,
})
