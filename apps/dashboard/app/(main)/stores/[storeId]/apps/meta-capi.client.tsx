"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CircleCheck, LoaderCircle, TriangleAlert } from "lucide-react";

import { validateMetaCapiInput } from "@workspace/lib/integrations";
import type { StoreIntegrationSummary } from "@workspace/lib/integrations/server";
import { SheetFooter } from "@workspace/ui/components/sheet";
import { Field, Note, SellerButton, TextInput } from "@/components/seller-ui";
import { APP_DRAWER_FOOTER_CLASS } from "./app-drawer.lib";
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
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-[18px]">
        {!pixelConnected && (
          <Note tone="amber" icon={TriangleAlert}>
            {t("errors.pixelRequired")}
          </Note>
        )}
        {saved && (
          <p className="flex items-center gap-2 text-[13px]">
            <CircleCheck className="size-4 text-success" aria-hidden />
            {t("metaCapi.tokenSaved")}
            {current?.details.testMode ? ` · ${t("metaCapi.testMode")}` : ""}
          </p>
        )}
        {current?.status === "error" && current.lastError && (
          <Note tone="danger">
            <span dir="auto">
              {t("lastError")}: {current.lastError}
            </span>
          </Note>
        )}
        <Field label={t("metaCapi.tokenLabel")} htmlFor="capi-token">
          <TextInput
            id="capi-token"
            type="password"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            className="text-start font-montserrat"
            value={token}
            placeholder={saved ? t("metaCapi.tokenKeep") : "EAA…"}
            aria-invalid={error ? true : undefined}
            aria-describedby="capi-hint"
            onChange={(event) => {
              setToken(event.target.value);
              setError(null);
            }}
          />
          <p id="capi-hint" className="text-xs text-(--s-faint)">
            {error ? <span className="font-semibold text-destructive">{error}</span> : t("metaCapi.tokenHint")}
          </p>
        </Field>
        <Field label={t("metaCapi.testCodeLabel")} htmlFor="capi-test" note={t("metaCapi.testCodeHint")}>
          <TextInput
            id="capi-test"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            className="text-start font-montserrat"
            value={testCode}
            placeholder="TEST12345"
            onChange={(event) => {
              setTestCode(event.target.value);
              setError(null);
            }}
          />
        </Field>
        <p className="text-xs text-(--s-faint)">{t("metaCapi.consentNote")}</p>
      </div>
      <SheetFooter className={APP_DRAWER_FOOTER_CLASS}>
        <SellerButton disabled={isPending || !pixelConnected} onClick={save}>
          {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
          {t("save")}
        </SellerButton>
        {saved && (
          <SellerButton variant="outline" disabled={isPending} onClick={test}>
            {t("metaCapi.test")}
          </SellerButton>
        )}
        {current && (
          <DisconnectAppButton
            pending={isPending}
            description={t("disconnectConfirm.metaCapi")}
            onConfirm={remove}
          />
        )}
      </SheetFooter>
    </>
  );
}
