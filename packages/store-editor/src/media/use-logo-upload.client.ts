"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MEDIA_MAX_BYTES, isMediaMimeType } from "@workspace/lib/media";
import { useEditorAdapter } from "../adapter.client";

/**
 * The store logo, uploaded from the canvas: the file goes into the store's
 * media library (same path as every editor upload), then the host saves its
 * URL as the store logo (`adapter.saveLogo`). The logo is store data, not a
 * draft: headers and footers show it at once, on the live site too.
 */
export function useLogoUpload(initialUrl: string | null | undefined) {
  const t = useTranslations("storeEditor.logo");
  const tm = useTranslations("mediaLibrary");
  const adapter = useEditorAdapter();
  const [logoUrl, setLogoUrl] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const saveLogo = adapter.saveLogo;
  const { media } = adapter;

  const upload = useCallback(
    async (file: File) => {
      if (!saveLogo) return;
      if (!isMediaMimeType(file.type)) return void toast.error(tm("errors.invalidType"));
      if (file.size > MEDIA_MAX_BYTES) return void toast.error(tm("errors.tooLarge"));
      setUploading(true);
      try {
        const paths = await media.createUploadPaths({ shared: false, types: [file.type] });
        if (!paths.success) return void toast.error(tm(`errors.${paths.error}`));
        const path = paths.data[0]!;
        try {
          await media.uploadFile(path, file);
        } catch (error) {
          console.error("Logo upload failed:", error);
          return void toast.error(tm("errors.uploadFailed"));
        }
        const recorded = await media.recordUpload({ storagePath: path, filename: file.name.slice(0, 200) || "logo", ...(await imageSize(file)) });
        if (!recorded.success) return void toast.error(tm(`errors.${recorded.error}`));
        const saved = await saveLogo(recorded.data.url);
        if (!saved.success) return void toast.error(t("failed"));
        setLogoUrl(recorded.data.url);
        toast.success(t("saved"));
      } catch (error) {
        console.error("Logo upload failed:", error);
        toast.error(tm("errors.generic"));
      } finally {
        setUploading(false);
      }
    },
    [media, saveLogo, t, tm],
  );

  return { logoUrl, uploading, upload, enabled: Boolean(saveLogo) };
}

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
