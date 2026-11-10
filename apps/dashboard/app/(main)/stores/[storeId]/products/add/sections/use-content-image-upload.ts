"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getPublicUrl, validateImage } from "@/lib/utils";
import { uploadProductImage } from "@/components/inputs/use-seller-upload";

/** Uploads an image dropped into a product rich-text editor to the seller's folder of the products bucket. */
export function useContentImageUpload() {
  const tToast = useTranslations("toast");

  return useCallback(
    async (file: File) => {
      try {
        await validateImage(file);
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
        const path = await uploadProductImage(file);
        return getPublicUrl(path, "products");
      } catch {
        toast.error(tToast("uploadError", { fileName: file.name }));
        return null;
      }
    },
    [tToast]
  );
}
