"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, BellRing, Boxes, History, PackagePlus, Pencil, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { formatDateTime, formatNumber } from "@/lib/i18n/format";
import { cn, getPublicUrl } from "@/lib/utils";
import { MAX_RESTOCK, stockLevel } from "./inventory.lib";
import { restockAction } from "./inventory.server";
import type { InventoryLine, ProductInventory, StockMovementRow } from "./inventory.types";

/**
 * Products › Inventory: what is low or out of stock, a quick "+N" restock per
 * line, and one product's stock history (`?product=<id>`, also opened from
 * the low_stock bell alert and the product edit page).
 */
export function InventoryPage({ lowStock, selected }: { lowStock: InventoryLine[]; selected: ProductInventory | null }) {
  const t = useTranslations("products.inventory");

  return (
    <div className="flex flex-col gap-5">
      <div className="min-w-0">
        <Link href="/products" className="mb-1 inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
          {t("back")}
        </Link>
        <h1 className="text-xl font-bold">{t("pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {selected && <ProductHistory product={selected} />}

      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">{t("lowStockTitle", { count: lowStock.length })}</h2>
        {lowStock.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-input bg-card px-5 py-14 text-center text-[13px] text-muted-foreground">
            <span className="mb-1 grid size-12 place-items-center rounded-xl bg-primary-soft text-primary-ink">
              <Boxes className="size-5" aria-hidden />
            </span>
            <b className="text-[15px] text-foreground">{t("emptyTitle")}</b>
            <span>{t("emptyDescription")}</span>
          </div>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card">
            {lowStock.map((line) => (
              <LineRow key={`${line.productId}:${line.variantId ?? ""}`} line={line} showHistoryLink />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function lineTitle(line: InventoryLine, untitled: string) {
  const title = line.title || untitled;
  return line.variantTitle ? `${title} · ${line.variantTitle}` : title;
}

function StockPill({ stock, threshold }: { stock: number; threshold: number }) {
  const t = useTranslations("products.inventory");
  const locale = useLocale();
  const level = stockLevel(stock, threshold);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        level === "out" && "bg-destructive/10 text-destructive",
        level === "low" && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        level === "ok" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
      )}
    >
      {level === "out" ? t("outOfStock") : t("inStock", { count: stock, stock: formatNumber(stock, locale) })}
    </span>
  );
}

function LineRow({ line, showHistoryLink }: { line: InventoryLine; showHistoryLink?: boolean }) {
  const t = useTranslations("products.inventory");
  const locale = useLocale();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const title = lineTitle(line, t("untitled"));

  const add = Number(amount);
  const valid = Number.isInteger(add) && add >= 1 && add <= MAX_RESTOCK;

  const restock = () => {
    if (!valid) return;
    startTransition(async () => {
      const res = await restockAction({ productId: line.productId, variantId: line.variantId, add });
      if (!res.success) {
        toast.error(t(res.error === "readOnly" ? "readOnly" : res.error === "notFound" ? "notFound" : "restockFailed"));
        return;
      }
      toast.success(t("restocked", { title, stock: formatNumber(res.stock, locale) }));
      setAmount("");
      router.refresh();
    });
  };

  return (
    <li className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
      {line.image ? (
        <Image
          src={getPublicUrl(line.image, "products")}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-lg border object-cover"
        />
      ) : (
        <div className="size-12 shrink-0 rounded-lg border bg-muted" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <StockPill stock={line.stock} threshold={line.threshold} />
          <span>{t("threshold", { threshold: formatNumber(line.threshold, locale) })}</span>
          {line.waiting > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-primary" title={t("waitingHint")}>
              <BellRing className="size-3.5" aria-hidden />
              {t("waiting", { count: line.waiting, n: formatNumber(line.waiting, locale) })}
            </span>
          )}
          {showHistoryLink && (
            <Link
              href={`/products/inventory?product=${encodeURIComponent(line.productId)}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <History className="size-3.5" aria-hidden />
              {t("history")}
            </Link>
          )}
        </div>
      </div>
      <form
        className="flex w-full items-center gap-2 sm:w-auto"
        onSubmit={(e) => {
          e.preventDefault();
          restock();
        }}
      >
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_RESTOCK}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("addPlaceholder")}
          aria-label={t("addLabel", { title })}
          className="h-9 w-full sm:w-24"
        />
        <Button type="submit" size="sm" variant="outline" disabled={!valid || isPending}>
          <PackagePlus className="size-4" aria-hidden />
          {t("restock")}
        </Button>
      </form>
    </li>
  );
}

function ProductHistory({ product }: { product: ProductInventory }) {
  const t = useTranslations("products.inventory");
  const title = product.title || t("untitled");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{t("historyFor")}</p>
          <h2 className="truncate text-base font-semibold">{title}</h2>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/products/${encodeURIComponent(product.productId)}/edit`}>
            <Pencil className="size-4" aria-hidden />
            {t("editProduct")}
          </Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href="/products/inventory" aria-label={t("closeHistory")}>
            <X className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>

      {product.lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("untracked")}</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {product.lines.map((line) => (
            <LineRow key={`${line.productId}:${line.variantId ?? ""}`} line={line} />
          ))}
        </ul>
      )}

      {product.history.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noHistory")}</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {product.history.map((row) => (
            <MovementRow key={row.id} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}

function MovementRow({ row }: { row: StockMovementRow }) {
  const t = useTranslations("products.inventory");
  const locale = useLocale();
  const positive = row.delta > 0;
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 text-sm">
      <span
        className={cn(
          "w-16 shrink-0 text-center font-semibold tabular-nums",
          positive ? "text-emerald-700 dark:text-emerald-300" : "text-destructive",
        )}
        dir="ltr"
      >
        {positive ? "+" : "−"}
        {formatNumber(Math.abs(row.delta), locale)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate">
          {t(`reasons.${row.reason}`)}
          {row.variantTitle && <span className="text-muted-foreground"> · {row.variantTitle}</span>}
          {row.orderId && (
            <>
              {" · "}
              <Link href={`/orders?order=${encodeURIComponent(row.orderId)}`} className="text-primary hover:underline">
                {row.orderNumber ? t("order", { number: row.orderNumber }) : t("orderNoNumber")}
              </Link>
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(row.createdAt, locale)}
          {row.bySeller && ` · ${t("byYou")}`}
        </p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {t("after", { stock: formatNumber(row.stockAfter, locale) })}
      </span>
    </li>
  );
}
