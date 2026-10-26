"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { generateImageName, getPublicUrl, validateImage } from "@/lib/utils";
import { createClient } from "@/supabase/client";

/** Uploads an image dropped into a product rich-text editor to the products bucket. */
export function useContentImageUpload() {
  const tToast = useTranslations("toast");
  const [supabase] = useState(createClient);

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

      const { data, error } = await supabase.storage
        .from("products")
        .upload(generateImageName(file), file, { cacheControl: "31536000", upsert: false });

      if (error) {
        toast.error(tToast("uploadError", { fileName: file.name }));
        return null;
      }

      return getPublicUrl(data.path, "products");
    },
    [supabase, tToast]
  );
}
