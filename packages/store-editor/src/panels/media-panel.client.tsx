"use client";

import { useEffect, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useDraggable } from "@dnd-kit/core";
import { useStore } from "zustand";
import { mediaAlt } from "@workspace/lib/media";
import { cn } from "@workspace/ui/lib/utils";
import type { MediaAssetView } from "../media/media.dto";
import { MediaLibrary } from "../media/media-library.client";
import { useDragData } from "../dnd/editor-dnd.client";
import type { EditorCommands } from "../lib/editor-commands.lib";
import { useEditorAdapter } from "../adapter.client";
import { mediaTabs } from "../shell/capabilities.lib";
import type { EditorStore } from "../state/editor.store";
import { ExplorePanel } from "./explore-panel.client";

/**
 * Media rail tab (P4B-03/12; owner, F-74): two tabs, Media (this store's
 * library, P4-09) and Explore (free stock photos), each where the host has
 * it. Selecting an image on the canvas opens Explore. Picking an image
 * replaces the selected image, or adds an Image element after the selection.
 * An image can also be dragged onto the canvas: onto an image to replace it,
 * or between elements and sections to add it.
 */
export function MediaPanel({
  store,
  storeId,
  readOnly,
  category,
  uiLocale,
  commands,
}: {
  store: EditorStore;
  storeId: string;
  readOnly: boolean;
  category: { en: string | null; ar: string | null };
  uiLocale: string;
  commands: EditorCommands;
}) {
  const t = useTranslations("storeEditor.media");
  const tabs = mediaTabs(useEditorAdapter().capabilities);
  const chosen = useStore(store, (s) => s.mediaTab);
  const setTab = useStore(store, (s) => s.setMediaTab);
  const tab = tabs.includes(chosen) ? chosen : tabs[0];
  // No hover preview outlives the panel.
  useEffect(() => () => commands.previewImage(null), [commands]);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {tabs.length > 1 && (
        <div role="tablist" aria-label={t("tabsLabel")} className="mx-3.5 mt-1 mb-2.5 grid grid-cols-2 gap-0.5 rounded-xl bg-(--s-fill) p-[3px]">
          {tabs.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "h-8 rounded-[9px] text-[12.5px] font-semibold transition-colors max-lg:h-[38px]",
                tab === key ? "bg-(--s-surface) text-(--s-ink) shadow-[0_1px_3px_rgb(13_55_67/0.1)]" : "text-(--s-subtle) hover:text-(--s-ink)",
              )}
            >
              {t(`tabs.${key}`)}
            </button>
          ))}
        </div>
      )}
      {tab === "explore" ? (
        <ExplorePanel storeId={storeId} readOnly={readOnly} category={category} uiLocale={uiLocale} commands={commands} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-3.5 pt-1">
          <p className="mb-3 text-xs text-(--s-subtle)">{t("intro")}</p>
          <MediaLibrary
            mode="pick"
            readOnly={readOnly}
            onPick={(asset) => commands.applyImage(asset.url)}
            tileWrapper={
              readOnly
                ? undefined
                : (asset, tile) => (
                    <DraggableAsset asset={asset} onHover={(on) => commands.previewImage(on ? asset.url : null)}>
                      {tile}
                    </DraggableAsset>
                  )
            }
          />
        </div>
      )}
    </div>
  );
}

/**
 * A library tile that can be dragged onto the canvas (clicks still select it).
 * Hovering shows it on the selected image (or the selected section's image).
 */
function DraggableAsset({ asset, onHover, children }: { asset: MediaAssetView; onHover: (on: boolean) => void; children: ReactNode }) {
  const locale = useLocale();
  const alt = mediaAlt(asset.altText, locale) ?? "";
  const data = useDragData({ kind: "media", src: asset.url, thumbUrl: asset.url, alt }, alt || asset.filename);
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: `media:${asset.id}`, data });
  // The tile's own button stays the accessible control (Enter/Space select it); no keyboard drag across the frame.
  const { onKeyDown: _keyboard, ...pointer } = listeners ?? {};
  void _keyboard;
  return (
    <div
      ref={setNodeRef}
      {...pointer}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-40")}>
      {children}
    </div>
  );
}
