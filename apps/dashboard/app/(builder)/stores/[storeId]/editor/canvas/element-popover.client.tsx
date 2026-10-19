"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { CopyPlus, Eye, EyeOff, GripVertical, ImagePlus, Trash2, X } from "lucide-react";
import { useStore } from "zustand";
import type { SectionInstance } from "@workspace/store-sections";
import { storeSectionRegistry, updateNode, type StyleKey, type StyleValues } from "@workspace/store-sections/render";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { ControlRow, Segmented } from "../inspector/controls/style-controls.client";
import { ContainerControls, ImageControls, SpacingControls, TypographyControls, type StylePatch } from "../inspector/controls/style-groups.client";
import { styleTargetOf, type EditorCommands } from "../lib/editor-commands.lib";
import { getNode, partField, refOf, setNodeProp, withTree } from "../lib/editor-selection.lib";
import { StyleOverrideProvider } from "../inspector/controls/style-override.client";
import { DEVICE_TONE } from "../lib/editor-devices.lib";
import { overrideState, readEffectiveStyle, readOwnStyle, setStyle, styleKindOf } from "../lib/editor-style.lib";
import type { EditorStore } from "../state/editor.store";
import { styleFromComputed } from "./canvas-handles.lib";
import type { CanvasBox } from "./editor-overlay.client";

const WIDTH = 300;
const GAP = 12;

/** Next to the anchor on the inline-end side, else the other side, else below; always inside `bounds`. */
export function placePopover(anchor: CanvasBox, bounds: CanvasBox, height: number, rtl: boolean): { top: number; left: number } {
  const right = anchor.left + anchor.width + GAP;
  const leftSide = anchor.left - WIDTH - GAP;
  const fitsRight = right + WIDTH <= bounds.left + bounds.width;
  const fitsLeft = leftSide >= bounds.left;
  const sides = rtl ? [fitsLeft && leftSide, fitsRight && right] : [fitsRight && right, fitsLeft && leftSide];
  const side = sides.find((x): x is number => typeof x === "number");
  let left = side ?? anchor.left;
  let top = anchor.top;
  if (side === undefined) {
    // No room beside it: below when it fits, else above, so the element stays visible.
    const below = anchor.top + anchor.height + GAP;
    top = below + height <= bounds.top + bounds.height ? below : anchor.top - height - GAP;
  }
  left = Math.max(bounds.left + 8, Math.min(left, bounds.left + bounds.width - WIDTH - 8));
  top = Math.max(bounds.top + 8, Math.min(top, bounds.top + bounds.height - height - 8));
  return { top, left };
}

/**
 * Element popover (P4B-05, the screenshot's TEXT card): the most used
 * controls for the selected part or element, anchored next to it. Writes go
 * to the device being edited, through the same helpers as the Style tab.
 */
export function ElementPopover({
  store,
  commands,
  anchor,
  bounds,
  instance,
  onRequestImage,
  selectedElement,
}: {
  store: EditorStore;
  commands: EditorCommands;
  anchor: CanvasBox;
  bounds: CanvasBox | null;
  instance: SectionInstance | null;
  onRequestImage: () => void;
  uiLocale: string;
  selectedElement: () => HTMLElement | null;
}) {
  const t = useTranslations("storeEditor.popover");
  const selection = useStore(store, (s) => s.selection);
  const device = useStore(store, (s) => s.device);
  const [closed, setClosed] = useState(false);
  const [height, setHeight] = useState(240);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => entry && setHeight(entry.contentRect.height));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [closed]);

  // What the element looks like now (its preset, theme or inherited values), read after each change.
  const [shown, setShown] = useState<StyleValues>({});
  useEffect(() => {
    const element = selectedElement();
    const view = element?.ownerDocument.defaultView;
    const next = element && view
      ? styleFromComputed(view.getComputedStyle(element), {
          rootPx: Number.parseFloat(view.getComputedStyle(element.ownerDocument.documentElement).fontSize) || 16,
          rtl: view.getComputedStyle(element).direction === "rtl",
        })
      : {};
    setShown((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [selectedElement, instance, device, anchor.width, anchor.height]);

  if (closed || !selection || !instance || !bounds) return null;

  const node = getNode(instance, selection.nodeId);
  const field = selection.part ? partField(storeSectionRegistry.get(instance.sectionId), selection.part) : undefined;
  const target = styleTargetOf(selection);
  const kind = styleKindOf(target, { nodeType: node?.type, fieldType: field?.type, partKey: selection.part?.split(".").pop() });
  // Its own values win; the rest show what applies now, so e.g. a medium button shows "M" selected.
  const style = { ...shown, ...readEffectiveStyle(instance, target, device) };
  const hidden = readOwnStyle(instance, target, device).hidden === true;
  const state = store.getState();
  const sectionRef = refOf(selection);
  const key = `${instance.id}:${selection.nodeId ?? selection.part}`;
  const patch = (value: StylePatch) => state.editSection(sectionRef, (i) => setStyle(i, target, device, value), `style:${key}:${device}:${Object.keys(value).join(",")}`);

  const overrides = {
    device,
    state: (keys: readonly StyleKey[]) => overrideState(instance, target, device, keys),
    reset: (keys: readonly StyleKey[]) => patch(Object.fromEntries(keys.map((k) => [k, undefined]))),
  };

  const rtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const position = placePopover(anchor, bounds, height, rtl);
  const startDrag = (event: ReactPointerEvent) => {
    const start = { x: event.clientX - offset.x, y: event.clientY - offset.y };
    const move = (e: PointerEvent) => setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const title = t(`kinds.${kind}`);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      className="pointer-events-auto absolute z-20 rounded-xl border bg-background p-3 shadow-xl"
      style={{ top: position.top + offset.y, left: position.left + offset.x, width: WIDTH }}
    >
      <div className="mb-2.5 flex items-center gap-1 border-b pb-2">
        <button type="button" aria-label={t("drag")} onPointerDown={startDrag} className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing">
          <GripVertical className="size-4" />
        </button>
        <span className="flex-1 text-xs font-semibold uppercase tracking-wide">{title}</span>
        {node && (
          <PopButton label={t("duplicate")} onClick={() => commands.duplicate()}>
            <CopyPlus className="size-3.5" />
          </PopButton>
        )}
        <PopButton label={t(hidden ? "show" : "hide")} onClick={() => commands.toggleHidden()}>
          {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </PopButton>
        {node && (
          <PopButton label={t("delete")} onClick={() => commands.remove()}>
            <Trash2 className="size-3.5" />
          </PopButton>
        )}
        <PopButton label={t("close")} onClick={() => setClosed(true)}>
          <X className="size-3.5" />
        </PopButton>
      </div>

      <StyleOverrideProvider value={overrides}>
        {(kind === "text" || kind === "button") && <TypographyControls style={style} set={patch} compact />}
        {kind === "icon" && <TypographyControls style={style} set={patch} compact />}
        {kind === "button" && node && (
          <ControlRow label={t("variant")} className="mt-2.5">
            <Segmented
              label={t("variant")}
              // The renderer draws a solid button when none is set.
              value={(["solid", "outline", "light"] as const).find((v) => v === (node.props.variant ?? "solid"))}
              onChange={(variant) =>
                state.editSection(sectionRef, (i) =>
                  withTree(i, (nodes) => updateNode(nodes, node.id, (n) => setNodeProp(n, "variant", variant ?? "solid", { locale: state.locale, defaultLocale: state.defaultLocale }))),
                )
              }
              options={(["solid", "outline", "light"] as const).map((v) => ({ value: v, label: t(`variants.${v}`) }))}
            />
          </ControlRow>
        )}
        {kind === "image" && (
          <div className="space-y-2.5">
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={onRequestImage}>
              <ImagePlus aria-hidden />
              {t("replaceImage")}
            </Button>
            <ImageControls style={style} set={patch} />
          </div>
        )}
        {kind === "container" && <ContainerControls style={style} set={patch} nodeType={node?.type} />}
        {kind === "generic" && <SpacingControls style={style} set={patch} />}
      </StyleOverrideProvider>
      {device !== "desktop" && (
        <p className={cn("mt-2.5 rounded px-2 py-1 text-[11px]", DEVICE_TONE[device].strip)}>{t("deviceNote", { device: t(`devices.${device}`) })}</p>
      )}
    </div>
  );
}

function PopButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-md border text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
