"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { saveQuantityOffers, type QuantityOfferRow } from "./quantity-offers.server";

type Draft = { key: number; minQuantity: string; discountType: "percent" | "fixed"; discountValue: string; isActive: boolean };

const MAX_TIERS = 6;

function toDrafts(rows: QuantityOfferRow[]): Draft[] {
  return rows.map((row, index) => ({
    key: index,
    minQuantity: String(row.minQuantity),
    discountType: row.discountType,
    discountValue: String(row.discountValue),
    isActive: row.isActive,
  }));
}

/** Quantity offers: "buy 2, save 10%", shown on this product's page on the seller's stores (ROADMAP.md F-07b). */
export function QuantityOffersSection({ productId, initial }: { productId: string; initial: QuantityOfferRow[] }) {
  const t = useTranslations("quantityOffers");
  const [tiers, setTiers] = useState<Draft[]>(() => toDrafts(initial));
  const [nextKey, setNextKey] = useState(initial.length);
  const [pending, startTransition] = useTransition();

  const patch = (key: number, change: Partial<Draft>) =>
    setTiers((rows) => rows.map((row) => (row.key === key ? { ...row, ...change } : row)));

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    setTiers((rows) => [
      ...rows,
      {
        key: nextKey,
        minQuantity: String(last ? Number(last.minQuantity) + 1 : 2),
        discountType: "percent",
        discountValue: last?.discountType === "percent" ? String(Math.min(90, Number(last.discountValue) + 10)) : "10",
        isActive: true,
      },
    ]);
    setNextKey((key) => key + 1);
  };

  const save = () =>
    startTransition(async () => {
      const result = await saveQuantityOffers({
        productId,
        tiers: tiers.map((tier) => ({
          minQuantity: Number(tier.minQuantity),
          discountType: tier.discountType,
          discountValue: Number(tier.discountValue),
          isActive: tier.isActive,
        })),
      });
      if (result.success) {
        setTiers(toDrafts(result.tiers));
        setNextKey(result.tiers.length);
        toast.success(t("saved"));
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });

  return (
    <section className="mx-auto mt-5 w-full max-w-5xl rounded-2xl border bg-card p-4 sm:p-5">
      <h2 className="font-semibold">{t("title")}</h2>
      <p className="mt-1 text-pretty text-sm text-muted-foreground">{t("description")}</p>

      {tiers.length > 0 && (
        <ul className="mt-3 space-y-2">
          {tiers.map((tier) => (
            <li key={tier.key} className="grid grid-cols-[88px_minmax(0,1fr)_88px_auto_auto] items-center gap-2">
              <Input
                aria-label={t("quantity")}
                placeholder={t("quantity")}
                inputMode="numeric"
                dir="ltr"
                value={tier.minQuantity}
                onChange={(event) => patch(tier.key, { minQuantity: event.target.value })}
              />
              <select
                aria-label={t("discountType")}
                className="h-10 min-w-0 rounded-[10px] border bg-background px-2 text-sm"
                value={tier.discountType}
                onChange={(event) => patch(tier.key, { discountType: event.target.value === "fixed" ? "fixed" : "percent" })}
              >
                <option value="percent">{t("percent")}</option>
                <option value="fixed">{t("fixed")}</option>
              </select>
              <Input
                aria-label={t("discountValue")}
                inputMode="decimal"
                dir="ltr"
                value={tier.discountValue}
                onChange={(event) => patch(tier.key, { discountValue: event.target.value })}
              />
              <Switch aria-label={t("active")} checked={tier.isActive} onCheckedChange={(isActive) => patch(tier.key, { isActive })} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("remove")}
                onClick={() => setTiers((rows) => rows.filter((row) => row.key !== tier.key))}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={tiers.length >= MAX_TIERS} onClick={addTier}>
          <Plus className="size-4" aria-hidden />
          {t("add")}
        </Button>
        <Button type="button" disabled={pending} onClick={save}>
          {t("save")}
        </Button>
      </div>
    </section>
  );
}
