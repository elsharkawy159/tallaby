"use client";

import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { styleTargetOf } from "@workspace/store-editor/lib/editor-commands.lib";
import { refOf } from "@workspace/store-editor/lib/editor-selection.lib";
import { setStyle } from "@workspace/store-editor/lib/editor-style.lib";
import type { EditorStore, Selection } from "@workspace/store-editor/state/editor.store";
import { CORNERS, draggedGap, showsRadiusDots, draggedRadius, radiusDot, type Corner, type GapLine, type SelectionHandles } from "@workspace/store-editor/canvas/canvas-handles.lib";
import type { CanvasBox } from "./editor-overlay.client";

/** Hit area across a gap divider, in pixels. */
const GRIP = 10;

/**
 * Direct-manipulation handles on the selected element (owner request
 * 2026-10-19): a divider in each gap of a flex or grid element (drag to
 * change `gap`) and a dot near each corner (drag in or out to change
 * `radius`). Writes go to the device being edited, one undo step per drag.
 */
export function SelectionHandlesLayer({
  store,
  selection,
  box,
  frame,
  handles,
}: {
  store: EditorStore;
  selection: NonNullable<Selection>;
  box: CanvasBox;
  frame: CanvasBox;
  handles: SelectionHandles;
}) {
  const t = useTranslations("storeEditor.canvas");
  // The value being dragged, shown next to the pointer's handle.
  const [active, setActive] = useState<{ id: string; label: string } | null>(null);

  const write = (key: "gap" | "radius", value: number, dragId: string) => {
    const state = store.getState();
    state.editSection(refOf(selection), (i) => setStyle(i, styleTargetOf(selection), state.device, { [key]: value }), `handle:${dragId}:${state.device}`);
  };

  /** Follows one pointer from press to release (captured, so it keeps working over the frame). */
  const drag = (event: ReactPointerEvent<HTMLElement>, onMove: (dx: number, dy: number) => void) => {
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget;
    el.setPointerCapture(event.pointerId);
    const start = { x: event.clientX, y: event.clientY };
    const move = (e: PointerEvent) => onMove(e.clientX - start.x, e.clientY - start.y);
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

  const startGap = (event: ReactPointerEvent<HTMLElement>, line: GapLine, index: number) => {
    if (event.button !== 0) return;
    const from = handles.gap;
    const id = `gap-${index}`;
    setActive({ id, label: t("gapValue", { value: from }) });
    // A fresh coalesce key per drag: one undo step for the whole drag.
    const dragId = `gap:${Date.now()}`;
    drag(event, (dx, dy) => {
      const next = draggedGap(from, line.axis === "x" ? dx : dy, line.axis, handles.rtl);
      setActive({ id, label: t("gapValue", { value: next }) });
      write("gap", next, dragId);
    });
  };

  const startRadius = (event: ReactPointerEvent<HTMLElement>, corner: Corner) => {
    if (event.button !== 0) return;
    const from = handles.radius;
    const id = `radius-${corner}`;
    setActive({ id, label: t("radiusValue", { value: from }) });
    const dragId = `radius:${Date.now()}`;
    drag(event, (dx, dy) => {
      const next = draggedRadius(from, corner, dx, dy, box.width, box.height);
      setActive({ id, label: t("radiusValue", { value: next }) });
      write("radius", next, dragId);
    });
  };

  const left = box.left - frame.left;
  const top = box.top - frame.top;
  // Kept during a radius drag, so dragging a borderless element down to 0 doesn't drop the dot mid-drag.
  const showRadius = showsRadiusDots(handles, box.width, box.height) || !!active?.id.startsWith("radius");

  return (
    <>
      {handles.gaps.map((line, index) => {
        const id = `gap-${index}`;
        const vertical = line.axis === "x";
        return (
          <div
            key={id}
            role="slider"
            aria-label={t("dragGap")}
            aria-valuenow={handles.gap}
            title={t("dragGap")}
            onPointerDown={(e) => startGap(e, line, index)}
            className={cn("group pointer-events-auto absolute flex touch-none items-center justify-center", vertical ? "cursor-col-resize" : "cursor-row-resize")}
            style={
              vertical
                ? { left: line.x - frame.left - GRIP / 2, top: line.y - frame.top, width: GRIP, height: line.length }
                : { left: line.x - frame.left, top: line.y - frame.top - GRIP / 2, width: line.length, height: GRIP }
            }
          >
            {/* A short brand-coloured bar; it grows a little on hover and while dragging. */}
            <span
              className={cn(
                "rounded-full bg-primary transition-all",
                vertical ? "h-3 w-0.5 group-hover:h-4" : "h-0.5 w-3 group-hover:w-4",
                active?.id === id && (vertical ? "h-4" : "w-4"),
              )}
            />
            {active?.id === id && <ValueLabel>{active.label}</ValueLabel>}
          </div>
        );
      })}
      {showRadius &&
        CORNERS.map((corner) => {
          const id = `radius-${corner}`;
          const dot = radiusDot(corner, handles.radius, box.width, box.height);
          return (
            <span
              key={id}
              role="slider"
              aria-label={t("dragRadius")}
              aria-valuenow={handles.radius}
              title={t("dragRadius")}
              onPointerDown={(e) => startRadius(e, corner)}
              className={cn(
                "pointer-events-auto absolute size-1.5 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border border-primary bg-background shadow-sm transition-transform hover:scale-125",
                corner === "tl" || corner === "br" ? "cursor-nwse-resize" : "cursor-nesw-resize",
                active?.id === id && "scale-125 bg-primary",
              )}
              style={{ left: left + dot.x, top: top + dot.y }}
            >
              {active?.id === id && <ValueLabel>{active.label}</ValueLabel>}
            </span>
          );
        })}
    </>
  );
}

function ValueLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute start-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium leading-none text-background rtl:translate-x-1/2">
      {children}
    </span>
  );
}
