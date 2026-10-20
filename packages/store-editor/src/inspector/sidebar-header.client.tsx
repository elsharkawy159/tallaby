"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, CopyPlus, CornerLeftUp, Eye, EyeOff, LayoutGrid, PanelTop, Trash2 } from "lucide-react";
import type { SectionInstance } from "@workspace/store-sections";
import { findNode, getElementDefinition, type ElementType } from "@workspace/store-sections/render";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { ancestorsOf } from "../lib/editor-agent.lib";
import type { EditorCommands } from "../lib/editor-commands.lib";
import { styleTargetOf } from "../lib/editor-commands.lib";
import { ELEMENT_ICONS } from "../lib/editor-icons.lib";
import { nodeLabel, refOf } from "../lib/editor-selection.lib";
import { readOwnStyle } from "../lib/editor-style.lib";
import type { Device, EditorStore, Selection } from "../state/editor.store";

const pick = (value: { ar: string; en: string }, locale: string) => (locale === "en" ? value.en : value.ar) || value.ar;

/**
 * Top of the right sidebar: what is selected (icon, name, kind), its path
 * from the section (click a step to select it), and the quick actions that
 * the canvas toolbar also offers.
 */
export function SidebarHeader({
  store,
  commands,
  instance,
  selection,
  info,
  uiLocale,
  readOnly,
  device,
}: {
  store: EditorStore;
  commands: EditorCommands;
  instance: SectionInstance;
  selection: NonNullable<Selection>;
  info: { title: string; detail?: string; kind: "section" | "element" };
  uiLocale: string;
  readOnly: boolean;
  device: Device;
}) {
  const t = useTranslations("storeEditor.sidebar");
  const ref = refOf(selection);
  const tree = instance.componentTree ?? [];
  const node = selection.nodeId ? findNode(tree, selection.nodeId) : null;
  const Icon = node ? (ELEMENT_ICONS[node.type as ElementType] ?? LayoutGrid) : PanelTop;
  const title = (node && nodeLabel(node, uiLocale)) || info.title;
  const hidden = readOwnStyle(instance, styleTargetOf(selection), device).hidden === true;
  const canStructure = !readOnly && (Boolean(node) || (ref.target === "page" && !selection.part));
  const canParent = Boolean(selection.nodeId || selection.part);

  // Section › …ancestors (the last three, so long paths stay on one line).
  const ancestors = ancestorsOf(instance, selection.nodeId)
    .map((id) => findNode(tree, id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n));
  const crumbs = [
    { key: "section", label: info.detail ?? info.title, select: () => store.getState().select(ref) },
    ...ancestors.map((n) => ({
      key: n.id,
      label: nodeLabel(n, uiLocale) || (getElementDefinition(n.type) ? pick(getElementDefinition(n.type)!.label, uiLocale) : n.type),
      select: () => store.getState().select({ ...ref, nodeId: n.id }),
    })),
  ];
  const shownCrumbs = crumbs.length > 4 ? [crumbs[0]!, null, ...crumbs.slice(-2)] : crumbs;

  return (
    <div className="border-b px-4 py-3">
      <div className="flex items-start gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{node && title !== info.title ? info.title : t(info.kind)}</p>
          <h2 className="truncate font-semibold leading-tight">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center">
          {canParent && (
            <HeaderAction label={t("actions.parent")} onClick={() => commands.selectParent()}>
              <CornerLeftUp className="size-3.5 rtl:-scale-x-100" />
            </HeaderAction>
          )}
          {canStructure && (
            <HeaderAction label={t("actions.duplicate")} onClick={() => commands.duplicate()}>
              <CopyPlus className="size-3.5" />
            </HeaderAction>
          )}
          {!readOnly && (
            <HeaderAction label={t(hidden ? "actions.show" : "actions.hide")} onClick={() => commands.toggleHidden()} pressed={hidden}>
              {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </HeaderAction>
          )}
          {canStructure && (
            <HeaderAction label={t("actions.delete")} onClick={() => commands.remove()} destructive>
              <Trash2 className="size-3.5" />
            </HeaderAction>
          )}
        </div>
      </div>
      {(node || selection.part) && (
        <nav aria-label={t("path")} className="mt-2 flex min-w-0 items-center gap-0.5 text-xs text-muted-foreground">
          {shownCrumbs.map((crumb, index) => (
            <Fragment key={crumb?.key ?? "gap"}>
              {index > 0 && <ChevronLeft className="size-3 shrink-0 opacity-60 ltr:rotate-180" aria-hidden />}
              {crumb ? (
                <button type="button" onClick={crumb.select} className="min-w-0 max-w-28 truncate rounded px-1 py-0.5 hover:bg-muted hover:text-foreground">
                  {crumb.label}
                </button>
              ) : (
                <span className="px-0.5">…</span>
              )}
            </Fragment>
          ))}
        </nav>
      )}
    </div>
  );
}

function HeaderAction({
  label,
  onClick,
  pressed,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={pressed}
          onClick={onClick}
          className={cn(
            "grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            pressed && "bg-muted text-foreground",
            destructive && "hover:bg-destructive/10 hover:text-destructive",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
