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
  PropText,
  eyebrowBlock,
  headingBlock,
  itemField,
  itemsOf,
  menuItemsBlock,
  noteBlock,
  stretchItems,
  textOr,
  textOverride,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Course = { number?: string; name?: string; description?: string; pairing?: string }

/** The per-course pairing prefix, hardcoded before it was a setting. */
const PAIRING_LABEL_FALLBACK = "Pairing:"

/**
 * Degustation — numbered-list archetype.
 *
 * A tasting menu read as a sequence: oversized course numbers in a gutter, the
 * dish and an optional wine pairing beside each. The price per person and the
 * pairing supplement sit in their own row under the headline.
 */
function MenuTasting ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer className="max-w-3xl">
        <div className="mb-12 text-center">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col items-center"
            align="center"
            headingClassName={`${TYPE_H2_SM} text-foreground`}
            overrides={{
              eyebrow: textOverride("eyebrow", `mb-2 ${MENU_EYEBROW_CLASS}`, isPreview),
            }}
          />
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="pricing"
            className="mt-3 flex items-center justify-center gap-4 text-sm text-muted-foreground"
            overrides={{
              price: textOverride("price", "font-semibold text-foreground", isPreview, { as: "span" }),
              pairingPrice: ({ instance: inst }) => {
                if (typeof inst.props.pairingPrice !== "string") return null
                return (
                  <span className="flex items-center gap-4">
                    <span aria-hidden>·</span>
                    <PropText instance={inst} propKey="pairingPrice" isPreview={isPreview} />
                  </span>
                )
              },
            }}
          />
        </div>

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="courses"
          className="flex flex-col"
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const courses = itemsOf<Course>(inst, "courses")
            if (courses.length === 0) return null
            const pairingLabel = textOr(inst, "pairingLabel", PAIRING_LABEL_FALLBACK)
            return (
              <div className="space-y-0 divide-y divide-border">
                {courses.map((c, i) => (
                  <div key={i} className="grid grid-cols-[3rem_1fr] gap-6 py-7">
                    <div className="pt-0.5 text-end text-2xl font-semibold tabular-nums text-border">
                      <ItemText instance={inst} collection="courses" index={i} field="number" value={c.number} isPreview={isPreview} />
                    </div>
                    <div>
                      <ItemText
                        as="h3"
                        instance={inst}
                        collection="courses"
                        index={i}
                        field="name"
                        value={c.name}
                        isPreview={isPreview}
                        className="font-semibold text-foreground"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="courses"
                        index={i}
                        field="description"
                        value={c.description}
                        isPreview={isPreview}
                        className="mt-1 text-sm text-muted-foreground"
                      />
                      {c.pairing && (
                        <p className="mt-2 text-xs italic text-primary">
                          {pairingLabel}{" "}
                          <ItemText instance={inst} collection="courses" index={i} field="pairing" value={c.pairing} isPreview={isPreview} />
                        </p>
                      )}
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

export const menuTastingSection = defineSection({
  id: "menu-tasting",
  displayName: "Degustation",
  description: "Numbered multi-course tasting menu with an optional wine pairing per course.",
  category: "menu",
  layoutArchetype: "numbered-list",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "hotel", "catering"],
  styles: ["editorial", "minimal", "modern"],
  goals: ["sales", "bookings", "brand"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  tags: ["menu", "tasting", "degustation", "fine-dining"],
  funnelStage: "consideration",
  conversionWeight: 70,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "pricing", label: "Pricing", eject: { direction: "row" } },
      { id: "courses", label: "Courses" },
    ],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Menu headline (4–8 words)", maxLength: 70 }),
      noteBlock({ key: "price", label: "Price per person", aiHint: "e.g. $185 per person", maxLength: 30 }, { slot: "pricing" }),
      noteBlock(
        { key: "pairingPrice", label: "Pairing supplement", aiHint: "e.g. Wine pairing +$95", maxLength: 40 },
        { slot: "pricing" }
      ),
      menuItemsBlock({
        key: "courses",
        label: "Courses",
        slot: "courses",
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ number: "01", name: "Course name", description: "Description.", pairing: "" }),
        fields: [
          itemField("number", "Course number", { aiHint: "e.g. 01, 02", maxLength: 4, group: "content" }),
          itemField("name", "Course name", { canonical: "headline", aiHint: "Dish name", maxLength: 60, group: "content" }),
          itemField("description", "Description", { type: "textarea", canonical: "body", aiHint: "Ingredients (1 sentence)", maxLength: 160, group: "content" }),
          itemField("pairing", "Wine pairing", { aiHint: "e.g. 2021 Chablis Premier Cru (optional)", maxLength: 80, group: "content" }),
        ],
      }),
    ],
    settings: [
      { key: "pairingLabel", label: "Pairing prefix", type: "text", maxLength: 20, group: "content", default: PAIRING_LABEL_FALLBACK },
    ],
  },
  defaultProps: {
    eyebrow: "Tasting menu",
    headline: "Six courses through the season",
    price: "$145 per person",
    pairingPrice: "Wine pairing +$85",
    courses: [
      { number: "01", name: "Oyster & green apple", description: "Shiso granita, finger lime.", pairing: "" },
      { number: "02", name: "Hand-dived scallop", description: "Cauliflower, golden raisin, curry oil.", pairing: "2022 Grüner Veltliner, Wachau" },
      { number: "03", name: "Heritage beetroot", description: "Goat's curd, hazelnut, aged balsamic.", pairing: "2021 Pinot Noir, Central Otago" },
      { number: "04", name: "Turbot", description: "Mussels, sea vegetables, saffron.", pairing: "2020 Chablis Premier Cru" },
      { number: "05", name: "Aged duck", description: "Plum, chicory, five spice jus.", pairing: "2018 Barolo, Piedmont" },
      { number: "06", name: "Dark chocolate", description: "Miso caramel, sesame, milk ice cream.", pairing: "Ten-year tawny port" },
    ],
  },
  Component: MenuTasting,
})
