"use client";

import { useTranslations } from "next-intl";
import { ClipboardList, Compass, FileText, Image as ImageIcon, Layers, Palette, Plus } from "lucide-react";
import { useStore } from "zustand";
import { cn } from "@workspace/ui/lib/utils";
import { useEditorAdapter } from "../adapter.client";
import type { EditorStore, Rail } from "../state/editor.store";
import { railEnabled } from "./capabilities.lib";

const ITEMS = [
  ["add", Plus],
  ["layers", Layers],
  ["media", ImageIcon],
  ["explore", Compass],
  ["forms", ClipboardList],
  ["pages", FileText],
  ["brand", Palette],
] as const satisfies readonly (readonly [Rail, unknown])[];

/**
 * Left tab rail (P4B-03, reference `builder-tab-rail.tsx`). Clicking the open tab closes the panel.
 * Below `md` it is a bottom tab bar; the panels open as bottom sheets there.
 */
export function EditorRail({ store, panelOpen, onToggle }: { store: EditorStore; panelOpen: boolean; onToggle: (rail: Rail) => void }) {
  const t = useTranslations("storeEditor.rail");
  const { capabilities } = useEditorAdapter();
  const rail = useStore(store, (s) => s.rail);
  return (
    <nav
      aria-label={t("label")}
      className={cn(
        "flex w-16 shrink-0 flex-col items-center gap-1 border-e bg-background py-2",
        "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:h-[calc(3.5rem+env(safe-area-inset-bottom))] max-md:w-full max-md:flex-row max-md:justify-around max-md:gap-0 max-md:border-e-0 max-md:border-t max-md:px-1 max-md:pt-0 max-md:pb-[env(safe-area-inset-bottom)]",
      )}
    >
      {ITEMS.filter(([key]) => railEnabled(key, capabilities)).map(([key, Icon]) => {
        const active = panelOpen && rail === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(key)}
            className={cn(
              "flex w-13 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              "max-md:h-12 max-md:w-auto max-md:min-w-0 max-md:flex-1 max-md:justify-center max-md:gap-0.5 max-md:py-1",
              active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
            )}
          >
            <Icon className="size-4.5" aria-hidden />
            <span className="max-w-full truncate">{t(key)}</span>
          </button>
        );
      })}
    </nav>
  );
}
