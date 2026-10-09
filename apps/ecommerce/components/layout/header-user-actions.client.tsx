"use client";

import { Link } from "@/i18n/navigation";
import { Heart, Package, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { AuthLink } from "./auth-link";
import { CartCountClient } from "./cart-count.client";
import { WishlistCount } from "./wishlist-count";
import { NotificationButton } from "./notification-button";

// Two-line label used next to header icons: a quiet hint over a bold name.
const labelHint = "block text-[11px] leading-[1.45] text-[#b9cfd5]";
const labelName = "block text-[13px] font-bold leading-[1.45]";
const actionClass =
  "relative flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-white transition-colors hover:bg-white/10 hover:text-white";

export function HeaderUserActions() {
  const t = useTranslations("navigation");

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <div className="flex items-center rounded-[10px] text-white transition-colors hover:bg-white/10 px-2.5 py-1.5">
        <AuthLink variant="desktop" />
        <Link
          href="/profile"
          className="hidden pe-2.5 text-white hover:text-white lg:block"
        >
          <span className={labelHint}>{t("hello")}</span>
          <span className={labelName}>{t("myAccount")}</span>
        </Link>
      </div>

      <Link href="/profile/orders" className={`${actionClass} hidden xl:flex`}>
        <Package className="size-5.5" aria-hidden />
        <span>
          <span className={labelHint}>{t("returns")}</span>
          <span className={labelName}>{t("myOrders")}</span>
        </span>
      </Link>

      <NotificationButton />

      <Link
        href="/profile/wishlist"
        className={actionClass}
        aria-label={t("wishlist")}
      >
        <span className="relative">
          <Heart className="size-5.5" aria-hidden />
          <WishlistCount className="absolute -top-2 -end-2 flex size-4.5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white" />
        </span>
      </Link>

      <Link href="/cart" className={actionClass}>
        <span className="relative">
          <ShoppingCart className="size-5.5" aria-hidden />
          <CartCountClient />
        </span>
        <span className={`${labelName} hidden lg:block`}>{t("cart")}</span>
      </Link>
    </div>
  );
}
