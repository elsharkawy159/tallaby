"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { useCart } from "@/providers/cart-provider";
import { StorefrontCart } from "./storefront-cart.client";
import s from "../storefront.module.css";

export function CartSheet({
  storeName,
  fontClassName,
}: {
  storeName: string;
  /** The storefront font's CSS variable class. Passed in because next/font
   *  modules can't be imported from client components (Turbopack build). */
  fontClassName: string;
}) {
  const t = useTranslations("storefront");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const { cartItems } = useCart();
  const count = cartItems
    .filter((item) => !item.savedForLater)
    .reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(s.iconButton, count > 0 && s.iconButtonFilled)}
        aria-label={t("openCart", { count })}
      >
        <ShoppingBag className="size-5" aria-hidden />
        {count > 0 && (
          <span className={s.badge} aria-hidden>
            {count}
          </span>
        )}
      </SheetTrigger>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        className={cn(fontClassName, s.tokens, "flex w-full flex-col gap-0 p-5 sm:max-w-md")}
      >
        <SheetHeader className="p-0 pb-2 text-start">
          <SheetTitle className="text-xl font-bold">{t("cartTitle")}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("cartScopeNote", { store: storeName })}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1">
          <StorefrontCart storeName={storeName} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
