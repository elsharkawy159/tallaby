"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, Save } from "lucide-react";

import type { StoreShippingZone } from "@workspace/lib/stores/server";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { BUTTON_CLASS, FIELD_CLASS, LabelNote } from "@/components/form/form-ui";
import { CurrencyInput } from "@/components/form/currency-input";
import { cn } from "@/lib/utils";
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
  new Intl.NumberFormat(locale.startsWith("ar") ? "ar-EG" : "en-EG", { maximumFractionDigits: 2 }).format(egp);

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
  zone,
  labels,
  otherZones,
  onClose,
  onSaved,
}: {
  storeId: string;
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
  const suggested = lib ? tallabyRateFor(lib, values.places) : null;
  // Live example for the first chosen place and an EGP 300 order.
  let example: { place: string; total: string; amount: string } | null = null;
  if (lib && parsed?.success && values.places[0]) {
    const { amountPiastres, free } = lib.quoteZone(parsed.data, 300);
    example = {
      place: lib.placeLabel(values.places[0], locale),
      total: formatEgp(locale, 300),
      amount: free ? t("free") : t("egp", { amount: formatEgp(locale, amountPiastres / 100) }),
    };
  }

  const setPlaces = (places: string[]) => {
    if (!priceTouched && lib) {
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
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={locale.startsWith("ar") ? "left" : "right"} className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-5 py-4 sm:px-6">
          <SheetTitle>{zone ? t("editZone") : t("addZone")}</SheetTitle>
          <SheetDescription>{t("zoneSheetDescription")}</SheetDescription>
        </SheetHeader>

        <form id="zone-form" onSubmit={submit} noValidate className="min-w-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-1.5">
            <Label htmlFor="zone-nameAr">{t("fields.nameAr")}</Label>
            <Input
              id="zone-nameAr"
              dir="rtl"
              maxLength={60}
              className={cn(FIELD_CLASS, invalid("nameAr") && "border-destructive")}
              aria-invalid={invalid("nameAr") || undefined}
              value={values.nameAr}
              onChange={(e) => set("nameAr", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="zone-nameEn">{t("fields.nameEn")}</Label>
            <Input
              id="zone-nameEn"
              dir="ltr"
              maxLength={60}
              className={FIELD_CLASS}
              value={values.nameEn}
              onChange={(e) => set("nameEn", e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="zone-places">{t("fields.places")}</Label>
            <PlacePicker
              id="zone-places"
              lib={lib}
              value={values.places}
              onChange={setPlaces}
              takenBy={takenBy}
              blockTaken={values.enabled}
              labels={labels}
              invalid={invalid("places")}
            />
            <LabelNote>{t("fields.placesHelp")}</LabelNote>
            {invalid("places") && <p className="text-sm text-destructive">{t("fieldErrors.places")}</p>}
            {overlap && <p className="text-sm text-destructive">{t("errors.overlap")}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="zone-price">{t("fields.price")}</Label>
            <CurrencyInput
              id="zone-price"
              invalid={invalid("price")}
              value={values.price}
              onChange={(v) => {
                setPriceTouched(true);
                set("price", v);
              }}
            />
            {suggested !== null && <LabelNote>{t("fields.priceHelp", { amount: formatEgp(locale, suggested) })}</LabelNote>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="zone-freeOver">{t("fields.freeOver")}</Label>
            <CurrencyInput
              id="zone-freeOver"
              invalid={invalid("freeOver")}
              placeholder={t("freeOverPlaceholder")}
              value={values.freeOver}
              onChange={(v) => set("freeOver", v)}
            />
            <LabelNote>{t("fields.freeOverHelp")}</LabelNote>
          </div>

          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">{t("fields.deliveryTime")}</legend>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Input
                id="zone-deliveryDaysMin"
                type="number"
                inputMode="numeric"
                min={0}
                max={60}
                step={1}
                dir="ltr"
                aria-label={t("fields.deliveryDaysMin")}
                aria-invalid={invalid("deliveryDaysMin") || undefined}
                className={cn(FIELD_CLASS, "w-20 text-center", invalid("deliveryDaysMin") && "border-destructive")}
                value={values.deliveryDaysMin}
                onChange={(e) => set("deliveryDaysMin", e.target.value)}
              />
              <span>{t("fields.to")}</span>
              <Input
                id="zone-deliveryDaysMax"
                type="number"
                inputMode="numeric"
                min={0}
                max={60}
                step={1}
                dir="ltr"
                aria-label={t("fields.deliveryDaysMax")}
                aria-invalid={invalid("deliveryDaysMax") || undefined}
                className={cn(FIELD_CLASS, "w-20 text-center", invalid("deliveryDaysMax") && "border-destructive")}
                value={values.deliveryDaysMax}
                onChange={(e) => set("deliveryDaysMax", e.target.value)}
              />
              <span>{t("fields.days")}</span>
            </div>
            {(invalid("deliveryDaysMin") || invalid("deliveryDaysMax")) && (
              <p className="text-sm text-destructive">{t("fieldErrors.days")}</p>
            )}
          </fieldset>

          {submitted && parsed && !parsed.success && !issues.has("places") && (
            <p className="text-sm text-destructive">{t("fieldErrors.generic")}</p>
          )}

          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>{t("fields.codEnabled")}</span>
              <Switch checked={values.codEnabled} onCheckedChange={(on) => set("codEnabled", on)} />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>{t("fields.enabled")}</span>
              <Switch checked={values.enabled} onCheckedChange={(on) => set("enabled", on)} />
            </label>
          </div>

          {example && <p className="rounded-xl border bg-muted/30 p-3 text-sm">{t.rich("example", { ...example, b: (c) => <b>{c}</b> })}</p>}
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" className={BUTTON_CLASS} onClick={onClose} disabled={isPending}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="zone-form" className={BUTTON_CLASS} disabled={isPending || !lib}>
            {isPending || !lib ? <LoaderCircle className="animate-spin" /> : <Save />}
            {t("saveZone")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
