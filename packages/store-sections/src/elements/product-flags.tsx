/**
 * Trending / seasonal badges (owner, 2026-10-27): the seller's product flags
 * (`products.is_trending`, `is_seasonal`) as small chips. The renderer adds
 * them to every product card's photo (`render.tsx`, so stores need no new
 * card) and the product page shows them above the price. Fixed platform
 * markup on theme tokens; nothing comes from seller text.
 */
import { Flame, Leaf } from "lucide-react";
import { sectionText } from "../core/copy";
import type { ProductSummary, RenderContext } from "../core/types";
import { cn } from "../sections/_primitives";

/** Whether a product carries a badge. */
export function hasProductFlags(product: Pick<ProductSummary, "trending" | "seasonal">): boolean {
  return product.trending === true || product.seasonal === true;
}

const CHIP = "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold leading-none shadow-sm";

export function ProductFlags({ product, ctx, className }: { product: Pick<ProductSummary, "trending" | "seasonal">; ctx: RenderContext; className?: string }) {
  if (!hasProductFlags(product)) return null;
  return (
    <span className={cn("flex flex-wrap gap-1.5", className)}>
      {product.trending === true && (
        <span className={cn(CHIP, "bg-(--sf-ink) text-(--sf-paper)")}>
          <Flame className="size-3 shrink-0" aria-hidden />
          {sectionText("trending", ctx.locale)}
        </span>
      )}
      {product.seasonal === true && (
        <span className={cn(CHIP, "bg-(--sf-paper) text-(--sf-ink) ring-1 ring-(--sf-line)")}>
          <Leaf className="size-3 shrink-0 text-(--sf-brand)" aria-hidden />
          {sectionText("seasonal", ctx.locale)}
        </span>
      )}
    </span>
  );
}
