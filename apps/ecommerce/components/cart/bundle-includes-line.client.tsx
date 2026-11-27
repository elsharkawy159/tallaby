"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatBundleIncludes, type BundleLineItem } from "@workspace/lib/products/bundles";
import { cn } from "@/lib/utils";

/**
 * "Includes: A ×1, B ×2" under a bundle line (0188, ROADMAP.md F-07f), as text.
 * Shared by the store cart and the checkout summary. Nothing without items.
 */
export function BundleIncludesLine({ items, className }: { items?: readonly BundleLineItem[] | null; className?: string }) {
  const locale = useLocale();
  const t = useTranslations("storeProduct.bundle");
  if (!items?.length) return null;
  return (
    <p className={cn("text-xs break-words text-(--sf-muted,#6b7280)", className)} dir="auto">
      {t("includes", { items: formatBundleIncludes(items, locale) })}
    </p>
  );
}
