"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, Printer, Truck } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { bostaLabelsUrl, canShipWithBosta } from "./bosta-ship.client";
import { shipWithBosta } from "./bosta-ship.server";
import type { SellerOrderRow } from "./orders.types";

/** Bosta prints at most 50 labels in one PDF. */
const LABELS_MAX = 50;

/**
 * Bulk Bosta actions for the orders on screen of one store (BS-12): send the
 * ones still to ship, and print the labels of the ones Bosta has not picked
 * up yet. Shipping runs one order at a time, so each keeps its own claim and
 * an address problem stops only that order.
 */
export function BostaBulkBar({ storeId, orders }: { storeId: string; orders: SellerOrderRow[] }) {
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
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E30613]/20 bg-[#E30613]/5 px-3 py-2">
      <Truck className="size-4 text-[#E30613]" aria-hidden />
      <span className="me-auto text-[13px] font-medium">{t("title")}</span>
      {toShip.length > 0 && (
        <Button size="sm" className="bg-[#E30613] text-white hover:bg-[#c00510]" disabled={isPending} onClick={() => setConfirming(true)}>
          {isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Truck className="size-4" aria-hidden />}
          {progress ? t("progress", progress) : t("ship", { count: toShip.length })}
        </Button>
      )}
      {printable.length > 0 && (
        <Button asChild size="sm" variant="outline">
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
            <Printer className="size-4" aria-hidden />
            {t("print", { count: printable.length })}
          </a>
        </Button>
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
    </div>
  );
}
