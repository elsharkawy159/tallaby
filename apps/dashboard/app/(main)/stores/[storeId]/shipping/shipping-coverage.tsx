"use client";

import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";
import type { CoverageItem } from "./shipping.dto";
import { formatEgp } from "./zone-sheet.client";

/**
 * Egypt at a glance (ROADMAP.md F-45a): every governorate as a tile with what a
 * customer there pays. The gaps are the point, so they look unfinished and the
 * way to close them sits right beside the count. A store in another currency
 * sees its own country's regions instead (`countryName`).
 */
export function ShippingCoverage({
  items,
  countryName = null,
  refuseElsewhere,
  disabled,
  onAddZone,
}: {
  items: CoverageItem[];
  countryName?: string | null;
  /** Places outside every zone can't order (else they pay Tallaby's rates). */
  refuseElsewhere: boolean;
  disabled: boolean;
  onAddZone: () => void;
}) {
  const t = useTranslations("storeShipping.coverage");
  const tShipping = useTranslations("storeShipping");
  const locale = useLocale();
  const covered = items.filter((item) => item.price !== null).length;
  const gaps = items.length - covered;

  return (
    <section aria-labelledby="shipping-coverage-title" className="rounded-2xl border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="shipping-coverage-title" className="text-lg font-bold text-balance sm:text-xl">
            {countryName ? t("summaryCountry", { covered, total: items.length, country: countryName }) : t("summary", { covered, total: items.length })}
          </h2>
          <p className="mt-1 text-sm text-pretty text-muted-foreground">
            {countryName
              ? gaps === 0
                ? t("allCoveredCountry", { country: countryName })
                : t("gapsNotCovered")
              : gaps === 0
                ? t("allCovered")
                : refuseElsewhere
                  ? t("gapsRefuse")
                  : t("gapsRates")}
          </p>
        </div>
        {gaps > 0 && (
          <Button type="button" size="sm" className={SMALL_BUTTON_CLASS} disabled={disabled} onClick={onAddZone}>
            <Plus />
            {t("closeGaps")}
          </Button>
        )}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const hasPrice = item.price !== null;
          return (
            <li
              key={item.key}
              title={item.zoneName ?? undefined}
              className={cn(
                "flex min-h-11 items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[13px]",
                hasPrice
                  ? "bg-primary-soft text-primary-ink"
                  : item.partial
                    ? "border border-dashed border-accent-ink/40 bg-accent-soft text-accent-ink"
                    : "border border-dashed border-input text-muted-foreground",
              )}
            >
              <span className="min-w-0 truncate">{item.label}</span>
              {hasPrice ? (
                <b className="shrink-0 font-sans tabular-nums">
                  {item.price === 0 ? tShipping("free") : formatEgp(locale, item.price as number)}
                </b>
              ) : (
                item.partial && <span className="shrink-0 text-[11px]">{t("partial")}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
