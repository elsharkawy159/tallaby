"use client"

import { memo, useMemo, useState } from "react"
import { useDraggable } from "@dnd-kit/react"
import { DND_TYPE } from "@/lib/builder/dnd/types"
import { Search } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import {
  CATEGORY_LABELS,
  SECTION_CATEGORY_ORDER,
} from "@/components/sections/categories"
import { sectionRegistry } from "@/components/sections"
import type {
  SectionCategory,
  SectionDefinition,
} from "@/components/sections/registry.types"
import { SectionPreviewCard } from "@/components/website-builder/section-preview-card"
import { useBuilderStore } from "@/lib/builder/store"
import { prepareSectionInstance } from "@/lib/builder/section-preparation"

const isDev = process.env.NODE_ENV === "development"

/** Spacing between preparation runs when a whole category is added at once. */
const BULK_PREPARE_STAGGER_MS = 400

const PaletteSectionCard = memo(function PaletteSectionCard({
  def,
  showPreview,
}: {
  def: SectionDefinition
  showPreview: boolean
}) {
  const { ref, isDragging } = useDraggable({
    id: `palette:${def.id}`,
    type: DND_TYPE.section,
    // Palette cards stay put while the builder's overlay chip follows the
    // pointer — the card is a source of new sections, not the section itself.
    data: useMemo(() => ({ drag: { source: "palette", sectionId: def.id } }), [def.id]),
  })

  return (
    <SectionPreviewCard
      ref={ref}
      def={def}
      showPreview={showPreview}
      isDragging={isDragging}
      className="cursor-grab active:cursor-grabbing"
    />
  )
})

export function LayoutsPalette() {
  const [q, setQ] = useState("")
  const addSectionsBulk = useBuilderStore((s) => s.addSectionsBulk)

  function handleAddCategorySections(sections: SectionDefinition[]) {
    const inserted = addSectionsBulk(
      sections.map((def) => def.id),
      { forceCanvas: true }
    )
    // Bulk-added sections used to keep their placeholder copy forever — they
    // never went through the preparation pipeline. Staggered so a whole category
    // doesn't fire a dozen simultaneous AI requests.
    inserted.forEach((instance, i) => {
      window.setTimeout(() => {
        void prepareSectionInstance(instance.id)
      }, i * BULK_PREPARE_STAGGER_MS)
    })
  }

  const categoriesWithSections = useMemo(() => {
    const all = sectionRegistry.getAll()
    const filtered = q.trim()
      ? all.filter(
          (d) =>
            d.displayName.toLowerCase().includes(q.toLowerCase()) ||
            d.description.toLowerCase().includes(q.toLowerCase())
        )
      : all

    return SECTION_CATEGORY_ORDER.map((cat) => ({
      category: cat,
      sections: filtered.filter((s) => s.category === cat),
    })).filter((c) => c.sections.length > 0)
  }, [q])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border p-3">
        <p className="mb-2 text-sm font-semibold">Layouts</p>
        <div className="relative">
          <Search className="pointer-events-none absolute top-2.5 start-2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search layouts…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="ps-8"
            aria-label="Search layouts"
          />
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <Accordion
          type="single"
          collapsible
          className="w-full px-2 pb-4"
          defaultValue={"navbar"}
        >
          {categoriesWithSections.map(({ category, sections }) => (
            <AccordionItem
              key={category}
              value={category}
              className="border-b-0"
            >
              <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                <span className="flex flex-1 items-center gap-2 text-start">
                  {CATEGORY_LABELS[category as SectionCategory]}
                  <Badge variant="secondary" className="ms-auto">
                    {sections.length}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {isDev && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mb-2 w-full"
                    onClick={() => handleAddCategorySections(sections)}
                  >
                    Add all {sections.length} to canvas
                  </Button>
                )}
                <div className="space-y-2 pb-2">
                  {sections.map((def) => (
                    <PaletteSectionCard key={def.id} def={def} showPreview />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  )
}
