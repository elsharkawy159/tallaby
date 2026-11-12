"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/providers/cart-provider";
import { HideBottomNavOnScroll } from "@/components/layout/hide-bottom-nav-on-scroll.client";
import { ProductTabsWrapper } from "@/components/product-page/product-tabs-wrapper.client";
import { useProductPage } from "@/components/product-page/product-page-provider.client";
import {
  LOW_STOCK_THRESHOLD,
  discountExpiryDate,
  pricingDiscountPercent,
  productBelowMinimum,
  productHasFreeDelivery,
  productMinOrder,
  productPricing,
} from "@/components/product-page/product-page.lib";
import { lowStockLeft } from "@workspace/store-sections/low-stock";
import type { ProductLocale } from "@/lib/product-translations";
import { getVariantImageUrls } from "@/lib/variant-images";
import { StoreBuyBox, StoreQuantity } from "./store-buy-box.client";
import { StoreGallery } from "./store-product-gallery.client";
import { StoreLiveViews, StoreLowStockAlert, StorePriceBlock, StoreStockLine } from "./store-product-info.client";
import { StoreVariantPicker } from "./store-variant-picker.client";
import { StorePieceChoices } from "./store-piece-choices.client";
import { countPieces, resolvePieces } from "@/components/product-page/variant-options.lib";
import { StoreRestockForm } from "./store-restock-form.client";
import { StoreQuantityOffers } from "./store-quantity-offers.client";
import { CustomerFieldsForm } from "@/components/product-page/customer-fields-form.client";
import { unitPriceWithExtras } from "@workspace/lib/products/customer-fields";

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
  const { product, variant, customer } = useProductPage();
  const locale = useLocale() as ProductLocale;
  const pricing = useSelectedPricing();
  const expiry = useMemo(() => (showCountdown ? discountExpiryDate(pricing.discountEndsAt) : null), [showCountdown, pricing.discountEndsAt]);
  const percent = showDiscount ? pricingDiscountPercent(product, variant, pricing) : null;

  return (
    <StorePriceBlock
      // The customer requirements' extras (F-91) follow what is filled.
      price={unitPriceWithExtras(pricing.price, customer.extrasPiastres)}
      listPrice={pricing.listPrice != null ? unitPriceWithExtras(pricing.listPrice, customer.extrasPiastres) : null}
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
  const hasStock = product.status === "active" && stock > 0 && !productBelowMinimum(product);
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
  const { product, variantId, inCart, cartQuantity, customer } = useProductPage();
  const { stock, price } = useSelectedPricing();
  const tCommon = useTranslations("common");
  const { cartItems } = useCart();
  // As ProductActions: starts at the cart's quantity (or 1). Shared by the in-page box and the phone dock.
  const [picked, setQuantity] = useState(cartQuantity || 1);
  // The seller's minimum (0151): the quantity never goes below it.
  const minOrder = productMinOrder(product, cartItems, variantId, stock);
  const quantity = Math.max(minOrder.floor, picked);
  const hasStock = product.status === "active" && stock > 0 && !minOrder.unavailable;
  const twoButtons = buyNow && product.directCheckout !== true && hasStock;

  // Pieces 2…N of a product with variants each get their own choice (2 black, 1 red).
  // Not for a seller minimum (0151): each line would be checked against it alone.
  const variants = product.productVariants ?? [];
  const piecesOn = variants.length > 1 && minOrder.minimum <= 1 && hasStock && !inCart;
  const [piecePicks, setPiecePicks] = useState<(string | null | undefined)[]>([]);
  const changeQuantity = (next: number) => {
    setQuantity(next);
    // A removed piece forgets its choice: raising the quantity again copies the last one.
    setPiecePicks((picks) => picks.slice(0, Math.max(0, next - 1)));
  };
  const pieces = piecesOn ? resolvePieces(variantId, piecePicks, quantity) : [];
  const stockOf = (id: string | null) => {
    if (product.trackStock === false) return Number.POSITIVE_INFINITY;
    const found = variants.find((v) => v.id === id);
    return found ? Number(found.stock ?? 0) : stock;
  };
  const lines = countPieces([variantId, ...pieces]);
  const limits = new Map<string, number>();
  for (const line of lines) if (line.variantId && line.quantity > stockOf(line.variantId)) limits.set(line.variantId, stockOf(line.variantId));
  const maxQuantity = piecesOn
    ? product.trackStock === false
      ? Number.POSITIVE_INFINITY
      : variants.reduce((sum, v) => sum + Math.max(0, Number(v.stock ?? 0)), 0)
    : stock;
  const cartLines = piecesOn ? lines.map((line) => ({ variantId: line.variantId ?? undefined, quantity: line.quantity })) : undefined;
  const choices = piecesOn ? (
    <StorePieceChoices
      product={product}
      pieces={pieces}
      limits={limits}
      onChange={(index, id) => {
        // The other pieces keep what they show now; only a piece added later copies the last one.
        const next: (string | null)[] = [...pieces];
        next[index] = id;
        setPiecePicks(next);
      }}
    />
  ) : null;

  const box = (layout: "inline" | "dock", hideQuantity = false) => (
    <StoreBuyBox
      product={product}
      stock={stock}
      selectedVariantId={variantId}
      isInCart={inCart}
      quantity={quantity}
      minQuantity={minOrder.floor}
      belowMinimum={minOrder.unavailable}
      onQuantityChange={changeQuantity}
      maxQuantity={maxQuantity}
      lines={cartLines}
      blocked={limits.size > 0}
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
    stock <= 0 && product.status === "active" ? (
      <StoreRestockForm key={variantId ?? "product"} productId={product.id} variantId={variantId} />
    ) : null;
  // Customer requirements (F-91): right above the add buttons, wherever the box is.
  const requirements = hasStock ? <CustomerFieldsForm className="mb-5" /> : null;
  // Sets the same quantity as the stepper (F-07c), so it lives with the box.
  const tiers = hasStock ? (
    <>
      {requirements}
      {minOrder.minimum > 1 && <p className="mb-3 text-sm font-semibold text-(--sf-ink)">{tCommon("minOrderLine", { count: minOrder.minimum })}</p>}
      <StoreQuantityOffers productId={product.id} price={unitPriceWithExtras(price, customer.extrasPiastres)} stock={maxQuantity} quantity={quantity} floor={minOrder.floor} readOnly={inCart} onSelect={changeQuantity} />
    </>
  ) : null;
  if (!stickyMobile) {
    if (!restock) {
      return (
        <>
          {tiers}
          {box("inline")}
          {choices && <div className="mt-4">{choices}</div>}
        </>
      );
    }
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
      {tiers}
      <div className="hidden md:block">{box("inline")}</div>
      {restock && <div className="md:mt-3">{restock}</div>}
      {twoButtons && (
        <div className="md:hidden">
          <StoreQuantity value={quantity} min={minOrder.floor} max={maxQuantity} onChange={changeQuantity} />
        </div>
      )}
      {choices && <div className="mt-4">{choices}</div>}
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
