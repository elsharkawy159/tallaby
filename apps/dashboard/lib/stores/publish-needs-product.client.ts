"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { storeProductsHref } from "@/lib/products/product-routes.lib";

/**
 * A store that was never published goes live only with a published product
 * (owner, 2026-11-25; `publishStoreSite` refuses with `noActiveProduct`). Every
 * seller publish button shows this: the reason, and a button to the add form.
 */
export function usePublishNeedsProductToast(storeId: string): () => void {
  const t = useTranslations("publishNeedsProduct");
  const router = useRouter();
  return useCallback(() => {
    toast.error(t("message"), {
      action: { label: t("action"), onClick: () => router.push(storeProductsHref(storeId, "/add")) },
    });
  }, [t, router, storeId]);
}
