"use client";

import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { LOGO_HEIGHT_RANGE, setLogoHeight } from "@workspace/store-sections/render";
import { cn } from "@workspace/ui/lib/utils";
import { styleTargetOf } from "../lib/editor-commands.lib";
import { refOf } from "../lib/editor-selection.lib";
import { setStyle } from "../lib/editor-style.lib";
import type { EditorStore, Selection } from "../state/editor.store";
import type { ResizeTarget } from "./canvas-handles.lib";
import type { CanvasBox } from "./editor-overlay.client";
import { RESIZE_HANDLES, draggedSize, handleCursor, handlePosition, keyDelta, steppedSize, type ResizeHandle, type ResizeLimits, type Size } from "./resize-handles.lib";

/** Hit area of a handle (the visible square is smaller), in pixels. */
const HIT = 14;
/** Smallest image width a drag leaves, in pixels. */
const IMAGE_MIN = 24;
/** The handle that takes keyboard focus (Tab): the bottom corner on the reading direction's end side. */
const FOCUS_HANDLE: Record<"ltr" | "rtl", ResizeHandle> = { ltr: "se", rtl: "sw" };

/**
 * Resize handles on a selected image or store logo (seller feedback
 * 2026-11-14): eight handles on the selection's box, dragged with a mouse,
 * pen or finger. The aspect ratio is kept (an image's height follows its
 * width, the logo's width follows its height); the size snaps to 4px for an
 * image and 2px for the logo (hold Alt for single pixels), is clamped to its
 * parent, and shows next to the pointer. With the corner handle focused the
 * arrow keys change it (Shift: 10px). An image writes its own `width` (and
 * `maxWidth: 100%`, so it can grow past a design's cap without overflowing)
 * on the device being edited; the logo writes the header or footer's logo
 * height (config/logo-size.ts), phones separately. One undo step per drag.
 */
export function ResizeHandlesLayer({
  store,
  selection,
  box,
  frame,
  target,
  rtl,
}: {
  store: EditorStore;
  selection: NonNullable<Selection>;
  box: CanvasBox;
  frame: CanvasBox;
  target: ResizeTarget;
  rtl: boolean;
}) {
  const t = useTranslations("storeEditor.canvas");
  const [active, setActive] = useState<{ handle: ResizeHandle; size: Size } | null>(null);
  // One undo step per keyboard session on a handle (a fresh key on each focus).
  const keyId = useRef(`resize-key:${Date.now()}`);

  const limits = (step: number): ResizeLimits => {
    if (target.kind === "image") return { axis: "width", min: IMAGE_MIN, max: 4000, step, maxWidth: target.maxWidth };
    const range = LOGO_HEIGHT_RANGE[store.getState().device === "mobile" ? "mobile" : "desktop"];
    return { axis: "height", min: range.min, max: range.max, step, maxWidth: target.maxWidth };
  };

  const write = (size: Size, coalesceKey: string) => {
    const state = store.getState();
    const device = state.device;
    if (target.kind === "image") {
      state.editSection(refOf(selection), (i) => setStyle(i, styleTargetOf(selection), device, { width: `${size.width}px`, maxWidth: "100%" }), `${coalesceKey}:${device}`);
      return;
    }
    if (selection.target === "page") return;
    const part = selection.target;
    state.editSection(refOf(selection), (i) => setLogoHeight(i, part, device === "mobile" ? "mobile" : "desktop", size.height), `${coalesceKey}:${device}`);
  };

  const start: Size = { width: target.width, height: target.height };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>, handle: ResizeHandle) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget;
    el.setPointerCapture(event.pointerId);
    const from = { x: event.clientX, y: event.clientY };
    const dragId = `resize:${Date.now()}`;
    let last = start;
    setActive({ handle, size: start });
    const move = (e: PointerEvent) => {
      const next = draggedSize(start, handle, e.clientX - from.x, e.clientY - from.y, limits(e.altKey ? 1 : target.kind === "image" ? 4 : 2));
      setActive({ handle, size: next });
      if (next.width === last.width && next.height === last.height) return;
      last = next;
      write(next, dragId);
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      setActive(null);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    const delta = keyDelta(event.key, { rtl, shift: event.shiftKey });
    if (delta === null) return;
    // The editor's own arrow shortcuts (move the element) must not run as well.
    event.preventDefault();
    event.stopPropagation();
    const next = steppedSize(start, delta, limits(1));
    if (next.width !== start.width || next.height !== start.height) write(next, keyId.current);
  };

  const left = box.left - frame.left;
  const top = box.top - frame.top;
  const label = t(target.kind === "logo" ? "dragResizeLogo" : "dragResize");
  const focusHandle = FOCUS_HANDLE[rtl ? "rtl" : "ltr"];
  const written = target.kind === "image" ? target.width : target.height;
  const range = limits(1);

  return (
    <>
      {RESIZE_HANDLES.map((handle) => {
        const at = handlePosition(handle);
        const isActive = active?.handle === handle;
        const focusable = handle === focusHandle;
        return (
          <span
            key={handle}
            role="slider"
            aria-label={label}
            aria-orientation={target.kind === "image" ? "horizontal" : "vertical"}
            aria-valuenow={written}
            aria-valuemin={range.min}
            aria-valuemax={range.axis === "width" ? Math.max(range.min, target.maxWidth) : range.max}
            aria-valuetext={t("sizeValue", { width: target.width, height: target.height })}
            aria-hidden={focusable ? undefined : true}
            tabIndex={focusable ? 0 : -1}
            title={label}
            onPointerDown={(e) => onPointerDown(e, handle)}
            onKeyDown={focusable ? onKeyDown : undefined}
            onFocus={focusable ? () => (keyId.current = `resize-key:${Date.now()}`) : undefined}
            className="group pointer-events-auto absolute grid -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-sm outline-none"
            style={{ left: left + at.x * box.width, top: top + at.y * box.height, width: HIT, height: HIT, cursor: handleCursor(handle) }}
          >
            <span
              className={cn(
                "block rounded-[2px] border-[1.5px] border-primary bg-background shadow-sm transition-transform group-hover:scale-125 group-focus-visible:scale-125 group-focus-visible:ring-2 group-focus-visible:ring-primary/40",
                handle.length === 2 ? "size-2" : handle === "n" || handle === "s" ? "h-1.5 w-3" : "h-3 w-1.5",
                isActive && "scale-125 bg-primary",
              )}
            />
            {isActive && (
              <span className="pointer-events-none absolute start-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium leading-none tabular-nums text-background rtl:translate-x-1/2">
                {t("sizeValue", { width: active.size.width, height: active.size.height })}
              </span>
            )}
          </span>
        );
      })}
    </>
  );
}
