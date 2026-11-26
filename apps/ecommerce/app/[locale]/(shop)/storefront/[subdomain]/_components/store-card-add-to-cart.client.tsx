"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AddToCartLook } from "@workspace/store-sections/render";
import { Button } from "@workspace/ui/components/button";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";
import { STORE_SOLID_BUTTON } from "./store-buttons.lib";

/** The card button per `addToCart` look; `button` is the solid one every card had before looks. */
const LOOK_CLASS: Record<AddToCartLook, string> = {
  button: STORE_SOLID_BUTTON,
  outline:
    "border-[1.5px] border-(--sf-brand) bg-transparent text-(--sf-brand) shadow-none hover:bg-[color-mix(in_srgb,var(--sf-brand)_8%,transparent)] hover:text-(--sf-brand)",
  // A round icon-only button: 32px on phones, 36px from md up.
  icon: cn(STORE_SOLID_BUTTON, "size-8 rounded-full p-0 md:size-9"),
  text: "h-auto rounded-none border-0 bg-transparent p-0 font-medium text-(--sf-brand) underline underline-offset-4 shadow-none hover:bg-transparent hover:text-(--sf-brand) hover:opacity-80",
};

/**
 * The add-to-cart button of a builder product card (`addToCart` node). It is
 * always there, as in the editor: a product with variants or a minimum above 1
 * (0151; `hasVariants` covers both) links to its page, where the shopper picks
 * one or sees the minimum, and a sold-out product shows a disabled button.
 * Once a product (without variants) is in the cart, the button turns into the
 * quantity stepper, so the card can add and remove without leaving the page;
 * the round `icon` look keeps its size instead and shows the count on a badge.
 * All follow the store's brand color, not Tallaby's. `look` is the node's
 * style; left out, the solid button.
 */
export function StoreCardAddToCart({
  productId,
  href,
  inStock,
  hasVariants,
  look = "button",
}: {
  productId: string;
  href: string;
  inStock: boolean;
  hasVariants: boolean;
  look?: AddToCartLook;
}) {
  const t = useTranslations("product");
  const { getCartItem } = useCart();
  const lookClass = LOOK_CLASS[look] ?? STORE_SOLID_BUTTON;
  const iconOnly = look === "icon";
  // Variant stock is the product page's to show (the product's own quantity can be 0).
  if (hasVariants) {
    return (
      <Button size="sm" asChild className={lookClass}>
        <Link href={href} aria-label={iconOnly ? t("addToCart") : undefined}>
          {look !== "text" && <ShoppingCart className="size-3.5 shrink-0 md:size-4" aria-hidden={iconOnly || undefined} />}
          {!iconOnly && <span>{t("addToCart")}</span>}
        </Link>
      </Button>
    );
  }
  if (!inStock) {
    return iconOnly ? (
      <Button size="sm" disabled aria-label={t("outOfStock")} className={lookClass}>
        <ShoppingCart className="size-3.5 shrink-0 md:size-4" aria-hidden />
      </Button>
    ) : (
      <Button size="sm" disabled className={lookClass}>
        {t("outOfStock")}
      </Button>
    );
  }
  const inCart = getCartItem(productId);
  if (inCart && iconOnly) {
    // Each tap adds one more; the badge shows how many are in the cart.
    return (
      <span className="relative inline-flex animate-in fade-in duration-200 motion-reduce:animate-none">
        <AddToCartButton
          productId={productId}
          size="sm"
          stock={1}
          showText={false}
          ariaLabel={`${t("addToCart")} (${t("inCartCount", { count: inCart.quantity })})`}
          className={lookClass}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -end-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-(--sf-paper,#fff) px-1 text-[10px] leading-none font-bold text-(--sf-brand) tabular-nums ring-1 ring-(--sf-brand)"
        >
          {inCart.quantity > 99 ? "99+" : inCart.quantity}
        </span>
      </span>
    );
  }
  if (inCart) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none">
        <QuantitySelector
          size="sm"
          cartItemId={inCart.id}
          initialQuantity={inCart.quantity}
          className="rounded-full border-(--sf-brand) text-(--sf-brand)"
        />
      </div>
    );
  }
  return (
    <AddToCartButton
      productId={productId}
      size="sm"
      stock={1}
      {...(iconOnly && { showText: false, ariaLabel: t("addToCart") })}
      {...(look === "text" && { showIcon: false })}
      className={cn(lookClass, "animate-in fade-in duration-200 motion-reduce:animate-none")}
    />
  );
}
