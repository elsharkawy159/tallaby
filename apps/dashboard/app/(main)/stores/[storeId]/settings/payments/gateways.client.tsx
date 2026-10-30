"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, CircleDashed, Clock, KeyRound, LoaderCircle, Plug, ShieldCheck, Unplug } from "lucide-react";

import { isStoreAppLive, storeAppsInGroup, type StoreApp } from "@workspace/lib/integrations";
import { isStoreGatewayProvider, type StoreGatewayProvider } from "@workspace/lib/payments/store-gateways";
import type { StoreGatewayOverview } from "@workspace/lib/payments/store-gateways/server";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { BUTTON_CLASS, FIELD_CLASS, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { cn } from "@/lib/utils";
import { AppLogo } from "../../apps/app-logo";
import { connectGateway, disconnectGateway } from "./gateways.server";
import { GATEWAY_FIELDS } from "./gateways.dto";

/** Paymob, Kashier, PayPal, Tallaby Pay: the catalog's payments group. */
const GATEWAYS = storeAppsInGroup("payments");

/**
 * Store settings › Payment methods › Online card payments (ROADMAP.md F-39):
 * the seller connects their own Paymob or Kashier account; card payments go
 * straight to them. One gateway per store. PayPal and Tallaby Pay are "soon".
 */
export function StoreGatewaysCard({
  storeId,
  initial,
  readOnly,
}: {
  storeId: string;
  initial: StoreGatewayOverview;
  readOnly: boolean;
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
    const name = tApp(`${key}.name`);
    return (
      <li key={key} className={cn("flex flex-wrap items-center gap-3.5 border-t px-4 py-4 first:border-t-0 sm:flex-nowrap sm:px-6", !live && "opacity-70")}>
        <AppLogo app={key} connected={isConnected} className="size-11 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
            {name}
            {!live ? (
              <Badge variant="outline" className="text-[10px] font-normal">
                {t("soon")}
              </Badge>
            ) : isConnected ? (
              <ConnectedTag verified={!!connected?.details.webhookVerifiedAt} />
            ) : null}
          </p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{tApp(`${key}.description`)}</p>
          {isConnected && connected && (
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12.5px]">
              <KeyRound className="size-3.5 text-faint" aria-hidden />
              <bdi dir="ltr" className="font-mono">
                •••• {connected.details.keyHint}
              </bdi>
              · {t(connected.details.mode === "live" ? "modeLive" : "modeTest")}
            </p>
          )}
          {isConnected && connected?.details.mode === "test" && (
            <p className="mt-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[12.5px]">{t("testModeWarning")}</p>
          )}
          {blocked && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{t("oneAtATime")}</p>}
        </div>
        {live && (
          <div className="flex w-full items-center justify-end gap-2 ps-[58px] sm:w-auto sm:ps-0">
            {isConnected ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(SMALL_BUTTON_CLASS, "text-muted-foreground hover:bg-muted hover:text-foreground")}
                  disabled={readOnly || isPending}
                  onClick={() => setEditing(provider)}
                >
                  <KeyRound />
                  {t("updateKeys")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(SMALL_BUTTON_CLASS, "text-destructive hover:bg-destructive/10 hover:text-destructive")}
                  disabled={readOnly || isPending}
                  onClick={() => setConfirming(provider)}
                >
                  <Unplug />
                  {t("disconnect")}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="accent"
                className={SMALL_BUTTON_CLASS}
                disabled={readOnly || isPending || blocked || !overview.webhooksReady}
                onClick={() => setEditing(provider)}
              >
                <Plug />
                {t("connect")}
              </Button>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <section className="rounded-2xl border bg-card shadow-[0_1px_2px_rgba(20,81,99,0.05),0_1px_3px_rgba(20,81,99,0.04)] dark:shadow-none">
      <div className="border-b px-4 py-[18px] sm:px-6">
        <h2 className="text-base font-bold leading-normal">{t("title")}</h2>
        <p className="text-[13px] text-muted-foreground">{t("description")}</p>
      </div>
      {!overview.webhooksReady && (
        <p className="border-b bg-muted/40 px-4 py-3 text-[13px] text-muted-foreground sm:px-6">{t("errors.webhooksNotConfigured")}</p>
      )}
      <ul>{GATEWAYS.map(row)}</ul>
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
          key={editing}
          provider={editing}
          storeId={storeId}
          isUpdate={connected?.provider === editing}
          currentMode={connected?.provider === editing ? (connected.details.mode as "test" | "live" | undefined) : undefined}
          onClose={() => setEditing(null)}
          onConnected={(next) => {
            setOverview(next);
            setEditing(null);
            toast.success(t("connected"));
            router.refresh();
          }}
        />
      )}
    </section>
  );
}

function ConnectedTag({ verified }: { verified: boolean }) {
  const t = useTranslations("storePayments.gateways");
  const base = "inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-medium";
  return verified ? (
    <span className={cn(base, "bg-success-soft text-success")}>
      <Check className="size-3" aria-hidden />
      {t("status.connected")}
    </span>
  ) : (
    <span className={cn(base, "bg-accent-soft text-accent-ink")} title={t("status.waitingHelp")}>
      <Clock className="size-3" aria-hidden />
      {t("status.waiting")}
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
}: {
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await connectGateway(storeId, provider, { ...values, ...(provider === "kashier" && { mode }) });
      if (result.success) onConnected(result.data);
      else setError(t(`errors.${result.error}`));
    });
  };

  return (
    <Sheet open onOpenChange={(open) => !open && !pending && onClose()}>
      <SheetContent side={locale.startsWith("ar") ? "left" : "right"} className="flex w-full flex-col gap-0 p-0 sm:max-w-[460px]">
        <SheetHeader className="border-b px-5 py-[18px]">
          <div className="flex items-center gap-3">
            <AppLogo app={provider} className="size-11 rounded-xl" />
            <div className="min-w-0">
              <SheetTitle className="text-base font-bold">{t(isUpdate ? "updateTitle" : "connectTitle", { gateway: name })}</SheetTitle>
              <SheetDescription className="text-xs">{t(`providers.${provider}.whereToFind`)}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form id="gateway-form" onSubmit={submit} noValidate autoComplete="off" className="flex flex-1 flex-col gap-[18px] overflow-y-auto p-5">
          {provider === "kashier" && (
            <div className="grid gap-1.5">
              <Label>{t("fields.mode")}</Label>
              <div className="grid grid-cols-2 gap-2" role="radiogroup">
                {(["live", "test"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={mode === m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm font-medium",
                      mode === m ? "border-primary bg-primary-soft text-primary-ink" : "text-muted-foreground",
                    )}
                  >
                    {t(m === "live" ? "modeLive" : "modeTest")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {fields.map((field) => {
            const optional = "optional" in field && field.optional;
            return (
              <div key={field.name} className="grid gap-1.5">
                <Label htmlFor={`gw-${field.name}`} className="justify-between">
                  {t(`fields.${field.name}`)}
                  {optional && <span className="text-xs font-normal text-faint">{t("optional")}</span>}
                </Label>
                <Input
                  id={`gw-${field.name}`}
                  dir="ltr"
                  type={field.secret ? "password" : "text"}
                  inputMode={"numeric" in field && field.numeric ? "numeric" : undefined}
                  autoComplete="off"
                  spellCheck={false}
                  className={cn(FIELD_CLASS, "text-start font-mono")}
                  placeholder={isUpdate && field.secret ? t("keepSaved") : field.placeholder}
                  value={values[field.name] ?? ""}
                  onChange={(ev) => setValues((v) => ({ ...v, [field.name]: ev.target.value }))}
                />
              </div>
            );
          })}

          {isUpdate && <p className="text-xs leading-relaxed text-muted-foreground">{t("blankKeepsSaved")}</p>}

          <div className="flex gap-2.5 rounded-xl border bg-muted/40 px-4 py-3.5 text-[13px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary-ink" aria-hidden />
            <div className="space-y-1.5">
              <p>{t("howItWorks.verify")}</p>
              <p>{t("howItWorks.money")}</p>
              <p>{t("howItWorks.fee")}</p>
            </div>
          </div>

          {error && (
            <p role="alert" className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <CircleDashed className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}
        </form>

        <SheetFooter className="flex-row items-center gap-2 border-t px-5 py-3.5">
          <Button type="submit" form="gateway-form" variant="accent" className={BUTTON_CLASS} disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : <Check />}
            {pending ? t("verifying") : isUpdate ? t("saveKeys") : t("verifyAndConnect")}
          </Button>
          <Button type="button" variant="ghost" className={cn(BUTTON_CLASS, "text-muted-foreground")} onClick={onClose} disabled={pending}>
            {t("cancel")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
