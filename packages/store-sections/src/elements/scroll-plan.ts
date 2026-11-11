/**
 * Which nodes of a tree section get a motion v2 scroll effect (docs/motion-v2-plan.md
 * §5.5), worked out once per section from the tree and drawn by the renderer
 * as enum attributes (`render.tsx`). Public pages only: the editor canvas
 * gets no plan, so it never draws `data-sf-scroll` or `data-sf-steps`.
 *
 * The contract (roles and props on tree nodes; no seller CSS anywhere):
 *
 * - **Photo effects.** An `image` gets `data-sf-scroll="parallax|zoom"` from its
 *   own `props.scrollEffect`, or from the section's Scroll effect
 *   (`style.shell.scrollEffect`) on the section's main photo (see
 *   `scrollEffectTargets`). Only a photo outside data lists whose direct parent
 *   is its frame: the parent clips (`overflow` hidden or clip) or holds
 *   nothing else. That parent gets `data-sf-frame` (the CSS clips it and the
 *   scroll timeline follows it), so the photo never shows an edge.
 *   A section background photo takes the section's effect instead of the tree.
 * - **`fade-exit`.** Only on the page's first section: the box holding its
 *   title (the parent of the `role: "title"` heading, else of the first
 *   heading), never the section root and never a box that holds a photo.
 *   The section root gets `data-sf-track` (the timeline it follows).
 * - **Progress bar.** A node with `role: "progress"` gets `data-sf-scroll="progress"`
 *   (and `data-sf-axis="y"` with `props.axis: "vertical"`). Inside a steps
 *   block it follows the steps; elsewhere the section (`data-sf-track`).
 * - **Steps.** A container with `role: "steps"` holding 2 to 8 descendants with
 *   `role: "step"` (the text blocks, in order) gets `data-sf-steps="n"`; each
 *   step gets `data-sf-step-item="k"`. Its descendant with `role: "steps-media"`
 *   is the media column (`data-sf-steps-media`, sticky from 768px), and the
 *   `image` nodes directly inside it are the step photos, in order
 *   (`data-sf-step-media="k"`; they never reveal). Images inside a step
 *   (`data-sf-step-own`) are that step's own photo, shown where the column is
 *   not: phones, reduced motion and Theme › Animations off. The engine sets
 *   `data-sf-step="k"` on the steps block; without it every text shows in full
 *   with the first photo.
 */
import type { ComponentNode } from "../config/schema";
import { isDataList } from "./data";
import { isBannerPhoto, normalizeStyle } from "./style";
import { STEPS_MAX, STEPS_MIN, type ImageScrollEffect, type ScrollEffect, type ShellScrollEffect } from "./scroll-progress.lib";

export type ScrollPlan = {
  /** Node id → its `data-sf-scroll`. */
  effects: Map<string, ScrollEffect>;
  /** Parents of effect photos (`data-sf-frame`). */
  frames: Set<string>;
  /** The section root follows the scroll for a fade-exit or a progress bar (`data-sf-track`). */
  track: boolean;
  /** Steps block id → its step count (`data-sf-steps`). */
  steps: Map<string, number>;
  /** Step text block id → its index (`data-sf-step-item`). */
  stepItems: Map<string, number>;
  /** Step photo id → its index (`data-sf-step-media`). */
  stepMedia: Map<string, number>;
  /** Media column ids (`data-sf-steps-media`). */
  stepsMedia: Set<string>;
  /** Photos inside a step, for phones (`data-sf-step-own`). */
  stepOwn: Set<string>;
};

export type ScrollTargets = {
  /** What the section's Scroll effect may offer (`none` is always possible). */
  effects: ShellScrollEffect[];
  /** The photo `parallax` and `zoom` move (null: none, or only the background photo). */
  imageId: string | null;
  /** The box `fade-exit` fades (null unless it is the page's first section). */
  contentId: string | null;
};

const imageEffectOf = (value: unknown): ImageScrollEffect | null => (value === "parallax" || value === "zoom" ? value : null);

/** A photo's parent is its frame when it clips or holds the photo alone. */
function isFrame(parent: ComponentNode): boolean {
  const overflow = normalizeStyle(parent.style).overflow;
  return overflow === "hidden" || overflow === "clip" || parent.children.length === 1;
}

type Visit = (node: ComponentNode, parent: ComponentNode | null, inList: boolean) => void;
function walk(nodes: readonly ComponentNode[], parent: ComponentNode | null, inList: boolean, visit: Visit) {
  for (const node of nodes) {
    visit(node, parent, inList);
    walk(node.children ?? [], node, inList || isDataList(node.type), visit);
  }
}

/** A photo a scroll effect can move: outside data lists, in its own frame. */
const movable = (node: ComponentNode, parent: ComponentNode | null, inList: boolean) => node.type === "image" && !inList && parent != null && isFrame(parent);

function hasImage(node: ComponentNode): boolean {
  return node.type === "image" || (node.children ?? []).some(hasImage);
}

/**
 * Where a section's Scroll effect would play (for the editor, which shows
 * the control only where it does something, and for the renderer): the first
 * movable photo with `role: "image"` or a banner photo; on the page's first
 * section, the box holding its title. `backgroundImage`: the section has a
 * background photo, which `parallax` and `zoom` move instead.
 */
export function scrollEffectTargets(tree: readonly ComponentNode[], { isFirstSection = false, backgroundImage = false }: { isFirstSection?: boolean; backgroundImage?: boolean } = {}): ScrollTargets {
  const found: { image: string | null; title: { parent: ComponentNode | null; role: boolean } | null } = { image: null, title: null };
  walk(tree, null, false, (node, parent, inList) => {
    if (!found.image && movable(node, parent, inList) && (node.props?.role === "image" || isBannerPhoto(node))) found.image = node.id;
    // The title: the first heading with `role: "title"`, else the first heading.
    if (node.type === "heading" && !inList && (!found.title || (!found.title.role && node.props?.role === "title"))) {
      found.title = { parent, role: node.props?.role === "title" };
    }
  });
  const imageId = found.image;
  const box = found.title?.parent;
  const contentId = isFirstSection && box && box.type !== "section" && !hasImage(box) ? box.id : null;
  const effects: ShellScrollEffect[] = [];
  if (imageId || backgroundImage) effects.push("parallax", "zoom");
  if (contentId) effects.push("fade-exit");
  return { effects, imageId, contentId };
}

/**
 * The scroll plan of a section root (`null` when nothing in it scrolls).
 * `sectionEffect`: the section's Scroll effect, when its background photo
 * does not take it.
 */
export function planScroll(root: ComponentNode, sectionEffect: ShellScrollEffect | undefined, { isFirstSection = false }: { isFirstSection?: boolean } = {}): ScrollPlan | null {
  const plan: ScrollPlan = {
    effects: new Map(),
    frames: new Set(),
    track: false,
    steps: new Map(),
    stepItems: new Map(),
    stepMedia: new Map(),
    stepsMedia: new Set(),
    stepOwn: new Set(),
  };
  const tree = [root];
  const photo = (node: ComponentNode, parent: ComponentNode, effect: ImageScrollEffect) => {
    plan.effects.set(node.id, effect);
    plan.frames.add(parent.id);
  };

  if (sectionEffect) {
    const targets = scrollEffectTargets(tree, { isFirstSection });
    if (sectionEffect === "fade-exit" && targets.contentId) {
      plan.effects.set(targets.contentId, "fade-exit");
      plan.track = true;
    }
  }
  const sectionPhoto = sectionEffect === "parallax" || sectionEffect === "zoom" ? scrollEffectTargets(tree).imageId : null;

  walk(tree, null, false, (node, parent, inList) => {
    if (node.type === "image" && parent && movable(node, parent, inList) && !plan.stepMedia.has(node.id)) {
      const own = imageEffectOf(node.props?.scrollEffect);
      const effect = own ?? (node.id === sectionPhoto ? (sectionEffect as ImageScrollEffect) : null);
      if (effect) photo(node, parent, effect);
    }
    if (node.props?.role === "steps" && !inList) planSteps(node, plan);
  });
  walk(tree, null, false, (node, _parent, inList) => {
    if (node.props?.role !== "progress" || inList || node.type === "image") return;
    plan.effects.set(node.id, "progress");
    if (!insideSteps(tree, node.id, plan)) plan.track = true;
  });

  const empty = !plan.effects.size && !plan.steps.size;
  return empty ? null : plan;
}

/** True when the node sits inside a planned steps block. */
function insideSteps(tree: readonly ComponentNode[], id: string, plan: ScrollPlan): boolean {
  let found = false;
  const visit = (nodes: readonly ComponentNode[], inSteps: boolean) => {
    for (const node of nodes) {
      if (found) return;
      const here = inSteps || plan.steps.has(node.id);
      if (node.id === id) found = here;
      else visit(node.children ?? [], here);
    }
  };
  visit(tree, false);
  return found;
}

function planSteps(block: ComponentNode, plan: ScrollPlan) {
  const items: ComponentNode[] = [];
  const columns: ComponentNode[] = [];
  const visit = (nodes: readonly ComponentNode[]) => {
    for (const node of nodes) {
      if (node.props?.role === "steps") continue; // a nested steps block is its own
      if (node.props?.role === "step") items.push(node);
      else if (node.props?.role === "steps-media") columns.push(node);
      else visit(node.children ?? []);
    }
  };
  visit(block.children ?? []);
  if (items.length < STEPS_MIN || items.length > STEPS_MAX) return;
  plan.steps.set(block.id, items.length);
  items.forEach((item, k) => plan.stepItems.set(item.id, k));
  const column = columns[0];
  if (!column) return;
  plan.stepsMedia.add(column.id);
  column.children
    .filter((child) => child.type === "image")
    .slice(0, STEPS_MAX)
    .forEach((image, k) => plan.stepMedia.set(image.id, k));
  // A step's own photo shows only where the media column does not.
  for (const item of items) {
    walk([item], null, false, (node) => {
      if (node.type === "image" && node.id !== item.id) plan.stepOwn.add(node.id);
    });
  }
}
