/**
 * The `beforeAfter` element (docs/systems/plan.md §10.1): two layers in one
 * frame, and a vertical handle the visitor drags left and right to reveal one
 * over the other. Server-renderable, no hooks. Its first child is the Before
 * layer and its second the After layer; each is an ordinary box (a photo and,
 * if the seller wants one, a label), so every part stays selectable.
 *
 * The After layer gives the frame its size; the Before layer lies over it and
 * is clipped at the handle (`clip-path`), which sits at `--sf-ba`. The server
 * writes the start position there, so without script both layers show, split
 * at that point. `PhotoToolsRuntime` (`render/photo-tools.client.ts`) moves
 * the variable on drag and on the handle's keys; nothing animates, so reduced
 * motion needs no special case. On the editor canvas there is no runtime: the
 * split stays at the start position, so both photos can be clicked.
 */
import type { CSSProperties, ReactNode } from "react";
import { ChevronsLeftRight } from "lucide-react";
import { sectionText } from "../core/copy";
import type { RenderContext } from "../core/types";
import { cn } from "../sections/_primitives";
import { BEFORE_AFTER, BEFORE_AFTER_VAR, beforeAfterStart, beforeClip, handleShift } from "./before-after.lib";

type Attrs = Record<string, string>;

export function BeforeAfterElement({
  attrs,
  props,
  ctx,
  layers,
}: {
  attrs: Attrs;
  props: Record<string, unknown>;
  ctx: RenderContext;
  /** The drawn Before and After layers (a layer that draws nothing is left out by the caller). */
  layers: ReactNode[];
}) {
  const [before, after] = layers;
  const live = ctx.mode !== "edit";
  // One layer (or none): a plain frame, nothing to compare.
  if (layers.length < 2) {
    if (!layers.length && live) return null;
    return (
      <div {...attrs} className="relative isolate min-w-0 overflow-hidden">
        {before ?? (
          <span data-editor-only className="block rounded-(--sf-radius,12px) border border-dashed border-(--sf-line) p-4 text-center text-xs text-(--sf-muted)">
            {sectionText("beforeAfterEmpty", ctx.locale)}
          </span>
        )}
      </div>
    );
  }
  const start = beforeAfterStart(props.start);
  const rtl = ctx.dir === "rtl";
  return (
    <div
      {...attrs}
      {...(live && { "data-sf-ba": "" })}
      style={{ [BEFORE_AFTER_VAR]: `${start}%` } as CSSProperties}
      // Selecting text would fight the drag; the canvas keeps it for typing a label in place.
      className={cn("relative isolate min-w-0 touch-pan-y overflow-hidden", live && "select-none")}
    >
      <div data-sf-ba-layer="after" className="*:size-full">
        {after}
      </div>
      <div data-sf-ba-layer="before" style={{ clipPath: beforeClip(rtl) }} className="absolute inset-0 z-1 *:size-full [&_img]:size-full [&_img]:object-cover">
        {before}
      </div>
      {/* The rail is as wide as the frame, so moving it by `--sf-ba` of its own width needs no layout. */}
      <div data-sf-ba-rail="" style={{ transform: handleShift(rtl) }} className="pointer-events-none absolute inset-0 z-2">
        <div
          data-sf-ba-handle=""
          role="slider"
          tabIndex={0}
          aria-orientation="horizontal"
          aria-label={sectionText("beforeAfterHandle", ctx.locale)}
          aria-valuemin={BEFORE_AFTER.min}
          aria-valuemax={BEFORE_AFTER.max}
          aria-valuenow={start}
          className="group/ba pointer-events-auto absolute inset-y-0 start-0 -ms-5.5 grid w-11 cursor-ew-resize touch-none place-items-center outline-none"
        >
          <span aria-hidden className="absolute inset-y-0 start-1/2 -ms-px w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.15)]" />
          <span
            aria-hidden
            className="relative grid size-10 place-items-center rounded-full bg-white text-black shadow-md ring-1 ring-black/10 group-focus-visible/ba:outline-2 group-focus-visible/ba:outline-offset-2 group-focus-visible/ba:outline-(--sf-brand,#111)"
          >
            <ChevronsLeftRight className="size-5" />
          </span>
        </div>
      </div>
    </div>
  );
}
