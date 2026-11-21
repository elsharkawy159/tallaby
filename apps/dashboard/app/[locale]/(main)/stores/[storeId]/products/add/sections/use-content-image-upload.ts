"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getPublicUrl } from "@/lib/utils";
import { prepareImageForUpload } from "@/lib/images/prepare-image.client";
import { uploadProductImage } from "@/components/inputs/use-seller-upload";

/** Uploads an image dropped into a product rich-text editor to the seller's folder of the products bucket. */
export function useContentImageUpload() {
  const tToast = useTranslations("toast");

  return useCallback(
    async (file: File) => {
      let upload: File;
      try {
        // HEIC, BMP, TIFF… are uploaded as a JPEG.
        upload = await prepareImageForUpload(file);
      } catch (error) {
        toast.error(
          error instanceof Error && tToast.has(error.message)
            ? tToast(error.message)
            : tToast("uploadError", { fileName: file.name })
        );
        return null;
      }

      try {
        // Signed upload into the seller's own folder (the bucket refuses direct writes, 0153).
        const path = await uploadProductImage(upload);
        return getPublicUrl(path, "products");
      } catch {
        toast.error(tToast("uploadError", { fileName: file.name }));
        return null;
      }
    },
    [tToast]
  );
}
