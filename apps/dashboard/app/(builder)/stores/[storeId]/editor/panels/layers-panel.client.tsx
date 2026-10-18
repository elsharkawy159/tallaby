"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ChevronRight, Copy, Eye, EyeOff, Footprints, GripVertical, LayoutGrid, PanelTop, Trash2 } from "lucide-react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useStore } from "zustand";
import type { ComponentNode, SectionInstance } from "@workspace/store-sections";
import { findPath, getElementDefinition, storeSectionRegistry, type ElementType } from "@workspace/store-sections/render";
import { cn } from "@workspace/ui/lib/utils";
import type { DragPayload } from "../dnd/dnd.types";
import { useDragData, useReducedMotion } from "../dnd/editor-dnd.client";
import type { EditorCommands } from "../editor-commands.lib";
import { ELEMENT_ICONS, SECTION_GROUP_ICONS } from "../editor-icons.lib";
import { SECTION_GROUPS } from "../editor-palette.lib";
import { readOwnStyle, type StyleTarget } from "../editor-style.lib";
import { sameRef, withTree } from "../editor-selection.lib";
import type { EditorStore, SectionRef, Selection } from "../editor.store";

const pick = (value: { ar: string; en: string }, locale: string) => (locale === "en" ? value.en : value.ar) || value.ar;

function sectionIcon(sectionId: string) {
  const group = SECTION_GROUPS.find((g) => g.sectionId === sectionId);
  return group ? SECTION_GROUP_ICONS[group.key] : LayoutGrid;
}

/**
 * Layers (P4B-08/12): header → sections → elements of custom sections →
 * footer. Selecting here and on the canvas is the same store selection.
 * Rows are sortable by their grip (mouse, touch, or keyboard: Space, arrows,
 * Space): sections among the page sections, elements among their siblings
 * only. Moving an element into another container is done on the canvas,
 * where the drop is checked against the element rules.
 */
export function LayersPanel({ store, commands, uiLocale }: { store: EditorStore; commands: EditorCommands; uiLocale: string }) {
  const t = useTranslations("storeEditor.layers");
  const pages = useStore(store, (s) => s.pages);
  const activePageId = useStore(store, (s) => s.activePageId);
  const header = useStore(store, (s) => s.header);
  const footer = useStore(store, (s) => s.footer);
  const selection = useStore(store, (s) => s.selection);
  const device = useStore(store, (s) => s.device);
  const page = pages.find((p) => p.id === activePageId) ?? pages[0]!;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  // Open the branch that holds the selected element.
  useEffect(() => {
    if (!selection?.nodeId || selection.target !== "page") return;
    const instance = page.content.sections.find((s) => s.id === selection.sectionId);
    const path = instance ? findPath(instance.componentTree ?? [], selection.nodeId) : null;
    if (!path) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(selection.sectionId);
      for (const id of path.slice(0, -1)) next.add(id);
      return next.size === prev.size ? prev : next;
    });
  }, [selection, page.content.sections]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const isHidden = (instance: SectionInstance, target: StyleTarget) => readOwnStyle(instance, target, device).hidden === true;
  const run = (sel: Selection, action: () => void) => {
    store.getState().select(sel);
    action();
  };

  const chromeRow = (part: "header" | "footer", instance: SectionInstance | null) => {
    if (!instance) return null;
    const definition = storeSectionRegistry.get(instance.sectionId);
    const Icon = part === "header" ? PanelTop : Footprints;
    return (
      <Row
        depth={0}
        icon={<Icon className="size-3.5" aria-hidden />}
        label={definition ? pick(definition.displayName, uiLocale) : t(part)}
        hint={t("everyPage")}
        active={selection?.target === part && !selection.part && !selection.nodeId}
        onSelect={() => store.getState().select({ target: part })}
      />
    );
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-2">
      <h2 className="px-1 pb-2 pt-1 text-sm font-semibold">{t("title")}</h2>
      <div role="tree" aria-label={t("title")} className="space-y-0.5">
        {chromeRow("header", header)}
        <SortableContext id="layers:sections" items={page.content.sections.map((s) => layerId("section", s.id))} strategy={verticalListSortingStrategy}>
        {page.content.sections.map((instance, index) => {
          const ref: SectionRef = { target: "page", sectionId: instance.id };
          const definition = storeSectionRegistry.get(instance.sectionId);
          const Icon = sectionIcon(instance.sectionId);
          const tree = instance.componentTree ?? [];
          const open = expanded.has(instance.id);
          const sectionSel: Selection = { ...ref };
          return (
            <SortableBlock
              key={instance.id}
              id={layerId("section", instance.id)}
              payload={{ kind: "layer", container: "sections", ref }}
              label={definition ? pick(definition.displayName, uiLocale) : instance.sectionId}
              ariaExpanded={tree.length ? open : undefined}
              ariaSelected={sameRef(selection, ref) && !selection?.nodeId && !selection?.part}
            >
              {(handle) => (
              <>
              <Row
                handle={handle}
                depth={0}
                icon={<Icon className="size-3.5" aria-hidden />}
                label={definition ? pick(definition.displayName, uiLocale) : instance.sectionId}
                active={sameRef(selection, ref) && !selection?.nodeId && !selection?.part}
                hidden={isHidden(instance, { kind: "section" })}
                expandable={tree.length > 0}
                expanded={open}
                onToggle={() => toggle(instance.id)}
                onSelect={() => store.getState().select(sectionSel)}
                actions={
                  <>
                    <RowAction label={t("moveUp")} disabled={index === 0} onClick={() => run(sectionSel, () => commands.move(-1))}>
                      <ArrowUp className="size-3.5" />
                    </RowAction>
                    <RowAction label={t("moveDown")} disabled={index === page.content.sections.length - 1} onClick={() => run(sectionSel, () => commands.move(1))}>
                      <ArrowDown className="size-3.5" />
                    </RowAction>
                    <HideAction t={t} hidden={isHidden(instance, { kind: "section" })} onClick={() => run(sectionSel, () => commands.toggleHidden())} />
                    <RowAction label={t("duplicate")} onClick={() => run(sectionSel, () => commands.duplicate())}>
                      <Copy className="size-3.5" />
                    </RowAction>
                    <RowAction label={t("delete")} onClick={() => run(sectionSel, () => commands.remove())}>
                      <Trash2 className="size-3.5" />
                    </RowAction>
                  </>
                }
              />
              {open && (
                <NodeRows
                  nodes={tree}
                  depth={1}
                  sectionRef={ref}
                  instance={instance}
                  store={store}
                  commands={commands}
                  expanded={expanded}
                  onToggle={toggle}
                  isHidden={isHidden}
                  uiLocale={uiLocale}
                />
              )}
              </>
              )}
            </SortableBlock>
          );
        })}
        </SortableContext>
        {chromeRow("footer", footer)}
      </div>
      {page.content.sections.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>}
    </div>
  );
}

function NodeRows({
  nodes,
  depth,
  sectionRef,
  instance,
  store,
  commands,
  expanded,
  onToggle,
  isHidden,
  uiLocale,
}: {
  nodes: ComponentNode[];
  depth: number;
  sectionRef: SectionRef;
  instance: SectionInstance;
  store: EditorStore;
  commands: EditorCommands;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  isHidden: (instance: SectionInstance, target: StyleTarget) => boolean;
  uiLocale: string;
}) {
  const t = useTranslations("storeEditor.layers");
  const selection = useStore(store, (s) => s.selection);
  const parentId = nodes.length ? (findParentId(instance, nodes[0]!.id) ?? null) : null;
  const container = `nodes:${instance.id}:${parentId ?? "root"}`;
  return (
    <div role="group">
      <SortableContext id={container} items={nodes.map((n) => layerId("node", instance.id, n.id))} strategy={verticalListSortingStrategy}>
      {nodes.map((node, index) => {
        const definition = getElementDefinition(node.type);
        const Icon = ELEMENT_ICONS[node.type as ElementType] ?? LayoutGrid;
        const sel: Selection = { ...sectionRef, nodeId: node.id };
        const run = (action: () => void) => {
          store.getState().select(sel);
          action();
        };
        const open = expanded.has(node.id);
        const custom = typeof node.props.label === "string" ? node.props.label : "";
        const hidden = isHidden(instance, { kind: "node", nodeId: node.id });
        return (
          <SortableBlock
            key={node.id}
            id={layerId("node", instance.id, node.id)}
            payload={{ kind: "layer", container, ref: sectionRef, nodeId: node.id, parentId }}
            label={custom || (definition ? pick(definition.label, uiLocale) : node.type)}
            ariaExpanded={node.children.length ? open : undefined}
            ariaSelected={selection?.nodeId === node.id}
          >
            {(handle) => (
            <>
            <Row
              handle={handle}
              depth={depth}
              icon={<Icon className="size-3.5" aria-hidden />}
              label={custom || (definition ? pick(definition.label, uiLocale) : node.type)}
              active={selection?.nodeId === node.id && sameRef(selection, sectionRef)}
              hidden={hidden}
              expandable={node.children.length > 0}
              expanded={open}
              onToggle={() => onToggle(node.id)}
              onSelect={() => store.getState().select(sel)}
              onRename={(label) =>
                store.getState().editSection(sectionRef, (i) =>
                  withTree(i, (tree) => {
                    const rename = (list: ComponentNode[]): ComponentNode[] =>
                      list.map((n) =>
                        n.id === node.id
                          ? { ...n, props: { ...n.props, label: label.trim().slice(0, 60) || undefined } }
                          : { ...n, children: rename(n.children) },
                      );
                    return rename(tree);
                  }),
                )
              }
              renameLabel={t("rename")}
              actions={
                <>
                  <RowAction label={t("moveUp")} disabled={index === 0} onClick={() => run(() => commands.move(-1))}>
                    <ArrowUp className="size-3.5" />
                  </RowAction>
                  <RowAction label={t("moveDown")} disabled={index === nodes.length - 1} onClick={() => run(() => commands.move(1))}>
                    <ArrowDown className="size-3.5" />
                  </RowAction>
                  <HideAction t={t} hidden={hidden} onClick={() => run(() => commands.toggleHidden())} />
                  <RowAction label={t("duplicate")} onClick={() => run(() => commands.duplicate())}>
                    <Copy className="size-3.5" />
                  </RowAction>
                  <RowAction label={t("delete")} onClick={() => run(() => commands.remove())}>
                    <Trash2 className="size-3.5" />
                  </RowAction>
                </>
              }
            />
            {open && node.children.length > 0 && (
              <NodeRows
                nodes={node.children}
                depth={depth + 1}
                sectionRef={sectionRef}
                instance={instance}
                store={store}
                commands={commands}
                expanded={expanded}
                onToggle={onToggle}
                isHidden={isHidden}
                uiLocale={uiLocale}
              />
            )}
            </>
            )}
          </SortableBlock>
        );
      })}
      </SortableContext>
    </div>
  );
}

const layerId = (kind: "section" | "node", sectionId: string, nodeId?: string) => (kind === "section" ? `layer:s:${sectionId}` : `layer:n:${sectionId}:${nodeId}`);

function findParentId(instance: SectionInstance, nodeId: string): string | null | undefined {
  const path = findPath(instance.componentTree ?? [], nodeId);
  return path ? (path.length > 1 ? path[path.length - 2]! : null) : undefined;
}

/**
 * A sortable tree item (P4B-12): the whole block (row and its open
 * children) moves; only the grip starts a drag, so clicking, renaming and
 * the row buttons never do.
 */
function SortableBlock({
  id,
  payload,
  label,
  ariaExpanded,
  ariaSelected,
  children,
}: {
  id: string;
  payload: DragPayload;
  label: string;
  ariaExpanded?: boolean;
  ariaSelected: boolean;
  children: (handle: ReactNode) => ReactNode;
}) {
  const t = useTranslations("storeEditor.layers");
  const reduced = useReducedMotion();
  const data = useDragData(payload, label);
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({
    id,
    data,
    transition: reduced ? null : undefined,
  });
  const handle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      aria-label={t("dragHandle", { name: label })}
      title={t("dragHandle", { name: label })}
      className="grid size-5 shrink-0 cursor-grab touch-none place-items-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
    >
      <GripVertical className="size-3.5" aria-hidden />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      role="treeitem"
      aria-expanded={ariaExpanded}
      aria-selected={ariaSelected}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10 opacity-40")}
    >
      {children(handle)}
    </div>
  );
}

function Row({
  handle,
  depth,
  icon,
  label,
  hint,
  active,
  hidden,
  expandable,
  expanded,
  onToggle,
  onSelect,
  onRename,
  renameLabel,
  actions,
}: {
  /** Drag grip (sortable rows only). */
  handle?: ReactNode;
  depth: number;
  icon: ReactNode;
  label: string;
  hint?: string;
  active: boolean;
  hidden?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onSelect: () => void;
  onRename?: (label: string) => void;
  renameLabel?: string;
  actions?: ReactNode;
}) {
  const [renaming, setRenaming] = useState(false);
  return (
    <div
      className={cn(
        "group flex h-8 items-center gap-1 rounded-md pe-1 text-sm",
        active ? "bg-primary/10 text-primary" : "hover:bg-muted",
        hidden && "opacity-50",
      )}
      style={{ paddingInlineStart: 4 + depth * 14 }}
    >
      {handle ?? <span className="size-5 shrink-0" aria-hidden />}
      <button
        type="button"
        tabIndex={-1}
        onClick={onToggle}
        className={cn("grid size-5 place-items-center rounded text-muted-foreground", !expandable && "invisible")}
        aria-hidden={!expandable}
      >
        <ChevronRight className={cn("size-3.5 transition-transform rtl:rotate-180", expanded && "rotate-90 rtl:rotate-90")} />
      </button>
      <span className="text-muted-foreground">{icon}</span>
      {renaming && onRename ? (
        <input
          autoFocus
          aria-label={renameLabel}
          defaultValue={label}
          maxLength={60}
          className="h-6 min-w-0 flex-1 rounded border bg-background px-1 text-sm"
          onBlur={(e) => {
            onRename(e.target.value);
            setRenaming(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") setRenaming(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={onSelect}
          onDoubleClick={() => onRename && setRenaming(true)}
          className="min-w-0 flex-1 truncate text-start"
          title={renameLabel && onRename ? renameLabel : undefined}
        >
          {label}
          {hint && <span className="ms-1.5 text-xs text-muted-foreground">{hint}</span>}
        </button>
      )}
      <span className="flex opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">{actions}</span>
    </div>
  );
}

function RowAction({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function HideAction({ t, hidden, onClick }: { t: (key: "show" | "hide") => string; hidden: boolean; onClick: () => void }) {
  return (
    <RowAction label={t(hidden ? "show" : "hide")} onClick={onClick}>
      {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
    </RowAction>
  );
}
