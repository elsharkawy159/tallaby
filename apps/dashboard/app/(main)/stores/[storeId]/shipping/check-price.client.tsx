"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calculator } from "lucide-react";

import type { StoreShippingSettings as Settings } from "@workspace/lib/shipping/store-zones";
import type { StoreShippingZone } from "@workspace/lib/stores/server";
import { Label } from "@workspace/ui/components/label";
import { CurrencyInput } from "@/components/form/currency-input";
import { SectionCard } from "@/components/form/form-ui";
import { PlacePicker, useShippingLib } from "./place-picker.client";
import { formatEgp } from "./zone-sheet.client";

/**
 * "Check a price": what a customer in a place pays at checkout, with the same
 * rules as the storefront quote (outside Egypt refused, no enabled zone →
 * Tallaby's rates, most specific zone wins, then the "Other places" setting).
 * The place data loads on first focus.
 */
export function CheckPrice({ zones, settings }: { zones: StoreShippingZone[]; settings: Settings }) {
  const t = useTranslations("storeShipping");
  const locale = useLocale();
  const [wanted, setWanted] = useState(false);
  const lib = useShippingLib(wanted);
  const [places, setPlaces] = useState<string[]>([]);
  const [total, setTotal] = useState("300");

  const place = places[0];
  const subtotal = Number(total.replace(",", "."));
  const egp = (n: number) => t("egp", { amount: formatEgp(locale, n) });

  let result: React.ReactNode = null;
  if (lib && place && Number.isFinite(subtotal) && subtotal >= 0) {
    const label = lib.placeLabel(place, locale);
    const b = (c: React.ReactNode) => <b>{c}</b>;
    if (!place.startsWith(`${lib.EGYPT}/`) && place !== lib.EGYPT) {
      result = t("checkPrice.outsideEgypt", { place: label });
    } else if (!zones.some((z) => z.enabled)) {
      result = t("checkPrice.noZones", { place: label });
    } else {
      const found = lib.findZoneForPlace(zones, place);
      if (found) {
        const { zone } = found;
        const { amountPiastres, free } = lib.quoteZone(zone, subtotal);
        result = t.rich("checkPrice.zone", {
          place: label,
          zone: (!locale.startsWith("ar") && zone.nameEn) || zone.nameAr,
          amount: free ? t("free") : egp(amountPiastres / 100),
          min: settings.handlingDays + zone.deliveryDaysMin,
          max: settings.handlingDays + zone.deliveryDaysMax,
          b,
        });
      } else {
        result =
          settings.otherPlaces === "refuse"
            ? t("checkPrice.refused", { place: label })
            : t("checkPrice.tallabyRates", { place: label });
      }
    }
  }

  return (
    <SectionCard id="shipping-check" icon={Calculator} title={t("checkPrice.title")} description={t("checkPrice.description")}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <div className="grid min-w-0 gap-1.5 self-start">
            <Label htmlFor="check-place">{t("checkPrice.place")}</Label>
            <PlacePicker id="check-place" lib={lib} onNeedLib={() => setWanted(true)} single value={places} onChange={setPlaces} />
          </div>
          <div className="grid gap-1.5 self-start">
            <Label htmlFor="check-total">{t("checkPrice.total")}</Label>
            <CurrencyInput id="check-total" value={total} onChange={setTotal} />
          </div>
        </div>
        {result && (
          <p className="rounded-xl border bg-muted/30 p-3 text-sm" aria-live="polite">
            {result}
          </p>
        )}
      </div>
    </SectionCard>
  );
}
