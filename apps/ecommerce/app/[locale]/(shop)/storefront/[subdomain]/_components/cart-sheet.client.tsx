"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { onCartItemAdded, useCart } from "@/providers/cart-provider";
import type { StoreMinOrder } from "@workspace/lib/stores/min-order";
import { StorefrontCart } from "./storefront-cart.client";
import s from "../storefront.module.css";

const OPEN_EVENT = "sf:open-cart";

/** Opens the store's cart sheet (mounted once per storefront page by StorefrontShell). */
export function openStoreCart() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** `/cart` or `/<locale>/cart` on this site: what the template headers, bottom nav and cart bar link to. */
function isCartLink(a: HTMLAnchorElement): boolean {
  if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return false;
  const url = new URL(a.href, window.location.href);
  return url.origin === window.location.origin && /^\/(?:[a-z]{2}\/)?cart\/?$/.test(url.pathname);
}

/**
 * The store's cart as a sheet from the side. Every cart link on the page
 * (header icons of every template, the bottom navigation, the phone cart bar,
 * "Go to cart" buttons) opens it instead of leaving the page, and so does
 * adding a product. The `/cart` page stays for a new tab, a shared link or no
 * JavaScript.
 */
export function StoreCartSheet({
  storeName,
  minOrder,
  fontClassName,
}: {
  storeName: string;
  /** The store's minimum order (F-13b), for the "add X more" line. */
  minOrder?: StoreMinOrder | null;
  /** The storefront font's CSS variable class, plus the site root class on a
   *  built site so the portaled sheet gets the store's brand colors and fonts.
   *  Passed in because next/font modules can't be imported from client
   *  components (Turbopack build). */
  fontClassName: string;
}) {
  const t = useTranslations("storefront");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    // Capture, before the links' own (client-side navigation) handlers.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement) || !isCartLink(a)) return;
      e.preventDefault();
      e.stopPropagation();
      show();
    };
    // Show the shopper what they just added.
    const offAdded = onCartItemAdded(show);
    window.addEventListener(OPEN_EVENT, show);
    document.addEventListener("click", onClick, true);
    return () => {
      offAdded();
      window.removeEventListener(OPEN_EVENT, show);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side={locale === "ar" ? "left" : "right"} data-sf-motion="off" className={cn(s.tokens, fontClassName, "flex w-full flex-col gap-0 bg-(--sf-paper) p-5 text-(--sf-ink) sm:max-w-md")}>
        <SheetHeader className="p-0 pb-2 text-start">
          <SheetTitle className="text-xl font-bold">{t("cartTitle")}</SheetTitle>
          <SheetDescription className="sr-only">{t("cartTitle")}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1">
          <StorefrontCart storeName={storeName} minOrder={minOrder} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** The default header's cart button: the live count, and it opens the store's cart sheet. */
export function CartSheet() {
  const t = useTranslations("storefront");
  const { cartItems } = useCart();
  const count = cartItems.filter((item) => !item.savedForLater).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button type="button" onClick={openStoreCart} className={cn(s.iconButton, count > 0 && s.iconButtonFilled)} aria-label={t("openCart", { count })} aria-haspopup="dialog">
      <ShoppingBag className="size-5" aria-hidden />
      {count > 0 && (
        <span className={s.badge} aria-hidden>
          {count}
        </span>
      )}
    </button>
  );
}
