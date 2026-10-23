"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { SiteLocale } from "@workspace/store-sections";
import type { ProductDetail } from "@workspace/store-sections/render";
import type { EditorAdapter } from "../adapter.types";
import { canvasProduct } from "../lib/editor-data.lib";

/**
 * The product the product page canvas draws (template product page spec §5.5):
 * the host's preview product (the newest product the store shows, or the one
 * picked in the canvas strip), else DEMO_PRODUCT. Reloaded in the canvas
 * language when it changes. Never cached: every load is a fresh store-checked action.
 */
export function usePreviewProduct(adapter: EditorAdapter, initial: ProductDetail | null | undefined, initialLocale: SiteLocale, locale: SiteLocale) {
  const tErrors = useTranslations("storeEditor.errors");
  const [real, setReal] = useState<ProductDetail | null>(initial ?? null);
  const [busy, setBusy] = useState(false);
  const loaded = useRef<{ id: string | undefined; locale: SiteLocale }>({ id: initial?.id, locale: initialLocale });
  const load = adapter.previewProduct;

  const fetchProduct = useCallback(
    async (productId: string | undefined, inLocale: SiteLocale) => {
      if (!load) return;
      setBusy(true);
      try {
        const result = await load(productId, inLocale);
        if (!result.success) {
          toast.error(tErrors(result.error));
          return;
        }
        loaded.current = { id: result.data?.id, locale: inLocale };
        setReal(result.data);
      } finally {
        setBusy(false);
      }
    },
    [load, tErrors],
  );

  // The product's copy follows the canvas language.
  useEffect(() => {
    if (!load || !real || loaded.current.locale === locale) return;
    void fetchProduct(real.id, locale);
  }, [load, real, locale, fetchProduct]);

  return {
    product: canvasProduct(real),
    /** The picked real product's id (none while DEMO_PRODUCT is drawn). */
    productId: real?.id ?? null,
    busy,
    /** Null when the host has no preview products (template and section editing). */
    pick: load ? (productId: string) => void fetchProduct(productId, locale) : null,
  };
}
