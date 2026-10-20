"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { SECTION_PADDING_XL } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H1, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import { cn } from "@workspace/ui/lib/utils"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type TileItem = { title?: string; description?: string; image?: string }

/**
 * Mosaic — bento archetype.
 *
 * Signature move: an uneven bento of image tiles under a plain, full-width
 * headline. Tile sizes follow a fixed 4/2/3/3 rhythm that stays deliberate at every
 * breakpoint; tiles are flat muted surfaces, never bordered cards. Replaces `hero-bento` and
 * `hero-image-bg` — the latter was even *named* "Hero — bento", a duplicate.
 */

/** Uneven but repeating rhythm — the point of a bento grid. */
const TILE_SPANS = [
  "sm:col-span-4 lg:col-span-4",
  "sm:col-span-2 lg:col-span-2",
  "sm:col-span-3 lg:col-span-3",
  "sm:col-span-3 lg:col-span-3",
] as const

function HeroMosaic ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const store = useBuilderStore.getState

  return (
    <section className="relative overflow-hidden" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6 lg:grid-cols-6">
          {/* Copy occupies the lead tile. */}
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="lead"
            className="flex flex-col justify-center gap-6 pb-8 sm:col-span-6 lg:col-span-6 lg:pb-12"
            headingLevel={1}
            align="left"
            headingClassName={`${TYPE_H1} max-w-3xl text-foreground`}
            bodyClassName={`${TYPE_LEAD} max-w-2xl`}
          />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="tiles"
            as="div"
            className="contents"
            // The bento rhythm is keyed to the *entry* index, not the tile index,
            // so a free element dropped between tiles takes the next span and the
            // grid stays full rather than leaving a hole.
            entryClassName={(entry, index) =>
              entry.kind === "node" ? TILE_SPANS[index % TILE_SPANS.length] : undefined
            }
            renderItems={({ instance: inst }) => {
              const tiles = (inst.props.tiles as TileItem[]) ?? []
              return (
                <>
                  {tiles.map((tile, i) => (
                    <article
                      key={i}
                      className={cn(
                        "relative flex flex-col overflow-hidden rounded-2xl bg-muted/50",
                        TILE_SPANS[i % TILE_SPANS.length],
                      )}
                    >
                      <SectionMedia
                        instanceId={inst.id}
                        elementKey={`tiles.${i}.image`}
                        src={tile.image}
                        alt=""
                        // The narrow tile goes square so its height matches the wide one beside it.
                        ratio={i % TILE_SPANS.length === 1 ? "square" : "video"}
                        placeholder="landscape"
                        rounded="none"
                        collectionKey="tiles"
                        collectionIndex={i}
                        itemSrcProp="image"
                        isPreview={isPreview}
                        sizes="(max-width: 640px) 100vw, 40vw"
                        className="border-0"
                      />
                      <div className="flex flex-col gap-1.5 p-5">
                        <InlineEditableText
                          as="h3"
                          data-element-id={`${inst.id}::tiles.${i}.title`}
                          data-element-type="text"
                          className="font-heading text-base font-semibold text-foreground"
                          value={String(tile.title ?? "")}
                          isPreview={isPreview}
                          onChange={(t) => store().updateItem(inst.id, "tiles", i, { title: t })}
                          onCommit={(t) => store().updateItem(inst.id, "tiles", i, { title: t })}
                        />
                        <InlineEditableText
                          as="p"
                          data-element-id={`${inst.id}::tiles.${i}.description`}
                          data-element-type="text"
                          className="text-sm leading-relaxed text-muted-foreground"
                          value={String(tile.description ?? "")}
                          isPreview={isPreview}
                          onChange={(t) => store().updateItem(inst.id, "tiles", i, { description: t })}
                          onCommit={(t) => store().updateItem(inst.id, "tiles", i, { description: t })}
                        />
                      </div>
                    </article>
                  ))}
                </>
              )
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const heroMosaicSection = defineSection({
  id: "hero-mosaic",
  displayName: "Mosaic",
  description: "Bento hero — the headline is the lead tile in an uneven grid.",
  category: "hero",
  layoutArchetype: "bento",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 4,
  defaultStyle: SECTION_PADDING_XL,
  industries: ["saas", "creative", "agency", "portfolio", "tech", "ai_startup", "generic"],
  styles: ["modern", "playful", "bold"],
  goals: ["brand", "engagement", "awareness"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 92,
  editable: true,
  trustWeight: 30,
  conversionWeight: 25,
  funnelStage: "awareness",
  tags: ["bento", "grid", "showcase"],
  defaultOptions: { align: "start", gap: "md", paddingY: "xl" },
  schema: {
    slots: [
      { id: "lead", label: "Lead tile", isDefault: true },
      { id: "tiles", label: "Tiles", eject: { direction: "row" } },
    ],
    blocks: [
      { kind: "heading", level: 1, accent: true },
      { kind: "body" },
      { kind: "ctaRow", minItems: 1, maxItems: 2 },
      {
        kind: "items",
        slot: "tiles",
        key: "tiles",
        canonical: "cards",
        label: "Tiles",
        pick: ["title", "description", "image"],
        itemPlaceholder: "landscape",
        minItems: 2,
        maxItems: 6,
      },
    ],
  },
  defaultProps: {
    headline: "One place to plan, build and ship",
    description:
      "Boards, docs and automations share the same data, so context does not get lost between tools.",
    buttons: [{ label: "Explore the platform", href: "#", variant: "primary" }],
    tiles: [
      { title: "Shared canvas", description: "Edit the same file at the same time.", image: "" },
      { title: "Automations", description: "Route requests and send reminders without writing a script.", image: "" },
      { title: "Reports", description: "See what shipped this week and what slipped.", image: "" },
      { title: "Integrations", description: "Works with Slack, GitHub and Google Drive.", image: "" },
    ],
  },
  Component: HeroMosaic,
})
