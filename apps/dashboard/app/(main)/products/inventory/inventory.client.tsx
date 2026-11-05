"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, BellRing, Boxes, History, PackagePlus, Pencil, X } from "lucide-react";
import { EmptyState, PageHeader, Row, Rows, SellerButton, SellerCard, StatusBadge, TextAction, TextInput } from "@/components/seller-ui";
import { formatDateTime, formatNumber } from "@/lib/i18n/format";
import { getPublicUrl } from "@/lib/utils";
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
    <div className="flex flex-col gap-5 max-[600px]:gap-3.5">
      <div className="flex flex-col gap-1">
        <TextAction asChild className="w-fit">
          <Link href="/products">
            <ArrowLeft className="rtl:rotate-180" aria-hidden />
            {t("back")}
          </Link>
        </TextAction>
        <PageHeader title={t("pageTitle")} description={t("subtitle")} />
      </div>

      {selected && <ProductHistory product={selected} />}

      <section className="flex flex-col gap-2.5" aria-labelledby="low-stock-title">
        <h2 id="low-stock-title" className="text-[16.5px] font-bold text-(--s-ink)">
          {t("lowStockTitle", { count: lowStock.length })}
        </h2>
        {lowStock.length === 0 ? (
          <EmptyState icon={Boxes} title={t("emptyTitle")} description={t("emptyDescription")} />
        ) : (
          <Rows>
            {lowStock.map((line) => (
              <LineRow key={`${line.productId}:${line.variantId ?? ""}`} line={line} showHistoryLink />
            ))}
          </Rows>
        )}
      </section>
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
    <StatusBadge tone={level === "out" ? "danger" : level === "low" ? "warning" : "success"}>
      {level === "out" ? t("outOfStock") : t("inStock", { count: stock, stock: formatNumber(stock, locale) })}
    </StatusBadge>
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
    <Row className="flex-wrap min-[721px]:flex-nowrap">
      {line.image ? (
        <Image
          src={getPublicUrl(line.image, "products")}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-xl border border-(--s-line) object-cover"
        />
      ) : (
        <div className="size-12 shrink-0 rounded-xl border border-(--s-line) bg-(--s-fill)" />
      )}
      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate text-sm font-bold text-(--s-text)">{title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-(--s-subtle)">
          <StockPill stock={line.stock} threshold={line.threshold} />
          <span>{t("threshold", { threshold: formatNumber(line.threshold, locale) })}</span>
          {line.waiting > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold text-(--s-link)" title={t("waitingHint")}>
              <BellRing className="size-3.5" aria-hidden />
              {t("waiting", { count: line.waiting, n: formatNumber(line.waiting, locale) })}
            </span>
          )}
          {showHistoryLink && (
            <Link
              href={`/products/inventory?product=${encodeURIComponent(line.productId)}`}
              className="inline-flex min-h-8 items-center gap-1 font-semibold text-(--s-link) hover:underline"
            >
              <History className="size-3.5" aria-hidden />
              {t("history")}
            </Link>
          )}
        </div>
      </div>
      <form
        className="flex items-center gap-2 max-[720px]:w-full"
        onSubmit={(e) => {
          e.preventDefault();
          restock();
        }}
      >
        <TextInput
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_RESTOCK}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("addPlaceholder")}
          aria-label={t("addLabel", { title })}
          className="h-10 w-24 font-montserrat tabular-nums max-[720px]:flex-1"
        />
        <SellerButton type="submit" variant="mini" size="sm" className="h-10" disabled={!valid || isPending}>
          <PackagePlus aria-hidden />
          {t("restock")}
        </SellerButton>
      </form>
    </Row>
  );
}

function ProductHistory({ product }: { product: ProductInventory }) {
  const t = useTranslations("products.inventory");
  const title = product.title || t("untitled");

  return (
    <SellerCard className="flex flex-col gap-3 p-[22px] max-[600px]:p-4" aria-label={t("historyFor")}>
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1 basis-40">
          <p className="text-xs text-(--s-subtle)">{t("historyFor")}</p>
          <h2 className="truncate text-[16.5px] font-bold text-(--s-ink)">{title}</h2>
        </div>
        <SellerButton asChild variant="mini" size="sm">
          <Link href={`/products/${encodeURIComponent(product.productId)}/edit`}>
            <Pencil aria-hidden />
            {t("editProduct")}
          </Link>
        </SellerButton>
        <SellerButton asChild variant="mini" size="sm" className="w-9 px-0 max-[600px]:w-10">
          <Link href="/products/inventory" aria-label={t("closeHistory")}>
            <X aria-hidden />
          </Link>
        </SellerButton>
      </div>

      {product.lines.length === 0 ? (
        <p className="text-sm text-(--s-muted)">{t("untracked")}</p>
      ) : (
        <Rows>
          {product.lines.map((line) => (
            <LineRow key={`${line.productId}:${line.variantId ?? ""}`} line={line} />
          ))}
        </Rows>
      )}

      {product.history.length === 0 ? (
        <p className="text-sm text-(--s-muted)">{t("noHistory")}</p>
      ) : (
        <Rows>
          {product.history.map((row) => (
            <MovementRow key={row.id} row={row} />
          ))}
        </Rows>
      )}
    </SellerCard>
  );
}

function MovementRow({ row }: { row: StockMovementRow }) {
  const t = useTranslations("products.inventory");
  const locale = useLocale();
  const positive = row.delta > 0;
  return (
    <Row
      start={
        <span
          className={positive ? "w-14 shrink-0 text-center font-montserrat text-sm font-bold tabular-nums text-success" : "w-14 shrink-0 text-center font-montserrat text-sm font-bold tabular-nums text-destructive"}
          dir="ltr"
        >
          {positive ? "+" : "−"}
          {formatNumber(Math.abs(row.delta), locale)}
        </span>
      }
      end={<span className="text-xs text-(--s-subtle)">{t("after", { stock: formatNumber(row.stockAfter, locale) })}</span>}
    >
      <p className="truncate text-[13.5px] text-(--s-text)">
        {t(`reasons.${row.reason}`)}
        {row.variantTitle && <span className="text-(--s-subtle)"> · {row.variantTitle}</span>}
        {row.orderId && (
          <>
            {" · "}
            <Link href={`/orders?order=${encodeURIComponent(row.orderId)}`} className="text-(--s-link) hover:underline">
              {row.orderNumber ? t("order", { number: row.orderNumber }) : t("orderNoNumber")}
            </Link>
          </>
        )}
      </p>
      <p className="text-xs text-(--s-subtle)">
        {formatDateTime(row.createdAt, locale)}
        {row.bySeller && ` · ${t("byYou")}`}
      </p>
    </Row>
  );
}
