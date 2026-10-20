/**
 * Moving the parts of pre-built sections (P4B-16): a part inside its slots
 * (`instance.slots`, see `@workspace/store-sections` `core/slots.ts`), or a
 * whole item of an item collection (a highlight card). Pure; the commands,
 * the drop planner and the canvas toolbar share it. Works for any section
 * that declares `slots` or `itemCollections`, not only the Content ones.
 */
import type { SectionInstance } from "@workspace/store-sections";
import {
  findPartSlot,
  movePartToSlot,
  resolveSlotLayout,
  storeSectionRegistry,
  type SlotDefinition,
  type SlotLayout,
} from "@workspace/store-sections/render";
import { parsePart } from "./editor-selection.lib";
import { moveItem } from "./editor.lib";

/** What a selected part moves as: itself among its slots, or the item it belongs to. */
export type MovablePart =
  | { kind: "part"; part: string; slot: string; index: number }
  | { kind: "item"; collection: string; index: number; count: number };

export function slotsOf(instance: SectionInstance | null | undefined): readonly SlotDefinition[] {
  return (instance && storeSectionRegistry.get(instance.sectionId)?.slots) ?? [];
}

export function slotLayoutOf(instance: SectionInstance): SlotLayout {
  return resolveSlotLayout(instance, slotsOf(instance));
}

/** How the part can move, or null when it can't (not in a slot, not an item field). */
export function movableOf(instance: SectionInstance | null | undefined, part: string | undefined): MovablePart | null {
  const parsed = parsePart(part);
  if (!instance || !parsed) return null;
  if (parsed.kind === "item") {
    const definition = storeSectionRegistry.get(instance.sectionId);
    if (!definition?.itemCollections?.some((c) => c.key === parsed.collection)) return null;
    const items = instance.props[parsed.collection];
    const count = Array.isArray(items) ? items.length : 0;
    return parsed.index < count ? { kind: "item", collection: parsed.collection, index: parsed.index, count } : null;
  }
  const place = findPartSlot(slotLayoutOf(instance), parsed.key);
  return place ? { kind: "part", part: parsed.key, ...place } : null;
}

/** Puts a part in a slot at `index` (after taking it out). Same object when refused or a no-op. */
export function placePart(instance: SectionInstance, part: string, slot: string, index: number): SectionInstance {
  return movePartToSlot(instance, slotsOf(instance), part, slot, index);
}

/**
 * One step up (-1) or down (+1) in reading order: inside the slot, then on
 * to the end or start of the neighbouring slot that accepts the part.
 */
export function stepPart(instance: SectionInstance, part: string, direction: -1 | 1): SectionInstance {
  const slots = slotsOf(instance);
  const layout = resolveSlotLayout(instance, slots);
  const place = findPartSlot(layout, part);
  if (!place) return instance;
  const length = layout[place.slot]!.length;
  const index = place.index + direction;
  if (index >= 0 && index < length) return movePartToSlot(instance, slots, part, place.slot, index);
  const from = slots.findIndex((s) => s.key === place.slot);
  for (let i = from + direction; i >= 0 && i < slots.length; i += direction) {
    const next = slots[i]!;
    if (next.parts.includes(part) || next.accepts?.includes(part)) {
      return movePartToSlot(instance, slots, part, next.key, direction < 0 ? layout[next.key]!.length : 0);
    }
  }
  return instance;
}

type Bag = Record<string, unknown>;
const isBag = (value: unknown): value is Bag => typeof value === "object" && value !== null && !Array.isArray(value);

/** The index an item at `index` has after moving `from` → `to`. */
export function indexAfterMove(index: number, from: number, to: number): number {
  if (index === from) return to;
  if (from < to && index > from && index <= to) return index - 1;
  if (from > to && index >= to && index < from) return index + 1;
  return index;
}

/** Part styles are keyed `collection.index.field`; they follow their item when items move. */
function remapPartKeys(parts: unknown, collection: string, from: number, to: number): unknown {
  if (!isBag(parts)) return parts;
  const re = new RegExp(`^${collection}\\.(\\d{1,3})\\.(.+)$`);
  return Object.fromEntries(
    Object.entries(parts).map(([key, value]) => {
      const match = re.exec(key);
      return match ? [`${collection}.${indexAfterMove(Number(match[1]), from, to)}.${match[2]}`, value] : [key, value];
    }),
  );
}

function remapStyleParts(style: unknown, collection: string, from: number, to: number): unknown {
  return isBag(style) && style.parts ? { ...style, parts: remapPartKeys(style.parts, collection, from, to) } : style;
}

/** Moves an item (with its translations and part styles) from `from` to `to`. Same object when refused. */
export function placeItem(instance: SectionInstance, collection: string, from: number, to: number): SectionInstance {
  const items = instance.props[collection];
  const count = Array.isArray(items) ? items.length : 0;
  const target = Math.max(0, Math.min(to, count - 1));
  if (from < 0 || from >= count || target === from) return instance;
  const moved = moveItem(instance, collection, from, target);
  return {
    ...moved,
    ...(moved.style && { style: remapStyleParts(moved.style, collection, from, target) as SectionInstance["style"] }),
    ...(moved.breakpointStyles && {
      breakpointStyles: Object.fromEntries(
        Object.entries(moved.breakpointStyles).map(([device, style]) => [device, remapStyleParts(style, collection, from, target)]),
      ) as SectionInstance["breakpointStyles"],
    }),
  };
}

/** The selected part key after an item move (`items.0.title` → `items.2.title`). */
export function partAfterItemMove(part: string | undefined, collection: string, from: number, to: number): string | undefined {
  const parsed = parsePart(part);
  if (!parsed || parsed.kind !== "item" || parsed.collection !== collection) return part;
  return `${collection}.${indexAfterMove(parsed.index, from, to)}.${parsed.key}`;
}

/** One step up (-1) or down (+1) for whatever the part moves as. Returns the instance and the part to keep selected. */
export function stepMovable(instance: SectionInstance, part: string, direction: -1 | 1): { instance: SectionInstance; part: string } {
  const movable = movableOf(instance, part);
  if (!movable) return { instance, part };
  if (movable.kind === "part") return { instance: stepPart(instance, movable.part, direction), part };
  const to = movable.index + direction;
  const next = placeItem(instance, movable.collection, movable.index, to);
  return { instance: next, part: next === instance ? part : partAfterItemMove(part, movable.collection, movable.index, to)! };
}
