"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { LayoutTemplate, Minus, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";

// Tallaby delivery UI is disabled (owner, 2026-10-21); these imports only served it. See SettingsCard.
// import { TALLABY_SERVICES_ENABLED } from "@workspace/lib/fulfillment";
// import { applyShippingFeesAndRound, getBaseRateForGovernorate, getGovernorateLabel } from "@workspace/lib/shipping";
// import { ZONE_GOVERNORATES } from "@workspace/lib/shipping/store-zones";
import { DEFAULT_CURRENCY, type CurrencyLabel, type StoreCurrency } from "@workspace/lib";
import { CurrencyInput } from "@/components/form/currency-input";
import { MoneyText } from "@/components/money";
import { moneyParams, moneyUnitMarked, moneyUnitText } from "@/lib/i18n/format";
import type { StoreShippingSettings as Settings } from "@workspace/lib/shipping/store-zones";
import type { StoreShippingZone } from "@workspace/lib/stores/server";
import type { BostaOverview, WassalhaOverview } from "@workspace/lib/integrations/server";
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
import { IconButton, Note, OptionCard, OptionCards, SaveBar, SellerButton, Tag } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { ShippingCompaniesCard } from "./shipping-companies.client";
import { ShippingCoverage } from "./shipping-coverage";
import { StepCard } from "./shipping-ui";
import { DescribeZonesSheet } from "./ai/ai-zones.client";
import { deleteShippingZone, saveShippingSettings } from "./shipping.server";
import type { CoverageItem, TemplateOption, ZoneView } from "./shipping.dto";
import { TemplatesSheet } from "./templates.client";
import { formatEgp, ZoneSheet } from "./zone-sheet.client";

type StoreMoney = { currency: StoreCurrency; label: CurrencyLabel };

/** Chips shown per zone before "+N". */
const CHIP_LIMIT = 8;

/** The bar at each zone's edge, from the design's palette. They only tell zones apart. */
const ZONE_COLORS = [
  "var(--tallaby-teal-700)",
  "var(--tallaby-teal-300)",
  "var(--tallaby-amber-600)",
  "var(--tallaby-teal-500)",
  "var(--tallaby-teal-100)",
  "var(--tallaby-amber-700)",
];

export function StoreShippingSettings({
  storeId,
  money,
  country,
  countryName,
  settings,
  zones,
  coverage,
  templates,
  bosta,
  wassalha,
  readOnly,
}: {
  storeId: string;
  /** The store's currency: every amount on this page is in it. */
  money: StoreMoney;
  /** Where the place picker starts ("EG", "SA"…), or null when the currency has no one country. */
  country: string | null;
  /** The coverage board's country when it isn't Egypt. */
  countryName: string | null;
  settings: Settings;
  /** Saved zones with server-computed place labels and override hints. */
  zones: ZoneView[];
  /** Every governorate with its price, for the coverage board. */
  coverage: CoverageItem[];
  templates: TemplateOption[];
  /** The store's Bosta integration (BS-07), or null when it has none. */
  bosta: BostaOverview | null;
  /** The store's Wassalha settings (F-12c), or null when it has none. */
  wassalha: WassalhaOverview | null;
  readOnly: boolean;
}) {
  const t = useTranslations("storeShipping");
  const router = useRouter();
  const [editing, setEditing] = useState<ZoneView | "new" | null>(null);
  const [deleting, setDeleting] = useState<StoreShippingZone | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [describing, setDescribing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const settingsForm = useSettingsForm(storeId, settings);
  const egyptian = money.currency === DEFAULT_CURRENCY;
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
    money,
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

  // The two ways to add an area, the same with or without zones.
  const addActions = (
    <div className="flex flex-wrap gap-2 max-[600px]:flex-col">
      <SellerButton variant="solid" className="flex-1 max-[600px]:flex-none" disabled={disabled} onClick={() => setEditing("new")}>
        <Plus aria-hidden />
        {t("addZone")}
      </SellerButton>
      {/* AI zones only match Egyptian place names, so another currency would pay for an empty answer. */}
      {egyptian && (
        <SellerButton
          variant="outline"
          className="h-auto min-h-[42px] flex-1 whitespace-normal py-2 max-[600px]:flex-none"
          disabled={disabled}
          onClick={() => setDescribing(true)}
        >
          <Sparkles className="text-(--tallaby-amber-700)" aria-hidden />
          {t("describe.button")}
        </SellerButton>
      )}
    </div>
  );

  return (
    <>
      {readOnly && <Note tone="amber">{t("readOnly")}</Note>}

      <StepCard
        id="shipping-zones"
        step={1}
        done={zones.length > 0}
        title={t("zonesTitle")}
        description={t("checkoutNotice")}
        className="[animation-delay:.05s]"
        action={
          egyptian && (
            <SellerButton variant="mini" size="xs" disabled={disabled} onClick={() => setTemplatesOpen(true)}>
              <LayoutTemplate aria-hidden />
              {zones.length > 0 ? t("templates.button") : t("templates.startTitle")}
            </SellerButton>
          )
        }
      >
        {zones.length === 0 ? (
          <div className="flex flex-col gap-3.5 rounded-[20px] border-[1.5px] border-dashed border-(--s-field-strong) bg-linear-[160deg,var(--s-tint),var(--s-surface)_70%] p-5 max-[720px]:p-4">
            <p className="text-pretty text-[13px] text-(--s-muted)">{t("noZones")}</p>
            {addActions}
          </div>
        ) : (
          <>
            {addActions}
            <ul className="flex flex-col gap-2">
              {zones.map((view, index) => (
                <ZoneRow
                  key={view.zone.id}
                  view={view}
                  money={money}
                  color={ZONE_COLORS[index % ZONE_COLORS.length]!}
                  disabled={disabled}
                  onEdit={() => setEditing(view)}
                  onDelete={() => setDeleting(view.zone)}
                />
              ))}
            </ul>
          </>
        )}
      </StepCard>

      {zones.length > 0 && coverage.length > 0 && (
        <ShippingCoverage
          items={coverage}
          countryName={countryName}
          refuseElsewhere={!egyptian || settings.otherPlaces === "refuse"}
          disabled={disabled}
          onAddZone={() => setEditing("new")}
        />
      )}

      <ShippingCompaniesCard storeId={storeId} bosta={bosta} wassalha={wassalha} readOnly={readOnly} />

      <SettingsCard form={settingsForm} readOnly={readOnly} money={money} />

      <SaveBar
        dirty={!readOnly && settingsForm.changed}
        saving={settingsForm.isPending}
        saveDisabled={!settingsForm.freeOverValid}
        onSave={settingsForm.submit}
        onDiscard={settingsForm.discard}
      />

      {egyptian && <TemplatesSheet open={templatesOpen} onOpenChange={setTemplatesOpen} {...templateProps} />}

      {editing && (
        <ZoneSheet
          key={editing === "new" ? "new" : editing.zone.id}
          storeId={storeId}
          money={money}
          country={country}
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

      {describing && (
        <DescribeZonesSheet storeId={storeId} existingZones={raw} onClose={() => setDescribing(false)} onChanged={() => router.refresh()} />
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
    </>
  );
}

function ZoneRow({
  view,
  money,
  color,
  disabled,
  onEdit,
  onDelete,
}: {
  view: ZoneView;
  money: StoreMoney;
  color: string;
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
    zone.freeOver !== null && t("freeOverSummary", { amount: formatEgp(locale, zone.freeOver), unit: moneyUnitMarked(locale, money) }),
    zone.codEnabled ? t("cod") : t("noCod"),
  ].filter(Boolean);

  return (
    <li
      className={cn(
        "grid grid-cols-[10px_minmax(0,1fr)_auto_auto] items-center gap-x-3.5 gap-y-2 rounded-[18px] border border-(--s-line) bg-(--s-surface) px-4 py-3.5 max-[720px]:grid-cols-[8px_minmax(0,1fr)_auto] max-[720px]:gap-x-2.5 max-[720px]:px-3",
        !zone.enabled && "opacity-70",
      )}
    >
      <i aria-hidden className="w-2.5 self-stretch rounded-[5px] max-[720px]:row-span-2 max-[720px]:w-2" style={{ background: color }} />
      <div className="flex min-w-0 flex-col gap-1.5">
        <b className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-bold text-(--s-ink)">
          <span className="min-w-0 wrap-break-word">{name}</span>
          {!zone.enabled && <Tag>{t("disabled")}</Tag>}
          {overrides && (
            <Tag className="max-w-full">
              <span className="truncate">{t("overrides", { zone: overrides })}</span>
            </Tag>
          )}
        </b>
        <ul className="flex flex-wrap gap-1">
          {visible.map((c) => (
            <li key={c.key} className="max-w-full truncate rounded-full bg-(--s-fill) px-2.5 py-0.5 text-xs text-(--s-muted)">
              {c.label}
            </li>
          ))}
          {hidden > 0 && (
            <li>
              <button
                type="button"
                className="inline-flex min-h-6 cursor-pointer items-center rounded-full bg-(--s-fill) px-2.5 py-0.5 text-xs font-semibold text-(--s-link) outline-none hover:bg-(--s-hover) focus-visible:outline-[3px] focus-visible:outline-(--s-focus)"
                aria-label={t("morePlacesLabel", { count: hidden })}
                onClick={() => setShowAll(true)}
              >
                {t("morePlaces", { count: hidden })}
              </button>
            </li>
          )}
        </ul>
        <small className="block text-xs text-(--s-subtle)">
          <MoneyText locale={locale}>{meta.join(" · ")}</MoneyText>
        </small>
      </div>
      <p className="whitespace-nowrap rounded-xl border-[1.5px] border-(--s-field) px-3 py-2 font-montserrat text-sm font-bold leading-tight text-(--s-ink) tabular-nums max-[720px]:self-start max-[720px]:px-2.5">
        <MoneyText locale={locale}>
          {zone.price === 0 ? t("free") : t("egp", { amount: formatEgp(locale, zone.price), unit: moneyUnitMarked(locale, money) })}
        </MoneyText>
      </p>
      <div className="flex items-center gap-0.5 max-[720px]:col-span-2 max-[720px]:col-start-2 max-[720px]:justify-end">
        <IconButton disabled={disabled} aria-label={t("edit")} onClick={onEdit}>
          <Pencil aria-hidden />
        </IconButton>
        <IconButton
          className="hover:bg-destructive-soft hover:text-destructive"
          disabled={disabled}
          aria-label={t("deleteTitle", { name })}
          onClick={onDelete}
        >
          <Trash2 aria-hidden />
        </IconButton>
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
function useSettingsForm(storeId: string, initial: Settings) {
  const t = useTranslations("storeShipping");
  // const locale = useLocale(); // Tallaby rates table only
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  // Seller delivery only while Tallaby delivery is disabled.
  // const [method, setMethod] = useState(initial.method);
  const method: Settings["method"] = "own";
  const [handlingDays, setHandlingDays] = useState(String(initial.handlingDays));
  const [otherPlaces, setOtherPlaces] = useState(initial.otherPlaces);
  // Store-wide free delivery on the seller's zones (F-13b): none, every order, or over an amount.
  const [freeMode, setFreeMode] = useState<FreeMode>(freeModeOf(initial.freeShippingOver));
  const [freeOver, setFreeOver] = useState(initial.freeShippingOver ? String(initial.freeShippingOver) : "");
  // const [showRates, setShowRates] = useState(false);
  const [isPending, startTransition] = useTransition();

  const next: Settings = {
    method,
    handlingDays: Number(handlingDays),
    freeShippingOver: freeShippingOverFor(freeMode, freeOver),
    otherPlaces,
  };
  // Field by field, so the save bar opens only when the seller changed something they can see.
  const changed =
    next.handlingDays !== saved.handlingDays ||
    next.otherPlaces !== saved.otherPlaces ||
    next.freeShippingOver !== (saved.freeShippingOver ?? null);

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

  const discard = () => {
    setHandlingDays(String(saved.handlingDays));
    setOtherPlaces(saved.otherPlaces);
    setFreeMode(freeModeOf(saved.freeShippingOver));
    setFreeOver(saved.freeShippingOver ? String(saved.freeShippingOver) : "");
  };

  const freeOverValid = freeMode !== "over" || (next.freeShippingOver !== null && next.freeShippingOver > 0);

  return {
    saved,
    handlingDays,
    setHandlingDays,
    otherPlaces,
    setOtherPlaces,
    freeMode,
    setFreeMode,
    freeOver,
    setFreeOver,
    freeOverValid,
    changed,
    isPending,
    submit,
    discard,
  };
}

type FreeMode = "none" | "all" | "over";

/** settings.shipping.freeShippingOver ↔ the three choices: null = none, 0 = every order, X = over X. */
function freeModeOf(value: number | null): FreeMode {
  return value === null ? "none" : value === 0 ? "all" : "over";
}

function freeShippingOverFor(mode: FreeMode, amount: string): number | null {
  if (mode === "none") return null;
  if (mode === "all") return 0;
  const n = Number(amount.replace(",", "."));
  return amount.trim() !== "" && Number.isFinite(n) ? n : null;
}

type SettingsForm = ReturnType<typeof useSettingsForm>;

/** The server accepts 0–30 days. */
const HANDLING_DAYS_MAX = 30;

function SettingsCard({ form, readOnly, money }: { form: SettingsForm; readOnly: boolean; money: StoreMoney }) {
  const t = useTranslations("storeShipping");
  const locale = useLocale();
  const { handlingDays, setHandlingDays, otherPlaces, setOtherPlaces, freeMode, setFreeMode, freeOver, setFreeOver, freeOverValid } = form;
  const stepDays = (delta: number) =>
    setHandlingDays(String(Math.min(HANDLING_DAYS_MAX, Math.max(0, (Number(handlingDays) || 0) + delta))));

  return (
    <StepCard id="shipping-settings" step={3} title={t("rulesTitle")} description={t("rulesDescription")} className="[animation-delay:.15s]">
      {/* Tallaby delivery disabled (owner, 2026-10-21); see the comment above useSettingsForm: the Tallaby/own
          ChoiceGroup, the seller-funded free-over field and Tallaby's read-only rate table were here. The same
          rates are now the "Tallaby's rates" shipping template. */}

      <fieldset className="flex min-w-0 flex-col gap-2.5">
        <legend className="mb-2.5 text-[13.5px] font-bold text-(--s-text)">{t("freeDelivery.title")}</legend>
        <OptionCards>
          {(
            [
              ["none", "freeDelivery.none", "freeDelivery.noneDescription"],
              ["over", "freeDelivery.over", "freeDelivery.overDescription"],
              ["all", "freeDelivery.all", "freeDelivery.allDescription"],
            ] as const
          ).map(([value, title, description]) => (
            <OptionCard
              key={value}
              name="free-delivery"
              value={value}
              checked={freeMode === value}
              disabled={readOnly}
              onChange={() => setFreeMode(value)}
              title={t(title)}
              description={t(description)}
            />
          ))}
        </OptionCards>
        {freeMode === "over" && (
          <div className="flex flex-wrap items-center gap-2.5 rounded-[14px] border border-(--tallaby-amber-100) bg-accent-soft px-3.5 py-3 text-[13px] text-accent-ink dark:border-transparent">
            <label htmlFor="free-over" className="font-semibold">
              {t("freeDelivery.amount", moneyParams(locale, money))}
            </label>
            <div className="w-40 max-w-full">
              <CurrencyInput
                {...money}
                id="free-over"
                disabled={readOnly}
                placeholder="500"
                value={freeOver}
                onChange={setFreeOver}
                invalid={!freeOverValid}
              />
            </div>
          </div>
        )}
        <p className="text-pretty text-xs text-(--s-faint)">{t("freeDelivery.note")}</p>
      </fieldset>

      <div className="h-px bg-(--s-line-soft)" />

      <div className="flex flex-col gap-2.5">
        <label htmlFor="handling-days" className="text-[13.5px] font-bold text-(--s-text)">
          {t("handlingDays")}
        </label>
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-(--s-muted)">
          <div dir="ltr" className="inline-flex h-11 items-stretch overflow-hidden rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface) focus-within:border-(--s-primary)">
            <button
              type="button"
              disabled={readOnly}
              aria-label={t("handlingDaysLess")}
              onClick={() => stepDays(-1)}
              className="grid w-11 cursor-pointer place-items-center text-(--s-primary) transition-colors duration-150 hover:bg-(--s-hover) disabled:pointer-events-none disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <input
              id="handling-days"
              type="number"
              inputMode="numeric"
              min={0}
              max={HANDLING_DAYS_MAX}
              disabled={readOnly}
              className="w-12 bg-transparent text-center font-montserrat text-base font-bold text-(--s-ink) outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              value={handlingDays}
              onChange={(e) => setHandlingDays(e.target.value)}
            />
            <button
              type="button"
              disabled={readOnly}
              aria-label={t("handlingDaysMore")}
              onClick={() => stepDays(1)}
              className="grid w-11 cursor-pointer place-items-center text-(--s-primary) transition-colors duration-150 hover:bg-(--s-hover) disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
          <span>{t("handlingDaysUnit")}</span>
        </div>
        <p className="text-pretty text-xs text-(--s-faint)">{t("handlingDaysHelp")}</p>
      </div>

      <div className="h-px bg-(--s-line-soft)" />

      {/* Quiet and last while the owner decides on "use Tallaby's rates": it still sets what customers pay in uncovered places. */}
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold text-(--s-muted)">{t("otherPlaces.title")}</legend>
        {money.currency === DEFAULT_CURRENCY ? (
          <>
            <OptionCards>
              <OptionCard
                name="other-places"
                value="tallaby_rates"
                checked={otherPlaces === "tallaby_rates"}
                disabled={readOnly}
                onChange={() => setOtherPlaces("tallaby_rates")}
                title={t("otherPlaces.tallabyRates")}
                description={t("otherPlaces.tallabyRatesDescription")}
              />
              <OptionCard
                name="other-places"
                value="refuse"
                checked={otherPlaces === "refuse"}
                disabled={readOnly}
                onChange={() => setOtherPlaces("refuse")}
                title={t("otherPlaces.refuse")}
                description={t("otherPlaces.refuseDescription")}
              />
            </OptionCards>
            <p className="text-pretty text-xs text-(--s-faint)">{t("otherPlaces.note")}</p>
          </>
        ) : (
          // Tallaby's rates are Egyptian pounds; the saved choice is kept in case the store goes back to EGP.
          <Note>{t("otherPlaces.notCovered", { unit: moneyUnitText(locale, money) })}</Note>
        )}
      </fieldset>
    </StepCard>
  );
}
