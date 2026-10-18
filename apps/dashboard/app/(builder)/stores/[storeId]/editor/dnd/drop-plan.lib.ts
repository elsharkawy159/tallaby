/**
 * Drop planning (P4B-12): pure rules for what a drop on the canvas does.
 * The canvas probe says what is under the pointer; this decides whether the
 * drop inserts or moves a section, puts elements into a custom section,
 * replaces an image, or is refused. Pre-built sections are prop-based and
 * hold no elements, so elements dropped on one go into a new custom section
 * next to it instead (nothing is stored that the renderer can't show).
 * `applyDropPlan` turns a plan into new page content; both run on every
 * drop with the page as it is at that moment, so a stale plan can't corrupt it.
 */
import { MAX_SECTIONS_PER_PAGE, type ComponentNode, type PageContent, type SectionInstance } from "@workspace/store-sections";
import {
  LAYOUT_PRESETS,
  createNode,
  findNode,
  findParent,
  fromTemplate,
  insertNode,
  moveNode,
  removeNode,
  storeSectionRegistry,
  type MakeId,
} from "@workspace/store-sections/render";
import { payloadPreset } from "../editor-library.lib";
import { getInstance, partField } from "../editor-selection.lib";
import type { Selection } from "../editor.store";
import type { CanvasPayload, CanvasProbe, DropPlan, ImageCandidate, NodeSlot } from "./dnd.types";
import { planItemMove, planPartMove } from "./part-drop.lib";

type Source = { content: PageContent; header: SectionInstance | null; footer: SectionInstance | null };

const CUSTOM = "custom-section";

/** The new elements a payload adds, with ids from `makeId` (empty when it adds none). */
export function payloadNodes(payload: CanvasPayload, makeId: MakeId, options: { src?: string } = {}): ComponentNode[] {
  switch (payload.kind) {
    case "element":
      return [createNode(payload.elementType, makeId)];
    case "preset": {
      const preset = LAYOUT_PRESETS.find((p) => p.id === payload.presetId);
      return preset ? preset.nodes.map((template) => fromTemplate(template, makeId)) : [];
    }
    case "photo":
    case "media": {
      const image = createNode("image", makeId);
      const src = payload.kind === "media" ? payload.src : (options.src ?? "");
      const alt = payload.kind === "media" ? payload.alt : payload.photo.alt;
      return [{ ...image, props: { ...image.props, src, alt: alt.slice(0, 160) } }];
    }
    default:
      return [];
  }
}

/** Final index of a section moved from `from` to the insertion point `insertAt` (counted before removal). */
export function sectionMoveTarget(from: number, insertAt: number): number {
  return insertAt > from ? insertAt - 1 : insertAt;
}

/** The child index a slot points at in `tree`, or null when its parent or sibling is gone. */
export function slotIndex(tree: readonly ComponentNode[], slot: NodeSlot): number | null {
  const children = slot.parentId === null ? tree : findNode(tree, slot.parentId)?.children;
  if (!children) return null;
  if (slot.beforeId === null) return children.length;
  const index = children.findIndex((child) => child.id === slot.beforeId);
  return index < 0 ? null : index;
}

/** Inserts `nodes` in order at `index`; null when any of them is refused (type rules, depth or size limits). */
function insertAll(tree: readonly ComponentNode[], parentId: string | null, index: number, nodes: readonly ComponentNode[]): ComponentNode[] | null {
  let next = tree as ComponentNode[];
  for (const [offset, node] of nodes.entries()) {
    next = insertNode(next, parentId, node, index + offset);
    if (!findNode(next, node.id)) return null;
  }
  return next;
}

/** Whether a candidate is really an image: an Image element, or a part whose field is an image. */
export function isImageTarget(candidate: ImageCandidate, source: Source): boolean {
  const instance = getInstance(source, candidate.ref);
  if (!instance) return false;
  if ("nodeId" in candidate) return findNode(instance.componentTree ?? [], candidate.nodeId)?.type === "image";
  return partField(storeSectionRegistry.get(instance.sectionId), candidate.part)?.type === "image";
}

/** Moves a node within its own tree to a slot: the new index, `"same"` when it is already there, null when refused. */
function moveWithin(tree: readonly ComponentNode[], nodeId: string, slot: NodeSlot): number | "same" | null {
  const node = findNode(tree, nodeId);
  const place = findParent(tree, nodeId);
  if (!node || !place) return null;
  // Never into itself or one of its own children.
  if (slot.parentId !== null && (slot.parentId === nodeId || findNode(node.children, slot.parentId))) return null;
  let index = slotIndex(tree, slot);
  if (index === null) return null;
  if (place.parentId === slot.parentId && place.index < index) index -= 1;
  if (place.parentId === slot.parentId && place.index === index) return "same";
  const moved = findParent(moveNode(tree, nodeId, slot.parentId, index), nodeId);
  return moved && moved.parentId === slot.parentId && moved.index === index ? index : null;
}

/**
 * What dropping `payload` at `probe` does on this page. Null when the
 * pointer is not over the canvas (the drop is a cancel).
 */
export function planDrop(payload: CanvasPayload, probe: CanvasProbe | null, source: Source): DropPlan | null {
  if (!probe) return null;
  const sections = source.content.sections;
  const at = probe.sectionIndex;
  const full = sections.length >= MAX_SECTIONS_PER_PAGE;
  const over = probe.overSectionId ? sections.find((s) => s.id === probe.overSectionId) : undefined;
  const custom = over?.sectionId === CUSTOM ? over : undefined;

  if (payload.kind === "section") {
    const definition = storeSectionRegistry.get(payload.sectionId);
    // A library preset may start from a section hidden from the old list (contact details).
    const listed = definition?.insertable !== false || Boolean(payloadPreset(payload.sectionId, payload.presetId));
    // Header and footer belong to every page; they are chosen with a click, not dropped.
    if (!definition || definition.chrome || !listed) return { kind: "invalid", reason: "unsupported", index: at };
    return full ? { kind: "invalid", reason: "limit", index: at } : { kind: "insert-section", index: at };
  }

  if (payload.kind === "move-section") {
    const from = sections.findIndex((s) => s.id === payload.instanceId);
    return from < 0 ? null : { kind: "move-section", instanceId: payload.instanceId, to: sectionMoveTarget(from, at) };
  }

  // Parts and items stay in their section (P4B-16): away from it the drop is refused, not reinterpreted.
  if (payload.kind === "move-part") {
    const instance = getInstance(source, payload.ref);
    if (!instance) return null;
    const move = probe.part ? planPartMove(instance, payload.part, probe.part) : null;
    if (move === "same") return { kind: "invalid", reason: "noop", index: at };
    return move ? { kind: "move-part", ref: payload.ref, part: payload.part, ...move } : { kind: "invalid", reason: "unsupported", index: at };
  }

  if (payload.kind === "move-item") {
    if (!getInstance(source, payload.ref)) return null;
    const to = probe.itemInsertAt == null ? null : planItemMove(payload.index, probe.itemInsertAt);
    if (to === "same") return { kind: "invalid", reason: "noop", index: at };
    return to === null
      ? { kind: "invalid", reason: "unsupported", index: at }
      : { kind: "move-item", ref: payload.ref, collection: payload.collection, from: payload.index, to };
  }

  if (payload.kind === "move-node") {
    const from = sections.find((s) => s.id === payload.sectionInstanceId);
    const node = from ? findNode(from.componentTree ?? [], payload.nodeId) : null;
    if (!from || !node) return null;
    // An Image element dropped on another image of this page takes its place.
    if (node.type === "image") {
      const candidate = probe.images.findIndex(
        (c) => c.ref.target === "page" && !("nodeId" in c && c.nodeId === node.id) && isImageTarget(c, source),
      );
      if (candidate >= 0) {
        return { kind: "replace-image", target: probe.images[candidate]!, candidate, from: { sectionInstanceId: from.id, nodeId: node.id } };
      }
    }
    if (custom) {
      const tree = custom.componentTree ?? [];
      for (const [i, slot] of probe.slots.entries()) {
        if (custom.id === from.id) {
          const moved = moveWithin(tree, node.id, slot);
          // Hovering its own place: stop here rather than fall back to an outer slot.
          if (moved === "same") return { kind: "invalid", reason: "noop", index: at };
          if (moved !== null) return { kind: "move-node", fromSectionId: from.id, nodeId: node.id, sectionInstanceId: custom.id, parentId: slot.parentId, index: moved, slot: i };
          continue;
        }
        const index = slotIndex(tree, slot);
        if (index !== null && insertAll(tree, slot.parentId, index, [node])) {
          return { kind: "move-node", fromSectionId: from.id, nodeId: node.id, sectionInstanceId: custom.id, parentId: slot.parentId, index, slot: i };
        }
      }
      // Over its own section with nowhere new to go (e.g. its own place): nothing to do.
      if (custom.id === from.id) return { kind: "invalid", reason: "noop", index: at };
    }
    return full ? { kind: "invalid", reason: "limit", index: at } : { kind: "move-node-new-section", fromSectionId: from.id, nodeId: node.id, index: at };
  }

  if (payload.kind === "photo" || payload.kind === "media") {
    const candidate = probe.images.findIndex((c) => isImageTarget(c, source));
    if (candidate >= 0) return { kind: "replace-image", target: probe.images[candidate]!, candidate };
  }

  // New elements (element, preset, or an image as an Image element). Planning uses throwaway ids.
  let n = 0;
  const nodes = payloadNodes(payload, () => `__plan-${n++}`);
  if (!nodes.length) return { kind: "invalid", reason: "unsupported", index: at };
  if (custom) {
    const tree = custom.componentTree ?? [];
    for (const [i, slot] of probe.slots.entries()) {
      const index = slotIndex(tree, slot);
      if (index !== null && insertAll(tree, slot.parentId, index, nodes)) {
        return { kind: "insert-nodes", sectionInstanceId: custom.id, parentId: slot.parentId, index, slot: i };
      }
    }
  }
  return full ? { kind: "invalid", reason: "limit", index: at } : { kind: "new-section", index: at };
}

export type DropDeps = {
  makeNodeId: MakeId;
  /** A fresh instance of a library section (new id; the preset's props, or the defaults); null for an unknown id. */
  makeSection: (sectionId: string, presetId?: string) => SectionInstance | null;
  /** Image `src` for a photo drop (the imported media path; media drops carry their own). */
  src?: string;
};

const withSections = (content: PageContent, sections: SectionInstance[]): PageContent => ({ ...content, sections });

function placeSection(content: PageContent, instance: SectionInstance, index: number): PageContent {
  const sections = [...content.sections];
  sections.splice(Math.max(0, Math.min(index, sections.length)), 0, instance);
  return withSections(content, sections);
}

function setTree(content: PageContent, sectionId: string, tree: ComponentNode[]): PageContent {
  return withSections(
    content,
    content.sections.map((s) => (s.id === sectionId ? { ...s, componentTree: tree } : s)),
  );
}

/**
 * The page after a drop, and what to select. Null when the plan no longer
 * fits the page (it changed, or a limit was reached), so nothing is written.
 * Image replacement is not a page-structure change and is done by the commands.
 */
export function applyDropPlan(
  content: PageContent,
  plan: DropPlan,
  payload: CanvasPayload,
  deps: DropDeps,
): { content: PageContent; select: NonNullable<Selection> } | null {
  const sections = content.sections;
  const room = sections.length < MAX_SECTIONS_PER_PAGE;
  switch (plan.kind) {
    case "insert-section": {
      if (payload.kind !== "section" || !room) return null;
      const instance = deps.makeSection(payload.sectionId, payload.presetId);
      if (!instance) return null;
      return { content: placeSection(content, instance, plan.index), select: { target: "page", sectionId: instance.id } };
    }
    case "move-section": {
      const from = sections.findIndex((s) => s.id === plan.instanceId);
      if (from < 0 || from === plan.to) return null;
      const next = [...sections];
      const [moved] = next.splice(from, 1);
      next.splice(Math.max(0, Math.min(plan.to, next.length)), 0, moved!);
      return { content: withSections(content, next), select: { target: "page", sectionId: plan.instanceId } };
    }
    case "insert-nodes": {
      const section = sections.find((s) => s.id === plan.sectionInstanceId);
      const nodes = payloadNodes(payload, deps.makeNodeId, { src: deps.src });
      if (section?.sectionId !== CUSTOM || !nodes.length) return null;
      const tree = insertAll(section.componentTree ?? [], plan.parentId, plan.index, nodes);
      if (!tree) return null;
      return { content: setTree(content, section.id, tree), select: { target: "page", sectionId: section.id, nodeId: nodes[0]!.id } };
    }
    case "new-section": {
      const nodes = payloadNodes(payload, deps.makeNodeId, { src: deps.src });
      const instance = room ? deps.makeSection(CUSTOM) : null;
      const tree = instance && nodes.length ? insertAll([], null, 0, nodes) : null;
      if (!instance || !tree) return null;
      return {
        content: placeSection(content, { ...instance, componentTree: tree }, plan.index),
        select: { target: "page", sectionId: instance.id, nodeId: nodes[0]!.id },
      };
    }
    case "move-node": {
      if (payload.kind !== "move-node") return null;
      const from = sections.find((s) => s.id === plan.fromSectionId);
      const to = sections.find((s) => s.id === plan.sectionInstanceId);
      const node = from ? findNode(from.componentTree ?? [], plan.nodeId) : null;
      if (!from || !to || !node || to.sectionId !== CUSTOM) return null;
      const select = { target: "page" as const, sectionId: to.id, nodeId: node.id };
      if (from.id === to.id) {
        const tree = moveNode(from.componentTree ?? [], node.id, plan.parentId, plan.index);
        const place = findParent(tree, node.id);
        if (!place || place.parentId !== plan.parentId || place.index !== plan.index) return null;
        return { content: setTree(content, from.id, tree), select };
      }
      const target = insertAll(to.componentTree ?? [], plan.parentId, plan.index, [node]);
      if (!target) return null;
      const moved = setTree(setTree(content, to.id, target), from.id, removeNode(from.componentTree ?? [], node.id));
      return { content: moved, select };
    }
    case "move-node-new-section": {
      if (payload.kind !== "move-node") return null;
      const from = sections.find((s) => s.id === plan.fromSectionId);
      const node = from ? findNode(from.componentTree ?? [], plan.nodeId) : null;
      const instance = room ? deps.makeSection(CUSTOM) : null;
      const tree = node ? insertAll([], null, 0, [node]) : null;
      if (!from || !node || !instance || !tree) return null;
      const without = setTree(content, from.id, removeNode(from.componentTree ?? [], node.id));
      return {
        content: placeSection(without, { ...instance, componentTree: tree }, plan.index),
        select: { target: "page", sectionId: instance.id, nodeId: node.id },
      };
    }
    default:
      return null;
  }
}
