"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { HideBottomNavOnScroll } from "@/components/layout/hide-bottom-nav-on-scroll.client";
import { ProductActions } from "@/components/product-page/ProductActions";
import { ProductImages } from "@/components/product-page/ProductImages";
import { PriceTicket } from "@/components/product-page/price-ticket";
import { ProductStockBadge } from "@/components/product-page/product-stock-badge";
import { ProductTabsWrapper } from "@/components/product-page/product-tabs-wrapper.client";
import { VariantPicker } from "@/components/product-page/variant-picker";
import { useProductPage } from "@/components/product-page/product-page-provider.client";
import {
  discountExpiryDate,
  pricingDiscountPercent,
  productHasFreeDelivery,
  productPricing,
} from "@/components/product-page/product-page.lib";
import type { ProductLocale } from "@/lib/product-translations";
import { getVariantImageUrls } from "@/lib/variant-images";

/**
 * The interactive parts of a store product page (template product page spec
 * §5.3): today's product page components, each reading the page's selected
 * variant from `ProductPageProvider`, so price, stock, photos, picker and
 * buy box stay in sync wherever the seller placed them. Layout and spacing
 * come from the element's own box (the node's style).
 */

/** At or below this, stock reads as "Only N left" (as in ProductDetails). */
const LOW_STOCK_THRESHOLD = 5;

/** The selected variant's price and stock, else the base product's. */
function useSelectedPricing() {
  const { product, variant } = useProductPage();
  return useMemo(() => productPricing(product, variant), [product, variant]);
}

export function StoreProductGallery({ thumbs, zoom }: { thumbs: "side" | "bottom" | "none"; zoom: boolean }) {
  const { product, variant } = useProductPage();
  // As ProductHero: the selected variant's photos, else the product's.
  const images = useMemo(() => {
    const variantImages = getVariantImageUrls(variant);
    if (variantImages.length > 0) return variantImages;
    return Array.isArray(product.images) ? (product.images as string[]) : product.images ? [product.images as string] : [];
  }, [product.images, variant]);
  const bulletPoints = useMemo(
    () =>
      Array.isArray(product.bulletPoints)
        ? product.bulletPoints.filter((point): point is string => typeof point === "string" && point.trim().length > 0)
        : [],
    [product.bulletPoints],
  );

  return (
    <ProductImages
      images={images}
      productName={product.title}
      productId={product.id}
      description={product.description}
      bulletPoints={bulletPoints}
      thumbs={thumbs}
      zoom={zoom}
      recede={false}
    />
  );
}

export function StoreProductPrice({ showDiscount, showCountdown }: { showDiscount: boolean; showCountdown: boolean }) {
  const { product, variant } = useProductPage();
  const locale = useLocale() as ProductLocale;
  const pricing = useSelectedPricing();
  const expiry = useMemo(() => (showCountdown ? discountExpiryDate(pricing.discountEndsAt) : null), [showCountdown, pricing.discountEndsAt]);
  const percent = showDiscount ? pricingDiscountPercent(product, variant, pricing) : null;

  return (
    <PriceTicket
      price={pricing.price}
      listPrice={pricing.listPrice}
      discountPercent={percent}
      discountExpiryDate={expiry}
      hasFreeDelivery={productHasFreeDelivery(product)}
      locale={locale}
    />
  );
}

export function StoreProductStock() {
  const { product } = useProductPage();
  const { stock } = useSelectedPricing();
  const hasStock = product.status === "active" && stock > 0;
  return <ProductStockBadge hasStock={hasStock} isLowStock={hasStock && stock <= LOW_STOCK_THRESHOLD} stock={stock} />;
}

export function StoreProductVariants() {
  const { product, variantId, variant, selectVariant } = useProductPage();
  if (!product.productVariants?.length) return null;
  return <VariantPicker product={product} selectedVariantId={variantId} selectedVariant={variant} onSelect={selectVariant} />;
}

export function StoreProductBuyBox({
  buyNow,
  stickyMobile,
  variant: buttonStyle,
  addLabel,
  buyLabel,
}: {
  buyNow: boolean;
  stickyMobile: boolean;
  variant: "solid" | "outline";
  addLabel?: string;
  buyLabel?: string;
}) {
  const { product, variantId, inCart, cartQuantity } = useProductPage();
  const { price, listPrice, stock } = useSelectedPricing();
  const actions = (
    <ProductActions
      product={{
        ...product,
        quantity: stock.toString(),
        price: {
          final: price,
          list: listPrice ?? price,
        } as any,
      }}
      selectedVariantId={variantId}
      isInCart={inCart}
      cartItemQuantity={cartQuantity}
      addLabel={addLabel}
      buyLabel={buyLabel}
      buttonVariant={buttonStyle === "outline" ? "outline" : "default"}
      showBuyNow={buyNow}
    />
  );
  if (!stickyMobile) return actions;

  // Phones: docked at the bottom of the screen, as on today's product page.
  return (
    <>
      <HideBottomNavOnScroll />
      <div data-chat-avoid className="fixed right-0 bottom-[79px] left-0 z-50 transition-[bottom] duration-300 ease-out [html[data-bottom-nav=hidden]_&]:bottom-0 border-t border-gray-200 bg-white px-3 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:relative md:bottom-0 md:z-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        {actions}
      </div>
    </>
  );
}

/** Reviews and questions (ProductTabs; it never repeats the description). */
export function StoreProductReviews() {
  const { product } = useProductPage();
  return <ProductTabsWrapper product={product} />;
}
