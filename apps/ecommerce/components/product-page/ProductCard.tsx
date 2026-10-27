"use client";

import { useCurrencyLabel } from "@/lib/currency-label.client";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@workspace/lib";
import { ProductCardView } from "@workspace/ui/components/product-card";
import { ProductCardActions, WishlistButton } from "@/components/product";
import type { ProductCardProps } from "@/components/product";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Link } from "@/i18n/navigation";
import { getProductColorSwatches } from "@/lib/variant-colors";
import {
  resolveDiscountPercent,
  resolveListPrice,
  resolvePrice,
  resolvePrimaryImage,
} from "@/lib/utils";

interface ProductCardWithStatusProps extends ProductCardProps {
  isInWishlist?: boolean;
  wishlistItemId?: string;
}

const ProductCard = ({
  // Leave undefined so WishlistButton owns membership via the shared
  // client query. Defaulting to `false` pinned every heart to "not saved".
  isInWishlist,
  wishlistItemId,
  ...product
}: ProductCardWithStatusProps) => {
  const locale = useLocale() as "en" | "ar";
  const currencyLabel = useCurrencyLabel();
  const t = useTranslations("product");
  const slug = product.slug || "unknown-product";
  const price = resolvePrice(product);
  const listPrice = resolveListPrice(product);
  const discountPercent = resolveDiscountPercent(product);
  const { swatches, overflow } = useMemo(
    () => getProductColorSwatches(product.productVariants, locale),
    [product.productVariants, locale]
  );

  return (
    <ProductCardView
      dir={locale === "ar" ? "rtl" : "ltr"}
      title={product.title || product.name || "Untitled Product"}
      href={`/products/${slug}`}
      image={resolvePrimaryImage(product.images)}
      priceHtml={formatPrice(price, locale, "sm", currencyLabel)}
      listPriceHtml={
        listPrice != null && listPrice > price ? formatPrice(listPrice, locale, "sm", currencyLabel) : null
      }
      discountPercent={discountPercent}
      discountLabel={
        discountPercent ? t("discountPercentOff", { percent: discountPercent }) : undefined
      }
      flags={[
        ...(product.isTrending ? [{ key: "trending", label: t("badgeTrending"), tone: "dark" as const }] : []),
        ...(product.isSeasonal ? [{ key: "seasonal", label: t("badgeSeasonal"), tone: "light" as const }] : []),
      ]}
      swatches={swatches.map((swatch) => ({
        key: swatch.value,
        hex: swatch.hex,
        label: swatch.label,
        image: swatch.image,
        // Deep link: the product page preselects this color client-side, so
        // the page itself stays statically rendered (ISR).
        href: `/products/${slug}?variant=${encodeURIComponent(swatch.slug)}`,
      }))}
      swatchOverflow={overflow}
      swatchOverflowLabel={`${overflow} more colors`}
      linkComponent={Link}
      renderImage={(props) => <ImageWithFallback {...props} />}
      topEndSlot={
        <WishlistButton
          productId={product.id || ""}
          size="sm"
          variant="ghost"
          showText={false}
          className="size-8 shrink-0 rounded-lg bg-white/90 p-0 shadow-sm hover:bg-white"
          isInWishlist={isInWishlist}
          wishlistItemId={wishlistItemId}
        />
      }
      bottomEndSlot={
        <ProductCardActions
          product={product}
          variant="card"
          isInWishlist={isInWishlist}
          wishlistItemId={wishlistItemId}
        />
      }
    />
  );
};

export default ProductCard;
