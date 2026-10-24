"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal, flushSync } from "react-dom";
import { useTranslations } from "next-intl";
import { useDroppable } from "@dnd-kit/core";
import { RefreshCw } from "lucide-react";
import { useStore } from "zustand";
import type { DesignSystem, SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  CLASSIC_TOKENS,
  PageStyles,
  SITE_ROOT_CLASS,
  SectionRenderer,
  SiteTheme,
  designSystemToTokens,
  flushHeaderOnMobile,
  drawChrome,
  storeSectionRegistry,
  type RenderContext,
} from "@workspace/store-sections/render";
import { cn } from "@workspace/ui/lib/utils";
import { gapLines, type SelectionHandles } from "./canvas-handles.lib";
import { EditorOverlay, elementDragKey, type CanvasBox, type CanvasBoxes } from "./editor-overlay.client";
import { DEVICE_TONE } from "../lib/editor-devices.lib";
import { styleKindOf } from "../lib/editor-style.lib";
import type { EditorCommands } from "../lib/editor-commands.lib";
import { CANVAS_DROP_ID, isCanvasPayload } from "../dnd/dnd.types";
import { InvalidBadge, useEditorDnd, type DropMarker } from "../dnd/editor-dnd.client";
import { getInstance, inlineTextInfo, isImageSelection, refOf, sameRef, splitPartAttr } from "../lib/editor-selection.lib";
import type { Device, EditorStore, SectionRef, Selection } from "../state/editor.store";

const DEVICE_WIDTH: Record<Device, string> = { desktop: "100%", tablet: "820px", mobile: "390px" };

/** Copies the dashboard's stylesheets into the frame (Tailwind and fonts). */
function syncStyles(target: Document) {
  target.head.querySelectorAll("[data-copied-style]").forEach((node) => node.remove());
  document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    const copy = node.cloneNode(true) as HTMLElement;
    copy.setAttribute("data-copied-style", "");
    target.head.appendChild(copy);
  });
}

const esc = (value: string) => CSS.escape(value);

/** The innermost selectable thing under a frame element: element, part, section or header/footer. */
export function hitTest(element: Element | null): { selection: NonNullable<Selection>; element: HTMLElement } | null {
  if (!element) return null;
  const nodeEl = element.closest<HTMLElement>("[data-node-id]");
  const partEl = element.closest<HTMLElement>("[data-part]");
  const chromeEl = element.closest<HTMLElement>("[data-editor-chrome]");
  const sectionEl = element.closest<HTMLElement>("[data-section-id]");
  if (!sectionEl) return null;
  const base: NonNullable<Selection> = chromeEl
    ? { target: chromeEl.dataset.editorChrome as "header" | "footer" }
    : { target: "page", sectionId: sectionEl.dataset.sectionId! };
  // Prefer whichever marked element is closer to the click.
  if (nodeEl && (!partEl || partEl.contains(nodeEl))) return { selection: { ...base, nodeId: nodeEl.dataset.nodeId! }, element: nodeEl };
  const part = splitPartAttr(partEl?.dataset.part);
  if (partEl && part) return { selection: { ...base, part: part.part }, element: partEl };
  return { selection: base, element: chromeEl ?? sectionEl };
}

/** The frame element of a selection (for outlines, popover and inline editing). */
export function findSelectionElement(doc: Document, selection: Selection): HTMLElement | null {
  if (!selection) return null;
  const root =
    selection.target === "page"
      ? doc.querySelector<HTMLElement>(`main [data-section-id="${esc(selection.sectionId)}"]`)
      : doc.querySelector<HTMLElement>(`[data-editor-chrome="${selection.target}"]`);
  if (!root) return null;
  if (selection.nodeId) return root.querySelector<HTMLElement>(`[data-node-id="${esc(selection.nodeId)}"]`);
  if (selection.part) return root.querySelector<HTMLElement>(`[data-part$="::${esc(selection.part)}"]`);
  return root;
}

/** What a selection looks like on the page: a button node is a wrapper row around its link, which carries its styles. */
export function visualElement(element: HTMLElement): HTMLElement {
  return element.dataset.nodeType === "button" && element.firstElementChild instanceof HTMLElement ? element.firstElementChild : element;
}

// Only inline markup inside: the text's own box can then be measured.
const NON_INLINE = ":scope *:not(span,a,strong,em,b,i,u,s,small,mark,br,code,sub,sup)";

/** The element's box, grown to its text when the glyphs overflow it (tight line heights, tall Arabic glyphs). */
function visualRect(element: HTMLElement): DOMRect {
  const r = element.getBoundingClientRect();
  const view = element.ownerDocument.defaultView;
  if (!element.textContent?.trim() || element.querySelector(NON_INLINE) || !view || view.getComputedStyle(element).overflow !== "visible") return r;
  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);
  const t = range.getBoundingClientRect();
  if (!t.width || !t.height) return r;
  const top = Math.min(r.top, t.top);
  const left = Math.min(r.left, t.left);
  return new DOMRect(left, top, Math.max(r.right, t.right) - left, Math.max(r.bottom, t.bottom) - top);
}

/** Where the frame's document starts in the container (inside the frame's border). */
function frameOrigin(frame: HTMLIFrameElement, container: HTMLElement) {
  const f = frame.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  return { top: f.top - c.top + frame.clientTop, left: f.left - c.left + frame.clientLeft };
}

function boxOf(element: HTMLElement | null, frame: HTMLIFrameElement, container: HTMLElement): CanvasBox | null {
  if (!element || !element.isConnected) return null;
  const r = visualRect(visualElement(element));
  const o = frameOrigin(frame, container);
  return { top: o.top + r.top, left: o.left + r.left, width: r.width, height: r.height };
}

/**
 * Gap dividers and radius of the selected element (owner request
 * 2026-10-19). Dividers only for elements laid out as flex or grid with
 * two or more items; radius dots for any element big enough.
 */
function handlesOf(selection: Selection, element: HTMLElement | null, frame: HTMLIFrameElement, container: HTMLElement): SelectionHandles | null {
  if (!selection || (!selection.nodeId && !selection.part) || !element?.isConnected) return null;
  const target = visualElement(element);
  const view = target.ownerDocument.defaultView;
  if (!view) return null;
  const cs = view.getComputedStyle(target);
  const o = frameOrigin(frame, container);
  const layout = /^(inline-)?(flex|grid)$/.test(cs.display);
  const isContainer = !!selection.nodeId && styleKindOf({ kind: "node", nodeId: selection.nodeId }, { nodeType: element.dataset.nodeType }) === "container";
  const items =
    layout && isContainer
      ? Array.from(target.children).filter((child) => {
          const r = child.getBoundingClientRect();
          return (r.width > 0 || r.height > 0) && !/^(absolute|fixed)$/.test(view.getComputedStyle(child).position);
        })
      : [];
  const gaps = items.length > 1 ? gapLines(items.map((child) => child.getBoundingClientRect())).map((g) => ({ ...g, x: g.x + o.left, y: g.y + o.top })) : [];
  return {
    gaps,
    gap: Math.round(Number.parseFloat(cs.columnGap) || Number.parseFloat(cs.rowGap) || 0),
    radius: Math.round(Number.parseFloat(cs.borderTopLeftRadius) || 0),
    rtl: cs.direction === "rtl",
    // A border of none or hidden computes to 0px wide.
    bordered: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].some((w) => Number.parseFloat(w) > 0),
  };
}

const sameBox = (a: CanvasBox | null, b: CanvasBox | null) =>
  a === b || (!!a && !!b && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5);

/**
 * The editor canvas (P4-06, P4B-04/10): the real section renderer inside an
 * iframe, so tablet/mobile widths hit the same breakpoints as a phone. Click
 * selects the innermost part or element, double-click edits text in place or
 * opens the media library, right-click opens the context menu. Outlines,
 * toolbars and the popover are drawn above the frame by `EditorOverlay`.
 */
export function EditorCanvas({
  ctx,
  sections,
  header,
  footer,
  designSystem,
  fontClassName,
  defaultLocale,
  device,
  store,
  commands,
  uiLocale,
  onRequestImage,
  onQuickInsert,
  onFrameKeyDown,
  translated = false,
}: {
  ctx: RenderContext;
  sections: SectionInstance[];
  header: SectionInstance | null;
  footer: SectionInstance | null;
  designSystem: DesignSystem;
  /** Class names defining the store font variables. */
  fontClassName?: string;
  defaultLocale: SiteLocale;
  device: Device;
  store: EditorStore;
  commands: EditorCommands;
  uiLocale: string;
  onRequestImage: () => void;
  onQuickInsert: (index: number) => void;
  onFrameKeyDown: (event: KeyboardEvent) => void;
  /** The store has more than one language: the header shows its language switcher (unless hidden). */
  translated?: boolean;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const selection = useStore(store, (s) => s.selection);
  const [hover, setHover] = useState<NonNullable<Selection> | null>(null);
  // The page section whose toolbar shows (the one under the pointer, kept while the pointer is on its toolbar).
  const [toolbarSection, setToolbarSection] = useState<string | null>(null);
  const onToolbar = useRef(false);
  // The element being pressed: its drag source stays mounted while it drags (hover clears).
  const [pressed, setPressed] = useState<NonNullable<Selection> | null>(null);
  // Its frame element: the drag shows a copy of it under the pointer.
  const pressedElement = useRef<HTMLElement | null>(null);
  const [boxes, setBoxes] = useState<CanvasBoxes>({
    selected: null,
    hover: null,
    section: null,
    drag: null,
    frame: null,
    handles: null,
  });
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const { dnd, canvas } = useEditorDnd();
  const activeDrag = useStore(dnd, (s) => s.active);
  // Canvas drags: the frame lets pointer events through to the editor, which resolves the target itself.
  const canvasDrag = activeDrag && isCanvasPayload(activeDrag.payload) ? activeDrag.payload : null;
  /** The instance id a section ref renders with (`data-part` / `data-item` values start with it). */
  const instanceIdOf = (ref: SectionRef) => (ref.target === "page" ? ref.sectionId : (ref.target === "header" ? header?.id : footer?.id) ?? "");
  const { setNodeRef: setDropRef } = useDroppable({ id: CANVAS_DROP_ID });
  const [editing, setEditing] = useState(false);
  // What the storefront draws: flush on phones, plus the logo and tools the seller turned on (never saved).
  const hasLogo = Boolean(ctx.store.logoUrl);
  const drawnHeader = useMemo(() => drawChrome(flushHeaderOnMobile(header), "header", { translated, hasLogo }), [header, translated, hasLogo]);
  const drawnFooter = useMemo(() => drawChrome(footer, "footer", { translated, hasLogo }), [footer, translated, hasLogo]);
  // Remount a section after in-place editing so React owns clean DOM again.
  const [nonce, setNonce] = useState<Record<string, number>>({});
  const latest = useRef({ sections, header, footer, onRequestImage, onFrameKeyDown, commands });
  latest.current = { sections, header, footer, onRequestImage, onFrameKeyDown, commands };

  const startInline = useCallback(
    (element: HTMLElement, sel: NonNullable<Selection>, multiline: boolean) => {
      // Buttons wrap their link: edit the link's text.
      const target = element.dataset.nodeType === "button" ? (element.firstElementChild as HTMLElement | null) : element;
      if (!target || target.children.length > 0) return false;
      const frameDoc = target.ownerDocument;
      const original = target.textContent ?? "";
      const remountKey = sel.target === "page" ? sel.sectionId : sel.target;
      target.setAttribute("contenteditable", "plaintext-only");
      target.style.outline = "none";
      target.focus();
      frameDoc.getSelection()?.selectAllChildren(target);
      setEditing(true);

      const finish = (commit: boolean) => {
        target.removeEventListener("keydown", onKey);
        target.removeEventListener("blur", onBlur);
        target.removeAttribute("contenteditable");
        target.style.outline = "";
        const text = (target.innerText ?? "").replace(/ /g, " ");
        if (!commit) target.textContent = original;
        setEditing(false);
        if (commit && text !== original) latest.current.commands.commitText(sel, multiline ? text : text.replace(/\s*\n\s*/g, " ").trim());
        setNonce((prev) => ({ ...prev, [remountKey]: (prev[remountKey] ?? 0) + 1 }));
      };
      const onKey = (event: KeyboardEvent) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          event.preventDefault();
          finish(false);
        } else if (event.key === "Enter" && (!multiline || event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          finish(true);
        }
      };
      const onBlur = () => finish(true);
      target.addEventListener("keydown", onKey);
      target.addEventListener("blur", onBlur);
      return true;
    },
    [],
  );

  useEffect(() => {
    const frameDoc = frame.current?.contentDocument;
    if (!frameDoc) return;
    frameDoc.open();
    frameDoc.write("<!doctype html><html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head><body></body></html>");
    frameDoc.close();
    syncStyles(frameDoc);
    const observer = new MutationObserver(() => syncStyles(frameDoc));
    observer.observe(document.head, { childList: true });

    const select = (sel: Selection) => store.getState().select(sel);
    // Dragging an element (P4B-12): the press and the moves after it go to its drag source in the
    // editor document, mapped to its coordinates, so the editor's one DndContext carries the drag.
    let release: (() => void) | null = null;
    let suppressClick = false;
    const onMouseDown = (event: MouseEvent) => {
      release?.();
      const target = event.target as HTMLElement | null;
      if (event.button !== 0 || target?.isContentEditable) return;
      const hit = hitTest(target);
      if (!hit || (!hit.selection.nodeId && !hit.selection.part)) return;
      const source = document.querySelector<HTMLElement>(`[data-element-drag="${esc(elementDragKey(hit.selection))}"]`);
      if (!source) return;
      const toEditor = (e: MouseEvent) => {
        const f = frame.current?.getBoundingClientRect();
        return new MouseEvent(e.type, {
          bubbles: true,
          cancelable: true,
          clientX: (f?.left ?? 0) + (frame.current?.clientLeft ?? 0) + e.clientX,
          clientY: (f?.top ?? 0) + (frame.current?.clientTop ?? 0) + e.clientY,
          button: e.button,
          buttons: e.buttons,
        });
      };
      setPressed(hit.selection);
      pressedElement.current = hit.element;
      source.dispatchEvent(toEditor(event));
      const start = { x: event.clientX, y: event.clientY };
      let moved = false;
      const onFrameMove = (e: MouseEvent) => {
        if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) moved = true;
        // No text selection while dragging.
        if (moved) frameDoc.getSelection()?.removeAllRanges();
        document.dispatchEvent(toEditor(e));
      };
      const onFrameUp = (e: MouseEvent) => {
        document.dispatchEvent(toEditor(e));
        release?.();
        // The click after a drag doesn't select what is under the drop.
        if (moved) {
          suppressClick = true;
          setTimeout(() => (suppressClick = false), 0);
        }
      };
      // Images and links would start the browser's own drag instead.
      const onNativeDrag = (e: DragEvent) => e.preventDefault();
      frameDoc.addEventListener("mousemove", onFrameMove);
      frameDoc.addEventListener("mouseup", onFrameUp);
      frameDoc.addEventListener("dragstart", onNativeDrag);
      release = () => {
        frameDoc.removeEventListener("mousemove", onFrameMove);
        frameDoc.removeEventListener("mouseup", onFrameUp);
        frameDoc.removeEventListener("dragstart", onNativeDrag);
        release = null;
        setPressed(null);
      };
    };
    const onClick = (event: MouseEvent) => {
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const target = event.target as HTMLElement | null;
      // Editor actions inside empty states (open a management page, retry) do act, and select nothing.
      if (target?.closest("[data-editor-action]")) return;
      // Links, buttons and form labels never act in the editor (FAQ <summary> still opens).
      if (target?.closest("a, button, label")) event.preventDefault();
      if (target?.isContentEditable) return;
      setMenu(null);
      const hit = hitTest(target);
      if (hit) select(hit.selection);
    };
    const onDoubleClick = (event: MouseEvent) => {
      const hit = hitTest(event.target as HTMLElement | null);
      if (!hit) return;
      event.preventDefault();
      const { sections: list, header: h, footer: f } = latest.current;
      const instance = getInstance({ content: { sections: list }, header: h, footer: f }, refOf(hit.selection));
      select(hit.selection);
      if (isImageSelection(instance, hit.selection)) {
        latest.current.onRequestImage();
        return;
      }
      const info = inlineTextInfo(instance, hit.selection);
      if (info && startInline(hit.element, hit.selection, info.multiline)) return;
      // Not editable in place (several paragraphs, store data): show its field.
      store.getState().setInspectorTab("content");
      store.getState().setFocusSelected(true);
    };
    const onMove = (event: MouseEvent) => {
      const hit = hitTest(event.target as HTMLElement | null);
      setHover((prev) => {
        const next = hit?.selection ?? null;
        if (prev === next) return prev;
        if (prev && next && sameRef(prev, next) && prev.part === next.part && prev.nodeId === next.nodeId) return prev;
        return next;
      });
    };
    const onLeave = () => setHover(null);
    const onContextMenu = (event: MouseEvent) => {
      const hit = hitTest(event.target as HTMLElement | null);
      if (!hit || !frame.current || !container.current) return;
      event.preventDefault();
      select(hit.selection);
      const o = frameOrigin(frame.current, container.current);
      setMenu({ x: o.left + event.clientX, y: o.top + event.clientY });
    };
    const onSubmit = (event: Event) => event.preventDefault();
    const onKeyDown = (event: KeyboardEvent) => latest.current.onFrameKeyDown(event);

    frameDoc.addEventListener("mousedown", onMouseDown, true);
    frameDoc.addEventListener("click", onClick, true);
    frameDoc.addEventListener("dblclick", onDoubleClick, true);
    frameDoc.addEventListener("mousemove", onMove);
    frameDoc.addEventListener("mouseleave", onLeave);
    frameDoc.addEventListener("contextmenu", onContextMenu, true);
    frameDoc.addEventListener("submit", onSubmit, true);
    frameDoc.addEventListener("keydown", onKeyDown);
    setDoc(frameDoc);
    return () => {
      observer.disconnect();
      release?.();
      frameDoc.removeEventListener("mousedown", onMouseDown, true);
      frameDoc.removeEventListener("click", onClick, true);
      frameDoc.removeEventListener("dblclick", onDoubleClick, true);
      frameDoc.removeEventListener("mousemove", onMove);
      frameDoc.removeEventListener("mouseleave", onLeave);
      frameDoc.removeEventListener("contextmenu", onContextMenu, true);
      frameDoc.removeEventListener("submit", onSubmit, true);
      frameDoc.removeEventListener("keydown", onKeyDown);
    };
  }, [store, startInline]);

  useEffect(() => {
    if (!doc) return;
    doc.documentElement.lang = ctx.locale;
    doc.documentElement.dir = ctx.dir;
  }, [doc, ctx.locale, ctx.dir]);

  // Track outline boxes every frame (resizing, content changes); state only changes when a box moves.
  // Scrolling re-measures in the scroll event and commits before the paint, so outlines stay glued
  // to the content instead of trailing it a frame behind (which looked like a smooth glide).
  useEffect(() => {
    if (!doc) return;
    let raf = 0;
    const measure = () => {
      const f = frame.current;
      const c = container.current;
      if (f && c) {
        const selection = store.getState().selection;
        const selectedElement = findSelectionElement(doc, selection);
        const selected = boxOf(selectedElement, f, c);
        const handles = handlesOf(selection, selectedElement, f, c);
        const hovered = hover ? boxOf(findSelectionElement(doc, hover), f, c) : null;
        const section = toolbarSection ? boxOf(findSelectionElement(doc, { target: "page", sectionId: toolbarSection }), f, c) : null;
        // The pressed element keeps its box while it drags (hover clears).
        const drag = pressed ? boxOf(pressedElement.current, f, c) : hovered;
        // The frame's page area (inside its border).
        const frameBox = { ...frameOrigin(f, c), width: f.clientWidth, height: f.clientHeight };
        setBoxes((prev) =>
          sameBox(prev.selected, selected) &&
          sameBox(prev.hover, hovered) &&
          sameBox(prev.section, section) &&
          sameBox(prev.drag, drag) &&
          sameBox(prev.frame, frameBox) &&
          JSON.stringify(prev.handles) === JSON.stringify(handles)
            ? prev
            : { selected, hover: hovered, section, drag, frame: frameBox, handles },
        );
      }
    };
    const tick = () => {
      measure();
      raf = requestAnimationFrame(tick);
    };
    const onScroll = () => flushSync(measure);
    raf = requestAnimationFrame(tick);
    // Capture: scrolling inside the page's own scroll areas moves outlines too.
    doc.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(raf);
      doc.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [doc, hover, toolbarSection, pressed, store]);

  // The section toolbar follows the hovered section. Leaving the frame keeps it a moment, so the pointer can reach it.
  useEffect(() => {
    const next = hover?.target === "page" ? hover.sectionId : null;
    if (next) {
      setToolbarSection(next);
      return;
    }
    const timer = setTimeout(() => {
      if (!onToolbar.current) setToolbarSection(null);
    }, 250);
    return () => clearTimeout(timer);
  }, [hover]);

  // Drag and drop (P4B-12): the provider samples this frame under the pointer.
  useEffect(() => {
    if (!doc || !frame.current) return;
    canvas.current = { doc, frame: frame.current, pressedElement: () => pressedElement.current };
    return () => {
      canvas.current = null;
    };
  }, [doc, canvas]);

  // A drag starts: hover outlines go (the frame gets no pointer events until it ends).
  // The section toolbar stays mounted while its handle drags, and goes when the drag ends.
  useEffect(() => {
    if (canvasDrag) setHover(null);
    else {
      onToolbar.current = false;
      setToolbarSection(null);
      setPressed(null);
    }
  }, [canvasDrag]);

  // Scroll the selection into view when it is chosen outside the canvas (Layers).
  useEffect(() => {
    if (!doc || !selection) return;
    const element = findSelectionElement(doc, selection);
    const view = doc.defaultView;
    if (!element || !view) return;
    const r = element.getBoundingClientRect();
    // Only when (almost) out of view, so clicking a tall section never jumps the page.
    if (r.bottom < 60 || r.top > view.innerHeight - 60) element.scrollIntoView({ block: r.height > view.innerHeight ? "start" : "center" });
  }, [doc, selection]);

  // The popover reads the selection's look back from the frame.
  const selectedElement = useCallback(() => {
    const element = doc ? findSelectionElement(doc, store.getState().selection) : null;
    return element ? visualElement(element) : null;
  }, [doc, store]);

  const sectionKey = (instance: SectionInstance) => `${instance.id}:${nonce[instance.id] ?? 0}`;
  const hoverInstance = hover?.target === "page" ? sections.findIndex((s) => s.id === hover.sectionId) : -1;
  const selectedIndex = selection?.target === "page" ? sections.findIndex((s) => s.id === selection.sectionId) : -1;

  return (
    <div
      ref={(el) => {
        container.current = el;
        setDropRef(el);
      }}
      className="relative flex h-full justify-center overflow-hidden bg-muted/40 p-3 max-sm:p-1.5"
      // While dragging the frame takes no pointer events, so the wheel still scrolls the page.
      onWheel={canvasDrag ? (event) => doc?.defaultView?.scrollBy(0, event.deltaY) : undefined}
    >
      <iframe
        ref={frame}
        title="canvas"
        className={cn("h-full rounded-lg border bg-white shadow-sm transition-[width]", DEVICE_TONE[device].ring)}
        style={{ width: DEVICE_WIDTH[device], maxWidth: "100%", pointerEvents: canvasDrag ? "none" : undefined }}
      />
      {doc &&
        createPortal(
          <div
            className={`${SITE_ROOT_CLASS} ${fontClassName ?? ""} flex min-h-screen flex-col`}
            style={{
              // Inline, so the design system must be merged here too (inline beats SiteTheme's stylesheet).
              ...({ ...CLASSIC_TOKENS, ...designSystemToTokens(designSystem) } as CSSProperties),
              background: "var(--sf-paper)",
              color: "var(--sf-ink)",
              fontFamily: "var(--sf-font-body, var(--font-storefront)), system-ui, sans-serif",
            }}
            dir={ctx.dir}
          >
            <SiteTheme designSystem={designSystem} />
            {/* Heading font like the storefront (and SitePreview). */}
            <style>{`.${SITE_ROOT_CLASS} :where(h1,h2,h3,h4){font-family:var(--sf-font-heading,var(--sf-font-body,var(--font-storefront))),system-ui,sans-serif}`}</style>
            <PageStyles sections={[drawnHeader, ...sections, drawnFooter]} mode="edit" />
            <style>{`[data-section-id],[data-part],[data-node-id]{cursor:default}[contenteditable]{cursor:text;caret-color:var(--sf-brand)}`}</style>
            {/* The section or element being moved stays in place, faded, until it is dropped. */}
            {canvasDrag?.kind === "move-section" && <style>{`main [data-section-id="${esc(canvasDrag.instanceId)}"]{opacity:.35}`}</style>}
            {canvasDrag?.kind === "move-node" && <style>{`[data-node-id="${esc(canvasDrag.nodeId)}"]{opacity:.35}`}</style>}
            {canvasDrag?.kind === "move-part" && (
              <style>{`[data-part="${esc(`${instanceIdOf(canvasDrag.ref)}::${canvasDrag.part}`)}"]{opacity:.35}`}</style>
            )}
            {canvasDrag?.kind === "move-item" && (
              <style>{`[data-item="${esc(`${instanceIdOf(canvasDrag.ref)}::${canvasDrag.collection}.${canvasDrag.index}`)}"]{opacity:.35}`}</style>
            )}
            {header && (
              <div data-editor-chrome="header">
                <SectionRenderer key={`hdr:${nonce.header ?? 0}`} instance={drawnHeader!} registry={storeSectionRegistry} ctx={ctx} defaultLocale={defaultLocale} />
              </div>
            )}
            <main className="flex-1">
              {sections.map((instance) => (
                <SectionRenderer key={sectionKey(instance)} instance={instance} registry={storeSectionRegistry} ctx={ctx} defaultLocale={defaultLocale} />
              ))}
            </main>
            {drawnFooter && (
              <div data-editor-chrome="footer">
                <SectionRenderer key={`ftr:${nonce.footer ?? 0}`} instance={drawnFooter} registry={storeSectionRegistry} ctx={ctx} defaultLocale={defaultLocale} />
              </div>
            )}
          </div>,
          doc.body,
        )}
      {doc && (
        <EditorOverlay
          store={store}
          commands={commands}
          boxes={boxes}
          hover={hover}
          editing={editing}
          dragging={Boolean(canvasDrag)}
          menu={menu}
          onCloseMenu={() => setMenu(null)}
          insertIndex={{ hovered: hoverInstance, selected: selectedIndex }}
          toolbarSection={toolbarSection}
          dragTarget={pressed ?? hover}
          onToolbarPointer={(inside) => {
            onToolbar.current = inside;
            // During a drag the pointer leaves the handle; the drag end clears the toolbar.
            if (!inside && !canvasDrag) setToolbarSection(null);
          }}
          onQuickInsert={onQuickInsert}
          onRequestImage={onRequestImage}
          sections={sections}
          header={header}
          footer={footer}
          uiLocale={uiLocale}
          selectedElement={selectedElement}
        />
      )}
      {canvasDrag && boxes.frame && <CanvasDropMarker dnd={dnd} frame={boxes.frame} />}
    </div>
  );
}

/**
 * Where the current drag would land (P4B-12): a line between sections or
 * inside a container (with the container outlined), a frame over an image
 * it would replace, or a refused-drop note. Drawn above the frame, clipped to it.
 */
function CanvasDropMarker({ dnd, frame }: { dnd: ReturnType<typeof useEditorDnd>["dnd"]; frame: CanvasBox }) {
  const t = useTranslations("storeEditor.dnd");
  const marker = useStore(dnd, (s) => s.marker);
  if (!marker) return null;
  return (
    <div className="pointer-events-none absolute z-40 overflow-hidden rounded-lg" style={{ top: frame.top, left: frame.left, width: frame.width, height: frame.height }} aria-hidden>
      <MarkerShape marker={marker} frame={frame} label={marker.kind === "image" ? t("replaceImage") : marker.kind === "line" && marker.note ? t("newSection") : marker.kind === "invalid" ? t(marker.reason) : null} />
    </div>
  );
}

function MarkerShape({ marker, frame, label }: { marker: DropMarker; frame: CanvasBox; label: string | null }) {
  const clampY = (y: number) => Math.max(2, Math.min(frame.height - 2, y));
  if (marker.kind === "image") {
    const r = marker.rect;
    return (
      <div
        className="absolute grid place-items-center rounded-[3px] border-[3px] border-primary bg-black/35"
        style={{ top: r.top, left: r.left, width: r.right - r.left, height: r.bottom - r.top }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-lg">
          <RefreshCw className="size-4" aria-hidden />
          {label}
        </span>
      </div>
    );
  }
  const line = marker.line;
  const bar =
    line.orientation === "horizontal" ? (
      <div className="absolute flex items-center transition-[top,left,width] duration-150 ease-out motion-reduce:transition-none" style={{ top: clampY(line.y) - 1, left: line.x, width: line.length }}>
        <span className={cn("absolute inset-x-1 h-0.5 rounded-full", marker.kind === "invalid" ? "bg-destructive" : "bg-primary shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_20%,transparent)]")} />
        <span className={cn("relative size-2.5 rounded-full border-2 bg-background", marker.kind === "invalid" ? "border-destructive" : "border-primary")} />
        {label && (
          <span className="absolute start-1/2 top-2 -translate-x-1/2 rtl:translate-x-1/2">
            {marker.kind === "invalid" ? <InvalidBadge>{label}</InvalidBadge> : <span className="whitespace-nowrap rounded-md bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground shadow-md">{label}</span>}
          </span>
        )}
      </div>
    ) : (
      <div className="absolute w-0.5 rounded-full bg-primary shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_20%,transparent)]" style={{ top: line.y, left: line.x - 1, height: line.length }} />
    );
  return (
    <>
      {marker.kind === "slot" && (
        <div
          className="absolute rounded-[3px] border border-dashed border-primary/70 bg-primary/5"
          style={{ top: marker.container.top, left: marker.container.left, width: marker.container.right - marker.container.left, height: marker.container.bottom - marker.container.top }}
        />
      )}
      {bar}
    </>
  );
}
