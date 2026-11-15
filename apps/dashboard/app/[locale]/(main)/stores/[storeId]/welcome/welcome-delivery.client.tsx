"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Check, CreditCard, LoaderCircle, MapPin, Pencil, Plus } from "lucide-react";
import { isMethodAllowedForCurrency, STORE_PAYMENT_METHODS, type StorePayments } from "@workspace/lib/payments/store-methods";
import { CurrencyInput } from "@/components/form/currency-input";
import { MoneyText } from "@/components/money";
import { PaymentMethodLogo } from "@/components/payments/payment-method-logo";
import { Field, Note, SellerButton, Tag, Toggle } from "@/components/seller-ui";
import { Link, useRouter } from "@/i18n/navigation";
import { moneyParams, moneyUnitMarked } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { requestSetupPromptCheck } from "../../../_components/setup-prompts.lib";
import { MethodSheet, type Change, type Entry, type LiveKey } from "../settings/payments/payments.client";
import { saveStorePaymentMethod } from "../settings/payments/payments.server";
import { applyShippingTemplate, saveShippingSettings, saveShippingZone } from "../shipping/shipping.server";
import { formatEgp, ZoneSheet } from "../shipping/zone-sheet.client";
import { parseWelcomeAmount } from "./welcome.lib";
import type { WelcomeData } from "./welcome.types";

type Delivery = WelcomeData["delivery"];

/** The schemas' limits: a zone price up to 10,000, a free-delivery threshold up to 1,000,000. */
const MAX_PRICE = 10_000;
const MAX_FREE_OVER = 1_000_000;
/** Zones listed in the summary before "and N more" (the Shipping page has the full list). */
const SUMMARY_LIMIT = 3;

const linkClass = "inline-flex min-h-10 items-center gap-1 text-[13px] font-bold text-(--s-link) underline-offset-4 hover:underline";

function afterSave(router: ReturnType<typeof useRouter>) {
  router.refresh();
  requestSetupPromptCheck();
}

/**
 * Step 2a: the delivery price. A store with no zones gets one suggested zone
 * (`welcomeShippingDefault`): "All Egypt" at 60, saved with the `egypt_flat`
 * template, or one zone for the store's country with a price the seller types,
 * saved as a zone. A currency with no one country opens the zone sheet. Free
 * delivery above an amount saves the whole shipping settings object. Once the
 * store has zones this shows a summary and never applies the template again.
 */
export function WelcomeShippingStep({ storeId, delivery, disabled }: { storeId: string; delivery: Delivery; disabled: boolean }) {
  const t = useTranslations("storeWelcome.steps.shipping");
  const tShipping = useTranslations("storeShipping");
  const locale = useLocale();
  const router = useRouter();
  const { money, shipping } = delivery;
  const { suggested } = shipping;
  const [price, setPrice] = useState(suggested.kind === "egypt_flat" ? String(suggested.price) : "");
  const [freeOn, setFreeOn] = useState(false);
  const [freeOver, setFreeOver] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const busy = disabled || saving;

  const priceValue = parseWelcomeAmount(price, MAX_PRICE);
  const freeValue = freeOn ? parseWelcomeAmount(freeOver, MAX_FREE_OVER, true) : null;
  const unit = moneyUnitMarked(locale, money);
  const amount = (n: number) => (n === 0 ? tShipping("free") : tShipping("egp", { amount: formatEgp(locale, n), unit }));

  const save = () => {
    setSubmitted(true);
    if (priceValue === null || (freeOn && freeValue === null) || !shipping.zoneNames) return;
    const names = shipping.zoneNames;
    startSaving(async () => {
      const zone =
        suggested.kind === "egypt_flat"
          ? await applyShippingTemplate(storeId, { template: "egypt_flat", names: [names], price: priceValue, replace: false })
          : suggested.kind === "country"
            ? await saveShippingZone(storeId, null, {
                nameAr: names.nameAr,
                nameEn: names.nameEn,
                places: [suggested.country],
                price: priceValue,
                freeOver: null,
                deliveryDaysMin: 1,
                deliveryDaysMax: 3,
                codEnabled: true,
                enabled: true,
              })
            : null;
      if (!zone) return;
      if (!zone.success) {
        toast.error(tShipping(`errors.${zone.error}`));
        afterSave(router);
        return;
      }
      if (freeOn && freeValue !== null) {
        // The settings schema is strict: send the whole parsed object with the one field changed.
        const settings = await saveShippingSettings(storeId, { ...shipping.settings, freeShippingOver: freeValue });
        if (!settings.success) {
          toast.error(tShipping(`errors.${settings.error}`));
          afterSave(router);
          return;
        }
      }
      toast.success(t("saved"));
      afterSave(router);
    });
  };

  const sheet = sheetOpen && (
    <ZoneSheet
      storeId={storeId}
      money={money}
      country={shipping.country}
      zone={null}
      otherZones={shipping.zones}
      onClose={() => setSheetOpen(false)}
      onSaved={() => {
        setSheetOpen(false);
        afterSave(router);
      }}
    />
  );

  if (shipping.zones.length > 0) {
    const shown = shipping.zones.slice(0, SUMMARY_LIMIT);
    const freeOverSaved = shipping.settings.freeShippingOver;
    return (
      <>
        <div className="flex flex-col gap-2 rounded-2xl border border-(--s-line) bg-(--s-surface) px-3.5 py-3">
          <p className="text-[13px] font-semibold text-(--s-muted)">{t("zonesSummary", { count: shipping.zones.length })}</p>
          <ul className="flex flex-col gap-1.5">
            {shown.map((zone) => (
              <li key={zone.id} className={cn("flex items-center justify-between gap-3 text-[14px]", !zone.enabled && "opacity-60")}>
                <span className="min-w-0 truncate font-semibold text-(--s-ink)">{(locale !== "ar" && zone.nameEn) || zone.nameAr}</span>
                <span className="shrink-0 font-montserrat text-[13.5px] font-bold text-(--s-ink) tabular-nums">
                  <MoneyText locale={locale}>{amount(zone.price)}</MoneyText>
                </span>
              </li>
            ))}
          </ul>
          {shipping.zones.length > shown.length && <p className="text-xs text-(--s-subtle)">{t("moreZones", { count: shipping.zones.length - shown.length })}</p>}
          {freeOverSaved !== null && (
            <p className="text-xs text-(--s-subtle)">
              <MoneyText locale={locale}>{freeOverSaved === 0 ? t("freeAll") : t("freeSummary", { amount: amount(freeOverSaved) })}</MoneyText>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <SellerButton variant="outline" size="sm" disabled={busy} onClick={() => setSheetOpen(true)}>
            <Plus aria-hidden />
            {tShipping("addZone")}
          </SellerButton>
          <Link href={`/stores/${storeId}/shipping`} className={linkClass}>
            {t("edit")}
            <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden />
          </Link>
        </div>
        {sheet}
      </>
    );
  }

  if (suggested.kind === "none" || !shipping.zoneNames) {
    return (
      <>
        <Note>{t("noCountry")}</Note>
        <SellerButton variant="solid" className="self-start max-[600px]:w-full" disabled={busy} onClick={() => setSheetOpen(true)}>
          <Plus aria-hidden />
          {tShipping("addZone")}
        </SellerButton>
        {sheet}
      </>
    );
  }

  const priceInvalid = submitted && priceValue === null;
  const freeInvalid = submitted && freeOn && freeValue === null;

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border border-(--s-line) bg-(--s-surface) p-3.5">
        <p className="flex items-center gap-2 text-[14px] font-bold text-(--s-ink)">
          <MapPin className="size-4 text-(--s-subtle)" aria-hidden />
          {shipping.zoneLabel}
        </p>
        <Field
          label={t("priceLabel")}
          htmlFor="welcome-shipping-price"
          note={suggested.kind === "egypt_flat" ? t("priceHint") : t("priceHintAbroad")}
          error={priceInvalid ? tShipping("templates.egyptFlat.priceError") : undefined}
        >
          <CurrencyInput
            {...money}
            id="welcome-shipping-price"
            disabled={busy}
            invalid={priceInvalid}
            value={price}
            onChange={setPrice}
          />
        </Field>
        <div className="flex flex-col gap-2.5">
          <Toggle
            className="w-full flex-row-reverse justify-between text-[13.5px] text-(--s-text)"
            label={t("freeToggle")}
            checked={freeOn}
            disabled={busy}
            onCheckedChange={setFreeOn}
          />
          {freeOn && (
            <Field
              label={tShipping("freeDelivery.amount", moneyParams(locale, money))}
              htmlFor="welcome-free-over"
              error={freeInvalid ? t("freeOverError") : undefined}
            >
              <CurrencyInput {...money} id="welcome-free-over" placeholder="500" disabled={busy} invalid={freeInvalid} value={freeOver} onChange={setFreeOver} />
            </Field>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 max-[600px]:flex-col max-[600px]:items-stretch">
        <SellerButton variant="solid" disabled={busy} onClick={save}>
          {saving ? <LoaderCircle className="animate-spin" aria-hidden /> : <Check aria-hidden />}
          {t("save")}
        </SellerButton>
        <SellerButton variant="outline" disabled={busy} onClick={() => setSheetOpen(true)}>
          <Pencil aria-hidden />
          {t("adjust")}
        </SellerButton>
      </div>
      {sheet}
    </>
  );
}

/** InstaPay first, then the mobile wallets, as Settings › Payments lists them. */
const TRANSFERS: LiveKey[] = [
  "instapay",
  ...STORE_PAYMENT_METHODS.filter((m) => m.status === "live" && m.key !== "cod" && m.key !== "instapay").map((m) => m.key as LiveKey),
];

/**
 * Step 2b: how customers pay. Cash on delivery is on; Confirm saves it, which
 * marks payments as set up. InstaPay and the wallets open the same details
 * sheet as Settings › Payments (saving turns the method on). Card gateways
 * are only a link to Settings › Payments (owner, 2026-11-15).
 */
export function WelcomePaymentsStep({
  storeId,
  delivery,
  done,
  disabled,
}: {
  storeId: string;
  delivery: Delivery;
  done: boolean;
  disabled: boolean;
}) {
  const t = useTranslations("storeWelcome.steps.payments");
  const tPayments = useTranslations("storePayments");
  const tApp = useTranslations("storeApps.providers");
  const router = useRouter();
  const { money, payments } = delivery;
  const [methods, setMethods] = useState<StorePayments>(payments.methods);
  const [editing, setEditing] = useState<LiveKey | null>(null);
  const [saving, startSaving] = useTransition();
  const busy = disabled || saving;
  const entry = (key: LiveKey) => methods[key] as Entry | undefined;
  const transfers = TRANSFERS.filter((key) => isMethodAllowedForCurrency(money.currency, key));
  const codOn = entry("cod")?.enabled ?? false;

  const save = (key: LiveKey, change: Change, onDone?: () => void) =>
    startSaving(async () => {
      const result = await saveStorePaymentMethod(storeId, key, change);
      if (!result.success) {
        toast.error(tPayments(`errors.${result.error}`));
        return;
      }
      setMethods(result.data);
      toast.success(tPayments("saved"));
      onDone?.();
      afterSave(router);
    });

  const status = (key: LiveKey) => {
    const e = entry(key);
    if (key !== "cod" && !e?.details) return <Tag tone="warning">{tPayments("status.notSetUp")}</Tag>;
    return e?.enabled ? <Tag tone="success">{tPayments("status.on")}</Tag> : <Tag>{tPayments("status.off")}</Tag>;
  };

  const row = (key: LiveKey, action: React.ReactNode) => {
    const label = tPayments(`methods.${key}.name`);
    return (
      <li key={key} className="flex items-center gap-3 px-3.5 py-3 [&+&]:border-t [&+&]:border-(--s-line-soft)">
        <PaymentMethodLogo method={key} label={label} className="size-9 rounded-xl border-(--s-line)" />
        <div className="min-w-0 flex-1">
          <b className="flex flex-wrap items-center gap-2 text-[14px] font-bold text-(--s-text)">
            {label}
            {status(key)}
          </b>
          {key === "cod" && <small className="block text-xs leading-relaxed text-(--s-subtle)">{tPayments("methods.cod.description")}</small>}
        </div>
        {action}
      </li>
    );
  };

  const gatewayNames = payments.gatewayProviders.map((provider) => tApp(`${provider}.name`)).join(t("listSeparator"));

  return (
    <>
      <ul className="overflow-hidden rounded-2xl border border-(--s-line) bg-(--s-surface)">
        {row(
          "cod",
          !done && codOn ? (
            <SellerButton size="sm" variant="solid" disabled={busy} onClick={() => save("cod", { enabled: true })}>
              {saving && editing === null ? <LoaderCircle className="animate-spin" aria-hidden /> : <Check aria-hidden />}
              {t("confirm")}
            </SellerButton>
          ) : null,
        )}
      </ul>

      {transfers.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold text-(--s-muted)">{t("transfersTitle")}</p>
          <ul className="overflow-hidden rounded-2xl border border-(--s-line) bg-(--s-surface)">
            {transfers.map((key) =>
              row(
                key,
                <SellerButton
                  size="xs"
                  variant={entry(key)?.details ? "mini" : "outline"}
                  disabled={busy}
                  onClick={() => setEditing(key)}
                  aria-label={`${entry(key)?.details ? tPayments("edit") : tPayments("setUp")}: ${tPayments(`methods.${key}.name`)}`}
                >
                  {entry(key)?.details ? <Pencil aria-hidden /> : <Plus aria-hidden />}
                  {entry(key)?.details ? tPayments("edit") : tPayments("setUp")}
                </SellerButton>,
              ),
            )}
          </ul>
        </div>
      )}

      {payments.gatewayProviders.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-(--s-field-strong) px-3.5 py-3">
          <CreditCard className="size-5 shrink-0 text-(--s-subtle)" aria-hidden />
          <div className="min-w-0 flex-1">
            <b className="block text-[14px] font-bold text-(--s-text)">{t("cardsTitle")}</b>
            <small className="block text-xs leading-relaxed text-(--s-subtle)">
              {payments.gateway ? t("cardsConnected", { gateway: tApp(`${payments.gateway}.name`) }) : t("cardsBody", { gateways: gatewayNames })}
            </small>
          </div>
          <Link href={`/stores/${storeId}/settings/payments`} className={cn(linkClass, "shrink-0")}>
            {t("cardsLink")}
            <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden />
          </Link>
        </div>
      )}

      {editing && (
        <MethodSheet
          key={editing}
          methodKey={editing}
          money={money}
          entry={entry(editing)}
          pending={saving}
          onClose={() => setEditing(null)}
          onSave={(change) => save(editing, change, () => setEditing(null))}
        />
      )}
    </>
  );
}
