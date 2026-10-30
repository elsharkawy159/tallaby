"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "next-intl";
import { HideBottomNavOnScroll } from "@/components/layout/hide-bottom-nav-on-scroll.client";
import { ProductTabsWrapper } from "@/components/product-page/product-tabs-wrapper.client";
import { useProductPage } from "@/components/product-page/product-page-provider.client";
import {
  LOW_STOCK_THRESHOLD,
  discountExpiryDate,
  pricingDiscountPercent,
  productHasFreeDelivery,
  productPricing,
} from "@/components/product-page/product-page.lib";
import { lowStockLeft } from "@workspace/store-sections/low-stock";
import type { ProductLocale } from "@/lib/product-translations";
import { getVariantImageUrls } from "@/lib/variant-images";
import { StoreBuyBox, StoreQuantity } from "./store-buy-box.client";
import { StoreGallery } from "./store-product-gallery.client";
import { StoreLiveViews, StoreLowStockAlert, StorePriceBlock, StoreStockLine } from "./store-product-info.client";
import { StoreVariantPicker } from "./store-variant-picker.client";
import { StoreRestockForm } from "./store-restock-form.client";

/**
 * The interactive parts of a store product page (template product page spec
 * §5.3), each reading the page's selected variant from `ProductPageProvider`,
 * so price, stock, photos, picker and buy box stay in sync wherever the
 * seller placed them. They are drawn in the store's look (`--sf-*` tokens,
 * the Product Section design); the marketplace page keeps its own
 * components. Layout and spacing come from the element's own box.
 */

/** The selected variant's price and stock, else the base product's. */
function useSelectedPricing() {
  const { product, variant } = useProductPage();
  return useMemo(() => productPricing(product, variant), [product, variant]);
}

export function StoreProductGallery({ thumbs, zoom }: { thumbs: "side" | "bottom" | "none"; zoom: boolean }) {
  const { product, variant } = useProductPage();
  const pricing = useSelectedPricing();
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
    <StoreGallery
      // A new photo set (another variant) starts again at its first photo.
      key={images.join("|")}
      productId={product.id}
      images={images}
      productName={product.title}
      description={product.description}
      bulletPoints={bulletPoints}
      discountPercent={pricingDiscountPercent(product, variant, pricing)}
      thumbs={thumbs}
      zoom={zoom}
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
    <StorePriceBlock
      price={pricing.price}
      listPrice={pricing.listPrice}
      discountPercent={percent}
      discountEndsAt={expiry}
      hasFreeDelivery={productHasFreeDelivery(product)}
      locale={locale}
    />
  );
}

/** Units left for the seller's low-stock alert (F-34), following the selected variant; null when none applies. */
function useLowStockLeft() {
  const { product } = useProductPage();
  const { stock } = useSelectedPricing();
  const hasStock = product.status === "active" && stock > 0;
  const left = hasStock ? lowStockLeft(stock, { show: product.showLowStockBadge === true, threshold: product.lowStockThreshold }) : null;
  return { hasStock, stock, left };
}

/**
 * `alertElsewhere`: the page has its own low-stock badge element (F-34d), so
 * this line leaves the alert to it (and shows nothing while it applies).
 */
export function StoreProductStock({ alertElsewhere = false }: { alertElsewhere?: boolean }) {
  const { hasStock, stock, left } = useLowStockLeft();
  // The seller's low-stock alert (F-34) follows the selected variant and replaces the pill, so it isn't said twice.
  if (left != null) return alertElsewhere ? null : <StoreLowStockAlert left={left} />;
  return <StoreStockLine hasStock={hasStock} isLowStock={hasStock && stock <= LOW_STOCK_THRESHOLD} stock={stock} />;
}

/** The low-stock badge element (F-34d): the alert where the seller placed it, nothing otherwise. */
export function StoreProductStockBadge() {
  const { left } = useLowStockLeft();
  return left != null ? <StoreLowStockAlert left={left} /> : null;
}

export function StoreProductVariants() {
  const { product, variantId, variant, selectVariant } = useProductPage();
  if (!product.productVariants?.length) return null;
  return <StoreVariantPicker product={product} selectedVariantId={variantId} selectedVariant={variant} onSelect={selectVariant} />;
}

/** Live viewers (the renderer only asks for it when the seller ticked it). */
export function StoreProductLiveViews({ productId }: { productId: string }) {
  return <StoreLiveViews productId={productId} />;
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
  const { stock } = useSelectedPricing();
  // As ProductActions: starts at the cart's quantity (or 1). Shared by the in-page box and the phone dock.
  const [quantity, setQuantity] = useState(cartQuantity || 1);
  const hasStock = product.status === "active" && stock > 0;
  const twoButtons = buyNow && product.directCheckout !== true && hasStock;

  const box = (layout: "inline" | "dock", hideQuantity = false) => (
    <StoreBuyBox
      product={product}
      stock={stock}
      selectedVariantId={variantId}
      isInCart={inCart}
      quantity={quantity}
      onQuantityChange={setQuantity}
      addLabel={addLabel}
      buyLabel={buyLabel}
      outline={buttonStyle === "outline"}
      showBuyNow={buyNow}
      layout={layout}
      hideQuantity={hideQuantity}
    />
  );
  // Out of stock: "Notify me when it's back" (F-23a), per selected variant.
  const restock =
    !hasStock && product.status === "active" ? (
      <StoreRestockForm key={variantId ?? "product"} productId={product.id} variantId={variantId} />
    ) : null;
  if (!stickyMobile) {
    if (!restock) return box("inline");
    return (
      <div className="grid min-w-0 gap-3">
        {box("inline")}
        {restock}
      </div>
    );
  }

  // Phones: the buttons are docked at the bottom edge (the site's bottom nav
  // steps aside for them). With two buttons the dock has no room for the
  // quantity, so it stays here in the page. Larger screens keep the box in place.
  return (
    <>
      <HideBottomNavOnScroll />
      <div className="hidden md:block">{box("inline")}</div>
      {restock && <div className="md:mt-3">{restock}</div>}
      {twoButtons && (
        <div className="md:hidden">
          <StoreQuantity value={quantity} max={stock} onChange={setQuantity} />
        </div>
      )}
      <SiteDock>
        <DockBar>{box("dock", twoButtons)}</DockBar>
      </SiteDock>
    </>
  );
}

/**
 * The phone buy bar: fixed on the bottom edge in the store's paper colour,
 * padded for the safe area, with a spacer of its own height at the end of
 * the site so it never covers the footer.
 */
function DockBar({ children }: { children: ReactNode }) {
  const bar = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <div aria-hidden className="shrink-0 md:hidden" style={{ height }} />
      {/* data-sf-buy-bar: the site's phone bottom navigation and floating cart bar step aside for it. */}
      <div
        ref={bar}
        data-sf-buy-bar=""
        className="fixed inset-x-0 bottom-0 z-50 border-t border-(--sf-line) bg-(--sf-paper) px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] text-(--sf-ink) shadow-[0_-6px_20px_rgba(0,0,0,0.08)] md:hidden"
      >
        {children}
      </div>
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
