"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, GripVertical, LayoutTemplate } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { getEventCoordinates } from "@dnd-kit/utilities";
import { createStore, type StoreApi } from "zustand/vanilla";
import type { ElementType } from "@workspace/store-sections/render";
import type { EditorCommands } from "../lib/editor-commands.lib";
import { ELEMENT_ICONS } from "../lib/editor-icons.lib";
import { recordUse } from "../lib/editor-palette.lib";
import type { EditorStore } from "../state/editor.store";
import { useEditorAdapter } from "../adapter.client";
import type { Line, Point, Rect } from "./canvas-geometry.lib";
import { sampleCanvas, type CanvasSample } from "./canvas-probe.client";
import { CANVAS_DROP_ID, isCanvasPayload, type CanvasPayload, type DragData, type DragPayload, type DropPlan } from "./dnd.types";
import { planDrop } from "./drop-plan.lib";

/** What the canvas draws for the current target, in frame viewport coordinates. */
export type DropMarker =
  | { kind: "line"; line: Line; note?: "newSection" }
  | { kind: "slot"; line: Line; container: Rect }
  | { kind: "image"; rect: Rect }
  | { kind: "invalid"; line: Line; reason: "limit" | "unsupported" };

export type DndState = { active: DragData | null; plan: DropPlan | null; marker: DropMarker | null };

/** The canvas frame, registered by the canvas so drags can be resolved inside it. */
export type CanvasHandle = { doc: Document; frame: HTMLIFrameElement; pressedElement: () => HTMLElement | null };

/** A copy of the element being moved on the canvas, drawn under the pointer while it drags. */
type Ghost = { node: Node; width: number; height: number; dir: string };

type EditorDndValue = { dnd: StoreApi<DndState>; canvas: { current: CanvasHandle | null } };

const EditorDndContext = createContext<EditorDndValue | null>(null);

export function useEditorDnd(): EditorDndValue {
  const value = useContext(EditorDndContext);
  if (!value) throw new Error("useEditorDnd outside EditorDndProvider");
  return value;
}

/** Near the frame's top or bottom edge (px), dragging scrolls the page. */
const SCROLL_ZONE = 56;
const SCROLL_SPEED = 18;

function markerOf(plan: DropPlan, sample: CanvasSample): DropMarker | null {
  const { geometry } = sample;
  switch (plan.kind) {
    case "insert-section":
    case "move-section":
      return { kind: "line", line: geometry.sectionLine };
    case "new-section":
    case "move-node-new-section":
      return { kind: "line", line: geometry.sectionLine, note: "newSection" };
    case "insert-nodes":
    case "move-node": {
      const slot = geometry.slots[plan.slot];
      return slot ? { kind: "slot", line: slot.line, container: slot.container } : null;
    }
    case "move-part":
    case "move-item":
      return geometry.part ? { kind: "slot", line: geometry.part.line, container: geometry.part.container } : null;
    case "replace-image": {
      const rect = geometry.images[plan.candidate];
      return rect ? { kind: "image", rect } : null;
    }
    case "invalid":
      return plan.reason === "noop" ? null : { kind: "invalid", line: geometry.sectionLine, reason: plan.reason };
  }
}

/** Keys for "Recent" / "Most used" in the Add panel. */
function usageKey(payload: CanvasPayload) {
  if (payload.kind === "element") return `el:${payload.elementType}` as const;
  if (payload.kind === "preset") return `preset:${payload.presetId}` as const;
  if (payload.kind === "section") return `section:${payload.sectionId}` as const;
  return null;
}

/**
 * Drag and drop for the whole editor (P4B-12): one DndContext for the Add
 * panel, Explore, Layers and the canvas. Layers rows sort among their
 * siblings with @dnd-kit/sortable; everything else drops on the canvas,
 * where the target comes from `sampleCanvas` + `planDrop` (once per frame,
 * never per pointer event). Every drop is one editor command, so it is one
 * undo step and autosaves like any edit; a cancelled or refused drop
 * writes nothing.
 */
export function EditorDndProvider({
  store,
  commands,
  readOnly,
  children,
}: {
  store: EditorStore;
  commands: EditorCommands;
  readOnly: boolean;
  children: ReactNode;
}) {
  const exploreApi = useEditorAdapter().explore;
  const t = useTranslations("storeEditor.dnd");
  const tExplore = useTranslations("storeEditor.explore");
  const [value] = useState<EditorDndValue>(() => ({
    dnd: createStore<DndState>()(() => ({ active: null, plan: null, marker: null })),
    canvas: { current: null },
  }));
  const [overlay, setOverlay] = useState<DragData | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const drag = useRef<{ payload: CanvasPayload | null; origin: Point | null; pointer: Point | null; raf: number }>({
    payload: null,
    origin: null,
    pointer: null,
    raf: 0,
  });
  const importing = useRef(new Set<string>());

  const sensors = useSensors(
    // A few pixels of movement before a drag starts, so clicks still click.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Touch: press and hold, so the panels still scroll with a swipe.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const source = () => {
    const s = store.getState();
    const page = s.pages.find((p) => p.id === s.activePageId) ?? s.pages[0]!;
    return { content: page.content, header: s.header, footer: s.footer, presets: s.presets };
  };

  /** The plan and marker for the pointer now (null when it is not over the frame). */
  const resolve = (): { plan: DropPlan; sample: CanvasSample } | null => {
    const { payload, pointer } = drag.current;
    const canvas = value.canvas.current;
    if (!payload || !pointer || !canvas) return null;
    const f = canvas.frame.getBoundingClientRect();
    // The frame's document starts inside its border.
    const local = { x: pointer.x - f.left - canvas.frame.clientLeft, y: pointer.y - f.top - canvas.frame.clientTop };
    if (local.x < 0 || local.y < 0 || local.x > f.width || local.y > f.height) return null;
    const sample = sampleCanvas(canvas.doc, local, payload);
    const plan = planDrop(payload, sample.probe, source());
    return plan ? { plan, sample } : null;
  };

  /** Scrolls the frame while the pointer rests near its top or bottom edge; true when it moved. */
  const autoScroll = (): boolean => {
    const { pointer } = drag.current;
    const canvas = value.canvas.current;
    const view = canvas?.doc.defaultView;
    if (!pointer || !canvas || !view) return false;
    const f = canvas.frame.getBoundingClientRect();
    if (pointer.x < f.left || pointer.x > f.right) return false;
    const fromTop = pointer.y - f.top;
    const fromBottom = f.bottom - pointer.y;
    const step = fromTop >= 0 && fromTop < SCROLL_ZONE ? -1 : fromBottom >= 0 && fromBottom < SCROLL_ZONE ? 1 : 0;
    if (!step) return false;
    const depth = (SCROLL_ZONE - Math.min(fromTop, fromBottom)) / SCROLL_ZONE;
    const before = view.scrollY;
    view.scrollBy(0, step * Math.ceil(SCROLL_SPEED * depth));
    return view.scrollY !== before;
  };

  const tick = () => {
    drag.current.raf = 0;
    if (!drag.current.payload) return;
    const scrolled = autoScroll();
    const target = resolve();
    const marker = target ? markerOf(target.plan, target.sample) : null;
    const prev = value.dnd.getState();
    // State changes only when the target or its marker moved (no re-render per pointer event).
    if (JSON.stringify(prev.plan) !== JSON.stringify(target?.plan ?? null) || JSON.stringify(prev.marker) !== JSON.stringify(marker)) {
      value.dnd.setState({ plan: target?.plan ?? null, marker });
    }
    if (scrolled) schedule();
  };
  const schedule = () => {
    if (!drag.current.raf) drag.current.raf = requestAnimationFrame(tick);
  };

  const finish = () => {
    if (drag.current.raf) cancelAnimationFrame(drag.current.raf);
    drag.current = { payload: null, origin: null, pointer: null, raf: 0 };
    value.dnd.setState({ active: null, plan: null, marker: null });
    setOverlay(null);
    setGhost(null);
  };

  // A drag never outlives the editor.
  useEffect(() => () => {
    if (drag.current.raf) cancelAnimationFrame(drag.current.raf);
  }, []);

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (!data) return;
    const origin = getEventCoordinates(event.activatorEvent);
    drag.current = { payload: isCanvasPayload(data.payload) ? data.payload : null, origin, pointer: origin, raf: 0 };
    value.dnd.setState({ active: data, plan: null, marker: null });
    setOverlay(data);
    // An element, part or item dragged on the canvas shows itself under the pointer.
    const kind = data.payload.kind;
    const element = kind === "move-node" || kind === "move-part" || kind === "move-item" ? value.canvas.current?.pressedElement() : null;
    if (element?.isConnected) {
      const rect = element.getBoundingClientRect();
      setGhost({ node: ghostCopy(element), width: rect.width, height: rect.height, dir: element.ownerDocument.documentElement.dir });
      return;
    }
    // A library section shows its preview thumbnail (same document, so a plain copy keeps its look).
    if (kind === "section") {
      const target = event.activatorEvent.target;
      const preview = target instanceof Element ? target.closest("button")?.querySelector<HTMLElement>("[data-drag-preview]") : null;
      if (preview) {
        const rect = preview.getBoundingClientRect();
        setGhost({ node: preview.cloneNode(true), width: rect.width, height: rect.height, dir: document.documentElement.dir });
      }
    }
  };

  const onDragMove = (event: DragMoveEvent) => {
    if (!drag.current.payload) return;
    const { origin } = drag.current;
    if (origin) {
      drag.current.pointer = { x: origin.x + event.delta.x, y: origin.y + event.delta.y };
    } else {
      // Keyboard: the dragged item's centre stands in for the pointer.
      const rect = event.active.rect.current.translated;
      if (rect) drag.current.pointer = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    schedule();
  };

  const dropPhoto = async (payload: Extract<CanvasPayload, { kind: "photo" }>, plan: DropPlan) => {
    const { photoId } = payload.photo;
    if (readOnly) {
      toast.error(tExplore("readOnly"));
      return;
    }
    // One import per photo at a time (a second drop while the first imports is ignored).
    // Photos only come from Explore, which hosts without stock photos don't show.
    if (importing.current.has(photoId) || !exploreApi) return;
    importing.current.add(photoId);
    // The page is fixed now: switching pages while the photo imports doesn't move the drop.
    const pageId = store.getState().activePageId;
    const toastId = toast.loading(tExplore("importing"));
    try {
      const result = await exploreApi.import(photoId);
      if (!result.success) {
        toast.error(tExplore(`errors.${result.error}`), { id: toastId });
        return;
      }
      const placed = commands.applyDrop(payload, plan, { src: result.data.url, pageId });
      if (placed) toast.success(tExplore("imported"), { id: toastId });
      else toast.error(t("targetGone"), { id: toastId });
    } finally {
      importing.current.delete(photoId);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as DragData | undefined;
    const payload = drag.current.payload;
    // Resolve against the page as it is right now, not the last frame's plan.
    const target = payload ? resolve() : null;
    finish();
    if (!data) return;

    if (data.payload.kind === "layer") {
      const over = event.over?.data.current as (DragData & { sortable?: { index: number } }) | undefined;
      const from = (event.active.data.current as { sortable?: { index: number } }).sortable?.index;
      const to = over?.sortable?.index;
      const layer = data.payload;
      if (!over || over.payload.kind !== "layer" || over.payload.container !== layer.container || from === undefined || to === undefined || from === to) return;
      if (layer.nodeId) commands.moveNodeTo(layer.ref, layer.nodeId, layer.parentId ?? null, to);
      else if (layer.ref.target === "page") commands.moveSectionTo(layer.ref.sectionId, to);
      return;
    }

    if (!payload || !target) return;
    const { plan } = target;
    if (plan.kind === "invalid") {
      if (plan.reason === "limit") toast.error(t("limit"));
      return;
    }
    if (payload.kind === "photo") {
      void dropPhoto(payload, plan);
      return;
    }
    if (commands.applyDrop(payload, plan)) {
      const key = usageKey(payload);
      if (key) recordUse(key);
    }
  };

  // Layers rows only meet their siblings; everything else only meets the canvas.
  const collisionDetection: CollisionDetection = (args) => {
    const payload = (args.active.data.current as DragData | undefined)?.payload;
    if (payload?.kind === "layer") {
      const siblings = args.droppableContainers.filter((c) => {
        const other = (c.data.current as DragData | undefined)?.payload;
        return other?.kind === "layer" && other.container === payload.container;
      });
      return closestCenter({ ...args, droppableContainers: siblings });
    }
    const canvas = args.droppableContainers.filter((c) => c.id === CANVAS_DROP_ID);
    return args.pointerCoordinates ? pointerWithin({ ...args, droppableContainers: canvas }) : rectIntersection({ ...args, droppableContainers: canvas });
  };

  const describePlan = (label: string): string => {
    const plan = value.dnd.getState().plan;
    if (!plan) return t("announce.noTarget", { label });
    switch (plan.kind) {
      case "insert-section":
        return t("announce.insertSection", { position: plan.index + 1 });
      case "move-section":
        return t("announce.moveSection", { position: plan.to + 1 });
      case "new-section":
      case "move-node-new-section":
        return t("announce.newSection", { position: plan.index + 1 });
      case "insert-nodes":
      case "move-node":
        return t("announce.intoSection", { position: plan.index + 1 });
      case "move-part":
        return t("announce.movePart", { position: plan.index + 1 });
      case "move-item":
        return t("announce.movePart", { position: plan.to + 1 });
      case "replace-image":
        return t("announce.replaceImage");
      case "invalid":
        return plan.reason === "noop" ? t("announce.noop") : t("announce.invalid");
    }
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => t("announce.start", { label: (active.data.current as DragData | undefined)?.label ?? "" }),
    onDragMove: ({ active }) => {
      const data = active.data.current as DragData | undefined;
      return data && isCanvasPayload(data.payload) ? describePlan(data.label) : undefined;
    },
    onDragOver: ({ active, over }) => {
      const data = active.data.current as DragData | undefined;
      if (!data || isCanvasPayload(data.payload)) return undefined;
      const sortable = (over?.data.current as { sortable?: { index: number; items: unknown[] } } | undefined)?.sortable;
      return sortable ? t("announce.layerOver", { position: sortable.index + 1, total: sortable.items.length }) : undefined;
    },
    onDragEnd: ({ active }) => t("announce.drop", { label: (active.data.current as DragData | undefined)?.label ?? "" }),
    onDragCancel: ({ active }) => t("announce.cancel", { label: (active.data.current as DragData | undefined)?.label ?? "" }),
  };

  const isLayerDrag = overlay?.payload.kind === "layer";

  return (
    <EditorDndContext.Provider value={value}>
      <DndContext
        // A fixed id keeps dnd-kit's generated aria ids the same on the server and the client (no hydration mismatch).
        id="store-editor-dnd"
        sensors={sensors}
        collisionDetection={collisionDetection}
        // Panels scroll for Layers sorting; the canvas frame scrolls itself (autoScroll above).
        autoScroll={isLayerDrag}
        accessibility={{ announcements, screenReaderInstructions: { draggable: t("instructions") } }}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDragCancel={finish}
      >
        {children}
        <DragOverlay dropAnimation={null}>{ghost ? <DragGhost ghost={ghost} /> : overlay ? <DragChip data={overlay} /> : null}</DragOverlay>
      </DndContext>
    </EditorDndContext.Provider>
  );
}

/** The card that follows the pointer: icon (or photo) and name. */
function DragChip({ data }: { data: DragData }) {
  const { payload } = data;
  const icon =
    payload.kind === "element" ? (
      (() => {
        const Icon = ELEMENT_ICONS[payload.elementType as ElementType];
        return Icon ? <Icon className="size-4" aria-hidden /> : null;
      })()
    ) : payload.kind === "section" || payload.kind === "preset" ? (
      <LayoutTemplate className="size-4" aria-hidden />
    ) : (
      <GripVertical className="size-4" aria-hidden />
    );
  if (payload.kind === "photo" || payload.kind === "media") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Pexels CDN or store-media thumbnail
      <img
        src={payload.kind === "photo" ? payload.photo.thumbUrl : payload.thumbUrl}
        alt=""
        className="size-20 cursor-grabbing rounded-lg border-2 border-background object-cover shadow-xl ring-2 ring-primary"
      />
    );
  }
  return (
    <div className="flex max-w-56 cursor-grabbing items-center gap-2 rounded-lg border bg-background px-2.5 py-2 text-sm font-medium shadow-xl ring-2 ring-primary/30">
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">{icon}</span>
      <span className="truncate">{data.label}</span>
    </div>
  );
}

/** Most elements a ghost copies the look of, one by one (a bigger one keeps only the editor's classes). */
const GHOST_STYLED_NODES = 300;

/**
 * A copy of a frame element that looks the same outside the frame: each
 * element gets its computed style inline (the frame's page styles and theme
 * don't exist in the editor document). Ids and editor markers are dropped.
 */
function ghostCopy(element: HTMLElement): Node {
  const copy = element.cloneNode(true) as HTMLElement;
  const view = element.ownerDocument.defaultView;
  const sources = [element, ...element.querySelectorAll<HTMLElement>("*")];
  const targets = [copy, ...copy.querySelectorAll<HTMLElement>("*")];
  sources.forEach((source, i) => {
    const target = targets[i]!;
    target.removeAttribute("id");
    target.removeAttribute("data-node-id");
    target.removeAttribute("data-part");
    target.removeAttribute("data-item");
    if (!view || i >= GHOST_STYLED_NODES) return;
    const computed = view.getComputedStyle(source);
    for (let p = 0; p < computed.length; p++) {
      const name = computed[p]!;
      target.style.setProperty(name, computed.getPropertyValue(name));
    }
  });
  // It fills the ghost box, wherever it sat in its section.
  copy.style.margin = "0";
  copy.style.position = "static";
  copy.style.transform = "none";
  copy.style.opacity = "1";
  return copy;
}

/** The moved element itself, at its size, following the pointer from where it was grabbed. */
function DragGhost({ ghost }: { ghost: Ghost }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.replaceChildren(ghost.node);
    return () => el.replaceChildren();
  }, [ghost]);
  return (
    <div
      ref={host}
      dir={ghost.dir}
      className="pointer-events-none cursor-grabbing overflow-hidden rounded-[3px] opacity-85 shadow-xl ring-2 ring-primary/60"
      style={{ width: ghost.width, height: ghost.height }}
    />
  );
}

/** A refused-drop badge, shared by the canvas marker. */
export function InvalidBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-destructive px-2 py-1 text-[11px] font-medium text-white shadow-md">
      <Ban className="size-3" aria-hidden />
      {children}
    </span>
  );
}

/** Whether the user asked for less motion (sortable rows then jump instead of sliding). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Memoised DragData for a draggable (stable object across renders). */
export function useDragData(payload: DragPayload, label: string): DragData {
  const key = JSON.stringify(payload);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the payload's content
  return useMemo(() => ({ payload, label }), [key, label]);
}
