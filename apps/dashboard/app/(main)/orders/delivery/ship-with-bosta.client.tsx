"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ExternalLink, LoaderCircle, Package, Plug } from "lucide-react";
import { bostaTrackingUrl } from "@workspace/lib/integrations";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { formatMoney } from "@/lib/i18n/format";
import type { ShippingOrderRow } from "@/lib/shipping/shipping.types";
import { shipWithBosta } from "./bosta.server";

/**
 * "Ship with Bosta": confirms the address and the cash Bosta will collect, then
 * creates the Bosta delivery. Without a Bosta connection it points the seller
 * to the store's Apps page instead.
 */
export function ShipWithBostaButton({
  row,
  variant = "default",
}: {
  row: ShippingOrderRow;
  variant?: "default" | "outline";
}) {
  const t = useTranslations("shipping.bosta");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ship = () =>
    startTransition(async () => {
      const result = await shipWithBosta(row.id);
      if (!result.success) {
        const text = t(`errors.${result.error}`);
        setError(result.message ? `${text} (${result.message})` : text);
        return;
      }
      toast.success(
        result.data.alreadyShipped
          ? t("alreadyShipped", { tracking: result.data.trackingNumber })
          : t("shipped", { tracking: result.data.trackingNumber })
      );
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <Button
        size="sm"
        variant={variant}
        className={variant === "default" ? "bg-[#E30613] text-white hover:bg-[#c00510]" : undefined}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Package className="me-1.5 h-3.5 w-3.5" />
        {t("button")}
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && !isPending && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("title", { number: row.orderNumber })}</DialogTitle>
            <DialogDescription>{row.bostaConnected ? t("description") : t("connectFirst")}</DialogDescription>
          </DialogHeader>

          {row.bostaConnected && (
            <dl className="space-y-2 rounded-lg border p-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("receiver")}</dt>
                <dd className="text-end font-medium">
                  {row.customerName}
                  {row.customerPhone && (
                    <span dir="ltr" className="block text-xs font-normal text-muted-foreground">
                      {row.customerPhone}
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("address")}</dt>
                <dd className="text-end">{[row.addressLine, row.city].filter(Boolean).join(", ") || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("cod")}</dt>
                <dd className="text-end font-semibold tabular-nums">
                  {row.codDue > 0 ? formatMoney(row.codDue, locale) : t("prepaid")}
                </dd>
              </div>
            </dl>
          )}

          {error && <p className="text-sm text-destructive" dir="auto">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              {t("cancel")}
            </Button>
            {row.bostaConnected ? (
              <Button onClick={ship} disabled={isPending}>
                {isPending && <LoaderCircle className="me-1.5 h-4 w-4 animate-spin" />}
                {t("confirm")}
              </Button>
            ) : row.bostaStoreId ? (
              <Button asChild>
                <Link href={`/stores/${row.bostaStoreId}/apps?app=bosta`}>
                  <Plug className="me-1.5 h-4 w-4" />
                  {t("connect")}
                </Link>
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** "Bosta · 123456789" with a link to Bosta's public tracking page. */
export function BostaTracking({ trackingNumber }: { trackingNumber: string }) {
  const t = useTranslations("shipping.bosta");
  const url = bostaTrackingUrl(trackingNumber);
  return (
    <div className="text-sm">
      <span className="font-medium">{t("carrier")}</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {trackingNumber}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span dir="ltr" className="block text-xs text-muted-foreground">
          {trackingNumber}
        </span>
      )}
    </div>
  );
}
