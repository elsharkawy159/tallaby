/**
 * Part slots of pre-built sections (P4B-16). A slot is a container of
 * editable parts (title, text, button, image) whose order the seller can
 * change, and whose parts can move to another slot of the same section that
 * accepts them. The layout is stored in `instance.slots[slotKey].order`
 * (schema field from the reference `SlotLayout`); without it every slot shows
 * its default parts, so pages saved before slots render as they always did.
 *
 * Pure and React-free: sections, the storefront and the editor share it.
 */
import type { SectionInstance } from "../config/schema";
import type { Localized } from "./types";

export interface SlotDefinition {
  key: string;
  label: Localized;
  /** Part keys (prop keys) shown here by default, in order. */
  parts: readonly string[];
  /** Parts of other slots that may also be placed here. */
  accepts?: readonly string[];
}

/** Visible part keys per slot, in order. */
export type SlotLayout = Record<string, string[]>;

/** Whether `part` may be placed in `slot`. */
export function slotAccepts(slot: SlotDefinition, part: string): boolean {
  return slot.parts.includes(part) || Boolean(slot.accepts?.includes(part));
}

/** Every part key a slot list manages (each part's home slot is the one listing it in `parts`). */
export function slotPartKeys(slots: readonly SlotDefinition[]): string[] {
  return [...new Set(slots.flatMap((slot) => slot.parts))];
}

/**
 * The layout of an instance: stored orders first (unknown, refused or
 * duplicate keys dropped; the first slot to claim a part keeps it), then any
 * part placed nowhere goes back to the end of its home slot, so a part added
 * to a section later still shows.
 */
export function resolveSlotLayout(instance: Pick<SectionInstance, "slots">, slots: readonly SlotDefinition[]): SlotLayout {
  const managed = new Set(slotPartKeys(slots));
  const placed = new Set<string>();
  const layout: SlotLayout = {};
  for (const slot of slots) {
    const stored = instance.slots?.[slot.key]?.order;
    const order: string[] = [];
    for (const part of stored ?? slot.parts) {
      if (!managed.has(part) || placed.has(part) || !slotAccepts(slot, part)) continue;
      placed.add(part);
      order.push(part);
    }
    layout[slot.key] = order;
  }
  for (const slot of slots) {
    for (const part of slot.parts) {
      if (placed.has(part)) continue;
      placed.add(part);
      layout[slot.key]!.push(part);
    }
  }
  return layout;
}

/** The slot holding `part` and its index there, or null when no slot manages it. */
export function findPartSlot(layout: SlotLayout, part: string): { slot: string; index: number } | null {
  for (const [slot, parts] of Object.entries(layout)) {
    const index = parts.indexOf(part);
    if (index >= 0) return { slot, index };
  }
  return null;
}

/**
 * Moves `part` into `toSlot` at `index` (counted after the part is taken out
 * of its current place). Every slot's full order is written, so the stored
 * layout always says exactly what renders. Unchanged (same object) when the
 * move is refused or puts the part where it already is.
 */
export function movePartToSlot<T extends Pick<SectionInstance, "slots">>(
  instance: T,
  slots: readonly SlotDefinition[],
  part: string,
  toSlot: string,
  index: number,
): T {
  const target = slots.find((slot) => slot.key === toSlot);
  const layout = resolveSlotLayout(instance, slots);
  const from = findPartSlot(layout, part);
  if (!target || !from || !slotAccepts(target, part)) return instance;
  const next: SlotLayout = Object.fromEntries(Object.entries(layout).map(([key, parts]) => [key, parts.filter((p) => p !== part)]));
  const list = next[toSlot]!;
  const at = Math.max(0, Math.min(index, list.length));
  if (from.slot === toSlot && from.index === at) return instance;
  list.splice(at, 0, part);
  const stored = { ...(instance.slots ?? {}) };
  for (const slot of slots) stored[slot.key] = { ...(stored[slot.key] ?? {}), order: next[slot.key]! };
  return { ...instance, slots: stored };
}

/** Whether the instance's layout differs from the section's default. */
export function isCustomSlotLayout(instance: Pick<SectionInstance, "slots">, slots: readonly SlotDefinition[]): boolean {
  const layout = resolveSlotLayout(instance, slots);
  return slots.some((slot) => layout[slot.key]!.join("\u0000") !== slot.parts.join("\u0000"));
}

/** Drops the stored layout (back to the section's default order). */
export function resetSlotLayout<T extends Pick<SectionInstance, "slots">>(instance: T, slots: readonly SlotDefinition[]): T {
  if (!instance.slots) return instance;
  const stored = { ...instance.slots };
  for (const slot of slots) delete stored[slot.key];
  const { slots: _drop, ...rest } = instance;
  return (Object.keys(stored).length ? { ...instance, slots: stored } : rest) as T;
}
