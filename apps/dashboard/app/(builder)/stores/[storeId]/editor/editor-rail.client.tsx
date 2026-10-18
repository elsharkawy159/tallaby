"use client";

import { useTranslations } from "next-intl";
import { ClipboardList, Compass, FileText, Image as ImageIcon, Layers, Palette, Plus } from "lucide-react";
import { useStore } from "zustand";
import { cn } from "@workspace/ui/lib/utils";
import type { EditorStore, Rail } from "./editor.store";

const ITEMS = [
  ["add", Plus],
  ["layers", Layers],
  ["media", ImageIcon],
  ["explore", Compass],
  ["forms", ClipboardList],
  ["pages", FileText],
  ["brand", Palette],
] as const satisfies readonly (readonly [Rail, unknown])[];

/** Left tab rail (P4B-03, reference `builder-tab-rail.tsx`). Clicking the open tab closes the panel. */
export function EditorRail({ store, panelOpen, onToggle }: { store: EditorStore; panelOpen: boolean; onToggle: (rail: Rail) => void }) {
  const t = useTranslations("storeEditor.rail");
  const rail = useStore(store, (s) => s.rail);
  return (
    <nav aria-label={t("label")} className="flex w-16 shrink-0 flex-col items-center gap-1 border-e bg-background py-2">
      {ITEMS.map(([key, Icon]) => {
        const active = panelOpen && rail === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(key)}
            className={cn(
              "flex w-13 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
            )}
          >
            <Icon className="size-4.5" aria-hidden />
            {t(key)}
          </button>
        );
      })}
    </nav>
  );
}
