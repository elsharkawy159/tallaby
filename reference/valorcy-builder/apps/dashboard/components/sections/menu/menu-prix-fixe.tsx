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
  noteBlock,
  stretchItems,
  textOverride,
} from "@/components/sections/menu/menu-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Course = { courseLabel?: string; name?: string; description?: string; dietary?: string }

/**
 * Prix Fixe — side-label archetype.
 *
 * A set menu read top to bottom: each course's label sits in a narrow rail on
 * the start side, the dish beside it, courses split by hairlines. The price per
 * person sits under the headline and a small-print note closes the card.
 */
function MenuPrixFixe ({ instance, isPreview, definition }: SectionComponentProps) {
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
            price: textOverride("price", "mt-3 text-lg font-semibold text-primary", isPreview),
            note: textOverride(
              "note",
              "mt-12 w-full border-t border-border pt-8 text-center text-xs italic leading-relaxed text-muted-foreground/70",
              isPreview
            ),
          }}
          renderItems={({ instance: inst }) => {
            const courses = itemsOf<Course>(inst, "courses")
            if (courses.length === 0) return null
            return (
              <div className="mt-12 space-y-8 text-start">
                {courses.map((c, i) => (
                  <div key={i} className="grid grid-cols-[5rem_1fr] gap-6 border-t border-border pt-8 first:border-0 first:pt-0">
                    <div className="text-end">
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="courses"
                        index={i}
                        field="courseLabel"
                        value={c.courseLabel}
                        isPreview={isPreview}
                        className="text-xs font-semibold text-primary"
                      />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
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
                        {c.dietary && <span className="text-xs font-semibold italic text-muted-foreground/70">{c.dietary}</span>}
                      </div>
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="courses"
                        index={i}
                        field="description"
                        value={c.description}
                        isPreview={isPreview}
                        className="mt-1 text-sm leading-relaxed text-muted-foreground"
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

export const menuPrixFixeSection = defineSection({
  id: "menu-prix-fixe",
  displayName: "Prix Fixe",
  description: "Set menu — course labels on a side rail beside each dish, priced per person.",
  category: "menu",
  layoutArchetype: "side-label",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "catering", "hotel"],
  styles: ["editorial", "minimal", "corporate"],
  goals: ["sales", "engagement", "bookings"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 96,
  editable: true,
  tags: ["menu", "prix-fixe", "tasting", "set-menu", "restaurant"],
  funnelStage: "consideration",
  conversionWeight: 65,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Set menu headline (4–8 words)", maxLength: 70 }),
      noteBlock({ key: "price", label: "Price per person", aiHint: "e.g. $95 per person", maxLength: 30 }),
      menuItemsBlock({
        key: "courses",
        label: "Courses",
        minItems: 1,
        maxItems: 10,
        newItem: () => ({ courseLabel: "Course", name: "Dish name", description: "Dish description.", dietary: "" }),
        fields: [
          itemField("courseLabel", "Course label", { aiHint: "e.g. First, Second, Dessert", maxLength: 20, group: "content" }),
          itemField("name", "Dish name", { canonical: "headline", aiHint: "Dish name in full", maxLength: 60, group: "content" }),
          itemField("description", "Description", { type: "textarea", canonical: "body", aiHint: "Ingredients and technique (1–2 sentences)", maxLength: 180, group: "content" }),
          itemField("dietary", "Dietary note", { aiHint: "e.g. V, GF, Vegan", maxLength: 30, group: "content" }),
        ],
      }),
      noteBlock(
        { key: "note", label: "Footer note", type: "textarea", canonical: "body", aiHint: "Wine pairing, dietary note, or supplement info", maxLength: 200 },
        { label: "Footer note" }
      ),
    ],
  },
  defaultProps: {
    eyebrow: "Set menu",
    headline: "Five courses, one evening",
    price: "$95 per person",
    note: "Wine pairing available for $55. Please let us know about any allergies when booking.",
    courses: [
      { courseLabel: "First", name: "Chilled pea velouté", description: "Mint oil, crème fraîche, crisp shallot.", dietary: "V" },
      { courseLabel: "Second", name: "Seared scallops", description: "Cauliflower purée, brown butter, capers.", dietary: "GF" },
      { courseLabel: "Third", name: "Roast lamb loin", description: "Smoked aubergine, salsa verde, jus.", dietary: "GF" },
      { courseLabel: "Cheese", name: "Aged comté", description: "Quince paste, walnut bread.", dietary: "V" },
      { courseLabel: "Dessert", name: "Burnt honey tart", description: "Bay leaf ice cream, almond crumb.", dietary: "V" },
    ],
  },
  Component: MenuPrixFixe,
})
