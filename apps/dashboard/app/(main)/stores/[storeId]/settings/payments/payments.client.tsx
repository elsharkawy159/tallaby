"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { AtSign, Banknote, Check, CircleDashed, Clock, Eye, HandCoins, Landmark, Link2, LoaderCircle, Pencil, Plus, Settings2, Smartphone, TriangleAlert } from "lucide-react";
import { DEPOSIT_PERCENTS, computeDepositPiastres, type CodDepositSetting, type DepositPercent } from "@workspace/lib/orders/cod-deposit";

import {
  INSTAPAY_RECEIVE_TYPES,
  STORE_PAYMENT_METHODS,
  codSettingsSchema,
  instapayDetailsSchema,
  instapayReceiveType,
  operatorHint,
  walletDetailsSchema,
  type InstapayReceiveType,
  type StorePayments,
} from "@workspace/lib/payments/store-methods";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Field, Note, Rows, SectionCard, SellerButton, Tag, TextArea, TextInput, Toggle, fieldClass } from "@/components/seller-ui";
import { DEFAULT_CURRENCY } from "@workspace/lib";
import { gatewaySupportsCurrency, isTransferAllowedForCurrency } from "@workspace/lib/payments/store-methods";
import { CurrencyInput } from "@/components/form/currency-input";
import { moneyUnitText, type MoneyUnit } from "@/lib/i18n/format";
import { PaymentMethodLogo } from "@/components/payments/payment-method-logo";
import { cn } from "@/lib/utils";
import { saveCodDeposit, saveDefaultPaymentMethod, saveStorePaymentMethod } from "./payments.server";
import { toDetails, type PaymentDetailsFormValues } from "./payments.dto";
import type { StoreGatewayOverview } from "@workspace/lib/payments/store-gateways/server";
import { APP_DRAWER_CLASS, APP_DRAWER_FOOTER_CLASS } from "../../apps/app-drawer.lib";
import { StoreGatewaysCard } from "./gateways.client";

type LiveKey = "cod" | "vodafone_cash" | "e_cash" | "we_pay" | "orange_cash" | "instapay";
type Entry = { enabled: boolean; details?: Record<string, string>; fee?: number; maxOrder?: number; note?: string };
type Change = { enabled: boolean; details?: unknown; fee?: number; maxOrder?: number | null; note?: string };

const LIVE = STORE_PAYMENT_METHODS.filter((m) => m.status === "live");
const WALLETS = LIVE.filter((m) => m.key !== "cod").map((m) => m.key as LiveKey);
// Card payments have their own card (StoreGatewaysCard: the seller's gateway, Tallaby Pay soon).
const SOON = STORE_PAYMENT_METHODS.filter((m) => m.status === "soon" && m.key !== "card");
const EMPTY: PaymentDetailsFormValues = { holderName: "", phone: "", ipa: "", iban: "", paymentLink: "" };

/** InstaPay "receive by" choices: the field each one fills and how it reads. */
const RECEIVE_INPUT: Record<
  InstapayReceiveType,
  { icon: typeof AtSign; placeholder: string; inputMode?: "tel" | "email" | "url" }
> = {
  ipa: { icon: AtSign, placeholder: "name@instapay", inputMode: "email" },
  phone: { icon: Smartphone, placeholder: "01XXXXXXXXX", inputMode: "tel" },
  iban: { icon: Landmark, placeholder: "EG00 0000 0000 0000 0000 0000 0000 0" },
  paymentLink: { icon: Link2, placeholder: "https://ipn.eg/…", inputMode: "url" },
};

/** Field errors from the shared detail schemas, keyed by field. */
function fieldErrors(
  kind: "wallet" | "instapay",
  v: PaymentDetailsFormValues,
  receiveBy: InstapayReceiveType,
): Partial<Record<keyof PaymentDetailsFormValues, string>> {
  // The picked InstaPay identifier is required; the schema alone would call an empty one "invalid".
  if (kind === "instapay" && !v[receiveBy].trim()) {
    const rest = fieldErrors(kind, { ...v, [receiveBy]: "x" }, receiveBy);
    return { ...rest, [receiveBy]: "identifier_required" };
  }
  const schema = kind === "wallet" ? walletDetailsSchema : instapayDetailsSchema;
  const parsed = schema.safeParse(toDetails(kind, v, receiveBy));
  if (parsed.success) return {};
  const out: Partial<Record<keyof PaymentDetailsFormValues, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = (issue.path[0] as keyof PaymentDetailsFormValues) ?? "holderName";
    out[field] ??= ["phone_invalid", "ipa_invalid", "iban_invalid", "iban_checksum", "link_invalid", "identifier_required"].includes(issue.message)
      ? issue.message
      : field === "holderName"
        ? "holder_invalid"
        : "invalid";
  }
  return out;
}

/** "010 •••• 5678": enough to recognise the number without showing it. */
const maskNumber = (n: string) => (n.length > 7 ? `${n.slice(0, 3)} •••• ${n.slice(-4)}` : n);

/**
 * Store settings › Payment methods: a Cash card and a Wallets & instant transfer
 * card, the seller's card gateway, then the methods coming soon, beside what the
 * customer sees at checkout. COD is always set up; a wallet is "not set up" until
 * it has details. Each change saves at once, so this page has no save bar.
 */
export function StorePaymentsSettings({
  money,
  storeId,
  initial,
  initialDeposit,
  gateways,
  readOnly,
  usdLive,
}: {
  /** The store's currency: the cash fee and maximum are in it. */
  money: MoneyUnit;
  storeId: string;
  initial: StorePayments;
  /** `stores.settings.codDeposit` (F-21). */
  initialDeposit: CodDepositSetting | null;
  gateways: StoreGatewayOverview;
  readOnly: boolean;
  /** The USD switch (0136): the order fee is no longer EGP 5. */
  usdLive: boolean;
}) {
  const t = useTranslations("storePayments");
  const tSetup = useTranslations("storeSetup");
  const tApp = useTranslations("storeApps.providers");
  const locale = useLocale();
  const router = useRouter();
  const [payments, setPayments] = useState<StorePayments>(initial);
  const [editing, setEditing] = useState<LiveKey | null>(null);
  const [isPending, startTransition] = useTransition();
  const entry = (key: LiveKey) => payments[key] as Entry | undefined;
  const isSetUp = (key: LiveKey) => key === "cod" || !!entry(key)?.details;
  // Egyptian wallets, InstaPay and card payment work only in pounds. The saved settings stay, in case the store goes back to EGP.
  const egyptian = (money.currency ?? DEFAULT_CURRENCY) === DEFAULT_CURRENCY;
  const egyptOnly = (key: LiveKey) => !egyptian && key !== "cod" && !isTransferAllowedForCurrency(key, money.currency ?? DEFAULT_CURRENCY);
  const enabledKeys = LIVE.map((m) => m.key as LiveKey).filter((key) => entry(key)?.enabled && !egyptOnly(key));
  const enabledCount = enabledKeys.length;

  const save = (key: LiveKey, change: Change, onDone?: () => void) =>
    startTransition(async () => {
      const result = await saveStorePaymentMethod(storeId, key, change);
      if (result.success) {
        setPayments(result.data);
        toast.success(t("saved"));
        onDone?.();
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });

  const toggle = (key: LiveKey, on: boolean) => {
    // The last enabled method stays on; the server refuses it too.
    if (!on && enabledCount <= 1) {
      toast.error(t("errors.lastMethod"));
      return;
    }
    save(key, { enabled: on });
  };

  const row = (key: LiveKey) => {
    const e = entry(key);
    const setUp = isSetUp(key);
    const off = egyptOnly(key);
    const on = !!e?.enabled && !off;
    const locked = on && enabledCount <= 1;
    const label = t(`methods.${key}.name`);
    return (
      <div key={key} className="flex flex-wrap items-center gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-(--s-tint) [&+&]:border-t [&+&]:border-(--s-line-soft)">
        <PaymentMethodLogo method={key} label={label} className="size-10 rounded-xl border-(--s-line)" />
        <div className="min-w-0 flex-1 basis-[180px]">
          <b className="flex flex-wrap items-center gap-2 text-sm font-bold text-(--s-text)">
            {label}
            <StatusTag setUp={setUp} on={on} />
          </b>
          <small className="block text-xs leading-relaxed text-(--s-subtle)">{t(`methods.${key}.description`)}</small>
          <DetailsLine methodKey={key} entry={e} money={money} />
        </div>
        <div className="ms-auto flex items-center gap-2.5">
          {setUp ? (
            <>
              <SellerButton variant="mini" size="xs" disabled={readOnly || isPending || off} onClick={() => setEditing(key)}>
                <Pencil aria-hidden />
                {t("edit")}
              </SellerButton>
              <Toggle
                checked={on}
                disabled={readOnly || isPending || off}
                aria-disabled={locked || undefined}
                className={cn("max-[600px]:min-h-10", locked && "opacity-55")}
                title={locked ? t("lastMethodLocked") : undefined}
                onCheckedChange={(next) => toggle(key, next)}
                aria-label={t("toggle", { method: label })}
              />
            </>
          ) : (
            <SellerButton variant="solid" size="xs" disabled={readOnly || isPending || off} onClick={() => setEditing(key)}>
              <Plus aria-hidden />
              {t("setUp")}
            </SellerButton>
          )}
        </div>
      </div>
    );
  };

  const connectedGateway = gateways.connected?.provider;
  const codFee = entry("cod")?.fee;
  // A deposit is paid to the seller: an enabled wallet / InstaPay, or the card gateway in this currency (F-21).
  const gatewayPays = Boolean(connectedGateway && gatewaySupportsCurrency(connectedGateway, money.currency ?? DEFAULT_CURRENCY));
  const depositPayable = gatewayPays || enabledKeys.some((key) => key !== "cod");
  const codOn = enabledKeys.includes("cod");

  // The customer's list in checkout order (cash, card, then transfers), as checkout values.
  const previewMethods: { value: string; label: string; logo?: string }[] = [
    ...(enabledKeys.includes("cod") ? [{ value: "cash_on_delivery", label: t("methods.cod.name"), logo: "cod" }] : []),
    ...(connectedGateway && gatewaySupportsCurrency(connectedGateway, money.currency ?? DEFAULT_CURRENCY) ? [{ value: "online_payment", label: tApp(`${connectedGateway}.name`), logo: "card" }] : []),
    ...enabledKeys.filter((key) => key !== "cod").map((key) => ({ value: key, label: t(`methods.${key}.name`), logo: key })),
  ];
  // As checkout: the seller's pick while it is offered, else the first method.
  const effectiveDefault = previewMethods.some((m) => m.value === payments.defaultMethod) ? payments.defaultMethod : previewMethods[0]?.value;

  const chooseDefault = (method: string) =>
    startTransition(async () => {
      const result = await saveDefaultPaymentMethod(storeId, method);
      if (result.success) {
        setPayments(result.data);
        toast.success(t("defaultMethodSaved"));
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });

  return (
    <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start gap-4 max-[860px]:grid-cols-1">
      <div className="flex min-w-0 flex-col gap-4">
        {readOnly && <Note tone="amber">{t("readOnly")}</Note>}
        {!egyptian && <Note tone="amber">{t("currencyNotice", { unit: moneyUnitText(locale, money) })}</Note>}
        <Note>{t(usdLive ? "checkoutNoticeUsd" : "checkoutNotice")}</Note>

        <SectionCard icon={Banknote} tone="success" title={t("cashTitle")} description={t("cashDescription")}>
          <Rows>{row("cod")}</Rows>
          <DepositSettings
            storeId={storeId}
            initial={initialDeposit}
            codOn={codOn}
            payable={depositPayable}
            money={money}
            readOnly={readOnly}
          />
        </SectionCard>

        <SectionCard
          icon={Smartphone}
          title={
            <>
              {t("walletsTitle")}
              <Tag>{t("walletsCount", { on: WALLETS.filter((k) => entry(k)?.enabled).length, total: WALLETS.length })}</Tag>
            </>
          }
          description={t("walletsDescription")}
        >
          <Rows>{WALLETS.map(row)}</Rows>
        </SectionCard>

        <StoreGatewaysCard storeId={storeId} initial={gateways} readOnly={readOnly} usdLive={usdLive} currency={money.currency ?? DEFAULT_CURRENCY} />

        <SectionCard icon={Clock} tone="accent" title={t("soonTitle")} description={t("soonDescription")}>
          <ul className="flex flex-wrap gap-1.5">
            {SOON.map((m) => {
              const label = t(`methods.${m.key}.name`);
              return (
                <li key={m.key} className="inline-flex h-10 items-center gap-2 rounded-full border border-(--s-field) bg-(--s-surface) ps-1.5 pe-2.5 text-[13px] font-semibold text-(--s-muted)">
                  <PaymentMethodLogo method={m.key} label={label} className="size-7 rounded-full border-(--s-line) text-[9px]" />
                  {label}
                  <Tag tone="warning">{t("soon")}</Tag>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      {/* Follows every save; the store's real checkout list, with no sample amounts. Tapping a method makes it the one checkout selects first. */}
      <SectionCard
        icon={Eye}
        title={tSetup("customerSeesTitle")}
        description={t("defaultMethodHint")}
        className="sticky top-[140px] max-[860px]:static"
      >
        <div role="radiogroup" aria-label={t("defaultMethodLabel")} className="flex flex-col gap-2 rounded-[18px] border border-(--s-line) bg-(--s-tint) p-3.5">
          <b className="text-sm font-bold text-(--s-ink)">{tSetup("customerSeesHeading")}</b>
          {previewMethods.map((method) => {
            const selected = method.value === effectiveDefault;
            return (
              <button
                key={method.value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={readOnly || isPending}
                onClick={() => !selected && chooseDefault(method.value)}
                className={cn(
                  "flex min-h-11 w-full items-center gap-2.5 rounded-[14px] border-[1.5px] border-(--s-line) bg-(--s-surface) px-3 py-2.5 text-start transition-colors duration-150 enabled:hover:border-(--s-field-strong) disabled:cursor-default",
                  selected && "border-(--s-primary) enabled:hover:border-(--s-primary)",
                )}
              >
                <span className={cn("size-4 shrink-0 rounded-full border-2 border-(--s-field-strong)", selected && "border-[5px] border-(--s-primary)")} />
                {method.logo && <PaymentMethodLogo method={method.logo} label="" className="size-7 rounded-lg border-(--s-line) text-[9px]" />}
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-(--s-text)">{method.label}</span>
                {selected ? (
                  <Tag tone="success">{t("defaultMethodTag")}</Tag>
                ) : method.value === "cash_on_delivery" && codFee ? (
                  <small className="text-[11.5px] whitespace-nowrap text-(--s-subtle)">{t("codFeeLine", { fee: codFee, currency: moneyUnitText(locale, money) })}</small>
                ) : null}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {editing && (
        <MethodSheet
          key={editing}
          methodKey={editing}
          money={money}
          entry={entry(editing)}
          pending={isPending}
          onClose={() => setEditing(null)}
          onSave={(change) => save(editing, change, () => setEditing(null))}
        />
      )}
    </div>
  );
}

function StatusTag({ setUp, on }: { setUp: boolean; on: boolean }) {
  const t = useTranslations("storePayments");
  if (!setUp) {
    return (
      <Tag tone="warning">
        <CircleDashed aria-hidden />
        {t("status.notSetUp")}
      </Tag>
    );
  }
  if (on) {
    return (
      <Tag tone="success">
        <Check aria-hidden />
        {t("status.on")}
      </Tag>
    );
  }
  return <Tag>{t("status.off")}</Tag>;
}

function DetailsLine({ methodKey, entry, money }: { methodKey: LiveKey; entry?: Entry; money: MoneyUnit }) {
  const t = useTranslations("storePayments");
  const locale = useLocale();
  const unit = moneyUnitText(locale, money);
  const line = "mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-(--s-muted)";
  const icon = "size-3.5 text-(--s-subtle)";
  if (methodKey === "cod") {
    const parts = [entry?.fee ? t("codFeeLine", { fee: entry.fee, currency: unit }) : t("codNoFee")];
    if (entry?.maxOrder) parts.push(t("codMaxSummary", { max: entry.maxOrder, currency: unit }));
    return (
      <p className={line}>
        <Settings2 className={icon} aria-hidden />
        {parts.join(" · ")}
      </p>
    );
  }
  const d = entry?.details;
  if (!d) return null;
  const type = methodKey === "instapay" ? instapayReceiveType(d) : "phone";
  const id =
    type === "ipa" ? d.ipa
    : type === "phone" ? maskNumber(d.phone ?? "")
    : type === "iban" ? `•••• ${d.iban?.slice(-4)}`
    : t("receiveBy.paymentLink");
  const Icon = RECEIVE_INPUT[type].icon;
  return (
    <p className={line}>
      <Icon className={icon} aria-hidden />
      <bdi dir="ltr" className="font-montserrat">
        {id}
      </bdi>
      · {t("holderSummary", { name: d.holderName })}
    </p>
  );
}

function MethodSheet({
  methodKey,
  money,
  entry,
  pending,
  onClose,
  onSave,
}: {
  methodKey: LiveKey;
  money: MoneyUnit;
  entry?: Entry;
  pending: boolean;
  onClose: () => void;
  onSave: (change: Change) => void;
}) {
  const t = useTranslations("storePayments");
  const locale = useLocale();
  const label = t(`methods.${methodKey}.name`);
  const kind = methodKey === "cod" ? "cod" : methodKey === "instapay" ? "instapay" : "wallet";
  const setUp = kind === "cod" || !!entry?.details;
  const [values, setValues] = useState<PaymentDetailsFormValues>({ ...EMPTY, ...(entry?.details ?? {}) });
  const [receiveBy, setReceiveBy] = useState<InstapayReceiveType>(() => instapayReceiveType(entry?.details));
  const [fee, setFee] = useState(entry?.fee ? String(entry.fee) : "");
  const [maxOrder, setMaxOrder] = useState(entry?.maxOrder ? String(entry.maxOrder) : "");
  const [note, setNote] = useState(entry?.note ?? "");
  const [submitted, setSubmitted] = useState(false);

  const errors = kind === "cod" ? {} : fieldErrors(kind, values, receiveBy);
  const feeValue = fee ? Number(fee) : 0;
  const maxValue = maxOrder ? Number(maxOrder) : undefined;
  const feeValid = Number.isInteger(feeValue) && feeValue >= 0 && feeValue <= 500;
  const maxValid = codSettingsSchema.shape.maxOrder.safeParse(maxValue).success;
  const hint = kind === "wallet" && values.phone ? operatorHint(values.phone) : null;
  const hintMismatch = kind === "wallet" && hint && hint !== methodKey;
  // Saving details turns the method on; it can be switched off from the list.
  const enabled = methodKey === "cod" ? (entry?.enabled ?? true) : true;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (kind === "cod") {
      if (feeValid && maxValid) onSave({ enabled, fee: feeValue, maxOrder: maxValue ?? null, note: note.trim() });
      return;
    }
    if (Object.keys(errors).length === 0) onSave({ enabled, details: toDetails(kind, values, receiveBy) });
  };

  const field = (
    name: keyof PaymentDetailsFormValues,
    opts: { ltr?: boolean; placeholder?: string; inputMode?: "tel" | "email" | "url"; help?: string; label?: string } = {},
  ) => {
    const error = submitted ? errors[name] : undefined;
    return (
      <Field
        label={opts.label ?? t(`fields.${name}`)}
        htmlFor={`pm-${name}`}
        note={opts.help}
        error={error ? t(`fieldErrors.${error}`) : undefined}
      >
        <TextInput
          id={`pm-${name}`}
          className={cn(opts.ltr && "text-start font-montserrat")}
          dir={opts.ltr ? "ltr" : undefined}
          inputMode={opts.inputMode}
          placeholder={opts.placeholder}
          value={values[name]}
          aria-invalid={!!error}
          onChange={(ev) => setValues((v) => ({ ...v, [name]: ev.target.value }))}
        />
      </Field>
    );
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={locale.startsWith("ar") ? "left" : "right"} className={APP_DRAWER_CLASS}>
        <SheetHeader className="border-b border-(--s-line-soft) px-[18px] py-4 pe-14">
          <div className="flex items-center gap-3">
            <PaymentMethodLogo method={methodKey} label={label} className="border-(--s-line)" />
            <div className="min-w-0">
              <SheetTitle className="text-[17px] font-bold text-(--s-ink)">{t(setUp ? "editTitle" : "setUpTitle", { method: label })}</SheetTitle>
              <SheetDescription className="text-[12.5px] text-(--s-subtle)">{t(`methods.${methodKey}.setupHelp`)}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form id="pm-form" onSubmit={submit} noValidate className="flex flex-1 flex-col gap-4 overflow-y-auto p-[18px]">
          {kind === "cod" ? (
            <>
              <Field
                label={t("fields.codFeeLabel")}
                hint={t("optional")}
                htmlFor="pm-fee"
                note={t("fields.codFeeHelp")}
                error={submitted && !feeValid ? t("fieldErrors.codInvalid") : undefined}
              >
                <CurrencyInput {...money} id="pm-fee" placeholder="0" decimals={false} value={fee} onChange={setFee} invalid={submitted && !feeValid} />
              </Field>
              <Field
                label={t("fields.codMax")}
                hint={t("optional")}
                htmlFor="pm-max"
                note={t("fields.codMaxHelp")}
                error={submitted && !maxValid ? t("fieldErrors.codMaxInvalid") : undefined}
              >
                <CurrencyInput
                  {...money}
                  id="pm-max"
                  placeholder={t("fields.codMaxPlaceholder")}
                  decimals={false}
                  value={maxOrder}
                  onChange={setMaxOrder}
                  invalid={submitted && !maxValid}
                />
              </Field>
              <Field label={t("fields.noteLabel")} hint={t("optional")} htmlFor="pm-note">
                <TextArea
                  id="pm-note"
                  maxLength={300}
                  placeholder={t("fields.notePlaceholder")}
                  value={note}
                  onChange={(ev) => setNote(ev.target.value)}
                />
              </Field>
            </>
          ) : (
            <>
              {kind === "wallet" && field("phone", { ltr: true, inputMode: "tel", placeholder: "01XXXXXXXXX", help: t("fields.phoneHelp") })}
              {kind === "instapay" && (
                <>
                  <Field label={t("receiveBy.label")} htmlFor="pm-receive-by">
                    <Select value={receiveBy} onValueChange={(next) => setReceiveBy(next as InstapayReceiveType)}>
                      <SelectTrigger id="pm-receive-by" className={cn(fieldClass, "!h-[46px]")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INSTAPAY_RECEIVE_TYPES.map((type) => {
                          const Icon = RECEIVE_INPUT[type].icon;
                          return (
                            <SelectItem key={type} value={type}>
                              <Icon className="size-4 text-muted-foreground" aria-hidden />
                              {t(`receiveBy.${type}`)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </Field>
                  {field(receiveBy, {
                    ltr: true,
                    label: t(`receiveBy.${receiveBy}Field`),
                    placeholder: RECEIVE_INPUT[receiveBy].placeholder,
                    inputMode: RECEIVE_INPUT[receiveBy].inputMode,
                    help: t(`receiveBy.${receiveBy}Help`),
                  })}
                </>
              )}
              {field("holderName", { help: t("fields.holderHelp") })}
              {hintMismatch && (
                <Note tone="amber" icon={TriangleAlert}>
                  {t("operatorHint", { operator: t(`methods.${hint}.name`), method: label })}
                </Note>
              )}
              <ol className="flex flex-col gap-2 rounded-2xl bg-(--s-tint) px-3.5 py-3 text-[12.5px] text-(--s-muted)">
                {(["choose", "transfer", "confirm"] as const).map((step, i) => (
                  <li key={step} className="flex gap-2.5">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft font-montserrat text-[11.5px] font-bold text-primary-ink">{i + 1}</span>
                    <span className="min-w-0 pt-0.5">{t(`howItWorks.${step}`, { method: label })}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </form>

        <SheetFooter className={APP_DRAWER_FOOTER_CLASS}>
          <SellerButton variant="outline" onClick={onClose} disabled={pending}>
            {t("cancel")}
          </SellerButton>
          <SellerButton type="submit" form="pm-form" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Check aria-hidden />}
            {setUp ? t("save") : t("saveAndEnable")}
          </SellerButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** Sample order for the deposit example line, in store currency units. */
const DEPOSIT_EXAMPLE_TOTAL = 1000;

/**
 * Cash on delivery › Deposit (عربون, ROADMAP.md F-21): a COD order pays a
 * share first, to the seller's own wallet / InstaPay or card gateway, and the
 * rest on delivery. Off until the seller picks a percent; it can't be turned
 * on without cash on delivery and a way to pay the seller.
 */
function DepositSettings({
  storeId,
  initial,
  codOn,
  payable,
  money,
  readOnly,
}: {
  storeId: string;
  initial: CodDepositSetting | null;
  codOn: boolean;
  payable: boolean;
  money: MoneyUnit;
  readOnly: boolean;
}) {
  const t = useTranslations("storePayments.deposit");
  const tErr = useTranslations("storePayments");
  const locale = useLocale();
  const router = useRouter();
  const [deposit, setDeposit] = useState<CodDepositSetting | null>(initial);
  const [pending, startTransition] = useTransition();
  const canTurnOn = codOn && payable;
  const on = Boolean(deposit);
  const paused = on && !canTurnOn;
  const unit = moneyUnitText(locale, money);
  const fmt = (n: number) => new Intl.NumberFormat(locale.startsWith("ar") ? "ar-EG" : "en-US", { maximumFractionDigits: 2 }).format(n);

  const save = (percent: DepositPercent | null) =>
    startTransition(async () => {
      const result = await saveCodDeposit(storeId, percent);
      if (result.success) {
        setDeposit(result.data);
        toast.success(t(result.data ? "saved" : "turnedOff"));
        router.refresh();
      } else {
        toast.error(tErr(`errors.${result.error}`));
      }
    });

  const percent = deposit?.percent ?? 20;
  const exampleDeposit = computeDepositPiastres(DEPOSIT_EXAMPLE_TOTAL * 100, percent) / 100;

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-(--s-line) p-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink">
          <HandCoins className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 basis-[180px]">
          <b className="flex flex-wrap items-center gap-2 text-sm font-bold text-(--s-text)">
            {t("title")}
            {on && !paused && <Tag tone="success">{t("onTag", { percent })}</Tag>}
            {paused && <Tag tone="warning">{t("pausedTag")}</Tag>}
          </b>
          <small className="block text-xs leading-relaxed text-(--s-subtle)">{t("description")}</small>
        </div>
        <Toggle
          checked={on}
          disabled={readOnly || pending || (!on && !canTurnOn)}
          className="ms-auto max-[600px]:min-h-10"
          onCheckedChange={(next) => save(next ? percent : null)}
          aria-label={t("toggle")}
        />
      </div>

      {!canTurnOn && (
        <Note tone="amber" icon={TriangleAlert}>
          {t(!codOn ? "needsCod" : "needsMethod")}
        </Note>
      )}

      {on && (
        <>
          <div role="radiogroup" aria-label={t("percentLabel")} className="grid grid-cols-4 gap-2">
            {DEPOSIT_PERCENTS.map((p) => {
              const selected = p === deposit?.percent;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={readOnly || pending}
                  onClick={() => !selected && save(p)}
                  className={cn(
                    "min-h-11 rounded-[14px] border-[1.5px] border-(--s-line) bg-(--s-surface) font-montserrat text-[15px] font-bold text-(--s-text) transition-colors duration-150 enabled:hover:border-(--s-field-strong) disabled:cursor-default",
                    selected && "border-(--s-primary) bg-primary-soft text-primary-ink enabled:hover:border-(--s-primary)",
                  )}
                >
                  {fmt(p)}%
                </button>
              );
            })}
          </div>
          <p className="rounded-xl bg-(--s-tint) px-3 py-2 text-[12.5px] leading-relaxed text-(--s-muted)">
            {t("example", {
              total: fmt(DEPOSIT_EXAMPLE_TOTAL),
              deposit: fmt(exampleDeposit),
              rest: fmt(DEPOSIT_EXAMPLE_TOTAL - exampleDeposit),
              currency: unit,
            })}
          </p>
          <ul className="flex list-disc flex-col gap-1 ps-5 text-xs leading-relaxed text-(--s-subtle)">
            <li>{t("ruleRounding")}</li>
            <li>{t("ruleWhere")}</li>
            <li>{t("ruleWait")}</li>
          </ul>
        </>
      )}
    </div>
  );
}
