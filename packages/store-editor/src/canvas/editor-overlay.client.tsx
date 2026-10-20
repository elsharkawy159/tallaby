"use client";

import type { CSSProperties, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ClipboardPaste, Copy, CopyPlus, Eye, GripVertical, Paintbrush, Plus, Scissors, Trash2 } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { useStore } from "zustand";
import type { SectionInstance } from "@workspace/store-sections";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import type { DragPayload } from "../dnd/dnd.types";
import { useDragData } from "../dnd/editor-dnd.client";
import type { EditorCommands } from "../lib/editor-commands.lib";
import { getInstance, refOf, selectionLabel } from "../lib/editor-selection.lib";
import { movableOf } from "../lib/editor-slots.lib";
import type { EditorStore, Selection } from "../state/editor.store";
import type { SelectionHandles } from "./canvas-handles.lib";
import { ElementPopover } from "./element-popover.client";
import { SelectionHandlesLayer } from "./selection-handles.client";

export type CanvasBox = { top: number; left: number; width: number; height: number };
export type CanvasBoxes = {
  selected: CanvasBox | null;
  hover: CanvasBox | null;
  section: CanvasBox | null;
  drag: CanvasBox | null;
  frame: CanvasBox | null;
  /** Gap dividers and radius of the selected element. */
  handles: SelectionHandles | null;
};

const MOD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";

/**
 * Everything drawn above the canvas frame (P4B-04): hover outline and chip,
 * selection outline with its badge, the hovered section's toolbar, the
 * element drag source, "+" between sections, the
 * column grid, the element popover and the right-click menu. Positions come
 * from the canvas (frame coordinates mapped to this layer).
 */
export function EditorOverlay({
  store,
  commands,
  boxes,
  hover,
  editing,
  dragging,
  menu,
  onCloseMenu,
  insertIndex,
  toolbarSection,
  onToolbarPointer,
  dragTarget,
  onQuickInsert,
  onRequestImage,
  sections,
  header,
  footer,
  uiLocale,
  selectedElement,
}: {
  store: EditorStore;
  commands: EditorCommands;
  boxes: CanvasBoxes;
  hover: NonNullable<Selection> | null;
  editing: boolean;
  /** A drag is on: outlines hide, the toolbar stays mounted (its handle may be the drag source). */
  dragging: boolean;
  menu: { x: number; y: number } | null;
  onCloseMenu: () => void;
  insertIndex: { hovered: number; selected: number };
  /** The page section under the pointer: its toolbar (drag, move, duplicate, delete) shows on hover. */
  toolbarSection: string | null;
  onToolbarPointer: (inside: boolean) => void;
  /** The element or part a press would drag (the pressed one, else the hovered one). */
  dragTarget: NonNullable<Selection> | null;
  onQuickInsert: (index: number) => void;
  onRequestImage: () => void;
  sections: SectionInstance[];
  header: SectionInstance | null;
  footer: SectionInstance | null;
  uiLocale: string;
  /** The selected element in the frame, as it looks (a button's link). */
  selectedElement: () => HTMLElement | null;
}) {
  const t = useTranslations("storeEditor.canvas");
  const selection = useStore(store, (s) => s.selection);
  const gridOverlay = useStore(store, (s) => s.gridOverlay);
  const source = { content: { sections }, header, footer };
  const selectedInstance = selection ? getInstance(source, refOf(selection)) : null;
  const selectedInfo = selectionLabel(selectedInstance, selection, uiLocale);
  const hoverInstance = hover ? getInstance(source, refOf(hover)) : null;
  const hoverInfo = selectionLabel(hoverInstance, hover, uiLocale);
  const sameAsSelected =
    !!hover && !!selection && hover.target === selection.target && hover.part === selection.part && hover.nodeId === selection.nodeId &&
    (hover.target !== "page" || hover.sectionId === (selection as { sectionId: string }).sectionId);
  const { frame, selected, hover: hoverBox, section: sectionBox, drag: dragBox, handles } = boxes;
  const toolbarIndex = toolbarSection ? sections.findIndex((s) => s.id === toolbarSection) : -1;
  const toolbarInstance = toolbarIndex >= 0 ? sections[toolbarIndex]! : null;
  const isSection = !!selection && !selection.part && !selection.nodeId;
  const isPageSection = isSection && selection?.target === "page";
  // Elements and parts are dragged by themselves: the canvas forwards a press on them to this source.
  const dragInstance = dragTarget ? getInstance(source, refOf(dragTarget)) : null;
  const dragPayload = elementDragPayload(dragTarget, dragInstance);
  const dragLabel = selectionLabel(dragInstance, dragTarget, uiLocale)?.title ?? "";

  // "+" between sections: around the hovered section, or the selected one.
  const plusIndex = insertIndex.hovered >= 0 ? insertIndex.hovered : insertIndex.selected;
  const plusBox = insertIndex.hovered >= 0 ? (hover && !hover.part && !hover.nodeId ? hoverBox : null) : isPageSection ? selected : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {frame && (
        <div className="absolute overflow-hidden rounded-lg" style={{ top: frame.top, left: frame.left, width: frame.width, height: frame.height }}>
          {gridOverlay && <GridOverlay width={frame.width} />}
        </div>
      )}
      {frame && (
        <Clip frame={frame}>
          {hoverBox && !sameAsSelected && !editing && !dragging && (
            <div className="absolute rounded-[2px] outline outline-dashed -outline-offset-1 outline-primary/70" style={inFrame(hoverBox, frame)}>
              {hoverInfo && (
                <span className="absolute -top-5 start-0 whitespace-nowrap rounded-sm bg-primary/80 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary-foreground">
                  {hoverInfo.title}
                </span>
              )}
            </div>
          )}
          {selected && (
            // Centred on the element's edge (1px out, 1px in), so text touching it stays visible.
            <div className={cn("absolute rounded-[2px] outline-2 -outline-offset-1 outline-primary", editing && "outline-dashed", dragging && "invisible")} style={inFrame(selected, frame)}>
              {selectedInfo && (
                <span
                  className={cn(
                    "absolute start-0 whitespace-nowrap rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary-foreground",
                    selected.top - frame.top < 20 ? "top-0.5" : "-top-5",
                  )}
                >
                  {selectedInfo.title}
                </span>
              )}
            </div>
          )}
          {selected && selection && handles && !isSection && !editing && !dragging && (
            <SelectionHandlesLayer store={store} selection={selection} box={selected} frame={frame} handles={handles} />
          )}
          {sectionBox && toolbarInstance && !editing && (
            <SectionToolbar
              box={sectionBox}
              frame={frame}
              dragging={dragging}
              index={toolbarIndex}
              count={sections.length}
              title={selectionLabel(toolbarInstance, { target: "page", sectionId: toolbarInstance.id }, uiLocale)?.title ?? ""}
              instanceId={toolbarInstance.id}
              onPointer={onToolbarPointer}
              // Commands act on the selection: select the section first.
              run={(action) => {
                store.getState().select({ target: "page", sectionId: toolbarInstance.id });
                action();
              }}
              commands={commands}
            />
          )}
          {dragTarget && dragPayload && dragBox && (
            <ElementDragSource dragKey={elementDragKey(dragTarget)} payload={dragPayload} label={dragLabel} style={inFrame(dragBox, frame)} />
          )}
          {plusBox && plusIndex >= 0 && !editing && !dragging && (
            <>
              <PlusButton label={t("insertAbove")} box={plusBox} frame={frame} edge="top" onClick={() => onQuickInsert(plusIndex)} />
              <PlusButton label={t("insertBelow")} box={plusBox} frame={frame} edge="bottom" onClick={() => onQuickInsert(plusIndex + 1)} />
            </>
          )}
        </Clip>
      )}
      {selected && selection && !isSection && !editing && !dragging && frame && selected.top + selected.height > frame.top && selected.top < frame.top + frame.height && (
        <ElementPopover
          key={`${selection.target}:${"sectionId" in selection ? selection.sectionId : ""}:${selection.part ?? ""}:${selection.nodeId ?? ""}`}
          store={store}
          commands={commands}
          anchor={selected}
          bounds={frame}
          instance={selectedInstance}
          onRequestImage={onRequestImage}
          uiLocale={uiLocale}
          selectedElement={selectedElement}
        />
      )}
      <ContextMenu menu={menu} onClose={onCloseMenu} commands={commands} isPageSection={isPageSection} isSection={isSection} hasSelection={!!selection} />
    </div>
  );
}

function inFrame(box: CanvasBox, frame: CanvasBox) {
  return { top: box.top - frame.top, left: box.left - frame.left, width: box.width, height: box.height };
}

function Clip({ frame, children }: { frame: CanvasBox; children: ReactNode }) {
  return (
    <div className="absolute overflow-hidden" style={{ top: frame.top, left: frame.left, width: frame.width, height: frame.height }}>
      {children}
    </div>
  );
}

/** What dragging an element or part moves: an element of a custom section, a part or an item of a pre-built one (P4B-16). */
export function elementDragPayload(target: NonNullable<Selection> | null, instance: SectionInstance | null): DragPayload | null {
  if (!target) return null;
  if (target.nodeId) return target.target === "page" ? { kind: "move-node", sectionInstanceId: target.sectionId, nodeId: target.nodeId } : null;
  const movable = target.part ? movableOf(instance, target.part) : null;
  if (!movable) return null;
  return movable.kind === "part"
    ? { kind: "move-part", ref: refOf(target), part: movable.part }
    : { kind: "move-item", ref: refOf(target), collection: movable.collection, index: movable.index };
}

/** Matches a pressed frame element to its drag source. */
export function elementDragKey(target: NonNullable<Selection>): string {
  return [target.target === "page" ? target.sectionId : target.target, target.nodeId ?? "", target.part ?? ""].join("|");
}

/**
 * The hidden drag source of the element under the pointer: the canvas sends
 * a press on that element (and the following moves) here, so the element
 * itself drags. Mouse only; Ctrl+arrows move by keyboard.
 */
function ElementDragSource({ dragKey, payload, label, style }: { dragKey: string; payload: DragPayload; label: string; style: CSSProperties }) {
  const data = useDragData(payload, label);
  const { setNodeRef, listeners, attributes } = useDraggable({ id: `canvas-move:${JSON.stringify(payload)}`, data });
  const { onKeyDown: _keyboard, ...pointer } = listeners ?? {};
  void _keyboard;
  // Over the element itself, so the drag preview starts where the element is.
  return <span ref={setNodeRef} data-element-drag={dragKey} {...attributes} {...pointer} tabIndex={-1} aria-hidden className="pointer-events-none absolute opacity-0" style={style} />;
}

/**
 * The toolbar of the hovered page section: drag to sort, move up/down,
 * duplicate and delete. The buttons select the section, then act on it.
 */
function SectionToolbar({
  box,
  frame,
  dragging,
  index,
  count,
  title,
  instanceId,
  onPointer,
  run,
  commands,
}: {
  box: CanvasBox;
  frame: CanvasBox;
  dragging: boolean;
  index: number;
  count: number;
  title: string;
  instanceId: string;
  onPointer: (inside: boolean) => void;
  run: (action: () => void) => void;
  commands: EditorCommands;
}) {
  const t = useTranslations("storeEditor.canvas");
  // Kept inside the frame when the section starts above it.
  const top = Math.max(box.top - frame.top, 0) + 4;
  return (
    <div
      className={cn("pointer-events-auto absolute flex items-center gap-0.5 rounded-md border bg-background p-0.5 shadow-md", dragging && "invisible")}
      style={{ top, insetInlineEnd: frame.width - (box.left - frame.left + box.width) + 4 }}
      onPointerEnter={() => onPointer(true)}
      onPointerLeave={() => onPointer(false)}
    >
      <DragHandle label={t("dragToMove")} payload={{ kind: "move-section", instanceId }} title={title} />
      <ToolButton label={t("moveUp")} disabled={index <= 0} onClick={() => run(() => commands.move(-1))}>
        <ArrowUp className="size-3.5" />
      </ToolButton>
      <ToolButton label={t("moveDown")} disabled={index >= count - 1} onClick={() => run(() => commands.move(1))}>
        <ArrowDown className="size-3.5" />
      </ToolButton>
      <ToolButton label={t("duplicate")} onClick={() => run(() => commands.duplicate())}>
        <CopyPlus className="size-3.5" />
      </ToolButton>
      <ToolButton label={t("delete")} onClick={() => run(() => commands.remove())}>
        <Trash2 className="size-3.5" />
      </ToolButton>
    </div>
  );
}

/**
 * Drag handle in the section toolbar (P4B-12): sorts the section among the
 * page sections. Mouse and touch only; the arrow buttons and Ctrl+arrows
 * move by keyboard.
 */
function DragHandle({ label, payload, title }: { label: string; payload: DragPayload | null; title: string }) {
  const data = useDragData(payload ?? { kind: "move-section", instanceId: "" }, title);
  const id = payload ? `canvas-move:${JSON.stringify(payload)}` : "canvas-move:none";
  const { setNodeRef, listeners, attributes } = useDraggable({ id, data, disabled: !payload });
  if (!payload) return null;
  // No keyboard listener: Enter/Space on this button would otherwise start a drag across the frame.
  const { onKeyDown: _keyboard, ...pointer } = listeners ?? {};
  void _keyboard;
  return (
    <button
      ref={setNodeRef}
      type="button"
      aria-label={label}
      title={label}
      {...attributes}
      {...pointer}
      tabIndex={-1}
      className="grid size-7 cursor-grab touch-none place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
    >
      <GripVertical className="size-3.5" />
    </button>
  );
}

function ToolButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function PlusButton({ label, box, frame, edge, onClick }: { label: string; box: CanvasBox; frame: CanvasBox; edge: "top" | "bottom"; onClick: () => void }) {
  const y = (edge === "top" ? box.top : box.top + box.height) - frame.top;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="pointer-events-auto absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background transition-transform hover:scale-110"
      style={{ top: Math.max(12, Math.min(frame.height - 12, y)), left: box.left - frame.left + box.width / 2 }}
    >
      <Plus className="size-3.5" />
    </button>
  );
}

/** 12 columns over the store's content width (max 1200px, 16/32px gutters like the sections). */
function GridOverlay({ width }: { width: number }) {
  const gutter = width >= 768 ? 32 : 16;
  return (
    <div className="absolute inset-y-0 start-1/2 flex -translate-x-1/2 gap-4 rtl:translate-x-1/2" style={{ width: Math.min(width, 1200), paddingInline: gutter }}>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="h-full flex-1 bg-rose-500/8 outline outline-rose-500/15" />
      ))}
    </div>
  );
}

function ContextMenu({
  menu,
  onClose,
  commands,
  isPageSection,
  isSection,
  hasSelection,
}: {
  menu: { x: number; y: number } | null;
  onClose: () => void;
  commands: EditorCommands;
  isPageSection: boolean;
  isSection: boolean;
  hasSelection: boolean;
}) {
  const t = useTranslations("storeEditor.canvas");
  if (!menu) return null;
  const canStructure = isPageSection || !isSection;
  return (
    <DropdownMenu
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DropdownMenuTrigger asChild>
        <span className="pointer-events-none absolute size-px" style={{ top: menu.y, left: menu.x }} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem disabled={!canStructure} onSelect={() => commands.copy()}>
          <Copy aria-hidden />
          {t("copy")}
          <DropdownMenuShortcut>{MOD}C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canStructure} onSelect={() => commands.cut()}>
          <Scissors aria-hidden />
          {t("cut")}
          <DropdownMenuShortcut>{MOD}X</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!commands.hasClipboard()} onSelect={() => commands.paste()}>
          <ClipboardPaste aria-hidden />
          {t("paste")}
          <DropdownMenuShortcut>{MOD}V</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canStructure} onSelect={() => commands.duplicate()}>
          <CopyPlus aria-hidden />
          {t("duplicate")}
          <DropdownMenuShortcut>{MOD}D</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!hasSelection} onSelect={() => commands.copyStyle()}>
          <Paintbrush aria-hidden />
          {t("copyStyle")}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!commands.hasStyleClipboard()} onSelect={() => commands.pasteStyle()}>
          <Paintbrush aria-hidden />
          {t("pasteStyle")}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!hasSelection} onSelect={() => commands.toggleHidden()}>
          <Eye aria-hidden />
          {t("toggleHidden")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!canStructure} onSelect={() => commands.move(-1)}>
          <ArrowUp aria-hidden />
          {t("moveUp")}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canStructure} onSelect={() => commands.move(1)}>
          <ArrowDown aria-hidden />
          {t("moveDown")}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canStructure} variant="destructive" onSelect={() => commands.remove()}>
          <Trash2 aria-hidden />
          {t("delete")}
          <DropdownMenuShortcut>Del</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
