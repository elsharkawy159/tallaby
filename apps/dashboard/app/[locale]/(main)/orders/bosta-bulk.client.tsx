"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, Printer, Truck } from "lucide-react";

import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { SellerButton, SellerCard } from "@/components/seller-ui";
import { bostaLabelsUrl, canShipWithBosta } from "./bosta-ship.client";
import { shipWithBosta } from "./bosta-ship.server";
import type { OrderSummary } from "./orders.types";
import { BOSTA_BUTTON } from "./orders-ui";

/** Bosta prints at most 50 labels in one PDF. */
const LABELS_MAX = 50;

/**
 * Bulk Bosta actions for one store's waiting orders under the current filters,
 * on any page (BS-12): send the ones still to ship, and print the labels of the
 * ones Bosta has not picked up yet. Shipping runs one order at a time, so each
 * keeps its own claim and an address problem stops only that order.
 */
export function BostaBulkBar({ storeId, orders }: { storeId: string; orders: OrderSummary[] }) {
  const t = useTranslations("orders.bosta.bulk");
  const locale = useLocale();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const mine = orders.filter((o) => o.storeId === storeId && o.bostaConnected);
  const toShip = mine.filter(canShipWithBosta);
  const printable = mine.filter((o) => o.bosta?.trackingNumber && o.flow.stage === "to_ship").slice(0, LABELS_MAX);
  if (toShip.length === 0 && printable.length === 0) return null;

  const shipAll = () =>
    startTransition(async () => {
      let shipped = 0;
      let failed = 0;
      setProgress({ done: 0, total: toShip.length });
      for (const [index, order] of toShip.entries()) {
        const result = await shipWithBosta(storeId, order.id);
        if (result.success) shipped += 1;
        else failed += 1;
        setProgress({ done: index + 1, total: toShip.length });
      }
      setProgress(null);
      setConfirming(false);
      if (failed) toast.warning(t("partial", { shipped, failed }));
      else toast.success(t("done", { shipped }));
      router.refresh();
    });

  return (
    <SellerCard className="flex flex-wrap items-center gap-2 px-4 py-3">
      <Truck className="size-4 shrink-0 text-[#E30613]" aria-hidden />
      <span className="me-auto min-w-0 text-[13px] font-semibold text-(--s-text)">{t("title")}</span>
      {toShip.length > 0 && (
        <SellerButton variant="solid" size="sm" className={BOSTA_BUTTON} disabled={isPending} onClick={() => setConfirming(true)}>
          {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Truck aria-hidden />}
          {progress ? t("progress", progress) : t("ship", { count: toShip.length })}
        </SellerButton>
      )}
      {printable.length > 0 && (
        <SellerButton asChild variant="outline" size="sm">
          <a
            href={bostaLabelsUrl(
              storeId,
              printable.map((o) => o.id),
              "A6",
              locale,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Printer aria-hidden />
            {t("print", { count: printable.length })}
          </a>
        </SellerButton>
      )}
      <ConfirmActionDialog
        open={confirming}
        onOpenChange={(open) => !open && !isPending && setConfirming(false)}
        title={t("confirmTitle", { count: toShip.length })}
        description={t("confirmDescription")}
        confirmLabel={t("ship", { count: toShip.length })}
        cancelLabel={t("back")}
        pending={isPending}
        onConfirm={shipAll}
      />
    </SellerCard>
  );
}
