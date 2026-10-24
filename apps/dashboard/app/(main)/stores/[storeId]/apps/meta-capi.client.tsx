"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CircleCheck, LoaderCircle, TriangleAlert } from "lucide-react";

import { validateMetaCapiInput } from "@workspace/lib/integrations";
import type { StoreIntegrationSummary } from "@workspace/lib/integrations/server";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { SheetFooter } from "@workspace/ui/components/sheet";
import { BUTTON_CLASS, FIELD_CLASS } from "@/components/form/form-ui";
import { disconnectStoreApp } from "./apps.server";
import { DisconnectAppButton } from "./disconnect-button.client";
import { saveMetaCapi, testMetaCapi } from "./meta-capi.server";

/**
 * Meta Conversions API panel (PLAN.md §9.2, P7-05). The token field is
 * write-only: it starts empty, the saved token is never sent back, and the
 * panel only shows "token saved".
 */
export function MetaCapiPanel({
  storeId,
  current,
  pixelConnected,
  onSaved,
  onRemoved,
  onClose,
}: {
  storeId: string;
  current?: StoreIntegrationSummary;
  pixelConnected: boolean;
  onSaved: (summary: StoreIntegrationSummary) => void;
  onRemoved: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("storeApps");
  const router = useRouter();
  const [token, setToken] = useState("");
  const [testCode, setTestCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const saved = Boolean(current?.credentialsSaved);

  const save = () => {
    const check = validateMetaCapiInput({ accessToken: token, testEventCode: testCode });
    if (!check.success) {
      setError(t(`errors.${check.error === "invalid_token" ? "invalidToken" : "invalidTestCode"}`));
      return;
    }
    if (!saved && !check.data.accessToken) {
      setError(t("errors.tokenRequired"));
      return;
    }
    startTransition(async () => {
      const result = await saveMetaCapi(storeId, { accessToken: token, testEventCode: testCode });
      if (!result.success) {
        setError(t(`errors.${result.error}`));
        return;
      }
      setToken("");
      onSaved(result.data);
      toast.success(t("saved"));
      router.refresh();
    });
  };

  const test = () => {
    startTransition(async () => {
      const result = await testMetaCapi(storeId);
      if (!result.success) {
        toast.error(result.message ? `${t(`errors.${result.error}`)} ${result.message}` : t(`errors.${result.error}`));
        router.refresh();
        return;
      }
      onSaved(result.data);
      toast.success(t("metaCapi.testOk"));
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await disconnectStoreApp(storeId, "meta_capi");
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
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
        {!pixelConnected && (
          <p className="flex gap-2 rounded-xl bg-accent-soft p-3 text-[13px] text-accent-ink">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t("errors.pixelRequired")}
          </p>
        )}
        {saved && (
          <p className="flex items-center gap-2 text-[13px]">
            <CircleCheck className="size-4 text-primary" aria-hidden />
            {t("metaCapi.tokenSaved")}
            {current?.details.testMode ? ` · ${t("metaCapi.testMode")}` : ""}
          </p>
        )}
        {current?.status === "error" && current.lastError && (
          <p className="rounded-xl bg-destructive/10 p-3 text-[13px] text-destructive" dir="auto">
            {t("lastError")}: {current.lastError}
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="capi-token">{t("metaCapi.tokenLabel")}</Label>
          <Input
            id="capi-token"
            type="password"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            className={FIELD_CLASS}
            value={token}
            placeholder={saved ? t("metaCapi.tokenKeep") : "EAA…"}
            aria-invalid={error ? true : undefined}
            aria-describedby="capi-hint"
            onChange={(event) => {
              setToken(event.target.value);
              setError(null);
            }}
          />
          <p id="capi-hint" className="text-xs text-muted-foreground">
            {error ? <span className="text-destructive">{error}</span> : t("metaCapi.tokenHint")}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="capi-test">{t("metaCapi.testCodeLabel")}</Label>
          <Input
            id="capi-test"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            className={FIELD_CLASS}
            value={testCode}
            placeholder="TEST12345"
            onChange={(event) => {
              setTestCode(event.target.value);
              setError(null);
            }}
          />
          <p className="text-xs text-muted-foreground">{t("metaCapi.testCodeHint")}</p>
        </div>
        <p className="text-xs text-faint">{t("metaCapi.consentNote")}</p>
      </div>
      <SheetFooter className="flex-row flex-wrap gap-2">
        <Button type="button" className={BUTTON_CLASS} disabled={isPending || !pixelConnected} onClick={save}>
          {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
          {t("save")}
        </Button>
        {saved && (
          <Button type="button" variant="secondary" className={BUTTON_CLASS} disabled={isPending} onClick={test}>
            {t("metaCapi.test")}
          </Button>
        )}
        {current && (
          <DisconnectAppButton
            className={BUTTON_CLASS}
            pending={isPending}
            description={t("disconnectConfirm.metaCapi")}
            onConfirm={remove}
          />
        )}
      </SheetFooter>
    </>
  );
}
