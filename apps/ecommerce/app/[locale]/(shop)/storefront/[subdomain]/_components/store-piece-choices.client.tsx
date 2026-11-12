"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { Product } from "@/components/product-page/product-page.types";
import { variantSummary } from "@/components/product-page/variant-options.lib";
import { StoreVariantPicker, useVariantMatrix } from "./store-variant-picker.client";

/**
 * Pieces 2…N of a product with variants: one compact picker each, starting
 * on the piece before's choice, so "2 black and 1 red" is one add to cart.
 * A row slides in as the quantity goes up (none while motion is reduced).
 * `limits`: the variants asked for more than their stock, with that stock.
 */
export function StorePieceChoices({
  product,
  pieces,
  limits,
  onChange,
}: {
  product: Product;
  pieces: readonly (string | null)[];
  limits: ReadonlyMap<string, number>;
  onChange: (index: number, variantId: string | null) => void;
}) {
  const t = useTranslations("storeProduct");
  const matrix = useVariantMatrix(product);
  const list = useRef<HTMLOListElement>(null);
  const shown = useRef(pieces.length);
  // A piece added from the phone's docked stepper may land off screen: bring it into view.
  useEffect(() => {
    const added = pieces.length > shown.current;
    shown.current = pieces.length;
    if (!added) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.current?.lastElementChild?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [pieces.length]);
  if (pieces.length === 0) return null;

  return (
    <ol ref={list} className="grid gap-3" aria-label={t("pieceChoicesLabel")}>
      {pieces.map((variantId, index) => {
        const variant = product.productVariants?.find((v) => v.id === variantId) ?? null;
        const limit = variantId ? limits.get(variantId) : undefined;
        return (
          <li
            key={index}
            className="grid gap-3 rounded-(--sf-radius,12px) border border-(--sf-line) bg-(--sf-paper) p-3.5 animate-in fade-in slide-in-from-top-1 duration-300 motion-reduce:animate-none"
          >
            <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
              <span className="font-bold text-(--sf-ink)">{t("pieceChoice", { n: index + 2 })}</span>
              <span className="text-[13px] text-(--sf-muted)">{variantSummary(matrix, variant)}</span>
            </p>
            <StoreVariantPicker product={product} selectedVariantId={variantId} onSelect={(id) => onChange(index, id)} compact />
            {limit != null && (
              <p className="text-[13px] font-semibold" style={{ color: "var(--destructive,#dc2626)" }}>
                {t("pieceStockLimit", { count: limit })}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
