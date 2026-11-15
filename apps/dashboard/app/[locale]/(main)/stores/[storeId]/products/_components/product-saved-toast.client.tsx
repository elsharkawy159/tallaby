"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getProductViewUrl } from "./product-view-url.server";

/*
 * The product-saved toast with a "View" action that opens the product on the
 * live store in a new tab. Adding a product ends in a full page load (to clear
 * the form), which would drop a toast, so that one is handed to the next page
 * through sessionStorage and shown by <PendingProductSavedToast /> (in the
 * Products layout).
 */

const PENDING_KEY = "tallaby:product-created-toast";

/** Success toast; with "View" when the product has a live page. */
export async function showProductSavedToast(
  message: string,
  { storeId, productId, viewLabel }: { storeId: string; productId: string; viewLabel: string },
) {
  const url = await getProductViewUrl(storeId, productId).catch(() => null);
  toast.success(
    message,
    url
      ? {
          duration: 6000,
          action: { label: viewLabel, onClick: () => window.open(url, "_blank", "noopener,noreferrer") },
        }
      : undefined,
  );
}

/** Before a full page load: the next Products page shows the "product added" toast. false when storage is unavailable. */
export function queueProductCreatedToast(storeId: string, productId: string): boolean {
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ storeId, productId }));
    return true;
  } catch {
    return false;
  }
}

function takePendingToast(): { storeId: string; productId: string } | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PENDING_KEY);
    const value = JSON.parse(raw) as { storeId?: unknown; productId?: unknown };
    return typeof value.storeId === "string" && typeof value.productId === "string"
      ? { storeId: value.storeId, productId: value.productId }
      : null;
  } catch {
    return null;
  }
}

/** Shows the toast queued by queueProductCreatedToast, once. */
export function PendingProductSavedToast() {
  const t = useTranslations("toast");
  useEffect(() => {
    const pending = takePendingToast();
    if (!pending) return;
    void showProductSavedToast(t("productCreatedSuccessfully"), { ...pending, viewLabel: t("viewOnStore") });
  }, [t]);
  return null;
}
