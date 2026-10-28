"use client";

import { ChevronRight, Minus, Plus, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { AddToCartButton } from "@/components/product";
import type { Product } from "@/components/product-page/product-page.types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * The store product page's buy box (the store look of `ProductActions`, with
 * the same behaviour): quantity, "Add to cart" (or "Buy now" for a direct
 * checkout product), and an optional full-width "Buy now" under it for the
 * others; once in the cart they become links to the cart and checkout.
 * `layout="dock"`: the compact phone bar, both buttons side by side.
 * The quantity is held by the caller, so the dock and the page share it.
 */

const SOLID = "border-0 bg-(--sf-brand) text-(--sf-brand-ink) shadow-none hover:bg-[color-mix(in_srgb,var(--sf-brand)_86%,#000)] hover:text-(--sf-brand-ink)";
const OUTLINE =
  "border-[1.5px] border-(--sf-brand) bg-transparent text-(--sf-brand) shadow-none hover:bg-[color-mix(in_srgb,var(--sf-brand)_8%,transparent)] hover:text-(--sf-brand) dark:bg-transparent";
const INK = "border-0 bg-(--sf-ink) text-(--sf-paper) shadow-none hover:bg-[color-mix(in_srgb,var(--sf-ink)_84%,var(--sf-paper))] hover:text-(--sf-paper)";

export function StoreBuyBox({
  product,
  stock,
  selectedVariantId,
  isInCart,
  quantity,
  onQuantityChange,
  addLabel,
  buyLabel,
  outline,
  showBuyNow,
  layout = "inline",
  hideQuantity = false,
}: {
  product: Product;
  /** The selected variant's stock (else the product's). */
  stock: number;
  selectedVariantId: string | null;
  isInCart: boolean;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  addLabel?: string;
  buyLabel?: string;
  /** The add button outlined (the element's `variant: outline`). */
  outline: boolean;
  /** A second "Buy now" for products that are not direct checkout. */
  showBuyNow: boolean;
  layout?: "inline" | "dock";
  hideQuantity?: boolean;
}) {
  const t = useTranslations("storeProduct");
  const hasStock = product.status === "active" && stock > 0;
  const directCheckout = product.directCheckout === true;
  const dock = layout === "dock";
  const size = dock ? "h-12 text-[15px]" : "h-[54px] text-base";
  const button = cn("min-w-0 flex-1 gap-2 overflow-hidden rounded-full px-4 font-bold", size);

  if (!hasStock) {
    return (
      <div className={cn("flex items-center gap-2.5", dock && "gap-2")}>
        {!hideQuantity && !dock && <StoreQuantity value={quantity} max={0} disabled onChange={onQuantityChange} />}
        <p
          className={cn("flex-1 rounded-full px-4 text-center font-bold leading-none", dock ? "py-4 text-sm" : "py-5 text-base")}
          style={{ color: "var(--destructive,#dc2626)", background: "color-mix(in srgb, var(--destructive,#dc2626) 10%, transparent)" }}
        >
          {t("outOfStock")}
        </p>
      </div>
    );
  }

  const primary = isInCart ? (
    <Button asChild size="lg" className={cn(button, outline ? OUTLINE : SOLID)}>
      <Link href={directCheckout ? "/cart/checkout" : "/cart"}>
        {directCheckout ? <Zap className="size-[18px] shrink-0" aria-hidden /> : <ChevronRight className="size-[18px] shrink-0 rtl:rotate-180" aria-hidden />}
        <span className="truncate">{directCheckout ? buyLabel || t("buyNow") : t("goToCart")}</span>
      </Link>
    </Button>
  ) : (
    <AddToCartButton
      productId={product.id}
      quantity={quantity}
      variantId={selectedVariantId ?? undefined}
      className={cn(button, outline ? OUTLINE : SOLID)}
      variant={outline ? "outline" : "default"}
      stock={stock}
      buyNow={directCheckout}
      icon="bag"
      label={directCheckout ? buyLabel || t("buyNow") : addLabel || t("addToCart")}
    />
  );

  const secondary =
    showBuyNow && !directCheckout ? (
      isInCart ? (
        <Button asChild size="lg" className={cn(button, INK)}>
          <Link href="/cart/checkout">
            <Zap className="size-[18px] shrink-0" aria-hidden />
            <span className="truncate">{buyLabel || t("buyNow")}</span>
          </Link>
        </Button>
      ) : (
        <AddToCartButton
          productId={product.id}
          quantity={quantity}
          variantId={selectedVariantId ?? undefined}
          className={cn(button, INK)}
          variant="default"
          stock={stock}
          buyNow
          label={buyLabel || t("buyNow")}
        />
      )
    ) : null;

  const stepper = hideQuantity ? null : (
    <StoreQuantity value={quantity} max={stock} compact={dock} onChange={onQuantityChange} />
  );

  if (dock) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        {stepper}
        {primary}
        {secondary}
      </div>
    );
  }
  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {stepper}
        {primary}
      </div>
      {secondary && <div className="flex">{secondary}</div>}
    </div>
  );
}

/** The quantity pill: − N +, 48px tall, 1.5px border. */
export function StoreQuantity({
  value,
  max,
  disabled = false,
  compact = false,
  onChange,
  className,
}: {
  value: number;
  max?: number;
  disabled?: boolean;
  compact?: boolean;
  onChange: (quantity: number) => void;
  className?: string;
}) {
  const t = useTranslations("common");
  const canDecrease = !disabled && value > 1;
  const canIncrease = !disabled && (max == null || value < max);
  const step = cn(
    "grid h-full shrink-0 place-items-center text-(--sf-ink) transition-opacity disabled:opacity-35 motion-reduce:transition-none",
    compact ? "w-9" : "w-[42px]",
  );
  return (
    <div
      className={cn(
        "inline-flex h-12 shrink-0 items-center rounded-full border-[1.5px] border-(--sf-line) bg-(--sf-paper)",
        disabled && "opacity-60",
        className,
      )}
    >
      <button type="button" className={step} disabled={!canDecrease} onClick={() => onChange(Math.max(1, value - 1))} aria-label={t("decreaseQuantity")}>
        <Minus className="size-4" aria-hidden />
      </button>
      <span className={cn("text-center text-base font-bold tabular-nums text-(--sf-ink)", compact ? "min-w-6" : "min-w-8")} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={step}
        disabled={!canIncrease}
        onClick={() => onChange(max == null ? value + 1 : Math.min(max, value + 1))}
        aria-label={t("increaseQuantity")}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

