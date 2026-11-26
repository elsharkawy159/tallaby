"use client";

import { useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Banknote, Check, CircleDashed, Clock, Copy, CreditCard, KeyRound, LoaderCircle, Plug, Power, ShieldCheck, Unplug } from "lucide-react";

import { isStoreAppLive, storeAppsInGroup, type StoreApp } from "@workspace/lib/integrations";
import { isStoreGatewayProvider, type StoreGatewayProvider } from "@workspace/lib/payments/store-gateways";
import { gatewaySupportsCurrency } from "@workspace/lib/payments/store-methods";
import type { StoreGatewayOverview } from "@workspace/lib/payments/store-gateways/server";
import { splitTallabyPay } from "@workspace/lib/tallaby-pay";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Field, Note, OptionCard, OptionCards, Rows, SectionCard, SellerButton, Tag, TextInput } from "@/components/seller-ui";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { cn } from "@/lib/utils";
import { APP_DRAWER_CLASS, APP_DRAWER_FOOTER_CLASS } from "../../apps/app-drawer.lib";
import { AppLogo } from "../../apps/app-logo";
import { chooseTallabyPayFeePayer, connectGateway, disconnectGateway, turnOffTallabyPay, turnOnTallabyPay } from "./gateways.server";
import { GATEWAY_FIELDS } from "./gateways.dto";

/** Tallaby Pay first, then Paymob, Kashier, EasyKash and PayPal: the catalog's payments group. */
const GATEWAYS = storeAppsInGroup("payments");

/** The "how it works" line about Tallaby's order fee: EGP 5, the USD plan fee, or the plan fee on delivery. */
type GatewayFeeKey = "howItWorks.fee" | "howItWorks.feeUsd" | "howItWorks.feeUsdOnDelivery";

/**
 * Store settings › Payment methods › Online card payments (ROADMAP.md F-39):
 * Tallaby Pay (F-100: no keys, turned on with its terms, paid to the store's
 * Tallaby Pay earnings) or the seller's own Paymob, Kashier or EasyKash (F-98)
 * account, whose card payments go straight to them. One gateway per store.
 * PayPal is "soon".
 */
export function StoreGatewaysCard({
  storeId,
  initial,
  readOnly,
  usdLive,
  feeOnDelivery = false,
  currency,
  only,
  easykashCallbackUrl = null,
}: {
  storeId: string;
  initial: StoreGatewayOverview;
  readOnly: boolean;
  usdLive: boolean;
  /** `fee_on_delivery` (owner, 2026-11-26): the order fee is taken when the order is delivered. */
  feeOnDelivery?: boolean;
  /** The store's currency: a gateway that can't charge in it can't be connected or used. */
  currency: string;
  /** App Center › <gateway> › Settings shows just that gateway (F-93); Payment methods shows them all. */
  only?: readonly string[];
  /** This seller's EasyKash Callback URL, computed on the server; null when there is no public backend URL. */
  easykashCallbackUrl?: string | null;
}) {
  const t = useTranslations("storePayments.gateways");
  const tApp = useTranslations("storeApps.providers");
  const router = useRouter();
  const feeKey: GatewayFeeKey = !usdLive ? "howItWorks.fee" : feeOnDelivery ? "howItWorks.feeUsdOnDelivery" : "howItWorks.feeUsd";
  const [overview, setOverview] = useState(initial);
  const [editing, setEditing] = useState<StoreGatewayProvider | null>(null);
  const [confirming, setConfirming] = useState<StoreGatewayProvider | null>(null);
  const [turningOn, setTurningOn] = useState(false);
  const [isPending, startTransition] = useTransition();
  const connected = overview.connected;

  const disconnect = (provider: StoreGatewayProvider) => {
    startTransition(async () => {
      const tallabyPay = provider === "tallaby_pay";
      const result = tallabyPay ? await turnOffTallabyPay(storeId) : await disconnectGateway(storeId, provider);
      if (result.success) {
        setConfirming(null);
        setOverview((o) => ({ ...o, connected: null }));
        toast.success(t(tallabyPay ? "tallabyPay.turnedOff" : "disconnected"));
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });
  };

  const row = (app: StoreApp) => {
    const key = app.key;
    const live = isStoreAppLive(app) && isStoreGatewayProvider(key);
    const provider = key as StoreGatewayProvider;
    const isConnected = live && connected?.provider === provider;
    const blocked = live && !!connected && !isConnected;
    const wrongCurrency = live && !gatewaySupportsCurrency(provider, currency);
    // EasyKash posts to a per-seller URL; without one it can't be connected (same rule as webhooksReady).
    const noCallbackUrl = provider === "easykash" && !easykashCallbackUrl;
    // Tallaby Pay (F-100): no keys and no seller webhook; it opens when the owner turns on its launch switch.
    const tallabyPay = provider === "tallaby_pay";
    const tallabyPayClosed = tallabyPay && !overview.tallabyPay.live;
    const name = tApp(`${key}.name`);
    return (
      <div
        key={key}
        className={cn(
          "flex flex-wrap items-center gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-(--s-tint) [&+&]:border-t [&+&]:border-(--s-line-soft)",
          !live && "[&_.app-logo]:opacity-70",
        )}
      >
        <AppLogo app={key} connected={isConnected} className="app-logo size-10 rounded-xl" />
        <div className="min-w-0 flex-1 basis-[180px]">
          <b className="flex flex-wrap items-center gap-2 text-sm font-bold text-(--s-text)">
            {name}
            {!live || (tallabyPayClosed && !isConnected) ? (
              <Tag tone="warning">{t("soon")}</Tag>
            ) : isConnected && tallabyPay ? (
              <Tag tone="success">
                <Check aria-hidden />
                {t("tallabyPay.on")}
              </Tag>
            ) : isConnected ? (
              <ConnectedTag verified={!!connected?.details.webhookVerifiedAt} />
            ) : null}
          </b>
          <small className="block text-xs leading-relaxed text-(--s-subtle)">{tApp(`${key}.description`)}</small>
          {tallabyPayClosed && (
            <p className="mt-0.5 text-xs text-(--s-muted)">{t(isConnected ? "tallabyPay.paused" : "tallabyPay.notLiveYet")}</p>
          )}
          {isConnected && connected && !tallabyPay && (
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-(--s-muted)">
              <KeyRound className="size-3.5 text-(--s-subtle)" aria-hidden />
              <bdi dir="ltr" className="font-montserrat">
                •••• {connected.details.keyHint}
              </bdi>
              · {t(connected.details.mode === "live" ? "modeLive" : "modeTest")}
            </p>
          )}
          {isConnected && connected?.details.mode === "test" && (
            <Note tone="amber" className="mt-1.5">
              {t("testModeWarning")}
            </Note>
          )}
          {blocked && <p className="mt-0.5 text-xs text-(--s-muted)">{t("oneAtATime")}</p>}
          {wrongCurrency && (
            <Note tone="amber" className="mt-1.5">
              {t("notInCurrency", { currency })}
            </Note>
          )}
        </div>
        {live && tallabyPay && (
          <div className="ms-auto flex flex-wrap items-center gap-1.5">
            {isConnected ? (
              <>
                {/* F-100f: the store's Tallaby Pay balances, sales and withdrawals. */}
                <SellerButton asChild variant="mini" size="xs">
                  <Link href={`/stores/${storeId}/earnings`}>
                    <Banknote aria-hidden />
                    {t("tallabyPay.viewEarnings")}
                  </Link>
                </SellerButton>
                <SellerButton
                  variant="mini"
                  size="xs"
                  className="text-destructive [&_svg]:text-destructive"
                  disabled={readOnly || isPending}
                  onClick={() => setConfirming(provider)}
                >
                  <Power aria-hidden />
                  {t("tallabyPay.turnOff")}
                </SellerButton>
              </>
            ) : (
              <SellerButton
                variant="solid"
                size="xs"
                disabled={readOnly || isPending || blocked || wrongCurrency || tallabyPayClosed}
                onClick={() => setTurningOn(true)}
              >
                <Power aria-hidden />
                {t("tallabyPay.turnOn")}
              </SellerButton>
            )}
          </div>
        )}
        {live && tallabyPay && isConnected && (
          <TallabyPayFeePayerChoice
            storeId={storeId}
            feeBps={overview.tallabyPay.feeBps}
            value={overview.tallabyPayFeePayer ?? "seller"}
            disabled={readOnly || isPending}
            onSaved={(feePayer) => setOverview((o) => ({ ...o, tallabyPayFeePayer: feePayer }))}
          />
        )}
        {live && !tallabyPay && (
          <div className="ms-auto flex items-center gap-1.5">
            {isConnected ? (
              <>
                <SellerButton variant="mini" size="xs" disabled={readOnly || isPending} onClick={() => setEditing(provider)}>
                  <KeyRound aria-hidden />
                  {t("updateKeys")}
                </SellerButton>
                <SellerButton
                  variant="mini"
                  size="xs"
                  className="text-destructive [&_svg]:text-destructive"
                  disabled={readOnly || isPending}
                  onClick={() => setConfirming(provider)}
                >
                  <Unplug aria-hidden />
                  {t("disconnect")}
                </SellerButton>
              </>
            ) : (
              <SellerButton
                variant="solid"
                size="xs"
                disabled={readOnly || isPending || blocked || wrongCurrency || !overview.webhooksReady || noCallbackUrl}
                onClick={() => setEditing(provider)}
              >
                <Plug aria-hidden />
                {t("connect")}
              </SellerButton>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <SectionCard icon={CreditCard} title={t("title")} description={t("description")}>
      {!overview.webhooksReady && <Note tone="amber">{t("errors.webhooksNotConfigured")}</Note>}
      <Rows>{(only ? GATEWAYS.filter((app) => only.includes(app.key)) : GATEWAYS).map(row)}</Rows>
      <ConfirmActionDialog
        open={!!confirming}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={
          confirming === "tallaby_pay"
            ? t("tallabyPay.turnOffConfirm.title")
            : t("disconnectConfirm.title", { gateway: confirming ? tApp(`${confirming}.name`) : "" })
        }
        description={confirming === "tallaby_pay" ? t("tallabyPay.turnOffConfirm.description") : t("disconnectConfirm.description")}
        confirmLabel={confirming === "tallaby_pay" ? t("tallabyPay.turnOff") : t("disconnect")}
        destructive
        pending={isPending}
        onConfirm={() => confirming && disconnect(confirming)}
      />
      {turningOn && (
        <TallabyPaySheet
          storeId={storeId}
          settings={overview.tallabyPay}
          feeKey={feeKey}
          onClose={() => setTurningOn(false)}
          onTurnedOn={(next) => {
            setOverview(next);
            setTurningOn(false);
            toast.success(t("tallabyPay.turnedOn"));
            router.refresh();
          }}
        />
      )}
      {editing && (
        <GatewaySheet
          feeKey={feeKey}
          key={editing}
          provider={editing}
          storeId={storeId}
          isUpdate={connected?.provider === editing}
          currentMode={connected?.provider === editing ? (connected.details.mode as "test" | "live" | undefined) : undefined}
          callbackUrl={editing === "easykash" ? easykashCallbackUrl : null}
          onClose={() => setEditing(null)}
          onConnected={(next) => {
            setOverview(next);
            setEditing(null);
            toast.success(t("connected"));
            router.refresh();
          }}
        />
      )}
    </SectionCard>
  );
}

/**
 * Tallaby Pay › Who pays the fee (ROADMAP.md F-100j): the seller (default,
 * the fee comes out of each paid order) or the customer (checkout adds it on
 * top). Shows the live fee from billing_settings; saved on change.
 */
function TallabyPayFeePayerChoice({
  storeId,
  feeBps,
  value,
  disabled,
  onSaved,
}: {
  storeId: string;
  feeBps: number;
  value: "seller" | "customer";
  disabled: boolean;
  onSaved: (feePayer: "seller" | "customer") => void;
}) {
  const t = useTranslations("storePayments.gateways");
  const [pending, startTransition] = useTransition();
  const percent = (feeBps / 100).toLocaleString("en", { maximumFractionDigits: 2 });
  const choose = (next: "seller" | "customer") => {
    if (next === value) return;
    startTransition(async () => {
      const result = await chooseTallabyPayFeePayer(storeId, next);
      if (result.success) {
        onSaved(result.data.feePayer);
        toast.success(t("tallabyPay.feePayer.saved"));
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });
  };
  return (
    <fieldset className="basis-full" disabled={disabled || pending}>
      <legend className="mb-1.5 text-[13px] font-bold text-(--s-text)">{t("tallabyPay.feePayer.title")}</legend>
      <OptionCards>
        {(["seller", "customer"] as const).map((option) => (
          <OptionCard
            key={option}
            name={`tallaby-pay-fee-payer-${storeId}`}
            title={t(`tallabyPay.feePayer.${option}`)}
            description={t(`tallabyPay.feePayer.${option}Hint`, { percent })}
            checked={value === option}
            onChange={() => choose(option)}
          />
        ))}
      </OptionCards>
      <p className="mt-1.5 text-xs text-(--s-muted)">{t("tallabyPay.feePayer.note")}</p>
    </fieldset>
  );
}

/**
 * Tallaby Pay › Turn on (ROADMAP.md F-100b, design §2.1): the terms in plain
 * words with the live fee, hold and minimum withdrawal, an "I agree" box, and
 * Turn on. The server re-checks everything (terms, EGP, launch switch, one
 * gateway per store).
 */
function TallabyPaySheet({
  storeId,
  settings,
  feeKey,
  onClose,
  onTurnedOn,
}: {
  storeId: string;
  settings: StoreGatewayOverview["tallabyPay"];
  feeKey: GatewayFeeKey;
  onClose: () => void;
  onTurnedOn: (overview: StoreGatewayOverview) => void;
}) {
  const t = useTranslations("storePayments.gateways");
  const locale = useLocale();
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Western digits, as in the rest of the dashboard copy.
  const number = (value: number, digits = 0) => value.toLocaleString("en", { minimumFractionDigits: digits, maximumFractionDigits: 2 });
  const percent = number(settings.feeBps / 100);
  const net = number(splitTallabyPay(10_000, settings.feeBps).netPiastres / 100, 2);
  const minimum = number(settings.minPayoutPiastres / 100);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await turnOnTallabyPay(storeId, agreed);
      if (result.success) onTurnedOn(result.data);
      else setError(t(`errors.${result.error}`));
    });
  };

  const terms = [
    t("tallabyPay.terms.fee", { percent }),
    t("tallabyPay.terms.example", { net }),
    t("tallabyPay.terms.earnings"),
    settings.holdDays === 0 ? t("tallabyPay.terms.availableOnDelivery") : t("tallabyPay.terms.availableAfter", { days: settings.holdDays }),
    t("tallabyPay.terms.withdraw", { minimum }),
    t("tallabyPay.terms.refunds"),
    t(feeKey),
  ];

  return (
    <Sheet open onOpenChange={(open) => !open && !pending && onClose()}>
      <SheetContent side={locale.startsWith("ar") ? "left" : "right"} className={APP_DRAWER_CLASS}>
        <SheetHeader className="border-b border-(--s-line-soft) px-[18px] py-4 pe-14">
          <div className="flex items-center gap-3">
            <AppLogo app="tallaby_pay" className="size-11 rounded-[14px]" />
            <div className="min-w-0">
              <SheetTitle className="text-[17px] font-bold text-(--s-ink)">{t("tallabyPay.sheetTitle")}</SheetTitle>
              <SheetDescription className="text-[12.5px] text-(--s-subtle)">{t("tallabyPay.sheetDescription")}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form id="tallaby-pay-form" onSubmit={submit} noValidate className="flex flex-1 flex-col gap-4 overflow-y-auto p-[18px]">
          <section aria-labelledby="tallaby-pay-terms" className="flex flex-col gap-3 rounded-[14px] border border-(--s-line-soft) p-3.5">
            <h3 id="tallaby-pay-terms" className="text-[13.5px] font-bold text-(--s-text)">
              {t("tallabyPay.terms.title")}
            </h3>
            <ul className="flex list-disc flex-col gap-2 ps-5 text-[12.5px] leading-[1.7] text-(--s-muted)">
              {terms.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <label htmlFor="tallaby-pay-agree" className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.6] text-(--s-text)">
            <Checkbox id="tallaby-pay-agree" className="mt-0.5" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
            <span>{t("tallabyPay.agree")}</span>
          </label>

          {error && (
            <Note tone="danger" icon={CircleDashed}>
              <span role="alert">{error}</span>
            </Note>
          )}
        </form>

        <SheetFooter className={APP_DRAWER_FOOTER_CLASS}>
          <SellerButton variant="outline" onClick={onClose} disabled={pending}>
            {t("cancel")}
          </SellerButton>
          <SellerButton type="submit" form="tallaby-pay-form" disabled={pending || !agreed}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Power aria-hidden />}
            {t("tallabyPay.turnOn")}
          </SellerButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ConnectedTag({ verified }: { verified: boolean }) {
  const t = useTranslations("storePayments.gateways");
  return verified ? (
    <Tag tone="success">
      <Check aria-hidden />
      {t("status.connected")}
    </Tag>
  ) : (
    <span title={t("status.waitingHelp")}>
      <Tag tone="warning">
        <Clock aria-hidden />
        {t("status.waiting")}
      </Tag>
    </span>
  );
}

function GatewaySheet({
  provider,
  storeId,
  isUpdate,
  currentMode,
  onClose,
  onConnected,
  feeKey,
  callbackUrl,
}: {
  feeKey: GatewayFeeKey;
  /** EasyKash only: the URL the seller pastes in EasyKash (server-computed). */
  callbackUrl: string | null;
  provider: StoreGatewayProvider;
  storeId: string;
  isUpdate: boolean;
  currentMode?: "test" | "live";
  onClose: () => void;
  onConnected: (overview: StoreGatewayOverview) => void;
}) {
  const t = useTranslations("storePayments.gateways");
  const tApp = useTranslations("storeApps.providers");
  const locale = useLocale();
  const fields = GATEWAY_FIELDS[provider];
  const [values, setValues] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"test" | "live">(currentMode ?? "live");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const name = tApp(`${provider}.name`);
  // A provider can word an error or the key check its own way (EasyKash's API key, its Inquiry check).
  const providerText = (key: string) => (t.has(`providers.${provider}.${key}`) ? t(`providers.${provider}.${key}`) : t(key));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await connectGateway(storeId, provider, { ...values, ...(provider === "kashier" && { mode }) });
      if (result.success) onConnected(result.data);
      else setError(providerText(`errors.${result.error}`));
    });
  };

  return (
    <Sheet open onOpenChange={(open) => !open && !pending && onClose()}>
      <SheetContent data-clarity-mask="true" side={locale.startsWith("ar") ? "left" : "right"} className={APP_DRAWER_CLASS}>
        <SheetHeader className="border-b border-(--s-line-soft) px-[18px] py-4 pe-14">
          <div className="flex items-center gap-3">
            {/* The sheet only opens from a catalog row, so the provider is always an app key. */}
            <AppLogo app={provider} className="size-11 rounded-[14px]" />
            <div className="min-w-0">
              <SheetTitle className="text-[17px] font-bold text-(--s-ink)">{t(isUpdate ? "updateTitle" : "connectTitle", { gateway: name })}</SheetTitle>
              <SheetDescription className="text-[12.5px] text-(--s-subtle)">{t(`providers.${provider}.whereToFind`)}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form id="gateway-form" onSubmit={submit} noValidate autoComplete="off" className="flex flex-1 flex-col gap-4 overflow-y-auto p-[18px]">
          {provider === "kashier" && (
            <Field label={t("fields.mode")}>
              <OptionCards className="grid-cols-2">
                {(["live", "test"] as const).map((m) => (
                  <OptionCard key={m} name="gateway-mode" title={t(m === "live" ? "modeLive" : "modeTest")} checked={mode === m} onChange={() => setMode(m)} />
                ))}
              </OptionCards>
            </Field>
          )}

          {provider === "easykash" && <EasykashSteps callbackUrl={callbackUrl} />}

          {fields.map((field) => {
            const optional = "optional" in field && field.optional;
            return (
              <Field key={field.name} label={t(`fields.${field.name}`)} hint={optional ? t("optional") : undefined} htmlFor={`gw-${field.name}`}>
                {/* Secrets are write-only: the field starts empty and a saved key never comes back. */}
                <TextInput
                  id={`gw-${field.name}`}
                  dir="ltr"
                  type={field.secret ? "password" : "text"}
                  inputMode={"numeric" in field && field.numeric ? "numeric" : undefined}
                  autoComplete="off"
                  spellCheck={false}
                  className="text-start font-montserrat"
                  placeholder={isUpdate && field.secret ? t("keepSaved") : field.placeholder}
                  value={values[field.name] ?? ""}
                  onChange={(ev) => setValues((v) => ({ ...v, [field.name]: ev.target.value }))}
                />
              </Field>
            );
          })}

          {isUpdate && <p className="text-xs leading-relaxed text-(--s-faint)">{t("blankKeepsSaved")}</p>}

          <Note icon={ShieldCheck}>
            <span className="flex flex-col gap-1.5">
              <span>{providerText("howItWorks.verify")}</span>
              <span>{t("howItWorks.money")}</span>
              <span>{t(feeKey)}</span>
            </span>
          </Note>

          {error && (
            <Note tone="danger" icon={CircleDashed}>
              <span role="alert">{error}</span>
            </Note>
          )}
        </form>

        <SheetFooter className={APP_DRAWER_FOOTER_CLASS}>
          <SellerButton variant="outline" onClick={onClose} disabled={pending}>
            {t("cancel")}
          </SellerButton>
          <SellerButton type="submit" form="gateway-form" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Check aria-hidden />}
            {pending ? t("verifying") : isUpdate ? t("saveKeys") : t("verifyAndConnect")}
          </SellerButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * EasyKash setup (docs/easykash.md §2): the numbered steps, with this seller's
 * Callback URL to copy at the step that uses it. The URL comes from the
 * server; it is not a secret, only a routing hint (the HMAC is the proof).
 */
function EasykashSteps({ callbackUrl }: { callbackUrl: string | null }) {
  const t = useTranslations("storePayments.gateways.providers.easykash");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!callbackUrl) return;
    try {
      await navigator.clipboard.writeText(callbackUrl);
      setCopied(true);
      toast.success(t("callbackCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("callbackCopyFailed"));
    }
  };

  const steps = ["directPayment", "callback", "options", "fees", "keys", "test"] as const;
  return (
    <section aria-labelledby="easykash-steps" className="flex flex-col gap-3 rounded-[14px] border border-(--s-line-soft) p-3.5">
      <h3 id="easykash-steps" className="text-[13.5px] font-bold text-(--s-text)">
        {t("steps.title")}
      </h3>
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-2.5">
            <span
              aria-hidden
              className="grid size-6 shrink-0 place-items-center rounded-full bg-(--s-tint) font-montserrat text-xs font-bold text-(--s-primary)"
            >
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5 text-[12.5px] leading-[1.7] text-(--s-muted)">
              <p className={cn(step === "fees" && "font-semibold text-(--s-text)")}>{t(`steps.${step}`)}</p>
              {step === "callback" &&
                (callbackUrl ? (
                  <div className="flex items-center gap-2">
                    <TextInput
                      id="easykash-callback-url"
                      aria-label={t("callbackLabel")}
                      dir="ltr"
                      readOnly
                      value={callbackUrl}
                      onFocus={(e) => e.currentTarget.select()}
                      className="h-10 min-w-0 flex-1 text-start font-montserrat text-xs"
                    />
                    <SellerButton type="button" variant="mini" size="xs" onClick={copy}>
                      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                      {copied ? t("callbackCopiedShort") : t("callbackCopy")}
                    </SellerButton>
                  </div>
                ) : (
                  <Note tone="amber">{t("noCallbackUrl")}</Note>
                ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
