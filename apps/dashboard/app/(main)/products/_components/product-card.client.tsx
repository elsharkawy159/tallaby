"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, ImageIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import { getPublicUrl } from "@/lib/utils";
import { formatMoney, formatNumber } from "@/lib/i18n/format";
import { ProductPublishSwitch } from "./product-publish-toggle.client";
import { discountPercent, effectivePrice, stockLevel } from "./products-view.lib";
import type { VendorProduct } from "./vendor-products.section";

const stockStyles = {
  in: "bg-success-soft text-success",
  low: "bg-accent-soft text-accent-ink",
  out: "bg-destructive-soft text-destructive",
} as const;

export function StockBadge({
  quantity,
  className,
}: {
  quantity?: number | null;
  className?: string;
}) {
  const t = useTranslations("products.list.stock");
  const locale = useLocale();
  const level = stockLevel(quantity);
  const count = formatNumber(quantity ?? 0, locale);

  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[11px] font-semibold before:size-1.5 before:rounded-full before:bg-current",
        stockStyles[level],
        className
      )}
    >
      {t(level, { count })}
    </span>
  );
}

export function DiscountBadge({ percent }: { percent: number }) {
  return (
    <span
      dir="ltr"
      className="inline-grid h-6 place-items-center rounded-lg bg-destructive px-2 text-xs font-bold text-white tabular-nums"
    >
      -{percent}%
    </span>
  );
}

export function ProductPrice({ product }: { product: VendorProduct }) {
  const locale = useLocale();
  const discounted = discountPercent(product) > 0;

  return (
    <span className="flex flex-wrap items-baseline gap-x-2">
      <b className="text-[17px] font-extrabold tabular-nums">
        {formatMoney(effectivePrice(product), locale)}
      </b>
      {discounted && (
        <s className="text-xs text-faint tabular-nums">
          {formatMoney(product.basePrice, locale)}
        </s>
      )}
    </span>
  );
}

export function ProductActionsMenu({
  product,
  onDelete,
}: {
  product: VendorProduct;
  onDelete: (product: VendorProduct) => void;
}) {
  const t = useTranslations("products.list");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          aria-label={t("moreActions")}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {product.storeUrl && (
          <DropdownMenuItem asChild>
            <a href={product.storeUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              {t("view")}
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={`/products/${product.id}/edit`}>
            <Pencil />
            {t("edit")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(product)}>
          <Trash2 />
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProductCard({
  product,
  selected,
  selecting,
  onSelectedChange,
  onDelete,
}: {
  product: VendorProduct;
  selected: boolean;
  /** Some card is selected, so every checkbox stays visible. */
  selecting: boolean;
  onSelectedChange: (selected: boolean) => void;
  onDelete: (product: VendorProduct) => void;
}) {
  const t = useTranslations("products.list");
  const editHref = `/products/${product.id}/edit`;
  const image = product.images?.[0] ? getPublicUrl(product.images[0], "products") : "";
  const discount = discountPercent(product);
  const isDraft = product.status !== "active";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-input hover:shadow-[0_6px_20px_rgba(20,81,99,0.08)]",
        selected && "border-primary ring-3 ring-primary/20 hover:border-primary"
      )}
    >
      <div className="relative aspect-square border-b bg-white">
        <Link href={editHref} className="absolute inset-0 grid place-items-center" tabIndex={-1}>
          {image ? (
            <Image
              src={image}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, 260px"
              className={cn(
                "object-contain p-3.5 transition-opacity",
                isDraft && "opacity-55 grayscale-[.4]"
              )}
            />
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs text-faint">
              <ImageIcon className="size-8" aria-hidden="true" />
              {t("noImage")}
            </span>
          )}
        </Link>

        {discount > 0 && (
          <div className="pointer-events-none absolute start-2.5 top-2.5">
            <DiscountBadge percent={discount} />
          </div>
        )}

        <div
          className={cn(
            "absolute end-2.5 top-2.5 transition-opacity",
            selected || selecting
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100"
          )}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectedChange(checked === true)}
            aria-label={t("select", { title: product.title })}
            className="size-[22px] rounded-[7px] border-[1.5px] bg-card shadow-none"
          />
        </div>

        <div className="pointer-events-none absolute bottom-2.5 start-2.5">
          <StockBadge quantity={product.quantity} className="shadow-[0_0_0_2px_var(--card)]" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:px-3.5 sm:pt-3 sm:pb-3.5">
        <span className="truncate text-xs text-muted-foreground">
          {product.category?.name || "—"}
        </span>
        <h3 className="m-0 line-clamp-2 min-h-[43px] text-sm font-semibold leading-[1.55]">
          <Link href={editHref} title={product.title} className="hover:text-primary-ink">
            {product.title}
          </Link>
        </h3>
        <ProductPrice product={product} />

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-dashed pt-2.5">
          <ProductPublishSwitch productId={product.id} status={product.status} />
          <div className="flex items-center gap-1">
            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 rounded-[9px] px-2.5">
              <Link href={editHref}>
                <Pencil className="size-3.5" />
                {t("edit")}
              </Link>
            </Button>
            <ProductActionsMenu product={product} onDelete={onDelete} />
          </div>
        </div>
      </div>
    </article>
  );
}
