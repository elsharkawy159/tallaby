"use client";

/**
 * Reads the canvas frame under a point into a `CanvasProbe` (P4B-12). The
 * sections render inside an iframe with no editor code, so drop targets come
 * from the markers the renderer already writes in edit mode
 * (`data-section-id`, `data-editor-chrome`, `data-node-id`, `data-part`) and
 * their boxes, not from droppables. Runs at most once per animation frame.
 */
import { getElementDefinition } from "@workspace/store-sections/render";
import { dropIndex } from "@workspace/store-editor/lib/editor-palette.lib";
import { splitPartAttr } from "@workspace/store-editor/lib/editor-selection.lib";
import type { SectionRef } from "@workspace/store-editor/state/editor.store";
import { edgeDistance, insertionIndex, insertionLine, type Line, type Point, type Rect } from "@workspace/store-editor/dnd/canvas-geometry.lib";
import type { CanvasPayload, CanvasProbe, ImageCandidate, NodeSlot } from "@workspace/store-editor/dnd/dnd.types";
import { probeItem, probePartSlot } from "./part-probe.client";

/** Boxes for the markers, in frame viewport coordinates, matching the probe's lists. */
export type CanvasGeometry = {
  sectionLine: Line;
  slots: { line: Line; container: Rect }[];
  images: Rect[];
  /** The marker for a dragged part or item (P4B-16). */
  part?: { line: Line; container: Rect } | null;
};

export type CanvasSample = { probe: CanvasProbe; geometry: CanvasGeometry };

/** Within this many pixels of a container's edge, a drop goes beside it rather than inside. */
const EDGE = 10;
const MAX_IMAGES = 6;

const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
};
const visible = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 || r.height > 0;
};

/** Top-level page sections in order (header and footer are outside `main`). */
function pageSections(doc: Document): HTMLElement[] {
  return Array.from(doc.querySelectorAll<HTMLElement>("main [data-section-id]")).filter((el) => !el.parentElement?.closest("[data-section-id]"));
}

function refFor(el: Element): SectionRef | null {
  const chrome = el.closest<HTMLElement>("[data-editor-chrome]");
  if (chrome) return { target: chrome.dataset.editorChrome as "header" | "footer" };
  const section = el.closest<HTMLElement>("[data-section-id]");
  return section ? { target: "page", sectionId: section.dataset.sectionId! } : null;
}

/** Element nodes directly inside `parent` (a node element, or the section for the root). */
function childNodes(parent: HTMLElement, section: HTMLElement): HTMLElement[] {
  const parentNode = parent === section ? null : parent;
  return Array.from(parent.querySelectorAll<HTMLElement>("[data-node-id]")).filter((el) => {
    const owner = el.parentElement?.closest<HTMLElement>("[data-node-id]") ?? null;
    return (parentNode ? owner === parentNode : !owner || !section.contains(owner)) && visible(el);
  });
}

function slotIn(parent: HTMLElement, section: HTMLElement, point: Point, rtl: boolean): { slot: NodeSlot; line: Line; container: Rect } {
  const kids = childNodes(parent, section);
  const rects = kids.map(rectOf);
  const index = insertionIndex(rects, point, rtl);
  const container = rectOf(parent);
  return {
    slot: { parentId: parent === section ? null : parent.dataset.nodeId!, beforeId: kids[index]?.dataset.nodeId ?? null },
    line: insertionLine(rects, index, container, rtl),
    container,
  };
}

/**
 * Samples the frame at `point` (frame viewport coordinates). A dragged part
 * or item (`payload`) also gets its target inside its own section.
 */
export function sampleCanvas(doc: Document, point: Point, payload?: CanvasPayload | null): CanvasSample {
  const rtl = doc.documentElement.dir === "rtl";
  const width = doc.documentElement.clientWidth;

  const sections = pageSections(doc);
  const sectionRects = sections.map(rectOf);
  const sectionIndex = dropIndex(sectionRects, point.y);
  const main = doc.querySelector("main");
  const lineY = sectionIndex < sectionRects.length ? sectionRects[sectionIndex]!.top : (sectionRects.at(-1)?.bottom ?? (main ? rectOf(main).top : 0));
  const sectionLine: Line = { x: 0, y: lineY, length: width, orientation: "horizontal" };

  const stack = doc.elementsFromPoint(point.x, point.y);
  const top = stack[0] ?? null;
  const overSection = top?.closest<HTMLElement>("main [data-section-id]") ?? null;

  // Images: every Image element and section part under the pointer (the planner keeps image fields only).
  const images: ImageCandidate[] = [];
  const imageRects: Rect[] = [];
  const seen = new Set<string>();
  for (const el of stack) {
    if (images.length >= MAX_IMAGES) break;
    if (!(el instanceof HTMLElement)) continue;
    const ref = refFor(el);
    if (!ref) continue;
    if (el.dataset.nodeId && el.dataset.nodeType === "image" && !seen.has(`n:${el.dataset.nodeId}`)) {
      seen.add(`n:${el.dataset.nodeId}`);
      images.push({ ref, nodeId: el.dataset.nodeId });
      imageRects.push(rectOf(el));
    }
    const part = splitPartAttr(el.dataset.part);
    if (part && !seen.has(`p:${el.dataset.part}`)) {
      seen.add(`p:${el.dataset.part}`);
      images.push({ ref, part: part.part });
      imageRects.push(rectOf(el));
    }
  }

  // Element slots, only in a custom section: innermost node outwards, then the section root.
  const slots: NodeSlot[] = [];
  const slotGeometry: CanvasGeometry["slots"] = [];
  if (overSection && overSection.dataset.sectionType === "custom-section") {
    const add = (entry: ReturnType<typeof slotIn>) => {
      slots.push(entry.slot);
      slotGeometry.push({ line: entry.line, container: entry.container });
    };
    let node = top?.closest<HTMLElement>("[data-node-id]") ?? null;
    while (node && overSection.contains(node)) {
      const parent = node.parentElement?.closest<HTMLElement>("[data-node-id]");
      const parentEl = parent && overSection.contains(parent) ? parent : overSection;
      const isContainer = Boolean(getElementDefinition(node.dataset.nodeType ?? "")?.container);
      const inside = isContainer ? slotIn(node, overSection, point, rtl) : null;
      const beside = slotIn(parentEl, overSection, point, rtl);
      // Near a container's edge the drop goes next to it; otherwise inside it.
      if (inside && edgeDistance(rectOf(node), point) > EDGE) add(inside);
      add(beside);
      if (inside && edgeDistance(rectOf(node), point) <= EDGE) add(inside);
      node = parentEl === overSection ? null : parentEl;
    }
    add(slotIn(overSection, overSection, point, rtl));
  }

  const probe: CanvasProbe = { sectionIndex, overSectionId: overSection?.dataset.sectionId ?? null, images, slots };
  const geometry: CanvasGeometry = { sectionLine, slots: slotGeometry, images: imageRects };
  if (payload?.kind === "move-part") {
    const target = probePartSlot(doc, payload.ref, point);
    probe.part = target?.hit ?? null;
    geometry.part = target && { line: target.line, container: target.container };
  } else if (payload?.kind === "move-item") {
    const target = probeItem(doc, payload.ref, payload.collection, point);
    probe.itemInsertAt = target?.insertAt ?? null;
    geometry.part = target && { line: target.line, container: target.container };
  }
  return { probe, geometry };
}
