"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
  LOW_STOCK_THRESHOLD,
  discountExpiryDate,
  pricingDiscountPercent,
  productHasFreeDelivery,
  productPricing,
  stickyBuyBarClass,
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

  // Phones: docked at the bottom edge (a store host has no bottom nav to clear).
  // Larger screens keep the buttons in place.
  return (
    <>
      <HideBottomNavOnScroll />
      <div className="hidden md:block">{actions}</div>
      <SiteDock>
        <div className={`${stickyBuyBarClass(undefined, { bottomNav: false })} md:hidden`}>{actions}</div>
      </SiteDock>
    </>
  );
}

/**
 * Renders a fixed bar at the site root once mounted. Every section is its own
 * stacking context (`relative isolate`) and may animate with a transform, so
 * a fixed bar left inside it would paint under the sections after it.
 */
function SiteDock({ children }: { children: ReactNode }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [target, setTarget] = useState<Element | null>(null);
  useEffect(() => {
    setTarget(anchor.current?.closest(".sf-site") ?? anchor.current?.ownerDocument.body ?? null);
  }, []);
  if (target) return createPortal(children, target);
  return <span ref={anchor} className="contents">{children}</span>;
}

/** Reviews and questions (ProductTabs; it never repeats the description). */
export function StoreProductReviews() {
  const { product } = useProductPage();
  return <ProductTabsWrapper product={product} />;
}
