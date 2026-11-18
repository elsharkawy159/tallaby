"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, CircleDashed, Clock, Copy, CreditCard, KeyRound, LoaderCircle, Plug, ShieldCheck, Unplug } from "lucide-react";

import { isStoreAppLive, storeAppsInGroup, type StoreApp } from "@workspace/lib/integrations";
import { isStoreGatewayProvider, type StoreGatewayProvider } from "@workspace/lib/payments/store-gateways";
import { gatewaySupportsCurrency } from "@workspace/lib/payments/store-methods";
import type { StoreGatewayOverview } from "@workspace/lib/payments/store-gateways/server";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Field, Note, OptionCard, OptionCards, Rows, SectionCard, SellerButton, Tag, TextInput } from "@/components/seller-ui";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { cn } from "@/lib/utils";
import { APP_DRAWER_CLASS, APP_DRAWER_FOOTER_CLASS } from "../../apps/app-drawer.lib";
import { AppLogo } from "../../apps/app-logo";
import { connectGateway, disconnectGateway } from "./gateways.server";
import { GATEWAY_FIELDS } from "./gateways.dto";

/** Paymob, Kashier, EasyKash, PayPal, Tallaby Pay: the catalog's payments group. */
const GATEWAYS = storeAppsInGroup("payments");

/**
 * Store settings › Payment methods › Online card payments (ROADMAP.md F-39):
 * the seller connects their own Paymob, Kashier or EasyKash (F-98) account;
 * card payments go straight to them. One gateway per store. PayPal and Tallaby Pay are "soon".
 */
export function StoreGatewaysCard({
  storeId,
  initial,
  readOnly,
  usdLive,
  currency,
  only,
  easykashCallbackUrl = null,
}: {
  storeId: string;
  initial: StoreGatewayOverview;
  readOnly: boolean;
  usdLive: boolean;
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
  const [overview, setOverview] = useState(initial);
  const [editing, setEditing] = useState<StoreGatewayProvider | null>(null);
  const [confirming, setConfirming] = useState<StoreGatewayProvider | null>(null);
  const [isPending, startTransition] = useTransition();
  const connected = overview.connected;

  const disconnect = (provider: StoreGatewayProvider) => {
    startTransition(async () => {
      const result = await disconnectGateway(storeId, provider);
      if (result.success) {
        setConfirming(null);
        setOverview((o) => ({ ...o, connected: null }));
        toast.success(t("disconnected"));
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
            {!live ? <Tag tone="warning">{t("soon")}</Tag> : isConnected ? <ConnectedTag verified={!!connected?.details.webhookVerifiedAt} /> : null}
          </b>
          <small className="block text-xs leading-relaxed text-(--s-subtle)">{tApp(`${key}.description`)}</small>
          {isConnected && connected && (
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
        {live && (
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
        title={t("disconnectConfirm.title", { gateway: confirming ? tApp(`${confirming}.name`) : "" })}
        description={t("disconnectConfirm.description")}
        confirmLabel={t("disconnect")}
        destructive
        pending={isPending}
        onConfirm={() => confirming && disconnect(confirming)}
      />
      {editing && (
        <GatewaySheet
          feeKey={usdLive ? "howItWorks.feeUsd" : "howItWorks.fee"}
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
  feeKey: "howItWorks.fee" | "howItWorks.feeUsd";
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
