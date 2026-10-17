"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD, SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import {
  ItemText,
  TIMELINE_HEADING,
  itemsOf,
  timelineItemsBlock,
  type TimelineItem,
} from "@/components/sections/timeline/timeline-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Chapters — storytelling archetype.
 *
 * The brand story told as alternating chapters: a large image on one side, the
 * year, title and narrative on the other, swapping sides every chapter. The
 * chapter rows are chrome; the headline and the chapters are slot entries.
 */
function TimelineStory ({ instance, isPreview, definition }: SectionComponentProps) {
  return (
    <section className="bg-background" style={SECTION_PADDING_STANDARD}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col items-center"
          align="center"
          entryClassName={(entry) =>
            entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
          }
          headingClassName={`${TYPE_H2} text-foreground mb-16 text-center`}
          renderItems={({ instance: inst }) => {
            const items = itemsOf<TimelineItem>(inst, "items")
            if (items.length === 0) return null
            return (
              <div className="space-y-20">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center",
                      i % 2 === 1 && "lg:[&>*:first-child]:order-2"
                    )}
                  >
                    <SectionMedia
                      instanceId={inst.id}
                      elementKey={`item-${i}-img`}
                      src={item.imageUrl}
                      alt={String(item.title ?? "")}
                      ratio="video"
                      placeholder="landscape"
                      rounded="lg"
                      collectionKey="items"
                      collectionIndex={i}
                      itemSrcProp="imageUrl"
                      itemAltProp="title"
                      isPreview={isPreview}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="bg-muted"
                    />
                    <div>
                      <ItemText
                        as="div"
                        instance={inst}
                        collection="items"
                        index={i}
                        field="year"
                        elementId={`year${i}`}
                        value={item.year}
                        isPreview={isPreview}
                        className="text-sm font-semibold mb-3 text-primary"
                      />
                      <ItemText
                        as="h3"
                        instance={inst}
                        collection="items"
                        index={i}
                        field="title"
                        elementId={`title${i}`}
                        labelProp
                        value={item.title}
                        isPreview={isPreview}
                        className="text-2xl font-semibold text-foreground"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="items"
                        index={i}
                        field="body"
                        elementId={`body${i}`}
                        value={item.body}
                        isPreview={isPreview}
                        className="mt-4 text-base leading-7 text-muted-foreground"
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

export const timelineStorySection = defineSection({
  id: "timeline-story",
  displayName: "Chapters",
  description: "Brand story in alternating chapters — a large image beside each year, title and narrative.",
  category: "timeline",
  layoutArchetype: "storytelling",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["agency", "creative", "portfolio", "nonprofit", "startup", "generic", "other", "travel"],
  trustWeight: 40,
  conversionWeight: 20,
  funnelStage: 'consideration',
  styles: ["editorial", "modern", "minimal", "bold"],
  goals: ["brand", "trust", "awareness", "engagement"],
  complexity: "high",
  density: "low",
  imageRequired: true,
  mobileScore: 80,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      TIMELINE_HEADING,
      timelineItemsBlock({
        label: "Story chapters",
        yearLabel: "Year",
        bodyLabel: "Narrative",
        minItems: 1,
        maxItems: 6,
        withImage: true,
        newItem: () => ({ year: "2024", title: "Chapter title", body: "Tell this part of the story.", status: "done" }),
      }),
    ],
  },
  defaultProps: {
    headline: "Our story so far",
    items: [
      { year: "2012", title: "A workshop and a stubborn idea", body: "It started at a borrowed workbench, with a belief that everyday things could be made beautifully and built to last.", status: "done" },
      { year: "2017", title: "Finding our people", body: "Our first shop opened on a quiet side street. Within a year it had become a gathering place for makers and neighbours alike.", status: "done" },
      { year: "2024", title: "Crafting what comes next", body: "Today a team of thirty carries the same care into every piece — and into the partnerships that will shape our next decade.", status: "active" },
    ],
  },
  Component: TimelineStory,
})
