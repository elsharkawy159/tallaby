"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Info, LayoutTemplate, LoaderCircle, MapPinned, Pencil, Plus, Save, Settings2, Trash2 } from "lucide-react";

// Tallaby delivery UI is disabled (owner, 2026-10-21); these imports only served it. See SettingsCard.
// import { TALLABY_SERVICES_ENABLED } from "@workspace/lib/fulfillment";
// import { applyShippingFeesAndRound, getBaseRateForGovernorate, getGovernorateLabel } from "@workspace/lib/shipping";
// import { ZONE_GOVERNORATES } from "@workspace/lib/shipping/store-zones";
// import { CurrencyInput } from "@/components/form/currency-input";
import type { StoreShippingSettings as Settings } from "@workspace/lib/shipping/store-zones";
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
import { ChoiceCard, ChoiceGroup } from "@workspace/ui/components/choice-card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { BUTTON_CLASS, FIELD_CLASS, LabelNote, SectionCard, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";
import { CheckPrice } from "./check-price.client";
import { deleteShippingZone, saveShippingSettings } from "./shipping.server";
import type { TemplateOption, ZoneView } from "./shipping.dto";
import { ShippingTemplates, TemplatesSheet } from "./templates.client";
import { formatEgp, ZoneSheet } from "./zone-sheet.client";

/** Chips shown per zone before "+N". */
const CHIP_LIMIT = 8;

export function StoreShippingSettings({
  storeId,
  settings,
  zones,
  uncovered,
  templates,
  readOnly,
}: {
  storeId: string;
  settings: Settings;
  /** Saved zones with server-computed place labels and override hints. */
  zones: ZoneView[];
  /** Labels of Egypt's governorates no enabled zone covers (empty while no zone is on). */
  uncovered: string[];
  templates: TemplateOption[];
  readOnly: boolean;
}) {
  const t = useTranslations("storeShipping");
  const router = useRouter();
  const [editing, setEditing] = useState<ZoneView | "new" | null>(null);
  const [deleting, setDeleting] = useState<StoreShippingZone | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const raw = zones.map((z) => z.zone);
  const disabled = readOnly || isPending;

  const removeZone = (zone: StoreShippingZone) =>
    startTransition(async () => {
      const result = await deleteShippingZone(storeId, zone.id);
      if (result.success) {
        toast.success(t("zoneDeleted"));
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
      setDeleting(null);
    });

  const templateProps = {
    storeId,
    templates,
    zoneCount: zones.length,
    disabled: readOnly,
    onScratch: () => {
      setTemplatesOpen(false);
      setEditing("new");
    },
    onApplied: () => {
      setTemplatesOpen(false);
      router.refresh();
    },
  };

  return (
    <div className="space-y-5">
      {readOnly && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}
      <div className="flex gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="space-y-0.5">
          <p className="font-semibold">{t("noticeTitle")}</p>
          <p className="text-muted-foreground">{t("checkoutNotice")}</p>
        </div>
      </div>

      {zones.length === 0 && (
        <SectionCard id="shipping-templates" icon={LayoutTemplate} title={t("templates.startTitle")} description={t("templates.description")}>
          <ShippingTemplates {...templateProps} />
        </SectionCard>
      )}

      <SectionCard
        id="shipping-zones"
        icon={MapPinned}
        title={t("zonesTitle")}
        description={t("zonesDescription")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {zones.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={SMALL_BUTTON_CLASS}
                disabled={disabled}
                onClick={() => setTemplatesOpen(true)}
              >
                <LayoutTemplate />
                {t("templates.button")}
              </Button>
            )}
            <Button type="button" size="sm" className={SMALL_BUTTON_CLASS} disabled={disabled} onClick={() => setEditing("new")}>
              <Plus />
              {t("addZone")}
            </Button>
          </div>
        }
      >
        {zones.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noZones")}</p>
        ) : (
          <ul className="divide-y">
            {zones.map((view) => (
              <ZoneRow
                key={view.zone.id}
                view={view}
                disabled={disabled}
                onEdit={() => setEditing(view)}
                onDelete={() => setDeleting(view.zone)}
              />
            ))}
          </ul>
        )}
        {uncovered.length > 0 && (
          <p className="mt-4 rounded-lg bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{t("uncovered", { count: uncovered.length })}</span>{" "}
            {uncovered.join(t("listSeparator"))}.{" "}
            {settings.otherPlaces === "refuse" ? t("uncoveredRefuse") : t("uncoveredTallabyRates")}
          </p>
        )}
      </SectionCard>

      <CheckPrice zones={raw} settings={settings} />

      <SettingsCard storeId={storeId} initial={settings} readOnly={readOnly} />

      {zones.length > 0 && <TemplatesSheet open={templatesOpen} onOpenChange={setTemplatesOpen} {...templateProps} />}

      {editing && (
        <ZoneSheet
          key={editing === "new" ? "new" : editing.zone.id}
          storeId={storeId}
          zone={editing === "new" ? null : editing.zone}
          labels={editing === "new" ? undefined : Object.fromEntries(editing.chips.map((c) => [c.key, c.label]))}
          otherZones={raw.filter((z) => editing === "new" || z.id !== editing.zone.id)}
          onClose={() => setEditing(null)}
          onSaved={() => {
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

function ZoneRow({
  view,
  disabled,
  onEdit,
  onDelete,
}: {
  view: ZoneView;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("storeShipping");
  const locale = useLocale();
  const [showAll, setShowAll] = useState(false);
  const { zone, chips, overrides } = view;
  const name = (!locale.startsWith("ar") && zone.nameEn) || zone.nameAr;
  const visible = showAll ? chips : chips.slice(0, CHIP_LIMIT);
  const hidden = chips.length - visible.length;
  const meta = [
    t("daysRange", { min: zone.deliveryDaysMin, max: zone.deliveryDaysMax }),
    zone.freeOver !== null && t("freeOverSummary", { amount: formatEgp(locale, zone.freeOver) }),
    zone.codEnabled ? t("cod") : t("noCod"),
  ].filter(Boolean);

  return (
    <li className={cn("flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start", !zone.enabled && "opacity-70")}>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          <span className="min-w-0 break-words">{name}</span>
          {!zone.enabled && (
            <Badge variant="outline" className="text-[11px] font-normal">
              {t("disabled")}
            </Badge>
          )}
          {overrides && (
            <Badge variant="outline" className="max-w-full text-[11px] font-normal text-muted-foreground">
              <span className="truncate">{t("overrides", { zone: overrides })}</span>
            </Badge>
          )}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {visible.map((c) => (
            <li key={c.key} className="max-w-full truncate rounded-full bg-muted px-2.5 py-0.5 text-xs">
              {c.label}
            </li>
          ))}
          {hidden > 0 && (
            <li>
              <button
                type="button"
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-muted/70"
                onClick={() => setShowAll(true)}
              >
                {t("morePlaces", { count: hidden })}
              </button>
            </li>
          )}
        </ul>
        <LabelNote>{meta.join(" · ")}</LabelNote>
      </div>
      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
        <p className="whitespace-nowrap text-base font-bold tabular-nums">{t("egp", { amount: formatEgp(locale, zone.price) })}</p>
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
      </div>
    </li>
  );
}

/*
 * Settings card. TALLABY DELIVERY IS DISABLED (owner decision, 2026-10-21):
 * Tallaby will not deliver orders for a long time, so every store uses seller
 * (own) delivery and the Tallaby-delivery choice, its free-delivery offer and
 * its read-only rate table are commented out below, not deleted.
 * To re-enable: set TALLABY_SERVICES_ENABLED in packages/lib/src/fulfillment/
 * constants.ts (parseStoreShipping and updateStoreShippingSettings follow it),
 * restore the commented imports at the top of this file, and uncomment the
 * ChoiceGroup, the free-over field and the rates table here (plus the
 * `method`/`setMethod`, `freeOver` setter, `showRates` and `locale` state, and
 * the `fmt` helper: `formatEgp`).
 */
function SettingsCard({ storeId, initial, readOnly }: { storeId: string; initial: Settings; readOnly: boolean }) {
  const t = useTranslations("storeShipping");
  // const locale = useLocale(); // Tallaby rates table only
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  // Seller delivery only while Tallaby delivery is disabled.
  // const [method, setMethod] = useState(initial.method);
  const method: Settings["method"] = "own";
  const [handlingDays, setHandlingDays] = useState(String(initial.handlingDays));
  const [otherPlaces, setOtherPlaces] = useState(initial.otherPlaces);
  // Tallaby's seller-funded free delivery; kept as stored while hidden.
  const [freeOver] = useState(initial.freeShippingOver === null ? "" : String(initial.freeShippingOver));
  // const [showRates, setShowRates] = useState(false);
  const [isPending, startTransition] = useTransition();

  const next: Settings = {
    method,
    handlingDays: Number(handlingDays),
    freeShippingOver: freeOver.trim() === "" ? null : Number(freeOver.replace(",", ".")),
    otherPlaces,
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
    <SectionCard id="shipping-settings" icon={Settings2} title={t("settingsTitle")} description={t("settingsDescription")}>
      <div className="space-y-5">
        {/* Tallaby delivery disabled (owner, 2026-10-21); see the comment above SettingsCard.
        <ChoiceGroup value={method} onValueChange={(v) => setMethod(v as Settings["method"])} columns={2} stack disabled={readOnly}>
          <ChoiceCard
            value="tallaby"
            indicator
            title={t("tallabyTitle")}
            description={
              TALLABY_SERVICES_ENABLED
                ? t("tallabyDescription")
                : saved.method === "tallaby"
                  ? t("tallabyLegacy")
                  : t("tallabySoonDescription")
            }
            disabled={!TALLABY_SERVICES_ENABLED && saved.method !== "tallaby"}
            badge={
              !TALLABY_SERVICES_ENABLED && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11.5px] font-semibold text-muted-foreground">
                  {t("soon")}
                </span>
              )
            }
          />
          <ChoiceCard value="own" indicator title={t("ownTitle")} description={t("ownDescription")} />
        </ChoiceGroup>
        */}

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">{t("otherPlaces.title")}</legend>
          <ChoiceGroup
            value={otherPlaces}
            onValueChange={(v) => setOtherPlaces(v as Settings["otherPlaces"])}
            columns={2}
            stack
            disabled={readOnly}
          >
            <ChoiceCard
              value="tallaby_rates"
              indicator
              title={t("otherPlaces.tallabyRates")}
              description={t("otherPlaces.tallabyRatesDescription")}
            />
            <ChoiceCard value="refuse" indicator title={t("otherPlaces.refuse")} description={t("otherPlaces.refuseDescription")} />
          </ChoiceGroup>
          <LabelNote>{t("otherPlaces.note")}</LabelNote>
        </fieldset>

        <div className="grid gap-1.5">
          <Label htmlFor="handling-days">{t("handlingDays")}</Label>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Input
              id="handling-days"
              type="number"
              inputMode="numeric"
              min={0}
              max={30}
              dir="ltr"
              className={cn(FIELD_CLASS, "w-24 text-center")}
              disabled={readOnly}
              value={handlingDays}
              onChange={(e) => setHandlingDays(e.target.value)}
            />
            <span className="text-muted-foreground">{t("handlingDaysUnit")}</span>
          </div>
          <LabelNote>{t("handlingDaysHelp")}</LabelNote>
        </div>
        {/* Tallaby delivery disabled (owner, 2026-10-21): seller-funded free delivery on Tallaby's rates.
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
        */}

        {/* Tallaby delivery disabled (owner, 2026-10-21): Tallaby's read-only rate table. The same rates are now
            the "Tallaby's rates" shipping template.
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
                      <th className="px-3 py-2 text-end font-medium">{t("fields.price")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ZONE_GOVERNORATES.map((g) => (
                      <tr key={g}>
                        <td className="px-3 py-1.5">{getGovernorateLabel(g, locale)}</td>
                        <td className="px-3 py-1.5 text-end tabular-nums">
                          {t("egp", { amount: formatEgp(locale, applyShippingFeesAndRound(getBaseRateForGovernorate(g) ?? 0)) })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        */}

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
