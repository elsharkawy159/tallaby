/**
 * Slot entry resolution — the one place that decides what a slot renders.
 *
 * A slot's contents are a single ordered list mixing two kinds of entry:
 *
 *   • `block:<blockId>` — a schema block, rendered by the section's primitives
 *   • `node:<nodeId>`   — a free element the user dropped in, rendered by the
 *                          component-tree renderer
 *
 * The list is *virtual* until the user first edits it. `instance.slots` is absent
 * on every page saved before slots existed, and on every freshly inserted
 * section, in which case resolution falls back to schema order with nothing
 * hidden. That fallback is the entire backwards-compatibility story: no
 * migration, no rewrite of stored JSONB, byte-identical rendering.
 *
 * Pure — no React, no store, no registry. `__tests__/slot-entries.test.ts` pins
 * the fallback first, because that is the invariant a regression would break.
 */

import type { ComponentNode } from '@/lib/builder/component-node'
import type { SlotLayout } from '@/components/sections/registry.types'
import type { CompiledBlock, CompiledSlot } from '@/components/sections/schema/compile-schema'

export const BLOCK_ENTRY_PREFIX = 'block:'
export const NODE_ENTRY_PREFIX = 'node:'

export type SlotEntry =
  | { kind: 'block'; id: string; block: CompiledBlock; hidden: boolean }
  | { kind: 'node'; id: string; node: ComponentNode }

export function blockEntryId (blockId: string): string {
  return `${BLOCK_ENTRY_PREFIX}${blockId}`
}

export function nodeEntryId (nodeId: string): string {
  return `${NODE_ENTRY_PREFIX}${nodeId}`
}

/** The element-id of a slot's host container — also its `injectedChildren` key. */
export function slotHostElementId (instanceId: string, slotId: string): string {
  return `${instanceId}::slot:${slotId}`
}

export interface ResolveSlotEntriesArgs {
  slot: CompiledSlot
  /** Every compiled block of the section; filtered to this slot internally. */
  blocks: CompiledBlock[]
  /** `instance.slots?.[slot.id]`. */
  layout?: SlotLayout
  /** `injectedChildren[slotHostElementId(instanceId, slot.id)] ?? []`. */
  injected?: ComponentNode[]
}

/**
 * Resolves a slot's ordered entries.
 *
 * Order of precedence:
 *   1. ids named by `layout.order`, in that order — skipping any that no longer
 *      resolve (a block removed from the schema, a node the user deleted)
 *   2. schema blocks the order does not name, in schema order
 *   3. injected nodes the order does not name, in insertion order
 *
 * Steps 2 and 3 are what make the list forward-compatible: a section that gains
 * a block after a page was saved shows it rather than silently dropping it.
 */
export function resolveSlotEntries ({
  slot,
  blocks,
  layout,
  injected = [],
}: ResolveSlotEntriesArgs): SlotEntry[] {
  const blocksById = new Map(
    blocks.filter((b) => b.slot === slot.id).map((b) => [b.id, b])
  )
  const nodesById = new Map(injected.map((n) => [n.id, n]))
  const hidden = new Set(layout?.hidden ?? [])

  const entries: SlotEntry[] = []
  const claimed = new Set<string>()

  for (const entryId of layout?.order ?? []) {
    if (claimed.has(entryId)) continue
    const entry = resolveOne(entryId, blocksById, nodesById, hidden)
    if (!entry) continue
    claimed.add(entryId)
    entries.push(entry)
  }

  for (const block of blocksById.values()) {
    const id = blockEntryId(block.id)
    if (claimed.has(id)) continue
    claimed.add(id)
    entries.push({ kind: 'block', id, block, hidden: hidden.has(block.id) })
  }

  for (const node of nodesById.values()) {
    const id = nodeEntryId(node.id)
    if (claimed.has(id)) continue
    claimed.add(id)
    entries.push({ kind: 'node', id, node })
  }

  return entries
}

function resolveOne (
  entryId: string,
  blocksById: Map<string, CompiledBlock>,
  nodesById: Map<string, ComponentNode>,
  hidden: Set<string>
): SlotEntry | null {
  if (entryId.startsWith(BLOCK_ENTRY_PREFIX)) {
    const blockId = entryId.slice(BLOCK_ENTRY_PREFIX.length)
    const block = blocksById.get(blockId)
    return block ? { kind: 'block', id: entryId, block, hidden: hidden.has(blockId) } : null
  }
  if (entryId.startsWith(NODE_ENTRY_PREFIX)) {
    const nodeId = entryId.slice(NODE_ENTRY_PREFIX.length)
    const node = nodesById.get(nodeId)
    return node ? { kind: 'node', id: entryId, node } : null
  }
  return null
}

/** Entries that actually render — hidden blocks are kept out of the DOM. */
export function visibleSlotEntries (entries: SlotEntry[]): SlotEntry[] {
  return entries.filter((e) => e.kind === 'node' || !e.hidden)
}

/**
 * The full entry id list for a slot as it stands today, used to materialise
 * `layout.order` the first time a user reorders a virtual list.
 */
export function slotEntryIds (entries: SlotEntry[]): string[] {
  return entries.map((e) => e.id)
}

/**
 * Applies a reordering of the *visible* entries back onto the full list.
 *
 * Drag indices come from the DOM, where a hidden block occupies no position —
 * so a drag can only ever describe the visible order. Writing that straight to
 * `layout.order` would drop every hidden block, and the resolver would then
 * append them at the end: hide a badge, drag anything, and the badge silently
 * moves to the bottom of the slot for when it is shown again.
 *
 * Each hidden id is re-anchored after the visible id that preceded it, so it
 * comes back where the user left it.
 */
export function mergeHiddenIntoOrder (
  fullIds: string[],
  nextVisibleIds: string[]
): string[] {
  const visible = new Set(nextVisibleIds)
  const hidden = fullIds.filter((id) => !visible.has(id))
  if (!hidden.length) return nextVisibleIds

  // Where each hidden id sat relative to the visible entries before the move.
  const anchors = new Map<string | null, string[]>()
  let previousVisible: string | null = null
  for (const id of fullIds) {
    if (visible.has(id)) {
      previousVisible = id
      continue
    }
    const bucket = anchors.get(previousVisible)
    if (bucket) bucket.push(id)
    else anchors.set(previousVisible, [id])
  }

  const out: string[] = [...(anchors.get(null) ?? [])]
  for (const id of nextVisibleIds) {
    out.push(id)
    const trailing = anchors.get(id)
    if (trailing) out.push(...trailing)
  }
  return out
}
