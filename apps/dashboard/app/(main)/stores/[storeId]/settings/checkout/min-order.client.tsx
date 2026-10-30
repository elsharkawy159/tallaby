"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { StoreMinOrder } from "@workspace/lib/stores/min-order";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { saveStoreMinOrder } from "./min-order.server";

function toEgpText(piastres: number): string {
  if (!piastres) return "";
  return piastres % 100 === 0 ? String(piastres / 100) : (piastres / 100).toFixed(2);
}

/**
 * Store settings › Checkout › Minimum order (ROADMAP.md F-13b): an on/off
 * switch and the amount in EGP. The store website's cart and checkout show
 * "add X more" and the order is refused on the server below it.
 */
export function StoreMinOrderForm({
  storeId,
  initial,
  readOnly,
}: {
  storeId: string;
  initial: StoreMinOrder;
  readOnly: boolean;
}) {
  const t = useTranslations("storeMinOrder");
  const [enabled, setEnabled] = useState(initial.enabled);
  const [amount, setAmount] = useState(toEgpText(initial.amountPiastres));
  const [isPending, startTransition] = useTransition();
  const disabled = readOnly || isPending;

  const save = () => {
    startTransition(async () => {
      const result = await saveStoreMinOrder(storeId, { enabled, amount });
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setEnabled(result.minOrder.enabled);
      setAmount(toEgpText(result.minOrder.amountPiastres));
      toast.success(t("saved"));
    });
  };

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Switch checked={enabled} disabled={disabled} onCheckedChange={setEnabled} aria-label={t("enabled")} />
      </div>

      {enabled && (
        <div className="max-w-xs space-y-1">
          <Label htmlFor="store-min-order-amount">{t("amountLabel")}</Label>
          <Input
            id="store-min-order-amount"
            inputMode="decimal"
            dir="ltr"
            maxLength={12}
            value={amount}
            disabled={disabled}
            placeholder={t("amountPlaceholder")}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t("amountHint")}</p>
        </div>
      )}

      <Button type="button" variant="outline" disabled={disabled} onClick={save}>
        {t("save")}
      </Button>
    </section>
  );
}
