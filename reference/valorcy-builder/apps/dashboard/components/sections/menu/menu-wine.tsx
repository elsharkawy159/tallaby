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
  stretchItems,
  textOr,
  textOverride,
} from "@/components/sections/menu/menu-parts"
import type { FieldSpec } from "@/components/sections/schema/section-schema"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Wine = { name?: string; producer?: string; region?: string; vintage?: string; glass?: string; bottle?: string; category?: string }

/** Table column headings — hardcoded before they were settings, so these are the fallbacks. */
const COLUMN_LABELS = [
  { key: "labelWine", label: "Column: wine", fallback: "Wine" },
  { key: "labelRegion", label: "Column: region", fallback: "Region" },
  { key: "labelVintage", label: "Column: vintage", fallback: "Vintage" },
  { key: "labelGlass", label: "Column: glass", fallback: "Glass" },
  { key: "labelBottle", label: "Column: bottle", fallback: "Bottle" },
] as const

const GRID = "sm:grid-cols-[1fr_8rem_6rem_5rem_5rem]"

/**
 * Cellar — matrix archetype.
 *
 * A sommelier's list as a table: wines down the side grouped by style,
 * producer, region, vintage and glass / bottle prices across the top. On small
 * screens each wine collapses into its own soft card.
 */
function MenuWine ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const wines = itemsOf<Wine>(inst, "wines")
            if (wines.length === 0) return null
            const [wine, region, vintage, glass, bottle] = COLUMN_LABELS.map((c) => textOr(inst, c.key, c.fallback))
            return (
              <div className="mt-10 text-start">
                <div className={`mb-2 hidden gap-4 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 sm:grid ${GRID}`}>
                  <span>{wine}</span>
                  <span>{region}</span>
                  <span>{vintage}</span>
                  <span className="text-center">{glass}</span>
                  <span className="text-center">{bottle}</span>
                </div>
                <div className="space-y-8">
                  {groupByCategory(wines, "Wine").map(([cat, list]) => (
                    <div key={cat}>
                      <h3 className="mb-3 border-b border-border pb-2 text-xs font-semibold text-primary">{cat}</h3>
                      <div className="space-y-3">
                        {list.map(({ item: w, index: gi }) => (
                          <div
                            key={gi}
                            className={`grid grid-cols-1 gap-1 rounded-xl border border-border/40 bg-card/50 p-4 sm:items-center sm:gap-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 ${GRID}`}
                          >
                            <div>
                              <ItemText as="p" instance={inst} collection="wines" index={gi} field="name" value={w.name} isPreview={isPreview} className="font-semibold text-foreground" />
                              <ItemText as="p" instance={inst} collection="wines" index={gi} field="producer" value={w.producer} isPreview={isPreview} className="text-xs text-muted-foreground" />
                            </div>
                            <ItemText instance={inst} collection="wines" index={gi} field="region" value={w.region} isPreview={isPreview} className="text-sm text-muted-foreground" />
                            <ItemText instance={inst} collection="wines" index={gi} field="vintage" value={w.vintage} isPreview={isPreview} className="text-sm text-muted-foreground" />
                            <ItemText instance={inst} collection="wines" index={gi} field="glass" value={w.glass} isPreview={isPreview} className="text-sm font-semibold text-foreground sm:text-center" />
                            <ItemText instance={inst} collection="wines" index={gi} field="bottle" value={w.bottle} isPreview={isPreview} className="text-sm font-semibold text-foreground sm:text-center" />
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

export const menuWineSection = defineSection({
  id: "menu-wine",
  displayName: "Cellar",
  description: "Sommelier's wine list as a table — producer, region, vintage, glass and bottle prices.",
  category: "menu",
  layoutArchetype: "matrix",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "hotel", "catering"],
  styles: ["editorial", "minimal", "corporate"],
  goals: ["sales", "engagement"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["menu", "wine", "sommelier", "drinks"],
  funnelStage: "consideration",
  conversionWeight: 55,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–2 words)", maxLength: 20 }),
      headingBlock({ aiHint: "Wine list headline (3–6 words)", maxLength: 60 }),
      menuItemsBlock({
        key: "wines",
        label: "Wines",
        minItems: 1,
        maxItems: 30,
        newItem: () => ({ name: "Wine name", producer: "Producer", region: "Region, Country", vintage: "2020", glass: "$0", bottle: "$0", category: "White" }),
        fields: [
          itemField("name", "Wine name", { canonical: "headline", aiHint: "Wine name", maxLength: 60, group: "content" }),
          itemField("producer", "Producer", { aiHint: "Winery or producer name", maxLength: 60, group: "content" }),
          itemField("region", "Region", { aiHint: "e.g. Bordeaux, France", maxLength: 50, group: "content" }),
          itemField("vintage", "Vintage", { aiHint: "e.g. 2021 or NV", maxLength: 10, group: "content" }),
          itemField("glass", "Glass price", { aiHint: "e.g. $18", maxLength: 12, group: "content" }),
          itemField("bottle", "Bottle price", { aiHint: "e.g. $72", maxLength: 12, group: "content" }),
          itemField("category", "Category", { aiHint: "e.g. White, Red, Sparkling", maxLength: 20, group: "content" }),
        ],
      }),
    ],
    settings: COLUMN_LABELS.map(
      (c): FieldSpec => ({ key: c.key, label: c.label, type: "text", maxLength: 20, group: "content", default: c.fallback })
    ),
  },
  defaultProps: {
    eyebrow: "Wine list",
    headline: "Chosen by our sommelier",
    wines: [
      { name: "Sancerre", producer: "Domaine Vacheron", region: "Loire, France", vintage: "2022", glass: "$16", bottle: "$64", category: "White" },
      { name: "Albariño", producer: "Pazo de Señorans", region: "Rías Baixas, Spain", vintage: "2021", glass: "$14", bottle: "$56", category: "White" },
      { name: "Châteauneuf-du-Pape", producer: "Domaine du Vieux Télégraphe", region: "Rhône, France", vintage: "2018", glass: "$22", bottle: "$96", category: "Red" },
      { name: "Pinot Noir", producer: "Felton Road", region: "Central Otago, NZ", vintage: "2017", glass: "$20", bottle: "$88", category: "Red" },
      { name: "Brut Réserve", producer: "Billecart-Salmon", region: "Champagne, France", vintage: "NV", glass: "$24", bottle: "$110", category: "Sparkling" },
    ],
  },
  Component: MenuWine,
})
