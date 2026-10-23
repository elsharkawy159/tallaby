"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/providers/cart-provider";

/**
 * The item count on a builder header's cart link. It reads the host-scoped
 * cart, so it changes as soon as anything is added, removed or updated.
 */
export function StoreCartBadge() {
  const t = useTranslations("storefront");
  const { cartItems } = useCart();
  const count = cartItems.filter((item) => !item.savedForLater).reduce((sum, item) => sum + item.quantity, 0);
  if (count <= 0) return null;

  return (
    <span className="pointer-events-none absolute -end-1 -top-1 z-10 inline-grid h-5 min-w-5 place-items-center rounded-full bg-(--sf-brand) px-1 text-[11px] font-bold leading-none text-(--sf-brand-ink,#fff) tabular-nums ring-2 ring-(--sf-paper,#fff)">
      <span aria-hidden>{count > 99 ? "99+" : count}</span>
      <span className="sr-only">{t("itemCount", { count })}</span>
    </span>
  );
}
