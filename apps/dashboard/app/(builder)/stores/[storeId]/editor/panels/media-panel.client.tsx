"use client";

import { useEffect, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useDraggable } from "@dnd-kit/core";
import { mediaAlt } from "@workspace/lib/media";
import { cn } from "@workspace/ui/lib/utils";
import type { MediaAssetView } from "@/components/media/media.dto";
import { MediaLibrary } from "@/components/media/media-library.client";
import { useDragData } from "../dnd/editor-dnd.client";
import type { EditorCommands } from "@workspace/store-editor/lib/editor-commands.lib";

/**
 * Media rail tab (P4B-03/12): this store's media library (P4-09). Picking an
 * image replaces the selected image, or adds an Image element after the
 * selection. Like Explore photos, an image can also be dragged onto the
 * canvas: onto an image to replace it, or between elements and sections to add it.
 */
export function MediaPanel({ storeId, readOnly, commands }: { storeId: string; readOnly: boolean; commands: EditorCommands }) {
  const t = useTranslations("storeEditor.media");
  // No hover preview outlives the panel.
  useEffect(() => () => commands.previewImage(null), [commands]);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      <h2 className="text-sm font-semibold">{t("title")}</h2>
      <p className="mb-3 text-xs text-muted-foreground">{t("intro")}</p>
      <div>
        <MediaLibrary
          storeId={storeId}
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
