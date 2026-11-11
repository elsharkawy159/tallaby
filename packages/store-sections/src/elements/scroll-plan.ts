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
 * - **`reveal-scrub`** (docs/systems/plan.md §10, L6). Never on the page's
 *   first section. The section's main photo (as for `parallax`) gets
 *   `data-sf-scroll="scrub-photo"` in its frame, and the box holding its title
 *   (as for `fade-exit`, on any section) gets `data-sf-scroll="scrub-copy"`;
 *   both follow the section root (`data-sf-track`) as it enters the screen.
 *   The root also gets `data-sf-scrub` (`plan.scrub`): the scrub replaces the
 *   section's play-once reveal, so where the scrub runs (CSS scroll timelines,
 *   motion on) the CSS makes every waiting `data-reveal` in that section look
 *   played, and the two never fight. The markup keeps its `data-reveal`, so a
 *   browser without scroll timelines still plays the ordinary reveal once.
 * - **`horizontal`** (L6). The section's row of cards (`scrollEffectTargets`
 *   `rowId`: a node with `role: "h-row"`, else a product, category or post
 *   list that is not a carousel row or paginated, else a `grid` of 4 to 12
 *   boxes) gets `data-sf-scroll="horizontal"` when it draws 4 to 12 cards. The
 *   section root gets `data-sf-h="n"` (it grows by the pinned length) and
 *   `data-sf-track`; its direct child holding the row gets `data-sf-h-pin`
 *   (sticky). Fewer or more cards: nothing is drawn, the row stays as it is.
 *   The pinned layout is CSS only, from 768 × 600 px screens with scroll
 *   timelines and motion on; everywhere else the row keeps its own layout.
 */
import type { ComponentNode } from "../config/schema";
import { isDataList, isPaginated } from "./data";
import { isBannerPhoto, normalizeStyle } from "./style";
import { STEPS_MAX, STEPS_MIN, horizontalCount, type ImageScrollEffect, type ScrollEffect, type ShellScrollEffect } from "./scroll-progress.lib";

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
  /** `reveal-scrub` plays in this section (`data-sf-scrub` on its root: the CSS switches its play-once reveals off there). */
  scrub: boolean;
  /**
   * `horizontal`: the row that slides, the section's direct child that is
   * pinned, and how many cards the row draws (`null`: a data list whose
   * records were not counted; the renderer always counts them).
   */
  horizontal: { rowId: string; pinId: string; count: number | null } | null;
};

export type ScrollTargets = {
  /** What the section's Scroll effect may offer (`none` is always possible). */
  effects: ShellScrollEffect[];
  /** The photo `parallax` and `zoom` move (null: none, or only the background photo). */
  imageId: string | null;
  /** The box `fade-exit` fades (null unless it is the page's first section). */
  contentId: string | null;
  /** The box `reveal-scrub` moves with the photo (null on the page's first section, or with no title box). */
  scrubId: string | null;
  /** The row of cards `horizontal` slides (null: none, or the section has a background photo). */
  rowId: string | null;
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

/** Nothing inside these is a `horizontal` row: they move or fold on their own. */
const NO_ROW_INSIDE: ReadonlySet<string> = new Set(["carousel", "slide", "marquee", "accordion"]);

/** A row `horizontal` can slide: marked `role: "h-row"`, a plain data list, or a grid of 4 to 12 boxes. */
function isRow(node: ComponentNode): boolean {
  if (node.props?.role === "h-row") return (node.children ?? []).length > 0;
  if (isDataList(node.type)) return node.props?.rail !== true && !isPaginated(node) && (node.children ?? []).length > 0;
  return node.type === "grid" && horizontalCount(node.children.length) != null && node.children.every((child) => (child.children ?? []).length > 0);
}

/** The section's `horizontal` row and the root's direct child that holds it (the part that is pinned). */
function findRow(root: ComponentNode): { row: ComponentNode; pin: ComponentNode } | null {
  const search = (node: ComponentNode): ComponentNode | null => {
    if (NO_ROW_INSIDE.has(node.type)) return null;
    if (isRow(node)) return node;
    if (isDataList(node.type)) return null;
    for (const child of node.children ?? []) {
      const row = search(child);
      if (row) return row;
    }
    return null;
  };
  for (const pin of root.children ?? []) {
    const row = search(pin);
    if (row) return { row, pin };
  }
  return null;
}

/**
 * Where a section's Scroll effect would play (for the editor, which shows
 * the control only where it does something, and for the renderer): the first
 * movable photo with `role: "image"` or a banner photo; on the page's first
 * section, the box holding its title. `backgroundImage`: the section has a
 * background photo, which `parallax` and `zoom` move instead. `reveal-scrub`
 * moves the photo and the title's box of any section but the first;
 * `horizontal` slides the section's row of cards (not with a background
 * photo: its wrapper clips, so nothing could be pinned).
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
  const boxId = box && box.type !== "section" && !hasImage(box) ? box.id : null;
  const contentId = isFirstSection ? boxId : null;
  const scrubId = isFirstSection ? null : boxId;
  const root = tree.find((node) => node.type === "section");
  const rowId = (!backgroundImage && root && findRow(root)?.row.id) || null;
  const effects: ShellScrollEffect[] = [];
  if (imageId || backgroundImage) effects.push("parallax", "zoom");
  if (contentId) effects.push("fade-exit");
  if (!isFirstSection && (imageId || scrubId)) effects.push("reveal-scrub");
  if (rowId) effects.push("horizontal");
  return { effects, imageId, contentId, scrubId, rowId };
}

/**
 * The scroll plan of a section root (`null` when nothing in it scrolls).
 * `sectionEffect`: the section's Scroll effect, when its background photo
 * does not take it. `countOf`: how many cards a data list draws (the renderer
 * passes it; without it a list's `horizontal` count stays unknown).
 */
export function planScroll(
  root: ComponentNode,
  sectionEffect: ShellScrollEffect | undefined,
  { isFirstSection = false, countOf }: { isFirstSection?: boolean; countOf?: (list: ComponentNode) => number } = {},
): ScrollPlan | null {
  const plan: ScrollPlan = {
    effects: new Map(),
    frames: new Set(),
    track: false,
    steps: new Map(),
    stepItems: new Map(),
    stepMedia: new Map(),
    stepsMedia: new Set(),
    stepOwn: new Set(),
    scrub: false,
    horizontal: null,
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
  // reveal-scrub: the title's box here, the main photo in the walk below (a photo's own effect wins).
  const scrub = sectionEffect === "reveal-scrub" && !isFirstSection ? scrollEffectTargets(tree) : null;
  if (scrub?.scrubId) {
    plan.effects.set(scrub.scrubId, "scrub-copy");
    plan.scrub = plan.track = true;
  }
  if (sectionEffect === "horizontal") {
    const found = findRow(root);
    const count = !found ? 0 : isDataList(found.row.type) ? (countOf ? countOf(found.row) : null) : found.row.children.length;
    if (found && (count === null || horizontalCount(count))) plan.horizontal = { rowId: found.row.id, pinId: found.pin.id, count };
  }

  walk(tree, null, false, (node, parent, inList) => {
    if (node.type === "image" && parent && movable(node, parent, inList) && !plan.stepMedia.has(node.id)) {
      const own = imageEffectOf(node.props?.scrollEffect);
      const effect = own ?? (node.id === sectionPhoto ? (sectionEffect as ImageScrollEffect) : null);
      if (effect) photo(node, parent, effect);
      else if (node.id === scrub?.imageId) {
        plan.effects.set(node.id, "scrub-photo");
        plan.frames.add(parent.id);
        plan.scrub = plan.track = true;
      }
    }
    if (node.props?.role === "steps" && !inList) planSteps(node, plan);
  });
  walk(tree, null, false, (node, _parent, inList) => {
    if (node.props?.role !== "progress" || inList || node.type === "image") return;
    plan.effects.set(node.id, "progress");
    if (!insideSteps(tree, node.id, plan)) plan.track = true;
  });

  const empty = !plan.effects.size && !plan.steps.size && !plan.horizontal;
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
