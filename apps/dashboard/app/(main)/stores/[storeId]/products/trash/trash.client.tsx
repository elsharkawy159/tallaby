"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { EmptyState, PageHeader, Row, Rows, SellerButton, TextAction } from "@/components/seller-ui";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { trashDaysLeft } from "@workspace/lib/products/trash";
import type { TrashedProduct } from "@workspace/lib/products/trash/server";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { formatDateTime, formatNumber } from "@/lib/i18n/format";
import { cn, getPublicUrl } from "@/lib/utils";
import { deleteProductsForeverAction, restoreProductsAction } from "./trash.server";
import { useProductStoreId, useProductsHref } from "@/app/(main)/stores/[storeId]/products/_components/product-store.client";

/**
 * Products in Trash: each waits 30 days, then the daily job deletes it. The
 * seller restores it as it was, or deletes it for good now.
 */
export function ProductTrash({ items }: { items: TrashedProduct[] }) {
  const t = useTranslations("products.trash");
  const productStoreId = useProductStoreId();
  const productsHref = useProductsHref();
  const locale = useLocale();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<string[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleSelected = items.filter((p) => selected.has(p.id)).map((p) => p.id);
  const allSelected = items.length > 0 && visibleSelected.length === items.length;
  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const restore = (ids: string[]) =>
    startTransition(async () => {
      const res = await restoreProductsAction(productStoreId, ids);
      if (!res.success) {
        toast.error(t("restoreFailed"));
        return;
      }
      toast.success(t("restored", { count: res.count }));
      setSelected(new Set());
      router.refresh();
    });

  const deleteForever = (ids: string[]) =>
    startTransition(async () => {
      const res = await deleteProductsForeverAction(productStoreId, ids);
      if (!res.success) {
        toast.error(t("deleteFailed"));
        return;
      }
      toast.success(t("deleted", { count: res.count }));
      setConfirming(null);
      setSelected(new Set());
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <TextAction asChild className="w-fit">
          <Link href={productsHref()}>
            <ArrowLeft className="rtl:rotate-180" aria-hidden />
            {t("back")}
          </Link>
        </TextAction>
        <PageHeader title={t("pageTitle")} description={t("subtitle")} />
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Trash2} title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-h-10 cursor-pointer items-center gap-2 text-[13px] font-semibold text-(--s-muted)">
              <Checkbox
                checked={allSelected ? true : visibleSelected.length > 0 ? "indeterminate" : false}
                onCheckedChange={(value) => setSelected(value === true ? new Set(items.map((p) => p.id)) : new Set())}
              />
              {t("selectAll", { count: items.length })}
            </label>
            {visibleSelected.length > 0 && (
              <div className="ms-auto flex flex-wrap gap-2 max-[600px]:ms-0 max-[600px]:w-full">
                <SellerButton variant="outline" size="sm" className="max-[600px]:flex-1" disabled={isPending} onClick={() => restore(visibleSelected)}>
                  <RotateCcw aria-hidden />
                  {t("restoreCount", { count: visibleSelected.length })}
                </SellerButton>
                <SellerButton variant="danger" size="sm" className="max-[600px]:flex-1" disabled={isPending} onClick={() => setConfirming(visibleSelected)}>
                  <Trash2 aria-hidden />
                  {t("deleteCount", { count: visibleSelected.length })}
                </SellerButton>
              </div>
            )}
          </div>

          <Rows>
            {items.map((item) => {
              const daysLeft = trashDaysLeft(item.deletedAt);
              const title = item.title || t("untitled");
              return (
                <Row key={item.id} className="flex-wrap min-[721px]:flex-nowrap">
                  <label className="-ms-2 grid size-10 shrink-0 cursor-pointer place-items-center">
                    <Checkbox
                      checked={selected.has(item.id)}
                      onCheckedChange={(value) => toggle(item.id, value === true)}
                      aria-label={t("select", { title })}
                    />
                  </label>
                  {item.image ? (
                    <Image
                      src={getPublicUrl(item.image, "products")}
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
                    <p className="text-xs text-(--s-subtle)">
                      {t("deletedOn", { date: formatDateTime(item.deletedAt, locale) })}
                      {" · "}
                      <span className={cn(daysLeft <= 3 && "font-semibold text-destructive")}>
                        {t("daysLeft", { count: daysLeft, days: formatNumber(daysLeft, locale) })}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 max-[720px]:w-full">
                    <SellerButton variant="mini" size="sm" className="max-[720px]:flex-1" disabled={isPending} onClick={() => restore([item.id])}>
                      <RotateCcw aria-hidden />
                      {t("restore")}
                    </SellerButton>
                    <SellerButton variant="mini" size="sm" className="text-destructive max-[720px]:flex-1 [&_svg]:text-destructive" disabled={isPending} onClick={() => setConfirming([item.id])}>
                      <Trash2 aria-hidden />
                      {t("deleteForever")}
                    </SellerButton>
                  </div>
                </Row>
              );
            })}
          </Rows>
        </>
      )}

      <ConfirmActionDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && !isPending && setConfirming(null)}
        title={t("confirmTitle", { count: confirming?.length ?? 0 })}
        description={t("confirmDescription")}
        confirmLabel={t("deleteForever")}
        cancelLabel={t("cancel")}
        destructive
        pending={isPending}
        onConfirm={() => confirming && deleteForever(confirming)}
      />
    </div>
  );
}
