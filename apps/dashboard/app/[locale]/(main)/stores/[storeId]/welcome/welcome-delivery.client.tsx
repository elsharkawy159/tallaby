"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Check, LoaderCircle, MapPin, Plus } from "lucide-react";
import { CurrencyInput } from "@/components/form/currency-input";
import { MoneyText } from "@/components/money";
import { Field, Note, SellerButton } from "@/components/seller-ui";
import { Link, useRouter } from "@/i18n/navigation";
import { moneyUnitMarked } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { requestSetupPromptCheck } from "../../../_components/setup-prompts.lib";
import { applyShippingTemplate, saveShippingZone } from "../shipping/shipping.server";
import { formatEgp, ZoneSheet } from "../shipping/zone-sheet.client";
import { parseWelcomeAmount } from "./welcome.lib";
import type { WelcomeData } from "./welcome.types";

type Delivery = WelcomeData["delivery"];

/** The zone schema's limit: a price up to 10,000. */
const MAX_PRICE = 10_000;
/** Zones listed in the summary before "and N more" (the Shipping page has the full list). */
const SUMMARY_LIMIT = 3;

function afterSave(router: ReturnType<typeof useRouter>) {
  router.refresh();
  requestSetupPromptCheck();
}

/**
 * The delivery price: one field and one button. A store with no zones gets
 * one suggested zone (`welcomeShippingDefault`): "All Egypt" at 60, saved with
 * the `egypt_flat` template, or one zone for the store's country with a price
 * the seller types, saved as a zone. A currency with no one country opens the
 * zone sheet. Once the store has zones this shows a summary and the link to
 * the Shipping page, and never applies the template again.
 */
export function WelcomeShippingStep({ storeId, delivery, disabled }: { storeId: string; delivery: Delivery; disabled: boolean }) {
  const t = useTranslations("storeWelcome.steps.shipping");
  const tShipping = useTranslations("storeShipping");
  const locale = useLocale();
  const router = useRouter();
  const { money, shipping } = delivery;
  const { suggested } = shipping;
  const [price, setPrice] = useState(suggested.kind === "egypt_flat" ? String(suggested.price) : "");
  const [submitted, setSubmitted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const busy = disabled || saving;

  const priceValue = parseWelcomeAmount(price, MAX_PRICE);
  const unit = moneyUnitMarked(locale, money);
  const amount = (n: number) => (n === 0 ? tShipping("free") : tShipping("egp", { amount: formatEgp(locale, n), unit }));

  const save = () => {
    setSubmitted(true);
    if (priceValue === null || !shipping.zoneNames) return;
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
      if (zone.success) toast.success(t("saved"));
      else toast.error(tShipping(`errors.${zone.error}`));
      afterSave(router);
    });
  };

  if (shipping.zones.length > 0) {
    const shown = shipping.zones.slice(0, SUMMARY_LIMIT);
    const freeOverSaved = shipping.freeShippingOver;
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
        <Link
          href={`/stores/${storeId}/shipping`}
          className="inline-flex min-h-11 items-center gap-1 self-start text-[13px] font-bold text-(--s-link) underline-offset-4 hover:underline"
        >
          {t("edit")}
          <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden />
        </Link>
      </>
    );
  }

  if (suggested.kind === "none" || !shipping.zoneNames) {
    return (
      <>
        <Note>{t("noCountry")}</Note>
        <SellerButton variant="solid" className="h-11 self-start max-[600px]:w-full" disabled={busy} onClick={() => setSheetOpen(true)}>
          <Plus aria-hidden />
          {tShipping("addZone")}
        </SellerButton>
        {sheetOpen && (
          <ZoneSheet
            storeId={storeId}
            money={money}
            country={null}
            zone={null}
            otherZones={shipping.zones}
            onClose={() => setSheetOpen(false)}
            onSaved={() => {
              setSheetOpen(false);
              afterSave(router);
            }}
          />
        )}
      </>
    );
  }

  const priceInvalid = submitted && priceValue === null;

  return (
    <form
      className="flex flex-col gap-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
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
        <CurrencyInput {...money} id="welcome-shipping-price" disabled={busy} invalid={priceInvalid} value={price} onChange={setPrice} />
      </Field>
      <SellerButton type="submit" variant="solid" className="h-11 self-start max-[600px]:w-full" disabled={busy}>
        {saving ? <LoaderCircle className="animate-spin" aria-hidden /> : <Check aria-hidden />}
        {t("save")}
      </SellerButton>
    </form>
  );
}
