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

type Special = { name?: string; description?: string; price?: string; badge?: string; image?: string }

const PHOTO = placeholderFor("product")

/**
 * Specials — captioned-grid archetype.
 *
 * Today's dishes as three photo cards, each tagged with a corner label
 * ("Chef's pick", "Seasonal") and captioned with name, price and description.
 */
function MenuDailySpecials ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const specials = itemsOf<Special>(inst, "specials")
            if (specials.length === 0) return null
            return (
              <div className="mt-10 grid grid-cols-1 gap-6 text-start sm:grid-cols-3">
                {specials.map((s, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-3xl border border-border bg-card">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {s.image ? (
                        <SectionEditableImage
                          instanceId={inst.id}
                          elementKey={`spec-${i}`}
                          src={s.image}
                          alt={s.name ?? ""}
                          collectionKey="specials"
                          collectionIndex={i}
                          itemSrcProp="image"
                          isPreview={isPreview}
                          className="absolute inset-0 size-full object-cover transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted" />
                      )}
                      {s.badge && (
                        <span className="absolute start-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                          <ItemText instance={inst} collection="specials" index={i} field="badge" value={s.badge} isPreview={isPreview} />
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <ItemText
                          as="h3"
                          instance={inst}
                          collection="specials"
                          index={i}
                          field="name"
                          value={s.name}
                          isPreview={isPreview}
                          className="font-semibold text-foreground"
                        />
                        <ItemText
                          instance={inst}
                          collection="specials"
                          index={i}
                          field="price"
                          value={s.price}
                          isPreview={isPreview}
                          className="shrink-0 font-semibold text-primary"
                        />
                      </div>
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="specials"
                        index={i}
                        field="description"
                        value={s.description}
                        isPreview={isPreview}
                        className="mt-1.5 text-sm leading-relaxed text-muted-foreground"
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

export const menuDailySpecialsSection = defineSection({
  id: "menu-daily-specials",
  displayName: "Specials",
  description: "Today's dishes as captioned photo cards, each with a corner label and price.",
  category: "menu",
  layoutArchetype: "captioned-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "cafe", "catering", "hotel"],
  styles: ["modern", "bold", "editorial"],
  goals: ["sales", "engagement", "brand"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  tags: ["menu", "specials", "daily", "chef"],
  funnelStage: "consideration",
  conversionWeight: 65,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Specials headline (5–10 words)", maxLength: 80 }),
      menuItemsBlock({
        key: "specials",
        label: "Specials",
        minItems: 1,
        maxItems: 6,
        newItem: () => ({ name: "Dish name", description: "Description.", price: "$0", badge: "Special", image: "" }),
        fields: [
          itemField("image", "Dish photo", { type: "image" }),
          itemField("badge", "Badge label", { aiHint: "e.g. Chef's pick, Seasonal", maxLength: 20, group: "content" }),
          itemField("name", "Name", { canonical: "headline", aiHint: "Dish name", maxLength: 60, group: "content" }),
          itemField("description", "Description", { type: "textarea", canonical: "body", aiHint: "Ingredients (1 sentence)", maxLength: 140, group: "content" }),
          itemField("price", "Price", { aiHint: "e.g. $28 or Market price", maxLength: 20, group: "content" }),
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Today only",
    headline: "What the kitchen is excited about today",
    specials: [
      { name: "Market fish", description: "Today's catch, grilled whole with lemon and herbs.", price: "Market price", badge: "Chef's pick", image: PHOTO },
      { name: "Spring lamb shoulder", description: "Slow roasted, with minted peas and jus.", price: "$32", badge: "Seasonal", image: PHOTO },
      { name: "Rhubarb crumble", description: "Oat streusel, warm custard.", price: "$11", badge: "New", image: PHOTO },
    ],
  },
  Component: MenuDailySpecials,
})
