"use client";

/**
 * Reads where a dragged part or item of a pre-built section would land
 * (P4B-16), from the markers the sections render (`data-slot`, `data-part`,
 * `data-item`). Only the dragged section is searched: parts never leave it.
 * The slot under the pointer wins; otherwise the nearest slot of that
 * section, so the gaps between columns still give a precise target.
 */
import { splitPartAttr } from "@workspace/store-editor/lib/editor-selection.lib";
import type { SectionRef } from "@workspace/store-editor/state/editor.store";
import { insertionIndex, insertionLine, type Line, type Point, type Rect } from "@workspace/store-editor/dnd/canvas-geometry.lib";
import type { PartSlotHit } from "@workspace/store-editor/dnd/part-drop.lib";

export type PartProbe = { hit: PartSlotHit; line: Line; container: Rect };
export type ItemProbe = { insertAt: number; line: Line; container: Rect };

/** Beyond this distance (px) from every slot, the pointer is not aiming at the section. */
const REACH = 48;

const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
};

/** Distance from a point to a box (0 inside). */
function distance(rect: Rect, point: Point): number {
  const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
  const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
  return Math.hypot(dx, dy);
}

export function sectionRoot(doc: Document, ref: SectionRef): HTMLElement | null {
  return ref.target === "page"
    ? doc.querySelector<HTMLElement>(`main [data-section-id="${CSS.escape(ref.sectionId)}"]`)
    : doc.querySelector<HTMLElement>(`[data-editor-chrome="${ref.target}"]`);
}

/** Parts placed directly in a slot (not inside another part), with their keys, in document order. */
function slotParts(slot: HTMLElement): { el: HTMLElement; part: string }[] {
  return Array.from(slot.querySelectorAll<HTMLElement>("[data-part]"))
    .filter((el) => {
      const outer = el.parentElement?.closest("[data-part]");
      return el.closest("[data-slot]") === slot && !(outer && slot.contains(outer));
    })
    .map((el) => ({ el, part: splitPartAttr(el.dataset.part)?.part ?? "" }))
    .filter((p) => p.part && (p.el.getBoundingClientRect().width > 0 || p.el.getBoundingClientRect().height > 0));
}

/** The slot target for a dragged part of `ref` at `point` (frame viewport coordinates). */
export function probePartSlot(doc: Document, ref: SectionRef, point: Point): PartProbe | null {
  const root = sectionRoot(doc, ref);
  if (!root) return null;
  const rtl = doc.documentElement.dir === "rtl";
  const slots = Array.from(root.querySelectorAll<HTMLElement>("[data-slot]"));
  let best: { el: HTMLElement; d: number } | null = null;
  for (const el of slots) {
    const d = distance(rectOf(el), point);
    // Innermost slot under the pointer wins ties (later in document order = deeper or later).
    if (!best || d < best.d || (d === 0 && best.d === 0 && best.el.contains(el))) best = { el, d };
  }
  if (!best || best.d > REACH) return null;
  const slotKey = splitPartAttr(best.el.dataset.slot)?.part;
  if (!slotKey) return null;
  const parts = slotParts(best.el);
  const rects = parts.map((p) => rectOf(p.el));
  const container = rectOf(best.el);
  // Outside the slot the pointer still picks a place along it.
  const clamped = { x: Math.max(container.left, Math.min(point.x, container.right)), y: Math.max(container.top, Math.min(point.y, container.bottom)) };
  const index = insertionIndex(rects, clamped, rtl);
  return {
    hit: { slot: slotKey, beforePart: parts[index]?.part ?? null },
    line: insertionLine(rects, index, container, rtl),
    container,
  };
}

/** The insertion point for a dragged item of `collection` in `ref` at `point`. */
export function probeItem(doc: Document, ref: SectionRef, collection: string, point: Point): ItemProbe | null {
  const root = sectionRoot(doc, ref);
  if (!root) return null;
  const prefix = `::${collection}.`;
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-item]")).filter((el) => el.dataset.item?.includes(prefix));
  if (!items.length) return null;
  const parent = items[0]!.parentElement ?? root;
  const container = rectOf(parent);
  if (distance(container, point) > REACH) return null;
  const rtl = doc.documentElement.dir === "rtl";
  const rects = items.map(rectOf);
  const clamped = { x: Math.max(container.left, Math.min(point.x, container.right)), y: Math.max(container.top, Math.min(point.y, container.bottom)) };
  const insertAt = insertionIndex(rects, clamped, rtl);
  return { insertAt, line: insertionLine(rects, insertAt, container, rtl), container };
}
