"use client";

import { useTranslations } from "next-intl";
import { ClipboardList, Compass, FileText, Image as ImageIcon, Keyboard, Layers, Palette, Plus } from "lucide-react";
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

/** Phone order: Add sits in the middle of the bar. */
const PHONE_ORDER: Record<(typeof ITEMS)[number][0], string> = {
  layers: "max-md:order-1",
  media: "max-md:order-2",
  explore: "max-md:order-3",
  add: "max-md:order-4",
  forms: "max-md:order-5",
  pages: "max-md:order-6",
  brand: "max-md:order-7",
};

/**
 * Left tab rail (P4B-03, reference `builder-tab-rail.tsx`). Clicking the open tab closes the panel.
 * Below `md` it is a bottom tab bar with Add raised in the middle; the panels open as bottom sheets there.
 */
export function EditorRail({
  store,
  panelOpen,
  onToggle,
  onShowShortcuts,
}: {
  store: EditorStore;
  panelOpen: boolean;
  onToggle: (rail: Rail) => void;
  /** Keyboard shortcuts, at the foot of the desktop rail (Claude Design). Phones have no keyboard. */
  onShowShortcuts?: () => void;
}) {
  const t = useTranslations("storeEditor.rail");
  const { capabilities } = useEditorAdapter();
  const rail = useStore(store, (s) => s.rail);
  return (
    <nav
      aria-label={t("label")}
      className={cn(
        "z-20 flex w-16 shrink-0 flex-col items-center gap-1 border-e border-(--s-field) bg-(--s-surface) py-2.5",
        "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:h-[calc(62px+env(safe-area-inset-bottom))] max-md:w-full max-md:flex-row max-md:justify-around max-md:gap-0 max-md:border-e-0 max-md:border-t max-md:px-1 max-md:pt-1 max-md:pb-[env(safe-area-inset-bottom)]",
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
              "flex w-[52px] flex-col items-center gap-[3px] rounded-xl py-2 text-[10.5px] font-semibold text-(--s-subtle) transition-colors hover:bg-(--s-tint) hover:text-(--s-ink)",
              "max-md:h-[52px] max-md:w-auto max-md:min-w-0 max-md:flex-1 max-md:justify-center max-md:gap-0.5 max-md:py-1 max-md:text-[10px]",
              PHONE_ORDER[key],
              active && "bg-(--s-hover) text-(--s-ink) hover:bg-(--s-hover)",
              key === "add" &&
                cn(
                  "max-md:-mt-[18px] max-md:size-[52px] max-md:flex-none max-md:rounded-[18px] max-md:shadow-(--s-shadow-bar)",
                  active
                    ? "max-md:bg-accent max-md:text-(--tallaby-teal-900) max-md:hover:bg-accent max-md:hover:text-(--tallaby-teal-900)"
                    : "max-md:bg-(--s-solid) max-md:text-(--s-solid-fg) max-md:hover:bg-(--s-solid) max-md:hover:text-(--s-solid-fg)",
                ),
            )}
          >
            <Icon className={cn("size-[19px]", key === "add" && "max-md:size-[22px]")} aria-hidden />
            <span className={cn("max-w-full truncate", key === "add" && "max-md:sr-only")}>{t(key)}</span>
          </button>
        );
      })}
      {onShowShortcuts && (
        <button
          type="button"
          onClick={onShowShortcuts}
          className="mt-auto flex w-[52px] flex-col items-center gap-[3px] rounded-xl py-2 text-[10.5px] font-semibold text-(--s-subtle) transition-colors hover:bg-(--s-tint) hover:text-(--s-ink) max-md:hidden"
        >
          <Keyboard className="size-[19px]" aria-hidden />
          <span className="max-w-full truncate">{t("shortcuts")}</span>
        </button>
      )}
    </nav>
  );
}
