"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatPricePlain } from "@workspace/lib";
import { Link, usePathname } from "@/i18n/navigation";
import { useCart } from "@/providers/cart-provider";
import s from "../storefront.module.css";

/**
 * Phones: once something is in the cart, a floating bar keeps the total and
 * the way to the cart one tap away. Shoppers arriving from a shared link are
 * mostly on mobile.
 */
export function MobileCartBar() {
  const t = useTranslations("storefront");
  const locale = useLocale();
  // Browser path (see the usePathname rewrite note in the Next.js docs);
  // the bar only renders after the cart has loaded on the client.
  const pathname = usePathname();
  const { cartItems } = useCart();
  const items = cartItems.filter((item) => !item.savedForLater);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  if (count === 0 || pathname === "/cart") return null;

  return (
    <>
      <div className={s.barSpacer} aria-hidden />
      <div className={s.cartBar}>
        <span className="flex flex-col leading-tight">
          <span className="text-xs opacity-75">{t("itemCount", { count })}</span>
          <span className="font-bold tabular-nums">{formatPricePlain(subtotal, locale)}</span>
        </span>
        <Link href="/cart" className={s.cartBarButton}>
          {t("viewCart")}
        </Link>
      </div>
    </>
  );
}
