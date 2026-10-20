/**
 * Drag and drop shapes for the whole editor (P4B-12): what can be dragged,
 * what the canvas reports under the pointer, and what a drop will do. One
 * DndContext (`editor-dnd.client.tsx`) carries every drag; sources put a
 * `DragData` on their draggable and the planner (`drop-plan.lib.ts`) turns
 * a payload and a canvas probe into a `DropPlan`.
 */
import type { ElementType } from "@workspace/store-sections/render";
import type { SectionRef } from "../state/editor.store";
import type { PartSlotHit } from "./part-drop.lib";

/** A photo from the Explore tab (imported into the store's media library on drop). */
export type DragPhoto = { photoId: string; thumbUrl: string; alt: string };

export type DragPayload =
  /** A new element from the Add › Elements tab. */
  | { kind: "element"; elementType: ElementType }
  /** A layout preset (group of elements) from the Add › Elements tab. */
  | { kind: "preset"; presetId: string }
  /** A new section from the Add › Sections tab (`sectionId` = library section id; `presetId` = the library layout it starts from). */
  | { kind: "section"; sectionId: string; presetId?: string }
  /** An Explore photo: replaces an image under the pointer, or inserts an Image element. */
  | { kind: "photo"; photo: DragPhoto }
  /** An image from the store's media library (Images tab): same as a photo, already imported. */
  | { kind: "media"; src: string; thumbUrl: string; alt: string }
  /** An existing page section, moved from the canvas toolbar handle. */
  | { kind: "move-section"; instanceId: string }
  /** An existing element of a custom section, moved from the canvas toolbar handle. */
  | { kind: "move-node"; sectionInstanceId: string; nodeId: string }
  /** A part of a pre-built section (title, text, button, image), moved among the slots of its section (P4B-16). */
  | { kind: "move-part"; ref: SectionRef; part: string }
  /** An item of a section's collection (a highlight card), moved among its siblings (P4B-16). */
  | { kind: "move-item"; ref: SectionRef; collection: string; index: number }
  /** A Layers row: sorted only among its siblings (`container`); `parentId` is the element's parent (null = section root). */
  | { kind: "layer"; container: string; ref: SectionRef; nodeId?: string; parentId?: string | null };

/** `active.data.current` / `over.data.current` of every editor draggable. */
export type DragData = { payload: DragPayload; label: string };

/** Payloads that drop onto the canvas (everything but Layers rows). */
export type CanvasPayload = Exclude<DragPayload, { kind: "layer" }>;

export const isCanvasPayload = (payload: DragPayload | null | undefined): payload is CanvasPayload =>
  Boolean(payload && payload.kind !== "layer");

/** The one droppable the canvas registers; the exact place inside it comes from the probe. */
export const CANVAS_DROP_ID = "editor-canvas";

/** An image under the pointer: an image part of a section, or an Image element. */
export type ImageCandidate = { ref: SectionRef; part: string } | { ref: SectionRef; nodeId: string };

/** Where an element could go: inside `parentId` (null = section root), before `beforeId` (null = at the end). */
export type NodeSlot = { parentId: string | null; beforeId: string | null };

/**
 * What is under the pointer on the canvas, in page terms (no DOM). Built
 * from the frame by `sampleCanvas`; planning on it is pure.
 */
export type CanvasProbe = {
  /** Where a section would be inserted among the page's sections (from their midpoints). */
  sectionIndex: number;
  /** The page section under the pointer (instance id); null over the header, footer or empty space. */
  overSectionId: string | null;
  /** Images under the pointer, topmost first. */
  images: ImageCandidate[];
  /** Element slots in the custom section under the pointer, innermost first (the root last). */
  slots: NodeSlot[];
  /** For a dragged part: the slot of its section under (or nearest to) the pointer. */
  part?: PartSlotHit | null;
  /** For a dragged item: where it would be inserted among its collection (counted before removal). */
  itemInsertAt?: number | null;
};

export type DropPlan =
  | { kind: "insert-section"; index: number }
  | { kind: "move-section"; instanceId: string; to: number }
  /** New element(s), or a photo as an Image element, inside a custom section. */
  | { kind: "insert-nodes"; sectionInstanceId: string; parentId: string | null; index: number; slot: number }
  /** New element(s) wrapped in a new custom section at `index` (pre-built sections hold no elements). */
  | { kind: "new-section"; index: number }
  | { kind: "move-node"; fromSectionId: string; nodeId: string; sectionInstanceId: string; parentId: string | null; index: number; slot: number }
  | { kind: "move-node-new-section"; fromSectionId: string; nodeId: string; index: number }
  /**
   * The dragged image goes in place of the image under the pointer: only its
   * picture changes (layout, size and the rest stay). For an Image element
   * moved on the canvas, the moved element is removed (`from`), so the image
   * ends up where it was dropped.
   */
  | { kind: "replace-image"; target: ImageCandidate; candidate: number; from?: { sectionInstanceId: string; nodeId: string } }
  /** A part to `index` of `slot` in its own section (index counted after taking it out). */
  | { kind: "move-part"; ref: SectionRef; part: string; slot: string; index: number }
  | { kind: "move-item"; ref: SectionRef; collection: string; from: number; to: number }
  /**
   * Nothing happens on drop: refused (`limit`, `unsupported`), or the item
   * is already there (`noop`). `index` = the section boundary under the pointer.
   */
  | { kind: "invalid"; reason: "limit" | "oneSection" | "unsupported" | "noop"; index: number };
