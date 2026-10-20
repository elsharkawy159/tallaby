"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Info, LoaderCircle, MapPinned, Pencil, Plus, Save, Trash2, Truck } from "lucide-react";

import { applyShippingFeesAndRound, getBaseRateForGovernorate, getGovernorateLabel } from "@workspace/lib/shipping";
import {
  ZONE_GOVERNORATES,
  quoteZone,
  uncoveredGovernorates,
  zoneInputSchema,
  type StoreShippingSettings as Settings,
} from "@workspace/lib/shipping/store-zones";
import type { StoreShippingZone } from "@workspace/lib/stores/server";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { ChoiceCard, ChoiceGroup } from "@workspace/ui/components/choice-card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { BUTTON_CLASS, FIELD_CLASS, LabelNote, SectionCard, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { CurrencyInput } from "@/components/form/currency-input";
import { cn } from "@/lib/utils";
import { deleteShippingZone, saveShippingSettings, saveShippingZone } from "./shipping.server";
import { toZoneInput, type ZoneFormValues } from "./shipping.dto";

const EMPTY_ZONE: ZoneFormValues = {
  nameAr: "",
  nameEn: "",
  governorates: [],
  price: "",
  perKgSurcharge: "",
  freeOver: "",
  deliveryDaysMin: "1",
  deliveryDaysMax: "3",
  codEnabled: true,
  enabled: true,
};

const fmt = (locale: string, egp: number) =>
  new Intl.NumberFormat(locale.startsWith("ar") ? "ar-EG" : "en-EG", { maximumFractionDigits: 2 }).format(egp);

export function StoreShippingSettings({
  storeId,
  initial,
  readOnly,
}: {
  storeId: string;
  initial: { settings: Settings; zones: StoreShippingZone[] };
  readOnly: boolean;
}) {
  const t = useTranslations("storeShipping");
  const router = useRouter();
  const [zones, setZones] = useState(initial.zones);
  const [editing, setEditing] = useState<StoreShippingZone | "new" | null>(null);
  const [deleting, setDeleting] = useState<StoreShippingZone | null>(null);
  const [isPending, startTransition] = useTransition();

  const removeZone = (zone: StoreShippingZone) =>
    startTransition(async () => {
      const result = await deleteShippingZone(storeId, zone.id);
      if (result.success) {
        setZones((z) => z.filter((x) => x.id !== zone.id));
        toast.success(t("zoneDeleted"));
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
      setDeleting(null);
    });

  return (
    <div className="space-y-5">
      {readOnly && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}
      <p className="flex gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>{t("checkoutNotice")}</span>
      </p>

      <MethodCard storeId={storeId} initial={initial.settings} hasEnabledZone={zones.some((z) => z.enabled)} readOnly={readOnly} />

      <SectionCard
        id="shipping-zones"
        icon={MapPinned}
        title={t("zonesTitle")}
        description={t("zonesDescription")}
        action={
          <Button
            type="button"
            size="sm"
            className={SMALL_BUTTON_CLASS}
            disabled={readOnly || isPending}
            onClick={() => setEditing("new")}
          >
            <Plus />
            {t("addZone")}
          </Button>
        }
      >
        {zones.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("noZones")}</p>
        ) : (
          <ul className="divide-y">
            {zones.map((zone) => (
              <ZoneRow
                key={zone.id}
                zone={zone}
                disabled={readOnly || isPending}
                onEdit={() => setEditing(zone)}
                onDelete={() => setDeleting(zone)}
              />
            ))}
          </ul>
        )}
        <Uncovered zones={zones} />
      </SectionCard>

      {editing && (
        <ZoneSheet
          key={editing === "new" ? "new" : editing.id}
          storeId={storeId}
          zone={editing === "new" ? null : editing}
          otherZones={zones.filter((z) => editing === "new" || z.id !== editing.id)}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setZones((list) => (list.some((z) => z.id === saved.id) ? list.map((z) => (z.id === saved.id ? saved : z)) : [...list, saved]));
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle", { name: deleting?.nameAr ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleting) removeZone(deleting);
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MethodCard({
  storeId,
  initial,
  hasEnabledZone,
  readOnly,
}: {
  storeId: string;
  initial: Settings;
  hasEnabledZone: boolean;
  readOnly: boolean;
}) {
  const t = useTranslations("storeShipping");
  const locale = useLocale();
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [method, setMethod] = useState(initial.method);
  const [handlingDays, setHandlingDays] = useState(String(initial.handlingDays));
  const [freeOver, setFreeOver] = useState(initial.freeShippingOver === null ? "" : String(initial.freeShippingOver));
  const [showRates, setShowRates] = useState(false);
  const [isPending, startTransition] = useTransition();

  const next: Settings = {
    method,
    handlingDays: Number(handlingDays),
    freeShippingOver: freeOver.trim() === "" ? null : Number(freeOver.replace(",", ".")),
  };
  const dirty = JSON.stringify(next) !== JSON.stringify(saved);

  const submit = () =>
    startTransition(async () => {
      const result = await saveShippingSettings(storeId, next);
      if (result.success) {
        setSaved(result.data);
        toast.success(t("saved"));
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });

  return (
    <SectionCard id="shipping-method" icon={Truck} title={t("methodTitle")} description={t("methodDescription")}>
      <div className="space-y-5">
        <ChoiceGroup value={method} onValueChange={(v) => setMethod(v as Settings["method"])} columns={2} stack disabled={readOnly}>
          <ChoiceCard value="tallaby" indicator title={t("tallabyTitle")} description={t("tallabyDescription")} />
          <ChoiceCard
            value="own"
            indicator
            title={t("ownTitle")}
            description={hasEnabledZone ? t("ownDescription") : t("ownNeedsZone")}
            disabled={!hasEnabledZone && method !== "own"}
          />
        </ChoiceGroup>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="handling-days">{t("handlingDays")}</Label>
            <Input
              id="handling-days"
              type="number"
              min={0}
              max={30}
              dir="ltr"
              className={FIELD_CLASS}
              disabled={readOnly}
              value={handlingDays}
              onChange={(e) => setHandlingDays(e.target.value)}
            />
            <LabelNote>{t("handlingDaysHelp")}</LabelNote>
          </div>
          {method === "tallaby" && (
            <div className="grid gap-1.5">
              <Label htmlFor="free-over">{t("freeOver")}</Label>
              <CurrencyInput
                id="free-over"
                disabled={readOnly}
                placeholder={t("freeOverPlaceholder")}
                value={freeOver}
                onChange={setFreeOver}
              />
              <LabelNote>{t("freeOverHelp")}</LabelNote>
            </div>
          )}
        </div>

        {method === "tallaby" && (
          <div>
            <Button type="button" variant="link" className="h-auto p-0" onClick={() => setShowRates((s) => !s)}>
              {showRates ? t("hideRates") : t("showRates")}
            </Button>
            {showRates && (
              <div className="mt-3 overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">{t("governorate")}</th>
                      <th className="px-3 py-2 text-end font-medium">{t("rateFirstKg")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ZONE_GOVERNORATES.map((g) => (
                      <tr key={g}>
                        <td className="px-3 py-1.5">{getGovernorateLabel(g, locale)}</td>
                        <td className="px-3 py-1.5 text-end tabular-nums">
                          {t("egp", { amount: fmt(locale, applyShippingFeesAndRound(getBaseRateForGovernorate(g) ?? 0)) })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t px-3 py-2 text-xs text-muted-foreground">{t("ratesNote")}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="button" className={BUTTON_CLASS} disabled={readOnly || isPending || !dirty} onClick={submit}>
            {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
            {t("save")}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

function ZoneRow({
  zone,
  disabled,
  onEdit,
  onDelete,
}: {
  zone: StoreShippingZone;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("storeShipping");
  const locale = useLocale();
  const name = (!locale.startsWith("ar") && zone.nameEn) || zone.nameAr;
  return (
    <li className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          {name}
          {!zone.enabled && (
            <Badge variant="outline" className="text-[10px] font-normal">
              {t("disabled")}
            </Badge>
          )}
          {!zone.codEnabled && (
            <Badge variant="outline" className="text-[10px] font-normal">
              {t("noCod")}
            </Badge>
          )}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {zone.governorates.map((g) => getGovernorateLabel(g, locale)).join("، ")}
        </p>
        <LabelNote>
          {t("zoneSummary", {
            price: fmt(locale, zone.price),
            min: zone.deliveryDaysMin,
            max: zone.deliveryDaysMax,
          })}
          {zone.freeOver !== null && ` · ${t("freeOverSummary", { amount: fmt(locale, zone.freeOver) })}`}
        </LabelNote>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" className={SMALL_BUTTON_CLASS} disabled={disabled} onClick={onEdit}>
          <Pencil />
          {t("edit")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(SMALL_BUTTON_CLASS, "text-destructive")}
          disabled={disabled}
          onClick={onDelete}
          aria-label={t("deleteTitle", { name: zone.nameAr })}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}

function Uncovered({ zones }: { zones: StoreShippingZone[] }) {
  const t = useTranslations("storeShipping");
  const locale = useLocale();
  const left = uncoveredGovernorates(zones);
  if (zones.length === 0 || left.length === 0) return null;
  return (
    <p className="mt-4 rounded-lg bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
      {t("uncovered", { count: left.length })} {left.map((g) => getGovernorateLabel(g, locale)).join("، ")}
    </p>
  );
}

function ZoneSheet({
  storeId,
  zone,
  otherZones,
  onClose,
  onSaved,
}: {
  storeId: string;
  zone: StoreShippingZone | null;
  otherZones: StoreShippingZone[];
  onClose: () => void;
  onSaved: (zone: StoreShippingZone) => void;
}) {
  const t = useTranslations("storeShipping");
  const locale = useLocale();
  const [values, setValues] = useState<ZoneFormValues>(
    zone
      ? {
          nameAr: zone.nameAr,
          nameEn: zone.nameEn ?? "",
          governorates: zone.governorates,
          price: String(zone.price),
          perKgSurcharge: zone.perKgSurcharge ? String(zone.perKgSurcharge) : "",
          freeOver: zone.freeOver === null ? "" : String(zone.freeOver),
          deliveryDaysMin: String(zone.deliveryDaysMin),
          deliveryDaysMax: String(zone.deliveryDaysMax),
          codEnabled: zone.codEnabled,
          enabled: zone.enabled,
        }
      : EMPTY_ZONE,
  );
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Governorate → the other enabled zone that already has it.
  const taken = useMemo(() => {
    const map = new Map<string, string>();
    for (const z of otherZones) if (z.enabled) for (const g of z.governorates) map.set(g, z.nameAr);
    return map;
  }, [otherZones]);

  const input = toZoneInput(values);
  const parsed = zoneInputSchema.safeParse(input);
  const issues = new Set(parsed.success ? [] : parsed.error.issues.map((i) => String(i.path[0] ?? "")));
  const overlap = values.enabled && values.governorates.some((g) => taken.has(g));
  const set = <K extends keyof ZoneFormValues>(key: K, value: ZoneFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  const example = parsed.success ? quoteZone(parsed.data, { subtotal: 300, weightGrams: 2500 }) : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!parsed.success || overlap) return;
    startTransition(async () => {
      const result = await saveShippingZone(storeId, zone?.id ?? null, parsed.data);
      if (result.success) {
        toast.success(t("zoneSaved"));
        onSaved(result.data);
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });
  };

  const num = (key: "price" | "perKgSurcharge" | "freeOver" | "deliveryDaysMin" | "deliveryDaysMax", opts: { help?: string; placeholder?: string } = {}) => {
    const invalid = submitted && issues.has(key);
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={`zone-${key}`}>{t(`fields.${key}`)}</Label>
        {key.startsWith("delivery") ? (
          <Input
            id={`zone-${key}`}
            type="number"
            min={0}
            step={1}
            dir="ltr"
            className={cn(FIELD_CLASS, invalid && "border-destructive")}
            aria-invalid={invalid}
            placeholder={opts.placeholder}
            value={values[key]}
            onChange={(e) => set(key, e.target.value)}
          />
        ) : (
          <CurrencyInput
            id={`zone-${key}`}
            invalid={invalid}
            placeholder={opts.placeholder}
            value={values[key]}
            onChange={(v) => set(key, v)}
          />
        )}
        {opts.help && <LabelNote>{opts.help}</LabelNote>}
      </div>
    );
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={locale.startsWith("ar") ? "left" : "right"} className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{zone ? t("editZone") : t("addZone")}</SheetTitle>
          <SheetDescription>{t("zoneSheetDescription")}</SheetDescription>
        </SheetHeader>

        <form id="zone-form" onSubmit={submit} noValidate className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="zone-nameAr">{t("fields.nameAr")}</Label>
              <Input
                id="zone-nameAr"
                dir="rtl"
                maxLength={60}
                className={cn(FIELD_CLASS, submitted && issues.has("nameAr") && "border-destructive")}
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
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("fields.governorates")}</legend>
            <div className="grid max-h-64 grid-cols-2 gap-x-3 gap-y-2 overflow-y-auto rounded-xl border p-3">
              {ZONE_GOVERNORATES.map((g) => {
                const other = taken.get(g);
                const checked = values.governorates.includes(g);
                return (
                  <label key={g} className={cn("flex items-center gap-2 text-sm", other && !checked && "opacity-60")}>
                    <Checkbox
                      checked={checked}
                      disabled={!!other && !checked && values.enabled}
                      onCheckedChange={(on) =>
                        set("governorates", on ? [...values.governorates, g] : values.governorates.filter((x) => x !== g))
                      }
                    />
                    <span className="min-w-0 truncate">
                      {getGovernorateLabel(g, locale)}
                      {other && <span className="text-xs text-muted-foreground"> · {other}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
            {submitted && issues.has("governorates") && <p className="text-sm text-destructive">{t("fieldErrors.governorates")}</p>}
            {overlap && <p className="text-sm text-destructive">{t("errors.overlap")}</p>}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            {num("price", { help: t("fields.priceHelp") })}
            {num("perKgSurcharge", { help: t("fields.perKgHelp"), placeholder: "0" })}
            {num("freeOver", { help: t("fields.freeOverHelp"), placeholder: t("freeOverPlaceholder") })}
            <div className="grid grid-cols-2 gap-3">
              {num("deliveryDaysMin")}
              {num("deliveryDaysMax")}
            </div>
          </div>
          {submitted && !parsed.success && !issues.has("governorates") && (
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

          {example && (
            <p className="rounded-xl border bg-muted/30 p-3 text-sm">
              {t("example", {
                amount: example.free ? t("free") : t("egp", { amount: fmt(locale, example.amountPiastres / 100) }),
              })}
            </p>
          )}
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" className={BUTTON_CLASS} onClick={onClose} disabled={isPending}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="zone-form" className={BUTTON_CLASS} disabled={isPending}>
            {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
            {t("save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
