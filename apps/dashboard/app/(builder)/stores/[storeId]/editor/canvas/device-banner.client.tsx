"use client";

import { useTranslations } from "next-intl";
import { Info, Monitor, Smartphone, Tablet } from "lucide-react";
import { useStore } from "zustand";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { DEVICE_TONE } from "@workspace/store-editor/lib/editor-devices.lib";
import type { EditorStore } from "@workspace/store-editor/state/editor.store";

/**
 * Strip above the canvas while a tablet or phone is shown: style edits now
 * go to that device only, while content and layout stay shared. Desktop
 * (the base) shows nothing.
 */
export function DeviceBanner({ store }: { store: EditorStore }) {
  const t = useTranslations("storeEditor.responsive");
  const device = useStore(store, (s) => s.device);
  if (device === "desktop") return null;
  const Icon = device === "tablet" ? Tablet : Smartphone;

  return (
    <div role="status" className={cn("flex h-9 shrink-0 items-center justify-center gap-2 border-b px-3 text-xs", DEVICE_TONE[device].strip)}>
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">
        <strong className="font-semibold">{t(`banner.${device}.title`)}</strong> <span className="opacity-80">{t(`banner.${device}.body`)}</span>
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" aria-label={t("banner.sharedLabel")} className="grid size-6 shrink-0 place-items-center rounded opacity-70 hover:opacity-100">
            <Info className="size-3.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-64">{t("banner.shared")}</TooltipContent>
      </Tooltip>
      <button
        type="button"
        onClick={() => store.getState().setDevice("desktop")}
        className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 font-medium underline-offset-2 hover:underline"
      >
        <Monitor className="size-3.5" aria-hidden />
        {t("banner.backToDesktop")}
      </button>
    </div>
  );
}
