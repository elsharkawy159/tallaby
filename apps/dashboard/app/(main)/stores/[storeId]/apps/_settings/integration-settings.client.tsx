"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Info, LoaderCircle, Plug, ShieldAlert } from "lucide-react";

import { INTEGRATIONS, validateIdentifierConfig, type IntegrationProvider } from "@workspace/lib/integrations";
import type { StoreIntegrationSummary } from "@workspace/lib/integrations/server";
import { SheetFooter } from "@workspace/ui/components/sheet";
import { Field, Note, SellerButton, SellerCard, TextInput } from "@/components/seller-ui";
import { APP_DRAWER_FOOTER_CLASS } from "../app-drawer.lib";
import { connectStoreApp, disconnectStoreApp } from "../apps.server";
import type { AppCategoryOption } from "../apps.types";
import { DisconnectAppButton } from "../disconnect-button.client";
import { GoogleSheetsPanel } from "../google-sheets.client";
import { MetaCapiPanel } from "../meta-capi.client";
import { MetaDomainVerification } from "../meta-domain.client";
import { MetaEventsSettings } from "../meta-events.client";
import { ShopifyImportPanel } from "../shopify-import.client";

/**
 * App Center › <app> › Settings for the integrations that used to open in the
 * Apps page's side sheet (Meta Pixel, Google Analytics, Tag Manager, Meta
 * Conversions API, Google Sheets, Shopify import). The panels are the same
 * components; only their frame moved from a sheet to the settings page (F-93).
 */

/** Identifier apps get a short "how to connect" list. */
const STEP_KEYS = ["step1", "step2", "step3"] as const;

/** Result of the Google OAuth round-trip, passed back as `?google=…` (P7-06). */
const GOOGLE_RESULTS = new Set(["connected", "cancelled", "failed", "invalid", "rateLimited"]);

export type IntegrationStoreInfo = {
  /** An active custom domain: Meta can only verify a domain the seller owns. */
  hasCustomDomain: boolean;
  /** Meta Pixel › Domain verification token (stores.seo). */
  metaDomainToken: string | null;
};

export function IntegrationSettings({
  storeId,
  provider,
  summaries,
  store,
  categories,
  readOnly,
  googleSheetsEnabled,
  detailHref,
}: {
  storeId: string;
  provider: IntegrationProvider;
  /** This store's integration rows (never another store's). */
  summaries: StoreIntegrationSummary[];
  store: IntegrationStoreInfo;
  categories: AppCategoryOption[];
  readOnly: boolean;
  googleSheetsEnabled: boolean;
  /** The app's overview: where Cancel goes. */
  detailHref: string;
}) {
  const t = useTranslations("storeApps");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [items, setItems] = useState(summaries);
  // Fresh rows after router.refresh() replace the optimistic ones (derived during render, no effect).
  const [seen, setSeen] = useState(summaries);
  if (seen !== summaries) {
    setSeen(summaries);
    setItems(summaries);
  }

  const googleResult = searchParams.get("google");
  useEffect(() => {
    if (!googleResult || !GOOGLE_RESULTS.has(googleResult)) return;
    if (googleResult === "connected") toast.success(t("googleSheets.connected"));
    else toast.error(t(`googleSheets.result.${googleResult}`));
    router.replace(pathname);
  }, [googleResult, pathname, router, t]);

  const current = items.find((item) => item.provider === provider);
  const onSaved = (summary: StoreIntegrationSummary) => {
    setItems((list) => [...list.filter((item) => item.provider !== summary.provider), summary]);
    router.refresh();
  };
  const onRemoved = () => {
    setItems((list) => list.filter((item) => item.provider !== provider));
    router.refresh();
  };
  // A panel "closes" after a save or a disconnect: stay here, with fresh data.
  const onClose = () => router.refresh();

  return (
    <SellerCard className="flex flex-col overflow-hidden">
      {provider === "meta_capi" ? (
        <MetaCapiPanel
          storeId={storeId}
          current={current}
          pixelConnected={items.find((item) => item.provider === "meta_pixel")?.status === "connected"}
          onSaved={onSaved}
          onRemoved={onRemoved}
          onClose={onClose}
        />
      ) : provider === "shopify_import" ? (
        <ShopifyImportPanel storeId={storeId} current={current} categories={categories} readOnly={readOnly} onSaved={onSaved} onRemoved={onRemoved} onClose={onClose} />
      ) : provider === "google_sheets" ? (
        googleSheetsEnabled ? (
          <GoogleSheetsPanel storeId={storeId} current={current} readOnly={readOnly} onRemoved={onRemoved} onClose={onClose} />
        ) : (
          <div className="p-[18px]">
            <Note tone="amber">{t("comingSoon")}</Note>
          </div>
        )
      ) : (
        <IdentifierPanel
          storeId={storeId}
          provider={provider}
          current={current}
          capiConnected={Boolean(items.find((item) => item.provider === "meta_capi")?.credentialsSaved)}
          store={store}
          readOnly={readOnly}
          onCancel={() => router.push(detailHref)}
          onSaved={onSaved}
          onRemoved={onRemoved}
        />
      )}
    </SellerCard>
  );
}

function IdentifierPanel({
  storeId,
  provider,
  current,
  capiConnected,
  store,
  readOnly,
  onCancel,
  onSaved,
  onRemoved,
}: {
  storeId: string;
  provider: IntegrationProvider;
  current?: StoreIntegrationSummary;
  capiConnected: boolean;
  store: IntegrationStoreInfo;
  readOnly: boolean;
  onCancel: () => void;
  onSaved: (summary: StoreIntegrationSummary) => void;
  onRemoved: () => void;
}) {
  const t = useTranslations("storeApps");
  const [value, setValue] = useState(current?.identifier ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const trimmed = value.trim();
  const valid = Boolean(trimmed) && validateIdentifierConfig(provider, value).success;

  const save = () => {
    // Same check as the server, for an immediate message.
    if (!validateIdentifierConfig(provider, value).success) {
      setError(t(`providers.${provider}.invalid`));
      return;
    }
    startTransition(async () => {
      const result = await connectStoreApp(storeId, provider, value);
      if (!result.success) {
        setError(result.error === "invalidId" ? t(`providers.${provider}.invalid`) : t(`errors.${result.error}`));
        return;
      }
      onSaved(result.data);
      toast.success(t("saved"));
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await disconnectStoreApp(storeId, provider);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setValue("");
      onRemoved();
      toast.success(t("removed"));
    });
  };

  const message = error ?? (trimmed ? (valid ? t("looksGood") : t(`providers.${provider}.invalid`)) : null);

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-[18px]">
        {INTEGRATIONS[provider].warnsAboutSellerScripts && (
          <Note tone="amber" icon={ShieldAlert}>
            {t("gtmWarning")}
          </Note>
        )}
        {!current && (
          <div>
            <p className="mb-2.5 text-[12.5px] font-bold text-(--s-subtle)">{t("howTo")}</p>
            <ol className="flex flex-col gap-2.5">
              {STEP_KEYS.map((step, index) => (
                <li key={step} className="flex gap-2.5 text-[12.5px] leading-[1.7] text-(--s-muted)">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft font-montserrat text-[11.5px] font-bold text-primary-ink">{index + 1}</span>
                  <span className="min-w-0 pt-0.5">
                    {t.rich(`providers.${provider}.${step}`, {
                      b: (chunks) => <b className="font-semibold text-(--s-text)">{chunks}</b>,
                    })}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <Field label={t(`providers.${provider}.idLabel`)} htmlFor="app-id">
          <TextInput
            id="app-id"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            className="text-start font-montserrat"
            value={value}
            disabled={readOnly}
            placeholder={t(`providers.${provider}.placeholder`)}
            aria-invalid={error || (trimmed && !valid) ? true : undefined}
            aria-describedby="app-id-hint"
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
          />
          <p id="app-id-hint" className="min-h-[18px] text-xs text-(--s-faint)">
            {message ? <span className={error || !valid ? "font-semibold text-destructive" : "font-semibold text-success"}>{message}</span> : t(`providers.${provider}.hint`)}
          </p>
        </Field>
        {current && <Note icon={Info}>{t("eventsDelay", { vendor: t(`providers.${provider}.vendor`) })}</Note>}
        {provider === "meta_pixel" && current && (
          <MetaEventsSettings storeId={storeId} current={current} capiConnected={capiConnected} readOnly={readOnly} onSaved={onSaved} />
        )}
        {provider === "meta_pixel" && (
          <MetaDomainVerification storeId={storeId} initial={store.metaDomainToken} hasCustomDomain={store.hasCustomDomain} readOnly={readOnly} />
        )}
        <p className="text-xs text-(--s-faint)">{t("onlyThisStore")}</p>
      </div>
      <SheetFooter className={APP_DRAWER_FOOTER_CLASS}>
        {current ? (
          <DisconnectAppButton pending={isPending} onConfirm={remove} />
        ) : (
          <SellerButton variant="outline" disabled={isPending} onClick={onCancel}>
            {t("cancel")}
          </SellerButton>
        )}
        <SellerButton disabled={isPending || !valid || readOnly} onClick={save}>
          {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : !current && <Plug aria-hidden />}
          {current ? t("save") : t("connect")}
        </SellerButton>
      </SheetFooter>
    </>
  );
}
