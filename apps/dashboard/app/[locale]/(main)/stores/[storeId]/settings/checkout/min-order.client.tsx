"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";

import type { StoreMinOrder } from "@workspace/lib/stores/min-order";
import { Field, InputGroup, SectionCard, Toggle } from "@/components/seller-ui";
import { moneyParams, moneyUnitText, type MoneyUnit } from "@/lib/i18n/format";
import { saveStoreMinOrder } from "./min-order.server";

function toEgpText(piastres: number): string {
  if (!piastres) return "";
  return piastres % 100 === 0 ? String(piastres / 100) : (piastres / 100).toFixed(2);
}

/** The minimum order's state; saved by the checkout page's single save bar. */
export function useStoreMinOrder(storeId: string, money: MoneyUnit, initial: StoreMinOrder) {
  const t = useTranslations("storeMinOrder");
  const params = moneyParams(useLocale(), money);
  const [saved, setSaved] = useState({ enabled: initial.enabled, amount: toEgpText(initial.amountPiastres) });
  const [enabled, setEnabled] = useState(saved.enabled);
  const [amount, setAmount] = useState(saved.amount);
  const dirty = enabled !== saved.enabled || amount !== saved.amount;

  /** Saves when dirty; returns an error message or null. */
  const save = async () => {
    if (!dirty) return null;
    const result = await saveStoreMinOrder(storeId, { enabled, amount });
    if (!result.success) return t(`errors.${result.error}`, params);
    const next = { enabled: result.minOrder.enabled, amount: toEgpText(result.minOrder.amountPiastres) };
    setSaved(next);
    setEnabled(next.enabled);
    setAmount(next.amount);
    return null;
  };

  const reset = () => {
    setEnabled(saved.enabled);
    setAmount(saved.amount);
  };

  return { enabled, setEnabled, amount, setAmount, dirty, save, reset };
}

/**
 * Store settings › Checkout › Minimum order (ROADMAP.md F-13b): an on/off
 * switch and the amount in the store's currency. The store website's cart and checkout show
 * "add X more" and the order is refused on the server below it.
 */
export function StoreMinOrderCard({
  money,
  state,
  disabled,
}: {
  money: MoneyUnit;
  state: ReturnType<typeof useStoreMinOrder>;
  disabled: boolean;
}) {
  const t = useTranslations("storeMinOrder");
  const locale = useLocale();
  const params = moneyParams(locale, money);

  return (
    <SectionCard
      icon={ShoppingCart}
      title={t("title")}
      description={t("description")}
      action={<Toggle className="max-[600px]:min-h-10" checked={state.enabled} disabled={disabled} onCheckedChange={state.setEnabled} aria-label={t("enabled")} />}
    >
      {state.enabled && (
        <Field label={t("amountLabel", params)} htmlFor="store-min-order-amount" note={t("amountHint")} className="max-w-[320px]">
          <InputGroup
            id="store-min-order-amount"
            inputMode="decimal"
            dir="ltr"
            maxLength={12}
            end={moneyUnitText(locale, money)}
            inputClassName="font-montserrat"
            value={state.amount}
            disabled={disabled}
            placeholder={t("amountPlaceholder")}
            onChange={(e) => state.setAmount(e.target.value)}
          />
        </Field>
      )}
    </SectionCard>
  );
}
