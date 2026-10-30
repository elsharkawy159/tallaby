"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { trashDaysLeft } from "@workspace/lib/products/trash";
import type { TrashedProduct } from "@workspace/lib/products/trash/server";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { formatDateTime, formatNumber } from "@/lib/i18n/format";
import { cn, getPublicUrl } from "@/lib/utils";
import { deleteProductsForeverAction, restoreProductsAction } from "./trash.server";

/**
 * Products in Trash: each waits 30 days, then the daily job deletes it. The
 * seller restores it as it was, or deletes it for good now.
 */
export function ProductTrash({ items }: { items: TrashedProduct[] }) {
  const t = useTranslations("products.trash");
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
      const res = await restoreProductsAction(ids);
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
      const res = await deleteProductsForeverAction(ids);
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
      <div className="min-w-0">
        <Link href="/products" className="mb-1 inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
          {t("back")}
        </Link>
        <h1 className="text-xl font-bold">{t("pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-input bg-card px-5 py-14 text-center text-[13px] text-muted-foreground">
          <span className="mb-1 grid size-12 place-items-center rounded-xl bg-primary-soft text-primary-ink">
            <Trash2 className="size-5" aria-hidden />
          </span>
          <b className="text-[15px] text-foreground">{t("emptyTitle")}</b>
          <span>{t("emptyDescription")}</span>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
              <Checkbox
                checked={allSelected ? true : visibleSelected.length > 0 ? "indeterminate" : false}
                onCheckedChange={(value) => setSelected(value === true ? new Set(items.map((p) => p.id)) : new Set())}
              />
              {t("selectAll", { count: items.length })}
            </label>
            {visibleSelected.length > 0 && (
              <div className="ms-auto flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => restore(visibleSelected)}>
                  <RotateCcw className="size-4" aria-hidden />
                  {t("restoreCount", { count: visibleSelected.length })}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={isPending}
                  onClick={() => setConfirming(visibleSelected)}
                >
                  <Trash2 className="size-4" aria-hidden />
                  {t("deleteCount", { count: visibleSelected.length })}
                </Button>
              </div>
            )}
          </div>

          <ul className="divide-y rounded-2xl border bg-card">
            {items.map((item) => {
              const daysLeft = trashDaysLeft(item.deletedAt);
              const title = item.title || t("untitled");
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
                  <Checkbox
                    checked={selected.has(item.id)}
                    onCheckedChange={(value) => toggle(item.id, value === true)}
                    aria-label={t("select", { title })}
                  />
                  {item.image ? (
                    <Image
                      src={getPublicUrl(item.image, "products")}
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
                    <p className="text-xs text-muted-foreground">
                      {t("deletedOn", { date: formatDateTime(item.deletedAt, locale) })}
                      {" · "}
                      <span className={cn(daysLeft <= 3 && "font-semibold text-destructive")}>
                        {t("daysLeft", { count: daysLeft, days: formatNumber(daysLeft, locale) })}
                      </span>
                    </p>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button size="sm" variant="outline" className="flex-1 sm:flex-none" disabled={isPending} onClick={() => restore([item.id])}>
                      <RotateCcw className="size-4" aria-hidden />
                      {t("restore")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-destructive hover:text-destructive sm:flex-none"
                      disabled={isPending}
                      onClick={() => setConfirming([item.id])}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      {t("deleteForever")}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
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
