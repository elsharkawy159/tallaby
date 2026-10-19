/**
 * Drop rules for the parts of pre-built sections (P4B-16). Parts never leave
 * their section: a part goes to a slot of the same section that accepts it,
 * and a collection item moves among the items of its collection. Pure; the
 * probe (`part-probe.client.ts`) says what is under the pointer.
 */
import type { SectionInstance } from "@workspace/store-sections";
import { findPartSlot, resolveSlotLayout, slotAccepts } from "@workspace/store-sections/render";
import { slotsOf } from "../lib/editor-slots.lib";

/** A slot under (or nearest to) the pointer: insert before `beforePart` (null = at the end). */
export type PartSlotHit = { slot: string; beforePart: string | null };

/** Where `part` lands for a hit: the slot and index (counted after taking it out), `"same"` when it is already there, null when refused. */
export function planPartMove(instance: SectionInstance, part: string, hit: PartSlotHit): { slot: string; index: number } | "same" | null {
  const slots = slotsOf(instance);
  const target = slots.find((s) => s.key === hit.slot);
  const layout = resolveSlotLayout(instance, slots);
  const from = findPartSlot(layout, part);
  if (!target || !from || !slotAccepts(target, part)) return null;
  if (hit.beforePart === part) return "same";
  const list = layout[hit.slot]!.filter((p) => p !== part);
  const before = hit.beforePart === null ? -1 : list.indexOf(hit.beforePart);
  const index = before < 0 ? list.length : before;
  return from.slot === hit.slot && from.index === index ? "same" : { slot: hit.slot, index };
}

/** Final index of an item taken from `from` and inserted before `insertAt` (counted before removal); `"same"` when unchanged. */
export function planItemMove(from: number, insertAt: number): number | "same" {
  const to = insertAt > from ? insertAt - 1 : insertAt;
  return to === from ? "same" : to;
}
