"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, ImageIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { SellerButton } from "@/components/seller-ui";
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
import { formatNumber } from "@/lib/i18n/format";
import { useAccountMoney } from "@/components/account-money.client";
import { Money } from "@/components/money";
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
  trackStock,
  className,
}: {
  quantity?: number | null;
  /** False: unlimited stock (0138, F-51), shown as "Unlimited". */
  trackStock?: boolean | null;
  className?: string;
}) {
  const t = useTranslations("products.list.stock");
  const locale = useLocale();
  const unlimited = trackStock === false;
  const level = unlimited ? "in" : stockLevel(quantity);
  const count = formatNumber(quantity ?? 0, locale);

  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold before:size-[7px] before:rounded-full before:bg-current",
        stockStyles[level],
        className
      )}
    >
      {unlimited ? t("unlimited") : t(level, { count })}
    </span>
  );
}

export function DiscountBadge({ percent }: { percent: number }) {
  return (
    <span
      dir="ltr"
      className="inline-grid h-6 place-items-center rounded-full bg-destructive px-2.5 font-montserrat text-xs font-extrabold text-white tabular-nums dark:text-[#2b0d0d]"
    >
      -{percent}%
    </span>
  );
}

export function ProductPrice({ product }: { product: VendorProduct }) {
  const locale = useLocale();
  const { unit } = useAccountMoney();
  const discounted = discountPercent(product) > 0;

  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5" dir="auto">
      <b className="font-montserrat text-[17px] font-extrabold tabular-nums text-(--s-ink)">
        <Money value={effectivePrice(product)} locale={locale} unit={unit} />
      </b>
      {discounted && (
        <s className="font-montserrat text-[12.5px] font-medium tabular-nums text-(--s-faint)">
          <Money value={product.basePrice} locale={locale} unit={unit} />
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
          className="size-8 rounded-[10px] text-(--s-subtle) max-[600px]:size-10"
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
  const tPublish = useTranslations("products.publish");
  const editHref = `/products/${product.id}/edit`;
  const image = product.images?.[0] ? getPublicUrl(product.images[0], "products") : "";
  const discount = discountPercent(product);
  const isDraft = product.status !== "active";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-glass) shadow-(--s-shadow-card) transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-[3px] hover:shadow-(--s-shadow-card-hover)",
        selected && "border-(--s-primary) shadow-[0_0_0_3px_var(--s-focus-soft)]",
      )}
    >
      <div className="relative aspect-[1/1.02] border-b border-(--s-line-soft) bg-(--s-surface)">
        <Link href={editHref} className="absolute inset-0 grid place-items-center" tabIndex={-1} aria-hidden>
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="(max-width: 720px) 50vw, 260px"
              className={cn("object-contain p-3.5 transition-[filter]", isDraft && "saturate-[.7]")}
            />
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs text-(--s-faint)">
              <ImageIcon className="size-8" aria-hidden="true" />
              {t("noImage")}
            </span>
          )}
        </Link>

        {discount > 0 && (
          <div className="pointer-events-none absolute end-2.5 top-2.5">
            <DiscountBadge percent={discount} />
          </div>
        )}

        <label
          className={cn(
            "absolute start-1 top-1 grid size-10 cursor-pointer place-items-center transition-opacity duration-150",
            selected || selecting
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100",
          )}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectedChange(checked === true)}
            aria-label={t("select", { title: product.title })}
            className="size-[26px] rounded-[9px] border-[1.5px] border-(--s-field-strong) bg-(--s-surface) shadow-none"
          />
        </label>

        {isDraft ? (
          <span className="pointer-events-none absolute start-2.5 bottom-2.5 rounded-full bg-(--s-body) px-2.5 py-0.5 text-[11px] font-bold text-(--s-surface)">
            {tPublish("draft")}
          </span>
        ) : (
          <div className="pointer-events-none absolute end-2.5 bottom-2.5">
            <StockBadge quantity={product.quantity} trackStock={product.trackStock} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 pb-3 min-[721px]:px-3.5">
        <span className="truncate text-xs text-(--s-faint)">{product.category?.name || "—"}</span>
        <h3 className="m-0 line-clamp-2 min-h-[44px] text-sm font-bold leading-[1.55] text-(--s-text) max-[720px]:text-[13px]">
          <Link href={editHref} title={product.title} className="hover:text-(--s-link)">
            {product.title}
          </Link>
        </h3>
        <ProductPrice product={product} />

        <div className="mt-2 flex items-center justify-between gap-1.5 border-t border-(--s-line-soft) pt-3">
          <ProductPublishSwitch productId={product.id} status={product.status} />
          <div className="flex items-center gap-1">
            <SellerButton asChild variant="mini" size="xs" className="rounded-[10px] px-2.5">
              <Link href={editHref}>
                <Pencil className="max-[720px]:hidden" aria-hidden />
                {t("edit")}
              </Link>
            </SellerButton>
            <ProductActionsMenu product={product} onDelete={onDelete} />
          </div>
        </div>
      </div>
    </article>
  );
}

/** A product as one row, for the list view on a phone. */
export function ProductPhoneRow({
  product,
  selected,
  onSelectedChange,
  onDelete,
}: {
  product: VendorProduct;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  onDelete: (product: VendorProduct) => void;
}) {
  const t = useTranslations("products.list");
  const editHref = `/products/${product.id}/edit`;
  const image = product.images?.[0] ? getPublicUrl(product.images[0], "products") : "";

  return (
    <li className={cn("flex items-start gap-2.5 p-3 [&+&]:border-t [&+&]:border-(--s-line-soft)", selected && "bg-(--s-tint)")}>
      <label className="grid size-10 shrink-0 cursor-pointer place-items-center">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelectedChange(checked === true)}
          aria-label={t("select", { title: product.title })}
          className="size-[22px] rounded-[7px] border-[1.5px] border-(--s-field-strong) bg-(--s-surface) shadow-none"
        />
      </label>
      <Link href={editHref} tabIndex={-1} aria-hidden className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-(--s-line) bg-(--s-fill)">
        {image ? <Image src={image} alt="" fill sizes="48px" className="object-contain p-1" /> : null}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Link href={editHref} className="truncate text-[13.5px] font-bold text-(--s-text)">
          {product.title}
        </Link>
        <span className="flex flex-wrap items-center justify-between gap-2">
          <ProductPrice product={product} />
          <StockBadge quantity={product.quantity} trackStock={product.trackStock} />
        </span>
        <ProductPublishSwitch productId={product.id} status={product.status} showLabel />
      </div>
      <ProductActionsMenu product={product} onDelete={onDelete} />
    </li>
  );
}
