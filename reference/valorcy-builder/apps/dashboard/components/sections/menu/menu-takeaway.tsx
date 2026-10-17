"use client"

import { Clock, Phone } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  FlatLinkAction,
  ItemText,
  MENU_EYEBROW_CLASS,
  PropText,
  eyebrowBlock,
  flatActionBlocks,
  headingBlock,
  itemField,
  itemsOf,
  menuItemsBlock,
  noteBlock,
  stretchItems,
  textOverride,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type MenuItem = { name?: string; description?: string; price?: string }

/** The phone line's lead-in, hardcoded before it was a block. */
const CALL_LABEL_FALLBACK = "Call to order:"

/**
 * Collect — asymmetric archetype.
 *
 * A takeaway list in the wide column; a narrow sticky order card beside it
 * with the prep time, an online-order action and a call-to-order line.
 */
function MenuTakeaway ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
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
                <div className="divide-y divide-border">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 py-4">
                      <div className="flex-1">
                        <ItemText as="h3" instance={inst} collection="items" index={i} field="name" value={item.name} isPreview={isPreview} className="font-semibold text-foreground" />
                        <ItemText as="p" instance={inst} collection="items" index={i} field="description" value={item.description} isPreview={isPreview} className="mt-0.5 text-sm text-muted-foreground" />
                      </div>
                      <ItemText instance={inst} collection="items" index={i} field="price" value={item.price} isPreview={isPreview} className="shrink-0 font-semibold text-primary" />
                    </div>
                  ))}
                </div>
              )
            }}
          />

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="order"
              className="space-y-4 rounded-2xl border border-border bg-card p-6"
              overrides={{
                prepTime: ({ instance: inst }) => (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4 shrink-0 text-primary" aria-hidden />
                    <PropText instance={inst} propKey="prepTime" isPreview={isPreview} fallback="" />
                  </div>
                ),
                orderLabel: ({ instance: inst }) => (
                  <FlatLinkAction
                    instance={inst}
                    isPreview={isPreview}
                    labelProp="orderLabel"
                    hrefProp="orderHref"
                    fallback=""
                    hideEmpty={false}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
                  />
                ),
                // Carried by the button above; edited in the inspector.
                orderHref: () => null,
                // Drawn inside the phone line below so the line stays one row.
                callLabel: () => null,
                phone: ({ instance: inst }) => (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4 shrink-0" aria-hidden />
                    <PropText instance={inst} propKey="callLabel" isPreview={isPreview} fallback={CALL_LABEL_FALLBACK} />
                    <PropText instance={inst} propKey="phone" isPreview={isPreview} fallback="" className="font-semibold text-foreground" />
                  </div>
                ),
              }}
            />
          </aside>
        </div>
      </SectionContainer>
    </section>
  )
}

export const menuTakeawaySection = defineSection({
  id: "menu-takeaway",
  displayName: "Collect",
  description: "Takeaway list beside a sticky order card with prep time, order link and phone line.",
  category: "menu",
  layoutArchetype: "asymmetric",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "cafe", "food_delivery", "catering"],
  styles: ["minimal", "modern", "corporate"],
  goals: ["sales", "conversion", "bookings"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 93,
  editable: true,
  tags: ["menu", "takeaway", "click-collect", "order"],
  funnelStage: "decision",
  conversionWeight: 80,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Menu", isDefault: true },
      { id: "order", label: "Order card" },
    ],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–2 words)", maxLength: 20 }),
      headingBlock({ aiHint: "Takeaway headline (4–8 words)", maxLength: 70 }),
      menuItemsBlock({
        key: "items",
        label: "Menu items",
        minItems: 1,
        maxItems: 30,
        newItem: () => ({ name: "Item name", description: "Description.", price: "$0" }),
        fields: [
          itemField("name", "Name", { canonical: "headline", aiHint: "Dish name", maxLength: 60, group: "content" }),
          itemField("description", "Description", { type: "textarea", canonical: "body", aiHint: "Ingredients (1 sentence)", maxLength: 120, group: "content" }),
          itemField("price", "Price", { aiHint: "e.g. $14", maxLength: 12, group: "content" }),
        ],
      }),
      noteBlock({ key: "prepTime", label: "Prep time", aiHint: "e.g. Ready in 15–20 min", maxLength: 40 }, { slot: "order" }),
      ...flatActionBlocks({ labelKey: "orderLabel", hrefKey: "orderHref", labelText: "Order button label", hrefText: "Order link", labelAiHint: "CTA label (2–3 words)", maxLength: 24, slot: "order" }),
      noteBlock({ key: "callLabel", label: "Phone lead-in", maxLength: 30, group: "cta" }, { slot: "order", label: "Phone lead-in" }),
      noteBlock({ key: "phone", label: "Phone number", aiHint: "Phone number for call orders", maxLength: 30, group: "cta" }, { slot: "order" }),
    ],
  },
  defaultProps: {
    eyebrow: "Takeaway",
    headline: "Order ahead, pick up hot",
    prepTime: "Ready in 15–20 min",
    orderLabel: "Order online",
    orderHref: "#",
    callLabel: CALL_LABEL_FALLBACK,
    phone: "(555) 014-2290",
    items: [
      { name: "Chicken shawarma plate", description: "Garlic sauce, pickles, rice, salad.", price: "$15" },
      { name: "Lamb kofta wrap", description: "Tahini, tomato, parsley, sumac onion.", price: "$13" },
      { name: "Falafel box", description: "Hummus, tabbouleh, warm pita.", price: "$12" },
      { name: "Halloumi fries", description: "Za'atar, pomegranate molasses.", price: "$8" },
      { name: "Baklava (3 pieces)", description: "Pistachio, orange blossom syrup.", price: "$6" },
    ],
  },
  Component: MenuTakeaway,
})
