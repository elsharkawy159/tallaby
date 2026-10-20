"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  headingBlock,
  itemField,
  itemsOf,
  menuItemsBlock,
  stretchItems,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

type Dish = { name?: string; description?: string; price?: string; dietary?: string }
type Category = { label?: string; items?: Dish[] }

/** The collapsible panels. Its own component so the open-panel state is a real hook. */
function CategoryPanels ({ instance, isPreview }: { instance: SectionInstance; isPreview?: boolean }) {
  const categories = itemsOf<Category>(instance, "categories")
  // Index-keyed: categories often share a label while being drafted.
  const [open, setOpen] = useState<number | null>(0)
  if (categories.length === 0) return null

  return (
    <div className="space-y-2">
      {categories.map((cat, ci) => {
        const isOpen = open === ci
        return (
          <div key={ci} className="overflow-hidden rounded-xl border border-border bg-card">
            {/* The whole row toggles; while editing, clicks on the label stay with the editor. */}
            <div
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : ci)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setOpen(isOpen ? null : ci)
                }
              }}
              className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-start transition hover:bg-muted/30"
            >
              <span onClick={isPreview ? undefined : (e) => e.stopPropagation()}>
                <ItemText
                  instance={instance}
                  collection="categories"
                  index={ci}
                  field="label"
                  value={cat.label}
                  isPreview={isPreview}
                  className="font-semibold text-foreground"
                />
              </span>
              <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </div>
            {isOpen && (
              <div className="space-y-4 border-t border-border px-5 pb-5 pt-4">
                {(Array.isArray(cat.items) ? cat.items : []).map((item, ii) => (
                  <div key={ii} className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-foreground">{item.name}</span>
                        {item.dietary && <span className="text-xs italic text-muted-foreground/70">{item.dietary}</span>}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <span className="shrink-0 font-semibold text-primary">{item.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Fold — accordion archetype.
 *
 * Long menus kept compact: one collapsible panel per category, the first open,
 * each revealing its dishes and prices.
 */
function MenuAccordion ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer className="max-w-2xl">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-start"
          entryClassName={stretchItems}
          align="left"
          headingClassName={`${TYPE_H2_SM} mb-8 text-foreground`}
          renderItems={({ instance: inst }) => <CategoryPanels instance={inst} isPreview={isPreview} />}
        />
      </SectionContainer>
    </section>
  )
}

export const menuAccordionSection = defineSection({
  id: "menu-accordion",
  displayName: "Fold",
  description: "Collapsible category panels that keep a long menu compact.",
  category: "menu",
  layoutArchetype: "accordion",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "cafe", "catering", "food_delivery"],
  styles: ["minimal", "modern", "corporate"],
  goals: ["sales", "engagement"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  tags: ["menu", "accordion", "collapsible", "restaurant"],
  funnelStage: "consideration",
  conversionWeight: 55,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      headingBlock({ aiHint: "Menu headline (1–4 words)", maxLength: 40 }),
      menuItemsBlock({
        key: "categories",
        label: "Categories",
        canonical: "items",
        minItems: 1,
        maxItems: 8,
        newItem: () => ({ label: "Category", items: [] }),
        fields: [
          itemField("label", "Category name", { aiHint: "e.g. Starters, Mains", maxLength: 40, group: "content" }),
        ],
      }),
    ],
  },
  defaultProps: {
    headline: "Our menu",
    categories: [
      {
        label: "Starters",
        items: [
          { name: "Whipped feta", description: "Hot honey, pistachio, warm pita.", price: "$11", dietary: "V" },
          { name: "Crispy pork belly", description: "Apple slaw, cider glaze.", price: "$14", dietary: "" },
        ],
      },
      {
        label: "Mains",
        items: [
          { name: "Grilled sea bass", description: "Salsa verde, crushed potatoes.", price: "$27", dietary: "GF" },
          { name: "Aubergine parmigiana", description: "Basil, mozzarella, tomato.", price: "$19", dietary: "V" },
          { name: "Sirloin steak", description: "Béarnaise, watercress, fries.", price: "$32", dietary: "GF" },
        ],
      },
      {
        label: "Desserts",
        items: [
          { name: "Sticky toffee pudding", description: "Butterscotch, clotted cream.", price: "$10", dietary: "V" },
          { name: "Mango sorbet", description: "Lime, toasted coconut.", price: "$8", dietary: "V, GF" },
        ],
      },
    ],
  },
  Component: MenuAccordion,
})
