"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CircleCheck, ExternalLink, LoaderCircle, Truck } from "lucide-react";

import { validateBostaConnectInput } from "@workspace/lib/integrations";
import type { StoreIntegrationSummary } from "@workspace/lib/integrations/server";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { SheetFooter } from "@workspace/ui/components/sheet";
import { BUTTON_CLASS, FIELD_CLASS, ToggleRow } from "@/components/form/form-ui";
import { disconnectStoreApp } from "./apps.server";
import { saveBosta } from "./bosta.server";

const STEPS = ["step1", "step2", "step3"] as const;

/**
 * Bosta panel. The API key field is write-only: it starts empty, the saved key
 * is never sent back, and the panel only shows "key saved".
 */
export function BostaPanel({
  storeId,
  current,
  readOnly,
  onSaved,
  onRemoved,
  onClose,
}: {
  storeId: string;
  current?: StoreIntegrationSummary;
  readOnly: boolean;
  onSaved: (summary: StoreIntegrationSummary) => void;
  onRemoved: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("storeApps");
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [allowOpen, setAllowOpen] = useState(current?.details.allowOpenPackage ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const saved = Boolean(current?.credentialsSaved);

  const save = () => {
    const check = validateBostaConnectInput({ apiKey, allowOpenPackage: allowOpen });
    if (!check.success) {
      setError(t("errors.invalidToken"));
      return;
    }
    if (!saved && !check.data.apiKey) {
      setError(t("bosta.keyRequired"));
      return;
    }
    startTransition(async () => {
      const result = await saveBosta(storeId, { apiKey, allowOpenPackage: allowOpen });
      if (!result.success) {
        setError(result.message ? `${t(`errors.${result.error}`)} (${result.message})` : t(`errors.${result.error}`));
        return;
      }
      setApiKey("");
      onSaved(result.data);
      toast.success(saved ? t("saved") : t("bosta.connected"));
      router.refresh();
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await disconnectStoreApp(storeId, "bosta");
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      onRemoved();
      toast.success(t("removed"));
      router.refresh();
      onClose();
    });
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5">
        {!saved && (
          <div>
            <p className="mb-2.5 text-xs font-bold tracking-wider text-faint uppercase">{t("howTo")}</p>
            <ol className="flex flex-col gap-3">
              {STEPS.map((step, index) => (
                <li key={step} className="flex gap-3 text-[13px] text-muted-foreground">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-ink">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">
                    {t.rich(`bosta.${step}`, { b: (chunks) => <b className="font-semibold text-foreground">{chunks}</b> })}
                  </span>
                </li>
              ))}
            </ol>
            <a
              href="https://business.bosta.co"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
            >
              {t("bosta.openBosta")}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </div>
        )}
        {saved && (
          <div className="space-y-1.5 text-[13px]">
            <p className="flex items-center gap-2">
              <CircleCheck className="size-4 text-primary" aria-hidden />
              {t("bosta.keySaved")}
            </p>
            {current?.details.pickupLocationName && (
              <p className="text-muted-foreground">{t("bosta.pickupFrom", { name: current.details.pickupLocationName })}</p>
            )}
            <p className="text-muted-foreground">{t("bosta.shippedCount", { count: current?.details.shippedOrders ?? 0 })}</p>
          </div>
        )}
        {current?.status === "error" && current.lastError && (
          <p className="rounded-xl bg-destructive/10 p-3 text-[13px] text-destructive" dir="auto">
            {t("bosta.keyRejected")}
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bosta-key">{t("bosta.keyLabel")}</Label>
          <Input
            id="bosta-key"
            type="password"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            className={FIELD_CLASS}
            value={apiKey}
            disabled={readOnly}
            placeholder={saved ? t("bosta.keyKeep") : t("bosta.keyPlaceholder")}
            aria-invalid={error ? true : undefined}
            aria-describedby="bosta-hint"
            onChange={(event) => {
              setApiKey(event.target.value);
              setError(null);
            }}
          />
          <p id="bosta-hint" className="text-xs text-muted-foreground">
            {error ? <span className="text-destructive">{error}</span> : t("bosta.keyHint")}
          </p>
        </div>
        <ToggleRow
          id="bosta-open"
          boxed
          checked={allowOpen}
          disabled={readOnly}
          onCheckedChange={(value) => {
            setAllowOpen(value);
            setError(null);
          }}
          title={t("bosta.allowOpen")}
          description={t("bosta.allowOpenHint")}
        />
        {saved && (
          <Link
            href="/orders/delivery"
            className="flex items-center gap-2.5 rounded-xl bg-primary-soft px-3.5 py-3 text-[13px] font-semibold text-primary-ink"
          >
            <Truck className="size-4 shrink-0" aria-hidden />
            {t("bosta.goShip")}
          </Link>
        )}
        <p className="text-xs text-faint">{t("bosta.onlyThisStore")}</p>
      </div>
      <SheetFooter className="flex-row flex-wrap gap-2">
        <Button type="button" className={BUTTON_CLASS} disabled={isPending || readOnly} onClick={save}>
          {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
          {saved ? t("save") : t("connect")}
        </Button>
        {current && (
          <Button type="button" variant="outline" className={BUTTON_CLASS} disabled={isPending || readOnly} onClick={remove}>
            {t("disconnect")}
          </Button>
        )}
      </SheetFooter>
    </>
  );
}
