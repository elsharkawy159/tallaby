"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { PriceRoundingRule } from "@workspace/lib/products/price-rounding";
import { SaveBar } from "@/components/seller-ui";
import { useRouter } from "@/i18n/navigation";
import type { MoneyUnit } from "@/lib/i18n/format";
import { StorePriceRoundingCard, useStorePriceRounding } from "../../../settings/price-rounding.client";

/**
 * Store › Apps › Round prices (F-112, owner 2026-11-27). The same card that
 * was in Store settings › General, with its own save bar here. The rule and
 * its server action are unchanged (`stores.settings.priceRounding`).
 */
export function PriceRoundingApp({
  storeId,
  money,
  initial,
  readOnly,
}: {
  storeId: string;
  money: MoneyUnit;
  initial: PriceRoundingRule | null;
  readOnly: boolean;
}) {
  const t = useTranslations("storePriceRounding");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const state = useStorePriceRounding(storeId, initial);

  const save = () =>
    startTransition(async () => {
      const invalid = state.validate();
      if (invalid) {
        toast.error(invalid);
        return;
      }
      const error = await state.save();
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(t("saved"));
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-5">
      <StorePriceRoundingCard money={money} state={state} disabled={readOnly || isPending} />
      {!readOnly && <SaveBar dirty={state.dirty} saving={isPending} onSave={save} onDiscard={state.reset} />}
    </div>
  );
}
