"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Link } from "@/i18n/navigation";

/**
 * The add-to-cart button of a builder product card (`addToCart` node). It is
 * always there, as in the editor: a product with variants links to its page,
 * where the shopper picks one, and a sold-out product shows a disabled button.
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
  // Variant stock is the product page's to show (the product's own quantity can be 0).
  if (hasVariants) {
    return (
      <Button size="sm" asChild>
        <Link href={href}>
          <ShoppingCart className="size-3.5 shrink-0 md:size-4" />
          <span>{t("addToCart")}</span>
        </Link>
      </Button>
    );
  }
  if (!inStock) {
    return (
      <Button size="sm" disabled>
        {t("outOfStock")}
      </Button>
    );
  }
  return <AddToCartButton productId={productId} size="sm" stock={1} />;
}
