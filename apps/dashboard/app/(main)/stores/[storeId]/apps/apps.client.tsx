"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  Download,
  Info,
  Lightbulb,
  LoaderCircle,
  Plug,
  Search,
  ShieldAlert,
} from "lucide-react";

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
import { cn } from "@workspace/ui/lib/utils";
import { BUTTON_CLASS } from "@/components/form/form-ui";
import { StoreLogo } from "@/components/stores/store-logo.client";
import { APP_BRANDS, groupOf, kindLabelOf, type AppGroup } from "./apps-brand.lib";
import { connectStoreApp, disconnectStoreApp } from "./apps.server";
import type { AppCategoryOption } from "./apps.types";
import { GoogleSheetsPanel } from "./google-sheets.client";
import { MetaCapiPanel } from "./meta-capi.client";
import { ShopifyImportPanel } from "./shopify-import.client";

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

const GROUPS: AppGroup[] = ["tracking", "data"];

type Tab = "all" | AppGroup | "connected";

/** Identifier apps get a short "how to connect" list in the sheet. */
const STEP_KEYS = ["step1", "step2", "step3"] as const;

/** Result of the Google OAuth round-trip, passed back as `?google=…` (P7-06). */
const GOOGLE_RESULTS = new Set(["connected", "cancelled", "failed", "invalid", "rateLimited"]);

export type AppsStore = { name: string; logoUrl: string | null; hostname: string };

export function StoreApps({
  storeId,
  store,
  initial,
  readOnly,
  googleSheetsEnabled,
  categories,
}: {
  storeId: string;
  store: AppsStore;
  initial: StoreIntegrationSummary[];
  readOnly: boolean;
  googleSheetsEnabled: boolean;
  categories: AppCategoryOption[];
}) {
  const t = useTranslations("storeApps");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<IntegrationProvider | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const byProvider = new Map(items.map((item) => [item.provider, item]));
  const providers = ORDER.filter((p) => INTEGRATION_PROVIDERS.includes(p));

  useEffect(() => setItems(initial), [initial]);

  const googleResult = searchParams.get("google");
  useEffect(() => {
    if (!googleResult || !GOOGLE_RESULTS.has(googleResult)) return;
    if (googleResult === "connected") toast.success(t("googleSheets.connected"));
    else toast.error(t(`googleSheets.result.${googleResult}`));
    router.replace(pathname);
  }, [googleResult, pathname, router, t]);

  const isAvailable = (provider: IntegrationProvider) =>
    INTEGRATIONS[provider].availability === "available" && (provider !== "google_sheets" || googleSheetsEnabled);
  const isConnected = (provider: IntegrationProvider) => byProvider.has(provider);

  const available = providers.filter(isAvailable);
  const connectedCount = available.filter(isConnected).length;
  // Available apps first, "coming soon" last.
  const sorted = [...providers].sort((a, b) => Number(!isAvailable(a)) - Number(!isAvailable(b)));

  const q = query.trim().toLowerCase();
  const matches = sorted.filter((provider) => {
    if (tab === "connected" && !isConnected(provider)) return false;
    if ((tab === "tracking" || tab === "data") && groupOf(INTEGRATIONS[provider].category) !== tab) return false;
    if (!q) return true;
    const text = `${t(`providers.${provider}.name`)} ${t(`providers.${provider}.vendor`)} ${t(`providers.${provider}.description`)}`;
    return text.toLowerCase().includes(q);
  });

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: t("tabs.all"), count: providers.length },
    ...GROUPS.map((group) => ({
      key: group,
      label: t(`groups.${group}`),
      count: providers.filter((p) => groupOf(INTEGRATIONS[p].category) === group).length,
    })),
    { key: "connected", label: t("tabs.connected"), count: connectedCount },
  ];

  const renderCard = (provider: IntegrationProvider) => (
    <AppCard
      key={provider}
      provider={provider}
      current={byProvider.get(provider)}
      available={isAvailable(provider)}
      disabled={readOnly && !byProvider.has(provider)}
      onOpen={() => setEditing(provider)}
    />
  );

  const noneConnected = tab === "connected" && !q;

  return (
    <div className="space-y-7">
      <section className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="mb-3.5 inline-flex h-[30px] max-w-full items-center gap-2 overflow-hidden rounded-full border bg-card ps-1 pe-2.5 text-xs whitespace-nowrap text-muted-foreground">
            <StoreLogo name={store.name} logoUrl={store.logoUrl} className="size-[22px] rounded-full" />
            <b className="font-semibold text-foreground">{store.name}</b>
            <span dir="ltr" className="truncate">
              {store.hostname}
            </span>
            {readOnly && (
              <Badge variant="outline" className="h-5">
                {t("readOnlyBadge")}
              </Badge>
            )}
          </div>
          <h1 className="text-[23px] leading-tight font-extrabold tracking-tight sm:text-[28px]">{t("heroTitle")}</h1>
          <p className="mt-2 max-w-[520px] text-pretty text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-2xl border bg-card px-[18px] py-3.5 shadow-xs md:justify-start">
          <div>
            <div className="text-[28px] leading-none font-extrabold">
              {connectedCount}
              <span className="text-base font-semibold text-faint">/{available.length}</span>
            </div>
            <small className="mt-1 block text-xs whitespace-nowrap text-muted-foreground">{t("connectedCount")}</small>
          </div>
          <div className="flex ps-2" aria-hidden>
            {available.map((provider) =>
              isConnected(provider) ? (
                <AppLogo key={provider} provider={provider} className="-ms-2 size-[34px] rounded-[10px] ring-[3px] ring-card" />
              ) : (
                <span
                  key={provider}
                  className="-ms-2 size-[34px] rounded-[10px] border-[1.5px] border-dashed bg-muted/50 ring-[3px] ring-card"
                />
              ),
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" className="flex w-full gap-1 overflow-x-auto rounded-xl border bg-card p-1 sm:w-auto">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex h-[34px] items-center justify-center gap-1.5 rounded-[9px] px-3.5 max-sm:flex-1 text-[13px] font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                tab === key && "bg-primary text-primary-foreground hover:text-primary-foreground",
              )}
            >
              {label}
              <span className="text-[11px] opacity-70">{count}</span>
            </button>
          ))}
        </div>
        <label className="flex h-[42px] w-full items-center gap-2 rounded-xl border bg-card px-3 text-faint focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/30 sm:ms-auto sm:w-[260px]">
          <Search className="size-4 shrink-0" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("find")}
            aria-label={t("find")}
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none"
          />
        </label>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-2xl border-[1.5px] border-dashed px-5 py-12 text-center text-muted-foreground">
          <b className="mb-1 block text-foreground">{noneConnected ? t("empty.noneTitle") : t("empty.noMatchTitle")}</b>
          {noneConnected ? t("empty.noneBody") : t("empty.noMatchBody")}
        </div>
      ) : tab === "all" && !q ? (
        GROUPS.map((group) => {
          const list = matches.filter((p) => groupOf(INTEGRATIONS[p].category) === group);
          return (
            <section key={group} aria-labelledby={`apps-${group}`}>
              <div className="mb-3 flex items-baseline gap-2.5">
                <h2 id={`apps-${group}`} className="text-[13px] font-bold tracking-wider whitespace-nowrap text-muted-foreground uppercase">
                  {t(`groups.${group}`)}
                </h2>
                <span className="text-xs text-faint">{t("groupCount", { count: list.length })}</span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3.5">
                {list.map(renderCard)}
              </div>
            </section>
          );
        })
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3.5">{matches.map(renderCard)}</div>
      )}

      <div className="flex flex-wrap items-center gap-3.5 rounded-2xl border-[1.5px] border-dashed px-[18px] py-4 text-muted-foreground">
        <Lightbulb className="size-[22px] shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <b className="block text-foreground">{t("request.title")}</b>
          <span className="text-[13px]">{t("request.body")}</span>
        </div>
        <Button asChild variant="outline" className="h-9 rounded-[10px] font-semibold">
          <Link href="/help">{t("request.cta")}</Link>
        </Button>
      </div>

      <AppSheet
        key={editing ?? "none"}
        storeId={storeId}
        provider={editing}
        current={editing ? byProvider.get(editing) : undefined}
        pixelConnected={byProvider.get("meta_pixel")?.status === "connected"}
        categories={categories}
        readOnly={readOnly}
        onClose={() => setEditing(null)}
        onSaved={(summary) => setItems((list) => [...list.filter((i) => i.provider !== summary.provider), summary])}
        onRemoved={(provider) => setItems((list) => list.filter((i) => i.provider !== provider))}
      />
    </div>
  );
}

/** The brand tile, with a green check when the app is connected. */
function AppLogo({
  provider,
  connected,
  className,
}: {
  provider: IntegrationProvider;
  connected?: boolean;
  className?: string;
}) {
  const brand = APP_BRANDS[provider];
  return (
    <span
      className={cn(
        "relative grid size-12 shrink-0 place-items-center rounded-[14px]",
        brand.dark && "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
        className,
      )}
      style={{ background: brand.bg }}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-[52%]" style={{ fill: brand.fg }}>
        <path d={brand.icon.path} />
      </svg>
      {connected && (
        <span className="absolute -end-1 -bottom-1 grid size-[18px] place-items-center rounded-full bg-success text-background ring-[3px] ring-card">
          <Check className="size-[11px] stroke-[3]" aria-hidden />
        </span>
      )}
    </span>
  );
}

function AppCard({
  provider,
  current,
  available,
  disabled,
  onOpen,
}: {
  provider: IntegrationProvider;
  current?: StoreIntegrationSummary;
  available: boolean;
  disabled: boolean;
  onOpen: () => void;
}) {
  const t = useTranslations("storeApps");
  const isImport = provider === "shopify_import";
  const connected = Boolean(current);
  const failing = current?.status === "error";
  const interactive = available && !disabled;

  const pill = !available ? (
    <span className="inline-flex h-6 items-center rounded-full bg-accent-soft px-2.5 text-xs font-semibold whitespace-nowrap text-accent-ink">
      {t("comingSoon")}
    </span>
  ) : failing ? (
    <Badge variant="destructive">{t("error")}</Badge>
  ) : connected ? (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-success-soft px-2.5 text-xs font-semibold whitespace-nowrap text-success before:size-1.5 before:rounded-full before:bg-current">
      {isImport ? t("imported") : t("connected")}
    </span>
  ) : (
    <span className="inline-flex h-6 items-center rounded-full border bg-muted/50 px-2.5 text-xs font-semibold whitespace-nowrap text-muted-foreground">
      {t(`kinds.${kindLabelOf(provider)}`)}
    </span>
  );

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-disabled={available && disabled ? true : undefined}
      onClick={interactive ? onOpen : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen();
              }
            }
          : undefined
      }
      className={cn(
        "relative flex flex-col gap-3.5 rounded-2xl border bg-card p-[18px] text-start shadow-xs transition-[transform,box-shadow,border-color] duration-200",
        interactive &&
          "cursor-pointer outline-none hover:-translate-y-0.5 hover:border-input hover:shadow-[0_10px_30px_-12px_rgba(20,81,99,0.25)] focus-visible:ring-[3px] focus-visible:ring-ring/40",
        connected && "border-success/45",
        !available && "[&_.app-logo]:opacity-80 [&_.app-logo]:grayscale-[.35]",
        available && disabled && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3.5">
        <AppLogo provider={provider} connected={connected && !failing} className="app-logo" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] leading-snug font-bold">{t(`providers.${provider}.name`)}</h3>
          <small className="mt-0.5 block text-xs text-faint">{t(`providers.${provider}.vendor`)}</small>
          {connected && (current?.identifier || current?.details.shopDomain) && (
            <p dir="ltr" className="mt-1 truncate text-start font-mono text-xs text-faint rtl:text-end">
              {current?.identifier ?? current?.details.shopDomain}
            </p>
          )}
        </div>
      </div>
      <p className="flex-1 text-pretty text-[13px] leading-relaxed text-muted-foreground">
        {t(`providers.${provider}.description`)}
      </p>
      <div className="flex items-center justify-between gap-2.5 border-t pt-3.5">
        {pill}
        {available &&
          (connected ? (
            <span className="inline-flex h-9 items-center gap-2 rounded-[10px] border px-3.5 text-[13px] font-semibold">
              {isImport ? t("view") : t("manage")}
              <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-[10px] bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground",
                disabled && "opacity-45",
              )}
            >
              {isImport ? <Download className="size-4" aria-hidden /> : <Plug className="size-4" aria-hidden />}
              {isImport ? t("import") : t("connect")}
            </span>
          ))}
      </div>
    </div>
  );
}

function AppSheet({
  storeId,
  provider,
  current,
  pixelConnected,
  categories,
  readOnly,
  onClose,
  onSaved,
  onRemoved,
}: {
  storeId: string;
  provider: IntegrationProvider | null;
  current?: StoreIntegrationSummary;
  pixelConnected: boolean;
  categories: AppCategoryOption[];
  readOnly: boolean;
  onClose: () => void;
  onSaved: (summary: StoreIntegrationSummary) => void;
  onRemoved: (provider: IntegrationProvider) => void;
}) {
  const t = useTranslations("storeApps");
  const format = useFormatter();
  const since = current?.connectedAt
    ? format.dateTime(new Date(current.connectedAt), { day: "numeric", month: "short" })
    : null;

  return (
    <Sheet open={provider !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-[460px]">
        {provider && (
          <>
            <SheetHeader className="flex-row items-center gap-3.5 border-b px-[22px] py-5">
              <AppLogo provider={provider} className="size-14 rounded-2xl" />
              <div className="min-w-0">
                <SheetTitle className="text-lg font-extrabold">{t(`providers.${provider}.name`)}</SheetTitle>
                <SheetDescription className="text-[13px]">
                  {current && since
                    ? t("connectedSince", {
                        state: provider === "shopify_import" ? t("imported") : t("connected"),
                        date: since,
                      })
                    : t(`providers.${provider}.vendor`)}
                </SheetDescription>
              </div>
            </SheetHeader>
            <p className="px-4 pt-5 text-sm text-muted-foreground">{t(`providers.${provider}.description`)}</p>
            {provider === "meta_capi" ? (
              <MetaCapiPanel
                storeId={storeId}
                current={current}
                pixelConnected={pixelConnected}
                onSaved={onSaved}
                onRemoved={() => onRemoved(provider)}
                onClose={onClose}
              />
            ) : provider === "shopify_import" ? (
              <ShopifyImportPanel
                storeId={storeId}
                current={current}
                categories={categories}
                readOnly={readOnly}
                onSaved={onSaved}
                onRemoved={() => onRemoved(provider)}
                onClose={onClose}
              />
            ) : provider === "google_sheets" ? (
              <GoogleSheetsPanel
                storeId={storeId}
                current={current}
                readOnly={readOnly}
                onRemoved={() => onRemoved(provider)}
                onClose={onClose}
              />
            ) : (
              <IdentifierPanel
                storeId={storeId}
                provider={provider}
                current={current}
                onClose={onClose}
                onSaved={onSaved}
                onRemoved={onRemoved}
              />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function IdentifierPanel({
  storeId,
  provider,
  current,
  onClose,
  onSaved,
  onRemoved,
}: {
  storeId: string;
  provider: IntegrationProvider;
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
      router.refresh();
      onClose();
    });
  };

  const remove = () => {
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

  const message = error ?? (trimmed ? (valid ? t("looksGood") : t(`providers.${provider}.invalid`)) : null);

  return (
    <>
      <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto px-4 py-5">
        {INTEGRATIONS[provider].warnsAboutSellerScripts && (
          <p className="flex gap-2 rounded-xl bg-accent-soft p-3 text-[13px] text-accent-ink">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t("gtmWarning")}
          </p>
        )}
        {!current && (
          <div>
            <p className="mb-2.5 text-xs font-bold tracking-wider text-faint uppercase">{t("howTo")}</p>
            <ol className="flex flex-col">
              {STEP_KEYS.map((step, index) => (
                <li key={step} className="relative flex gap-3 pb-4 text-[13px] text-muted-foreground last:pb-0">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-ink">
                    {index + 1}
                  </span>
                  {index < STEP_KEYS.length - 1 && (
                    <span className="absolute start-[11.5px] top-7 bottom-1 w-px bg-border" aria-hidden />
                  )}
                  <span className="pt-0.5">
                    {t.rich(`providers.${provider}.${step}`, {
                      b: (chunks) => <b className="font-semibold text-foreground">{chunks}</b>,
                    })}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="app-id" className="flex justify-between gap-2">
            {t(`providers.${provider}.idLabel`)}
          </Label>
          <Input
            id="app-id"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "h-[46px] rounded-xl bg-muted/40 px-3.5 font-mono text-sm",
              trimmed && !valid && "border-destructive",
            )}
            value={value}
            placeholder={t(`providers.${provider}.placeholder`)}
            aria-invalid={error || (trimmed && !valid) ? true : undefined}
            aria-describedby="app-id-hint"
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
          />
          <p id="app-id-hint" className="min-h-[18px] text-xs text-faint">
            {message ? (
              <span className={error || !valid ? "text-destructive" : "text-success"}>{message}</span>
            ) : (
              t(`providers.${provider}.hint`)
            )}
          </p>
        </div>
        {current && (
          <p className="flex gap-2.5 rounded-xl bg-primary-soft px-3.5 py-3 text-xs leading-relaxed text-primary-ink">
            <Info className="mt-px size-4 shrink-0" aria-hidden />
            {t("eventsDelay", { vendor: t(`providers.${provider}.vendor`) })}
          </p>
        )}
        <p className="text-xs text-faint">{t("onlyThisStore")}</p>
      </div>
      <SheetFooter className="flex-row justify-end gap-2.5 border-t px-[22px] py-4">
        {current ? (
          <Button
            type="button"
            variant="outline"
            className={cn(BUTTON_CLASS, "border-destructive/35 text-destructive hover:text-destructive")}
            disabled={isPending}
            onClick={remove}
          >
            {t("disconnect")}
          </Button>
        ) : (
          <Button type="button" variant="ghost" className={BUTTON_CLASS} disabled={isPending} onClick={onClose}>
            {t("cancel")}
          </Button>
        )}
        <Button type="button" className={BUTTON_CLASS} disabled={isPending || !valid} onClick={save}>
          {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : !current && <Plug aria-hidden />}
          {current ? t("save") : t("connect")}
        </Button>
      </SheetFooter>
    </>
  );
}
