"use client"

import { Fragment } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { useBuilderStore } from "@/lib/builder/store"
import { usePublicSiteContext } from "@/components/website-builder/public-site-context"
import {
  SlotNodeRenderer,
  StaticSlotNodeRenderer,
} from "@/components/website-builder/component-tree-renderer"
import {
  slotRuleOf,
  useDroppableSlot,
  useSlotBlockDnd,
} from "@/components/website-builder/dnd/use-slot-dnd"
import { useDropEdge } from "@/components/dnd/dnd-provider"
import { DndDropIndicator } from "@/components/dnd/dnd-drop-indicator"
import { dragStateAttrs } from "@/components/dnd/dnd-sortable-item"
import {
  slotDropId,
  slotHostElementId,
  slotParentId,
} from "@/lib/builder/dnd/ids"
import type { SlotRule } from "@/lib/builder/dnd/types"
import {
  resolveSlotEntries,
  visibleSlotEntries,
  type SlotEntry,
} from "@/components/sections/schema/slot-entries"
import {
  BlockRenderer,
  type BlockOverride,
  type BlockRenderCtx,
} from "@/components/sections/_primitives/block-renderer"
import type { CompiledSlot } from "@/components/sections/schema/compile-schema"
import type {
  SectionComponentProps,
  SectionDefinition,
  SectionInstance,
} from "@/components/sections/registry.types"
import type { ElementType, ReactNode } from "react"

/**
 * One editable region of a schema-driven section.
 *
 * A section keeps its own JSX layout — grids, gradients, scrims, bento spans —
 * and hands its *child list* to a slot. The slot resolves an ordered mix of
 * schema blocks and user-dropped elements, renders each through the shared
 * `BlockRenderer` (or a per-block override), and registers the drag-and-drop
 * surfaces that let a user reorder, hide and add entries in place.
 *
 * That split is the whole design: converting the section to a `ComponentNode`
 * tree would lose the Tailwind vocabulary those layouts are written in
 * (`hover:`, `dark:`, gradients, arbitrary values), so only the contents become
 * data. See docs/SECTION_ENGINE.md.
 *
 * The host element's `data-element-id` (`<instanceId>::slot:<slotId>`) doubles
 * as the `injectedChildren` key — a stable anchor, unlike the `__i:` DOM paths
 * the instrumentation pass derives, which shift whenever the JSX changes.
 */

type BlockRendererDefaults = Pick<
  Parameters<typeof BlockRenderer>[0],
  | "headingLevel"
  | "headingClassName"
  | "bodyClassName"
  | "noteClassName"
  | "align"
  | "ctaClassName"
  | "badgeVariant"
  | "mediaProps"
>

export interface SectionSlotProps
  extends Pick<SectionComponentProps, "instance" | "isPreview">,
    BlockRendererDefaults {
  /** The section's compiled definition, injected by `defineSection()`. */
  definition: SectionDefinition | undefined
  slotId: string
  as?: ElementType
  className?: string
  /** Class applied to each entry wrapper. Receives the entry and its index. */
  entryClassName?: string | ((entry: SlotEntry, index: number) => string | undefined)
  /**
   * Per-block render hooks, keyed by block id. Returning `undefined` falls
   * through to `BlockRenderer`; returning `null` renders nothing.
   *
   * This is the escape hatch for blocks whose chrome is section-specific — a
   * capture form, a headline built from a collection, a definition list — so the
   * shared renderer never grows per-section branches.
   */
  overrides?: Record<string, BlockOverride>
  /** Renders `items` blocks. Collections are always section-specific. */
  renderItems?: (ctx: BlockRenderCtx) => ReactNode
}

export function SectionSlot ({
  instance,
  definition,
  slotId,
  isPreview,
  as: Host = "div",
  className,
  entryClassName,
  overrides,
  renderItems,
  ...blockDefaults
}: SectionSlotProps) {
  const publicSite = usePublicSiteContext()
  const isBuilder = publicSite === null
  const hostId = slotHostElementId(instance.id, slotId)
  const injected = useBuilderStore((s) => s.injectedChildren[hostId])

  const slot = definition?.slots?.find((s) => s.id === slotId)

  if (process.env.NODE_ENV !== "production" && definition && !slot) {
    console.warn(
      `[SectionSlot] "${instance.sectionId}" has no slot "${slotId}". ` +
        `Declared: ${definition.slots?.map((s) => s.id).join(", ") || "none"}.`
    )
  }
  if (!slot) return null

  const visible = visibleSlotEntries(
    resolveSlotEntries({
      slot,
      blocks: definition?.blocks ?? [],
      layout: instance.slots?.[slotId],
      injected: injected ?? [],
    })
  )

  const rule = slotRuleOf(slot, visible.length)

  const body = visible.map((entry, index) => (
    <SlotEntryView
      key={entry.id}
      entry={entry}
      index={index}
      instance={instance}
      slotId={slotId}
      rule={rule}
      isPreview={isPreview}
      isBuilder={isBuilder}
      className={
        typeof entryClassName === "function"
          ? entryClassName(entry, index)
          : entryClassName
      }
      overrides={overrides}
      renderItems={renderItems}
      blockDefaults={blockDefaults}
    />
  ))

  return isBuilder ? (
    <BuilderSlotHost
      Host={Host}
      hostId={hostId}
      instanceId={instance.id}
      slot={slot}
      rule={rule}
      isPreview={isPreview}
      className={className}
    >
      {body}
    </BuilderSlotHost>
  ) : (
    // The published markup carries the same host identity as the canvas, so a
    // slot stays addressable by id on both surfaces — only the drag wiring is
    // builder-only.
    <Host className={className} data-element-id={hostId} data-slot-id={slot.id}>
      {body}
    </Host>
  )
}

/**
 * Builder-only wrapper, split out so the public render path calls no dnd-kit
 * hooks at all rather than branching inside one component.
 */
function BuilderSlotHost ({
  Host,
  hostId,
  instanceId,
  slot,
  rule,
  isPreview,
  className,
  children,
}: {
  Host: ElementType
  hostId: string
  instanceId: string
  slot: CompiledSlot
  rule: SlotRule
  isPreview?: boolean
  className?: string
  children: ReactNode
}) {
  const droppable = useDroppableSlot({
    sectionId: instanceId,
    slotId: slot.id,
    rule,
    disabled: isPreview || slot.acceptsElements === false,
  })
  // Drawn as an outline rather than an inner indicator: the host is the
  // section's own layout element, and making it `relative` could re-anchor
  // absolutely positioned content inside it.
  const edge = useDropEdge(slotDropId(instanceId, slot.id))

  return (
    <Host
      ref={droppable.ref}
      data-element-id={hostId}
      data-element-container="1"
      data-slot-id={slot.id}
      data-builder-tag={slot.label}
      {...dragStateAttrs({ isDropTarget: droppable.isDropTarget })}
      data-drop-edge={edge ?? undefined}
      className={cn(
        className,
        "data-[drop-edge=center]:rounded-sm data-[drop-edge=center]:outline-2 data-[drop-edge=center]:outline-offset-2 data-[drop-edge=center]:outline-[var(--dnd-indicator,var(--primary))]"
      )}
    >
      {children}
    </Host>
  )
}

/** One slot target's indicator, isolated so an edge change re-renders only this span. */
function SlotDropIndicator ({ id }: { id: string }) {
  return <DndDropIndicator edge={useDropEdge(id)} data-no-instrument="" />
}

function SlotEntryView ({
  entry,
  index,
  instance,
  slotId,
  rule,
  isPreview,
  isBuilder,
  className,
  overrides,
  renderItems,
  blockDefaults,
}: {
  entry: SlotEntry
  index: number
  instance: SectionInstance
  slotId: string
  rule: SlotRule
  isPreview?: boolean
  isBuilder: boolean
  className?: string
  overrides?: Record<string, BlockOverride>
  renderItems?: (ctx: BlockRenderCtx) => ReactNode
  blockDefaults: BlockRendererDefaults
}) {
  if (entry.kind === "node") {
    // In the builder the entry class goes on the node's own drag wrapper, so
    // slot entries stay direct children of the slot host.
    return isBuilder ? (
      <SlotNodeRenderer
        sectionId={instance.id}
        node={entry.node}
        slotParentId={slotParentId(slotId)}
        slotRule={rule}
        index={index}
        isPreview={Boolean(isPreview)}
        className={className}
      />
    ) : (
      <Wrap className={className}>
        <StaticSlotNodeRenderer sectionId={instance.id} node={entry.node} />
      </Wrap>
    )
  }

  const ctx: BlockRenderCtx = {
    instance,
    block: entry.block,
    isPreview,
    index,
    value:
      instance.props[entry.block.propKeys[0] ?? entry.block.collectionKey ?? ""],
  }
  const override = overrides?.[entry.block.id]?.(ctx)
  const content =
    override !== undefined ? (
      override
    ) : (
      <BlockRenderer {...ctx} {...blockDefaults} renderItems={renderItems} />
    )

  if (content === null) return null

  return isBuilder && !isPreview ? (
    <SlotBlockEntry
      sectionId={instance.id}
      slotId={slotId}
      blockId={entry.block.id}
      rule={rule}
      className={className}
    >
      {content}
    </SlotBlockEntry>
  ) : (
    <Wrap className={className}>{content}</Wrap>
  )
}

/** Avoids an extra DOM node when a section has no per-entry class to apply. */
function Wrap ({ className, children }: { className?: string; children: ReactNode }) {
  return className ? (
    <div className={className}>{children}</div>
  ) : (
    <Fragment>{children}</Fragment>
  )
}

/**
 * A schema block in the builder: draggable within its slot, and a target that
 * shows where things land before/after it.
 */
function SlotBlockEntry ({
  sectionId,
  slotId,
  blockId,
  rule,
  className,
  children,
}: {
  sectionId: string
  slotId: string
  blockId: string
  rule: SlotRule
  className?: string
  children: ReactNode
}) {
  const dnd = useSlotBlockDnd({ sectionId, slotId, blockId, rule })

  return (
    <div
      ref={dnd.ref}
      data-slot-block={blockId}
      {...dragStateAttrs({ isDragSource: dnd.isDragSource })}
      className={cn("relative min-w-0 data-[drag-source]:opacity-40", className)}
    >
      {children}
      <SlotDropIndicator id={dnd.id} />
    </div>
  )
}
