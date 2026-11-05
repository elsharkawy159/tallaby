"use client";

import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, CopyPlus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useStore } from "zustand";
import type { EditorCommands } from "../lib/editor-commands.lib";
import { getInstance, getNode, nodeLabel, refOf, selectionLabel } from "../lib/editor-selection.lib";
import type { EditorStore } from "../state/editor.store";

/**
 * The dark bar above the phone tab bar while something is selected and the
 * inspector sheet is closed (Claude Design "Seller Editor v3 (Mobile)"): what is
 * selected, the same commands as the sidebar header, and Edit to open the sheet.
 */
export function PhoneActionBar({
  store,
  commands,
  uiLocale,
  readOnly,
  onEdit,
}: {
  store: EditorStore;
  commands: EditorCommands;
  uiLocale: string;
  readOnly: boolean;
  onEdit: () => void;
}) {
  const t = useTranslations("storeEditor");
  // Plain strings and booleans, so typing or dragging elsewhere does not re-render this bar.
  const label = (s: ReturnType<EditorStore["getState"]>) => {
    if (!s.selection) return null;
    const page = s.pages.find((p) => p.id === s.activePageId) ?? s.pages[0];
    if (!page) return null;
    const instance = getInstance({ content: page.content, header: s.header, footer: s.footer }, refOf(s.selection));
    const node = instance ? getNode(instance, s.selection.nodeId) : null;
    const info = selectionLabel(instance, s.selection, uiLocale);
    return { title: (node && nodeLabel(node, uiLocale)) || info?.title || "", detail: info?.detail ?? "" };
  };
  const title = useStore(store, (s) => label(s)?.title ?? "");
  // The section the element sits in, under its name (Claude Design).
  const detail = useStore(store, (s) => label(s)?.detail ?? "");
  // As in the sidebar header: elements and page sections have structure; a header, a footer or a field does not.
  const canStructure = useStore(store, (s) => !readOnly && Boolean(s.selection && (s.selection.nodeId || (s.selection.target === "page" && !s.selection.part))));

  const tool = "grid size-[42px] shrink-0 place-items-center rounded-xl text-white active:bg-white/12";
  return (
    <div
      role="toolbar"
      aria-label={t("sidebar.label")}
      className="fixed inset-x-2.5 bottom-[calc(72px+env(safe-area-inset-bottom))] z-41 flex items-center gap-0.5 rounded-[18px] bg-(--tallaby-teal-900) p-1.5 shadow-(--s-shadow-bar) md:bottom-4"
    >
      <span className="min-w-0 flex-1 px-2 leading-tight">
        <span className="block truncate text-[12.5px] font-bold text-white">{title}</span>
        {detail && <span className="block truncate text-[10.5px] font-medium text-(--tallaby-teal-300)">{detail}</span>}
      </span>
      {canStructure && (
        <>
          <button type="button" aria-label={t("canvas.moveUp")} className={tool} onClick={() => commands.move(-1)}>
            <ArrowUp className="size-[18px]" aria-hidden />
          </button>
          <button type="button" aria-label={t("canvas.moveDown")} className={tool} onClick={() => commands.move(1)}>
            <ArrowDown className="size-[18px]" aria-hidden />
          </button>
          <button type="button" aria-label={t("canvas.duplicate")} className={tool} onClick={() => commands.duplicate()}>
            <CopyPlus className="size-[18px]" aria-hidden />
          </button>
          <button type="button" aria-label={t("canvas.delete")} className={tool} onClick={() => commands.remove()}>
            <Trash2 className="size-[18px]" aria-hidden />
          </button>
        </>
      )}
      <button type="button" onClick={onEdit} className="flex h-[42px] shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-[13px] font-bold text-(--tallaby-teal-900)">
        <SlidersHorizontal className="size-[18px]" aria-hidden />
        {t("sidebar.edit")}
      </button>
    </div>
  );
}
