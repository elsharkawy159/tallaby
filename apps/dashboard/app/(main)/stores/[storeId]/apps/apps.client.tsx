"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BarChart3, Code2, LoaderCircle, Plug, Radar, ShieldAlert, type LucideIcon } from "lucide-react";

import {
  INTEGRATIONS,
  INTEGRATION_PROVIDERS,
  validateIdentifierConfig,
  type IntegrationProvider,
} from "@workspace/lib/integrations";
import type { StoreIntegrationSummary } from "@workspace/lib/integrations/server";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { BUTTON_CLASS, FIELD_CLASS, SectionCard, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { connectStoreApp, disconnectStoreApp } from "./apps.server";

const ICONS: Partial<Record<IntegrationProvider, LucideIcon>> = {
  meta_pixel: Radar,
  google_analytics: BarChart3,
  google_tag_manager: Code2,
};

/** Shown in the order sellers are most likely to need them. */
const ORDER: IntegrationProvider[] = [
  "meta_pixel",
  "google_analytics",
  "google_tag_manager",
  "meta_capi",
  "tiktok_pixel",
  "snapchat_pixel",
  "google_sheets",
  "shopify_import",
];

export function StoreApps({
  storeId,
  initial,
  readOnly,
}: {
  storeId: string;
  initial: StoreIntegrationSummary[];
  readOnly: boolean;
}) {
  const t = useTranslations("storeApps");
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<IntegrationProvider | null>(null);
  const byProvider = new Map(items.map((item) => [item.provider, item]));
  const providers = ORDER.filter((p) => INTEGRATION_PROVIDERS.includes(p));

  return (
    <SectionCard id="store-apps" icon={Plug} title={t("title")} description={t("description")}>
      <ul className="grid gap-3 sm:grid-cols-2">
        {providers.map((provider) => {
          const definition = INTEGRATIONS[provider];
          const current = byProvider.get(provider);
          const connected = current?.status === "connected";
          const Icon = ICONS[provider] ?? Plug;
          const available = definition.availability === "available";
          return (
            <li key={provider} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary-ink">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{t(`providers.${provider}.name`)}</h3>
                    {!available ? (
                      <Badge variant="outline">{t("soon")}</Badge>
                    ) : connected ? (
                      <Badge variant="secondary">{t("connected")}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-pretty text-[13px] text-muted-foreground">
                    {t(`providers.${provider}.description`)}
                  </p>
                  {connected && current?.identifier && (
                    <p dir="ltr" className="mt-1 truncate text-start font-mono text-xs text-faint rtl:text-end">
                      {current.identifier}
                    </p>
                  )}
                </div>
              </div>
              {available && (
                <Button
                  type="button"
                  variant={connected ? "outline" : "secondary"}
                  className={SMALL_BUTTON_CLASS}
                  disabled={readOnly}
                  onClick={() => setEditing(provider)}
                >
                  {connected ? t("manage") : t("connect")}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <ConnectSheet
        key={editing ?? "none"}
        storeId={storeId}
        provider={editing}
        current={editing ? byProvider.get(editing) : undefined}
        onClose={() => setEditing(null)}
        onSaved={(summary) => setItems((list) => [...list.filter((i) => i.provider !== summary.provider), summary])}
        onRemoved={(provider) => setItems((list) => list.filter((i) => i.provider !== provider))}
      />
    </SectionCard>
  );
}

function ConnectSheet({
  storeId,
  provider,
  current,
  onClose,
  onSaved,
  onRemoved,
}: {
  storeId: string;
  provider: IntegrationProvider | null;
  current?: StoreIntegrationSummary;
  onClose: () => void;
  onSaved: (summary: StoreIntegrationSummary) => void;
  onRemoved: (provider: IntegrationProvider) => void;
}) {
  const t = useTranslations("storeApps");
  const router = useRouter();
  const [value, setValue] = useState(current?.identifier ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    if (!provider) return;
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
      router.refresh();
      onClose();
    });
  };

  const remove = () => {
    if (!provider) return;
    startTransition(async () => {
      const result = await disconnectStoreApp(storeId, provider);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      onRemoved(provider);
      toast.success(t("removed"));
      router.refresh();
      onClose();
    });
  };

  return (
    <Sheet open={provider !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        {provider && (
          <>
            <SheetHeader>
              <SheetTitle>{t(`providers.${provider}.name`)}</SheetTitle>
              <SheetDescription>{t(`providers.${provider}.description`)}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
              {INTEGRATIONS[provider].warnsAboutSellerScripts && (
                <p className="flex gap-2 rounded-xl bg-accent-soft p-3 text-[13px] text-accent-ink">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {t("gtmWarning")}
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="app-id">{t(`providers.${provider}.idLabel`)}</Label>
                <Input
                  id="app-id"
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  className={FIELD_CLASS}
                  value={value}
                  placeholder={t(`providers.${provider}.placeholder`)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby="app-id-hint"
                  onChange={(event) => {
                    setValue(event.target.value);
                    setError(null);
                  }}
                />
                <p id="app-id-hint" className="text-xs text-muted-foreground">
                  {error ? <span className="text-destructive">{error}</span> : t(`providers.${provider}.hint`)}
                </p>
              </div>
              <p className="text-xs text-faint">{t("onlyThisStore")}</p>
            </div>
            <SheetFooter className="flex-row gap-2">
              <Button type="button" className={BUTTON_CLASS} disabled={isPending} onClick={save}>
                {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
                {t("save")}
              </Button>
              {current && (
                <Button type="button" variant="outline" className={BUTTON_CLASS} disabled={isPending} onClick={remove}>
                  {t("disconnect")}
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
