"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

import type { StoreShippingZone } from "@workspace/lib/stores/server";
import { DEFAULT_CURRENCY } from "@workspace/lib";
import { CurrencyInput } from "@/components/form/currency-input";
import { MoneyText } from "@/components/money";
import { Field, FieldRow, Modal, Note, SellerButton, TextInput, Toggle } from "@/components/seller-ui";
import { moneyUnitMarked, type MoneyUnit } from "@/lib/i18n/format";
import { PlacePicker, useShippingLib, type ShippingLib } from "./place-picker.client";
import { saveShippingZone } from "./shipping.server";
import { toZoneInput, type ZoneFormValues } from "./shipping.dto";

const EMPTY_ZONE: ZoneFormValues = {
  nameAr: "",
  nameEn: "",
  places: [],
  price: "",
  freeOver: "",
  deliveryDaysMin: "1",
  deliveryDaysMax: "3",
  codEnabled: true,
  enabled: true,
};

export const formatEgp = (locale: string, egp: number) =>
  new Intl.NumberFormat(locale.startsWith("ar") ? "ar-EG" : "en-EG", { maximumFractionDigits: 2, numberingSystem: "latn" }).format(egp);

/**
 * Tallaby's rate for a set of places: the highest governorate rate among them
 * (`EG` itself counts as every governorate). Null when no place is in Egypt.
 */
function tallabyRateFor(lib: ShippingLib, places: string[]): number | null {
  const rates: number[] = [];
  for (const key of places) {
    const [country, region] = key.split("/");
    if (country !== lib.EGYPT) continue;
    if (region) rates.push(lib.defaultRateForGovernorate(region));
    else rates.push(...lib.ZONE_GOVERNORATES.map(lib.defaultRateForGovernorate));
  }
  return rates.length ? Math.max(...rates) : null;
}

export function ZoneSheet({
  storeId,
  money,
  country,
  zone,
  labels,
  otherZones,
  onClose,
  onSaved,
}: {
  storeId: string;
  /** The store's currency; its zone prices are in it. */
  money: MoneyUnit;
  /** Where the place picker starts. */
  country: string | null;
  /** The zone being edited, or null for a new one. */
  zone: StoreShippingZone | null;
  /** Server-rendered labels for the zone's places, shown until the place data loads. */
  labels?: Record<string, string>;
  otherZones: StoreShippingZone[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("storeShipping");
  const locale = useLocale();
  const lib = useShippingLib();
  const [values, setValues] = useState<ZoneFormValues>(
    zone
      ? {
          nameAr: zone.nameAr,
          nameEn: zone.nameEn ?? "",
          places: zone.places,
          price: String(zone.price),
          freeOver: zone.freeOver === null ? "" : String(zone.freeOver),
          deliveryDaysMin: String(zone.deliveryDaysMin),
          deliveryDaysMax: String(zone.deliveryDaysMax),
          codEnabled: zone.codEnabled,
          enabled: zone.enabled,
        }
      : EMPTY_ZONE,
  );
  const [submitted, setSubmitted] = useState(false);
  // An edited zone keeps its saved price; a new one follows Tallaby's rate until the seller types.
  const [priceTouched, setPriceTouched] = useState(zone !== null);
  const [isPending, startTransition] = useTransition();
  const set = <K extends keyof ZoneFormValues>(key: K, value: ZoneFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  // Place → the other enabled zone that already has exactly that place.
  const takenBy = useMemo(() => {
    const map = new Map<string, string>();
    for (const z of otherZones) {
      if (!z.enabled) continue;
      const name = (!locale.startsWith("ar") && z.nameEn) || z.nameAr;
      for (const p of z.places) map.set(p, name);
    }
    return map;
  }, [otherZones, locale]);

  const input = toZoneInput(values);
  const parsed = lib?.zoneInputSchema.safeParse(input);
  const issues = new Set(parsed && !parsed.success ? parsed.error.issues.map((i) => String(i.path[0] ?? "")) : []);
  const overlap = values.enabled && values.places.some((p) => takenBy.has(p));
  // Tallaby's rates are in pounds, so they mean nothing on a store in another currency.
  const egyptian = (money.currency ?? DEFAULT_CURRENCY) === DEFAULT_CURRENCY;
  const unit = moneyUnitMarked(locale, money);
  const suggested = lib && egyptian ? tallabyRateFor(lib, values.places) : null;
  // Live example for the first chosen place and an order of 300.
  let example: { place: string; total: string; unit: string; amount: string } | null = null;
  if (lib && parsed?.success && values.places[0]) {
    const { amountPiastres, free } = lib.quoteZone(parsed.data, 300);
    example = {
      place: lib.placeLabel(values.places[0], locale),
      total: formatEgp(locale, 300),
      unit,
      amount: free ? t("free") : t("egp", { amount: formatEgp(locale, amountPiastres / 100), unit }),
    };
  }

  const setPlaces = (places: string[]) => {
    if (!priceTouched && lib && egyptian) {
      const rate = tallabyRateFor(lib, places);
      setValues((v) => ({ ...v, places, price: rate === null ? "" : String(rate) }));
    } else {
      set("places", places);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!parsed?.success || overlap) return;
    startTransition(async () => {
      const result = await saveShippingZone(storeId, zone?.id ?? null, parsed.data);
      if (result.success) {
        toast.success(t("zoneSaved"));
        onSaved();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });
  };

  const invalid = (key: string) => submitted && issues.has(key);

  return (
    <Modal
      open
      onOpenChange={(open) => !open && !isPending && onClose()}
      width={560}
      className="max-h-[calc(100dvh-32px)] overflow-hidden"
      title={zone ? t("editZone") : t("addZone")}
      description={t("zoneSheetDescription")}
      footer={
        <>
          <SellerButton variant="outline" onClick={onClose} disabled={isPending}>
            {t("cancel")}
          </SellerButton>
          <SellerButton type="submit" form="zone-form" variant="solid" disabled={isPending || !lib}>
            {(isPending || !lib) && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("saveZone")}
          </SellerButton>
        </>
      }
    >
      <form id="zone-form" onSubmit={submit} noValidate className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-1 pb-1">
        <FieldRow>
          <Field label={t("fields.nameAr")} htmlFor="zone-nameAr">
            <TextInput
              id="zone-nameAr"
              dir="rtl"
              maxLength={60}
              aria-invalid={invalid("nameAr") || undefined}
              value={values.nameAr}
              onChange={(e) => set("nameAr", e.target.value)}
            />
          </Field>
          <Field label={t("fields.nameEn")} htmlFor="zone-nameEn">
            <TextInput id="zone-nameEn" dir="ltr" maxLength={60} value={values.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
          </Field>
        </FieldRow>

        <Field
          label={t("fields.places")}
          htmlFor="zone-places"
          note={t("fields.placesHelp")}
          error={invalid("places") ? t("fieldErrors.places") : overlap ? t("errors.overlap") : undefined}
        >
          <PlacePicker
            id="zone-places"
            country={country}
            lib={lib}
            value={values.places}
            onChange={setPlaces}
            takenBy={takenBy}
            blockTaken={values.enabled}
            labels={labels}
            invalid={invalid("places")}
          />
        </Field>

        <FieldRow>
          <Field
            label={t("fields.price")}
            htmlFor="zone-price"
            note={suggested !== null ? t("fields.priceHelp", { amount: formatEgp(locale, suggested), unit }) : undefined}
          >
            <CurrencyInput
              {...money}
              id="zone-price"
              invalid={invalid("price")}
              value={values.price}
              onChange={(v) => {
                setPriceTouched(true);
                set("price", v);
              }}
            />
          </Field>
          <Field label={t("fields.freeOver")} htmlFor="zone-freeOver" note={t("fields.freeOverHelp")}>
            <CurrencyInput
              {...money}
              id="zone-freeOver"
              invalid={invalid("freeOver")}
              placeholder={t("freeOverPlaceholder")}
              value={values.freeOver}
              onChange={(v) => set("freeOver", v)}
            />
          </Field>
        </FieldRow>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13.5px] font-bold text-(--s-text)">{t("fields.deliveryTime")}</legend>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-(--s-muted)">
            <TextInput
              id="zone-deliveryDaysMin"
              type="number"
              inputMode="numeric"
              min={0}
              max={60}
              step={1}
              dir="ltr"
              aria-label={t("fields.deliveryDaysMin")}
              aria-invalid={invalid("deliveryDaysMin") || undefined}
              className="w-20 text-center font-montserrat"
              value={values.deliveryDaysMin}
              onChange={(e) => set("deliveryDaysMin", e.target.value)}
            />
            <span>{t("fields.to")}</span>
            <TextInput
              id="zone-deliveryDaysMax"
              type="number"
              inputMode="numeric"
              min={0}
              max={60}
              step={1}
              dir="ltr"
              aria-label={t("fields.deliveryDaysMax")}
              aria-invalid={invalid("deliveryDaysMax") || undefined}
              className="w-20 text-center font-montserrat"
              value={values.deliveryDaysMax}
              onChange={(e) => set("deliveryDaysMax", e.target.value)}
            />
            <span>{t("fields.days")}</span>
          </div>
          {(invalid("deliveryDaysMin") || invalid("deliveryDaysMax")) && (
            <p className="text-xs font-medium text-destructive">{t("fieldErrors.days")}</p>
          )}
        </fieldset>

        {submitted && parsed && !parsed.success && !issues.has("places") && (
          <p className="text-xs font-medium text-destructive">{t("fieldErrors.generic")}</p>
        )}

        <div className="flex flex-col gap-3">
          <Toggle
            className="w-full flex-row-reverse justify-between text-[13.5px] text-(--s-text)"
            label={t("fields.codEnabled")}
            checked={values.codEnabled}
            onCheckedChange={(on) => set("codEnabled", on)}
          />
          <Toggle
            className="w-full flex-row-reverse justify-between text-[13.5px] text-(--s-text)"
            label={t("fields.enabled")}
            checked={values.enabled}
            onCheckedChange={(on) => set("enabled", on)}
          />
        </div>

        {example && (
          <Note>
            <MoneyText locale={locale}>
              {t.rich("example", {
                ...example,
                b: (c) => (
                  <b>
                    <MoneyText locale={locale}>{c}</MoneyText>
                  </b>
                ),
              })}
            </MoneyText>
          </Note>
        )}
      </form>
    </Modal>
  );
}
