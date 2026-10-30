"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";
import { STORE_SOLID_BUTTON } from "./store-buttons.lib";

/**
 * The add-to-cart button of a builder product card (`addToCart` node). It is
 * always there, as in the editor: a product with variants links to its page,
 * where the shopper picks one, and a sold-out product shows a disabled button.
 * Once a product (without variants) is in the cart, the button turns into the
 * quantity stepper, so the card can add and remove without leaving the page.
 * Both follow the store's brand color, not Tallaby's.
 */
export function StoreCardAddToCart({
  productId,
  href,
  inStock,
  hasVariants,
}: {
  productId: string;
  href: string;
  inStock: boolean;
  hasVariants: boolean;
}) {
  const t = useTranslations("product");
  const { getCartItem } = useCart();
  // Variant stock is the product page's to show (the product's own quantity can be 0).
  if (hasVariants) {
    return (
      <Button size="sm" asChild className={STORE_SOLID_BUTTON}>
        <Link href={href}>
          <ShoppingCart className="size-3.5 shrink-0 md:size-4" />
          <span>{t("addToCart")}</span>
        </Link>
      </Button>
    );
  }
  if (!inStock) {
    return (
      <Button size="sm" disabled className={STORE_SOLID_BUTTON}>
        {t("outOfStock")}
      </Button>
    );
  }
  const inCart = getCartItem(productId);
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
  return <AddToCartButton productId={productId} size="sm" stock={1} className={cn(STORE_SOLID_BUTTON, "animate-in fade-in duration-200 motion-reduce:animate-none")} />;
}
