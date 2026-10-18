"use client";

import { useCallback, useState } from "react";
import { MEDIA_BUCKET, MEDIA_MAX_BYTES, isMediaMimeType } from "@workspace/lib/media";
import { uploadSellerFile } from "@/components/inputs/use-seller-upload";
import { createUploadPaths, recordUpload } from "./media.server";
import type { MediaAssetView, MediaErrorKey } from "./media.dto";

export type UploadItem = {
  key: string;
  name: string;
  status: "uploading" | "done" | "failed";
  error?: MediaErrorKey | "uploadFailed";
};

const CONCURRENCY = 3;

/** Natural size of an image file, or nulls when the browser cannot decode it. */
async function imageSize(file: File): Promise<{ width: number | null; height: number | null }> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: null, height: null };
  }
}

/**
 * Uploads several images into the media library of one store: the server
 * hands out the object paths, the browser uploads to `store-media` with the
 * seller's session (use-seller-upload), then recordUpload checks and records
 * each file. Calls `onUploaded` for every recorded file.
 */
export function useMediaUpload({
  storeId,
  onUploaded,
}: {
  storeId: string;
  onUploaded: (asset: MediaAssetView) => void;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const patch = (key: string, next: Partial<UploadItem>) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...next } : item)));

  const upload = useCallback(
    async (files: File[], target: { shared: boolean; folderId: string | null }) => {
      const batch = files.slice(0, 20).map((file, index) => ({ file, key: `${Date.now()}-${index}-${file.name}` }));
      if (!batch.length) return;
      setItems((current) => [...batch.map(({ key, file }) => ({ key, name: file.name, status: "uploading" as const })), ...current].slice(0, 40));

      const valid = batch.filter(({ file, key }) => {
        if (!isMediaMimeType(file.type)) patch(key, { status: "failed", error: "invalidType" });
        else if (file.size > MEDIA_MAX_BYTES) patch(key, { status: "failed", error: "tooLarge" });
        else return true;
        return false;
      });
      if (!valid.length) return;

      setIsUploading(true);
      try {
        const paths = await createUploadPaths(storeId, { shared: target.shared, types: valid.map(({ file }) => file.type) });
        if (!paths.success) {
          for (const { key } of valid) patch(key, { status: "failed", error: paths.error });
          return;
        }
        const queue = valid.map((entry, index) => ({ ...entry, path: paths.data[index]! }));
        const worker = async () => {
          for (let next = queue.shift(); next; next = queue.shift()) {
            const { file, key, path } = next;
            try {
              await uploadSellerFile(file, { bucket: MEDIA_BUCKET, path, cacheControl: "31536000" });
            } catch (error) {
              console.error("Media upload failed:", error);
              patch(key, { status: "failed", error: "uploadFailed" });
              continue;
            }
            const { width, height } = await imageSize(file);
            const recorded = await recordUpload(storeId, {
              storagePath: path,
              filename: file.name.slice(0, 200) || "image",
              width,
              height,
              folderId: target.folderId,
            });
            if (recorded.success) {
              patch(key, { status: "done" });
              onUploaded(recorded.data);
            } else {
              patch(key, { status: "failed", error: recorded.error });
            }
          }
        };
        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
      } finally {
        setIsUploading(false);
      }
    },
    [storeId, onUploaded],
  );

  const clearFinished = useCallback(() => setItems((current) => current.filter((item) => item.status === "uploading")), []);

  return { upload, items, isUploading, clearFinished };
}
