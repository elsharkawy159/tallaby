"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { searchCouponProducts, type CouponProductOption } from "@/actions/coupons";
import { useAccountMoney } from "@/components/account-money.client";
import { formatMoney, isArabicPound, moneyNumberOptions, moneyParams } from "@/lib/i18n/format";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { addCrossSell, removeCrossSell, setCrossSellActive, type CrossSellResult, type CrossSellRow } from "./cross-sell.server";
import { toAsciiDigits } from "@/components/form/form-ui";

/** "Frequently bought with": offers shown under this product on the seller's stores (ROADMAP.md F-32c). */
export function CrossSellSection({ productId, initial }: { productId: string; initial: CrossSellRow[] }) {
  const { unit } = useAccountMoney();
  const locale = useLocale();
  const t = useTranslations("crossSell");
  const format = useFormatter();
  const [offers, setOffers] = useState(initial);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<CouponProductOption[]>([]);
  const [chosen, setChosen] = useState<CouponProductOption | null>(null);
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [pending, startTransition] = useTransition();

  const text = query.trim();
  const searching = text.length >= 2 && !chosen;
  const shown = searching ? options : [];

  useEffect(() => {
    if (!searching) return;
    let stale = false;
    const timer = setTimeout(() => {
      searchCouponProducts({ query: text }).then((rows) => {
        if (!stale) setOptions(rows.filter((row) => row.id !== productId && row.isActive));
      });
    }, 250);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [text, searching, productId]);

  const run = (action: () => Promise<CrossSellResult>, after?: () => void) =>
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setOffers(result.offers);
        after?.();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });

  const add = () => {
    if (!chosen) return;
    run(
      () => addCrossSell({ productId, offerProductId: chosen.id, discountType: type, discountValue: Number(value) }),
      () => {
        setChosen(null);
        setQuery("");
        setType("percent");
        setValue("10");
        toast.success(t("added"));
      },
    );
  };

  const label = (offer: CrossSellRow) =>
    offer.discountType === "percent"
      ? t("percentOff", { value: offer.discountValue })
      : t("amountOff", { value: isArabicPound(locale, unit) ? formatMoney(offer.discountValue, locale) : format.number(offer.discountValue, moneyNumberOptions(unit)) });

  return (
    <section className="rounded-[24px] border border-(--s-line) bg-(--s-glass) p-[22px] shadow-(--s-shadow-card) max-[600px]:rounded-[20px] max-[600px]:p-4">
      <h2 className="text-[16.5px] font-bold text-(--s-ink)">{t("title")}</h2>
      <p className="mt-0.5 text-pretty text-[13px] leading-relaxed text-(--s-muted)">{t("description")}</p>

      {offers.length > 0 && (
        <ul className="mt-3 divide-y">
          {offers.map((offer) => (
            <li key={offer.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{offer.title}</p>
                <p className="text-xs text-muted-foreground">{label(offer)}</p>
              </div>
              <Switch
                aria-label={t("active")}
                checked={offer.isActive}
                disabled={pending}
                onCheckedChange={(isActive) => run(() => setCrossSellActive({ id: offer.id, productId, isActive }))}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("remove")}
                disabled={pending}
                onClick={() => run(() => removeCrossSell({ id: offer.id, productId }))}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_100px_auto]">
        <div className="relative">
          <Input
            placeholder={t("search")}
            aria-label={t("search")}
            value={chosen ? chosen.title : query}
            onChange={(event) => {
              setChosen(null);
              setQuery(event.target.value);
            }}
          />
          {shown.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
              {shown.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    className="w-full truncate rounded-lg p-2 text-start text-sm hover:bg-muted"
                    onClick={() => {
                      setChosen(option);
                      setOptions([]);
                    }}
                  >
                    {option.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <select
          aria-label={t("discountType")}
          className="h-10 rounded-[10px] border bg-background px-2 text-sm"
          value={type}
          onChange={(event) => setType(event.target.value === "fixed" ? "fixed" : "percent")}
        >
          <option value="percent">{t("percent")}</option>
          <option value="fixed">{t("fixed", moneyParams(locale, unit))}</option>
        </select>
        <Input aria-label={t("discountValue")} inputMode="decimal" dir="ltr" value={value} onChange={(event) => setValue(toAsciiDigits(event.target.value))} />
        <Button type="button" disabled={!chosen || pending} onClick={add}>
          {t("add")}
        </Button>
      </div>
    </section>
  );
}
