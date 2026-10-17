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
  headingBlock,
  itemField,
  itemsOf,
  menuItemsBlock,
  stretchItems,
  textOverride,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Dish = { name?: string; description?: string; price?: string; dietary?: string }
type Col = { heading?: string; items?: Dish[] }

/**
 * Diptych — divided-grid archetype.
 *
 * Two menu columns side by side, split by a vertical hairline — starters on
 * one side, mains on the other. Each column's heading is inline-editable; its
 * dishes are stored on the column.
 */
function MenuTwoCol ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const cols = itemsOf<Col>(inst, "cols")
            if (cols.length === 0) return null
            return (
              <div className="mt-12 grid gap-10 text-start sm:grid-cols-2 sm:divide-x sm:divide-border">
                {cols.map((col, ci) => (
                  <div key={ci} className={ci > 0 ? "sm:ps-10" : ""}>
                    <ItemText
                      as="h3"
                      instance={inst}
                      collection="cols"
                      index={ci}
                      field="heading"
                      value={col.heading}
                      isPreview={isPreview}
                      className="mb-6 border-b border-border pb-3 text-lg font-semibold text-foreground"
                    />
                    <div className="space-y-5">
                      {(Array.isArray(col.items) ? col.items : []).map((item, ii) => (
                        <div key={ii} className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="font-medium text-foreground">{item.name}</span>
                              {item.dietary && <span className="text-xs italic text-muted-foreground/70">{item.dietary}</span>}
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <span className="shrink-0 font-semibold text-foreground">{item.price}</span>
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

export const menuTwoColSection = defineSection({
  id: "menu-two-col",
  displayName: "Diptych",
  description: "Two menu columns split by a hairline — starters beside mains.",
  category: "menu",
  layoutArchetype: "divided-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "catering", "cafe", "hotel"],
  styles: ["minimal", "modern", "editorial"],
  goals: ["sales", "engagement"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 94,
  editable: true,
  tags: ["menu", "two-col", "split", "restaurant"],
  funnelStage: "consideration",
  conversionWeight: 55,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Menu headline (3–7 words)", maxLength: 70 }),
      menuItemsBlock({
        key: "cols",
        label: "Columns",
        canonical: "items",
        minItems: 2,
        maxItems: 2,
        newItem: () => ({ heading: "Section", items: [] }),
        fields: [
          itemField("heading", "Column heading", { canonical: "headline", aiHint: "Column section heading", maxLength: 50, group: "content" }),
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "À la carte",
    headline: "Start light, finish generous",
    cols: [
      {
        heading: "Starters",
        items: [
          { name: "Grilled halloumi", description: "Watermelon, mint, chilli honey.", price: "$12", dietary: "V" },
          { name: "Beef carpaccio", description: "Rocket, parmesan, truffle aioli.", price: "$15", dietary: "" },
          { name: "Roasted carrot soup", description: "Ginger, coconut, coriander.", price: "$9", dietary: "V, GF" },
        ],
      },
      {
        heading: "Mains",
        items: [
          { name: "Herb-crusted salmon", description: "Fennel, citrus, new potatoes.", price: "$27", dietary: "GF" },
          { name: "Spinach & ricotta gnocchi", description: "Sage butter, toasted hazelnut.", price: "$21", dietary: "V" },
          { name: "Half roast chicken", description: "Garlic, thyme, charred greens.", price: "$24", dietary: "GF" },
        ],
      },
    ],
  },
  Component: MenuTwoCol,
})
