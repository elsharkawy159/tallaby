"use client";

import { useLocale, useTranslations } from "next-intl";
import type { PriceRoundingRule } from "@workspace/lib/products/price-rounding";
import { Link } from "@/i18n/navigation";
import { useAccountMoney } from "@/components/account-money.client";
import { MoneyText } from "@/components/money";
import { formatMoneyMarked } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { useProductStoreId } from "../../_components/product-store.client";
import { priceRoundingHint } from "./price-rounding-hint.lib";

/**
 * Under a price input (ROADMAP.md F-112b): when the store rounds prices on
 * save and the typed price (or sale price) will change, says what will be
 * saved, or that the discount will be removed, with a link to the setting.
 * Nothing when the rule is off or nothing changes.
 */
export function PriceRoundingHint({
  list,
  final,
  rule,
  className,
}: {
  list: unknown;
  /** The sale price when the discount is on; anything not below `list` = no discount. */
  final?: unknown;
  rule: PriceRoundingRule | null | undefined;
  className?: string;
}) {
  const t = useTranslations("productForm.priceRounding");
  const locale = useLocale();
  const { unit } = useAccountMoney();
  const storeId = useProductStoreId();
  const hint = priceRoundingHint(list, final, rule);
  if (hint.kind === "none") return null;

  const money = (value: number) => formatMoneyMarked(value, locale, unit);
  const lines =
    hint.kind === "dropped"
      ? [t("discountDropped", { amount: money(hint.price) })]
      : [
          ...(hint.price !== null ? [t("priceSaved", { amount: money(hint.price) })] : []),
          ...(hint.salePrice !== null ? [t("salePriceSaved", { amount: money(hint.salePrice) })] : []),
        ];

  return (
    <p
      role="status"
      className={cn(
        "text-pretty text-xs leading-relaxed",
        hint.kind === "dropped" ? "text-accent-ink" : "text-(--s-faint)",
        className,
      )}
    >
      {lines.map((line) => (
        <span key={line} className="block">
          <MoneyText locale={locale}>{line}</MoneyText>
        </span>
      ))}
      <Link href={`/stores/${storeId}/settings`} className="font-semibold text-(--s-primary) underline-offset-2 hover:underline">
        {t("settingsLink")}
      </Link>
    </p>
  );
}
