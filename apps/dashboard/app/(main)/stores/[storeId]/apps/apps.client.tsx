"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  BookOpen,
  ChartLine,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Info,
  LayoutGrid,
  Lightbulb,
  LoaderCircle,
  MessageSquare,
  Plug,
  PlugZap,
  Search,
  ShieldAlert,
  Sparkles,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { isPaidAppPricing } from "@workspace/lib/billing/app-pricing";
import {
  INTEGRATIONS,
  STORE_APPS,
  STORE_APP_GROUPS,
  isStoreAppDefaultInstalled,
  isStoreAppLive,
  isStoreAppRequestable,
  storeAppHref,
  storeAppPricing,
  storeAppProvider,
  validateIdentifierConfig,
  type IntegrationProvider,
  type StoreApp,
  type StoreAppGroup,
} from "@workspace/lib/integrations";
import type { StoreIntegrationSummary } from "@workspace/lib/integrations/server";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { EmptyState, Field, IconTile, InputGroup, Note, PageHeader, PageTabs, SellerButton, SellerCard, StatusBadge, Tag, TextInput } from "@/components/seller-ui";
import { StoreLogo } from "@/components/stores/store-logo.client";
import { StoreSiteStatusNote } from "@/components/stores/store-site-status-note";
import { cn } from "@/lib/utils";
import { AppLogo } from "./app-logo";
import { APP_DRAWER_CLASS, APP_DRAWER_FOOTER_CLASS } from "./app-drawer.lib";
import { AppInstallDialog, useAppPriceLabel } from "./app-install.client";
import { connectStoreApp, disconnectStoreApp, requestApp } from "./apps.server";
import { DisconnectAppButton } from "./disconnect-button.client";
import type { AppCategoryOption } from "./apps.types";
import { GoogleSheetsPanel } from "./google-sheets.client";
import { MetaCapiPanel } from "./meta-capi.client";
import { MetaEventsSettings } from "./meta-events.client";
import { MetaDomainVerification } from "./meta-domain.client";
import { ShopifyImportPanel } from "./shopify-import.client";

/**
 * The catalog (`STORE_APPS`) decides the order, the groups and which apps
 * have their own page (Bosta, Wassalha, the payment gateways); the others
 * open the side sheet below. Installed lists what this store has; Explore
 * lists the whole catalog by category (F-47).
 */
type View = "installed" | "explore";
type Category = "all" | StoreAppGroup;

const APP_GRID = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-3";

/** Identifier apps get a short "how to connect" list in the sheet. */
const STEP_KEYS = ["step1", "step2", "step3"] as const;

/** Result of the Google OAuth round-trip, passed back as `?google=…` (P7-06). */
const GOOGLE_RESULTS = new Set(["connected", "cancelled", "failed", "invalid", "rateLimited"]);

/** Where a new store usually starts; hidden once installed. A fixed suggestion, not a statistic. */
const SUGGESTED_KEYS = ["meta_pixel", "google_analytics", "bosta"];

const GROUP_ICONS: Record<Category, LucideIcon> = {
  all: LayoutGrid,
  ai: Sparkles,
  tracking: ChartLine,
  shipping: Truck,
  payments: CreditCard,
  data: ArrowLeftRight,
  messaging: MessageSquare,
};

export type AppsStore = {
  name: string;
  logoUrl: string | null;
  hostname: string;
  siteStatus: string;
  /** An active custom domain: Meta can only verify a domain the seller owns. */
  hasCustomDomain: boolean;
  /** Meta Pixel › Domain verification token (stores.seo). */
  metaDomainToken: string | null;
};

export function StoreApps({
  storeId,
  store,
  initial,
  installs,
  requests,
  readOnly,
  googleSheetsEnabled,
  usdLive,
  feedsReady,
  categories,
  feeds,
}: {
  storeId: string;
  store: AppsStore;
  initial: StoreIntegrationSummary[];
  /** Apps with a live install row (0139). Connected ones come from `initial`, default ones from the catalog. */
  installs: { appKey: string; cancelAtPeriodEnd: boolean }[];
  /** What this store asked for (0143, F-62). */
  requests: { appKey: string; status: "requested" | "enabled" | "declined" }[];
  readOnly: boolean;
  googleSheetsEnabled: boolean;
  /** The USD switch (0136): until it is on, the server refuses to install a paid app. */
  usdLive: boolean;
  /** How many feed addresses platforms can read now (none before the site is published). */
  feedsReady: number;
  categories: AppCategoryOption[];
  /** Product feeds (F-11b): shown on the Installed tab, under the apps. */
  feeds?: ReactNode;
}) {
  const t = useTranslations("storeApps");
  const tSetup = useTranslations("storeSetup");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<IntegrationProvider | null>(null);
  const [installTarget, setInstallTarget] = useState<StoreApp | null>(null);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [, startRequest] = useTransition();
  const [view, setView] = useState<View>("installed");
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const priceLabel = useAppPriceLabel();
  const byProvider = new Map(items.map((item) => [item.provider, item]));
  const apps: StoreApp[] = [...STORE_APPS];

  useEffect(() => setItems(initial), [initial]);

  const googleResult = searchParams.get("google");
  useEffect(() => {
    if (!googleResult || !GOOGLE_RESULTS.has(googleResult)) return;
    if (googleResult === "connected") toast.success(t("googleSheets.connected"));
    else toast.error(t(`googleSheets.result.${googleResult}`));
    router.replace(pathname);
  }, [googleResult, pathname, router, t]);

  const isAvailable = (app: StoreApp) => isStoreAppLive(app) && (app.key !== "google_sheets" || googleSheetsEnabled);
  const currentOf = (app: StoreApp) => {
    const provider = storeAppProvider(app);
    return provider ? byProvider.get(provider) : undefined;
  };
  const isConnected = (app: StoreApp) => Boolean(currentOf(app));
  const installOf = (app: StoreApp) => installs.find((install) => install.appKey === app.key);
  const hasInstallRow = (app: StoreApp) => Boolean(installOf(app));
  const isInstalled = (app: StoreApp) =>
    isAvailable(app) && (isStoreAppDefaultInstalled(app) || isConnected(app) || hasInstallRow(app));
  // A paid app has nothing to buy it with until the wallet is in dollars; what is already bought stays manageable.
  const isPaidLocked = (app: StoreApp) => isPaidAppPricing(storeAppPricing(app)) && !usdLive && !hasInstallRow(app);

  const available = apps.filter(isAvailable);
  const connectedCount = available.filter(isConnected).length;
  // Available apps first, "coming soon" last.
  const sorted = [...apps].sort((a, b) => Number(!isAvailable(a)) - Number(!isAvailable(b)));

  const installedApps = sorted.filter(isInstalled);
  const q = query.trim().toLowerCase();
  const matchesQuery = (app: StoreApp) => {
    if (!q) return true;
    const text = `${t(`providers.${app.key}.name`)} ${t(`providers.${app.key}.vendor`)} ${t(`providers.${app.key}.description`)}`;
    return text.toLowerCase().includes(q);
  };
  const exploreApps = sorted.filter((app) => category === "all" || app.group === category);
  const matches = (view === "installed" ? installedApps : exploreApps).filter(matchesQuery);
  const suggested = apps.filter((app) => SUGGESTED_KEYS.includes(app.key) && isAvailable(app) && !isInstalled(app));

  const categoryTabs: { key: Category; label: string; count: number }[] = [
    { key: "all", label: t("tabs.all"), count: apps.length },
    ...STORE_APP_GROUPS.map((group) => ({
      key: group,
      label: t(`groups.${group}`),
      count: apps.filter((app) => app.group === group).length,
    })),
  ];

  const openApp = (app: StoreApp) => {
    const href = storeAppHref(storeId, app);
    const provider = storeAppProvider(app);
    // Connect flows stay as they are. Only an app with no panel, or a paid one not yet bought, goes through the engine.
    const viaEngine = (!href && !provider) || (isPaidAppPricing(storeAppPricing(app)) && !hasInstallRow(app));
    if (viaEngine) setInstallTarget(app);
    else if (href) router.push(href);
    else if (provider) setEditing(provider);
  };

  const request = (app: StoreApp) => {
    setRequesting(app.key);
    startRequest(async () => {
      const result = await requestApp(storeId, app.key);
      setRequesting(null);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("appRequest.sent"));
      router.refresh();
    });
  };

  const renderCard = (app: StoreApp) => (
    <AppCard
      key={app.key}
      app={app}
      current={currentOf(app)}
      available={isAvailable(app)}
      installed={isInstalled(app)}
      paidLocked={isPaidLocked(app)}
      priceLabel={priceLabel(storeAppPricing(app))}
      disabled={readOnly && !isConnected(app)}
      requestStatus={requests.find((item) => item.appKey === app.key)?.status ?? null}
      requesting={requesting === app.key}
      onRequest={() => request(app)}
      onOpen={() => openApp(app)}
    />
  );

  const noneInstalled = view === "installed" && !q;

  return (
    <>
      <PageHeader
        title={tSetup("appsTitle")}
        description={t("description")}
        actions={
          <div className="flex min-w-0 max-w-full items-center gap-2.5 rounded-full border border-(--s-line) bg-(--s-surface) py-1 ps-1 pe-3.5">
            <StoreLogo name={store.name} logoUrl={store.logoUrl} className="size-8 rounded-full" />
            <span className="min-w-0 leading-tight">
              <b className="block truncate text-[13px] font-bold text-(--s-ink)">
                <bdi>{store.name}</bdi>
              </b>
              <bdi dir="ltr" className="block truncate font-montserrat text-[11.5px] text-(--s-subtle)">
                {store.hostname}
              </bdi>
            </span>
            {readOnly && <Tag tone="warning">{t("readOnlyBadge")}</Tag>}
          </div>
        }
      />
      <StoreSiteStatusNote siteStatus={store.siteStatus} className="text-[13px]" />

      <div className="flex flex-wrap items-center gap-3">
        <PageTabs
          sticky={false}
          className="max-[720px]:w-full"
          value={view}
          onChange={(key) => setView(key as View)}
          tabs={[
            { key: "installed", icon: LayoutGrid, label: <TabLabel label={t("views.installed")} count={installedApps.length} /> },
            { key: "explore", icon: BookOpen, label: <TabLabel label={t("views.explore")} count={apps.length} /> },
          ]}
        />
        <InputGroup
          type="search"
          className="ms-auto min-w-[220px] flex-[0_1_280px] rounded-full max-[860px]:ms-0 max-[860px]:flex-[1_1_100%]"
          start={<Search className="size-4" aria-hidden />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("find")}
          aria-label={t("find")}
        />
      </div>

      {view === "installed" ? (
        <div className="flex flex-col gap-[22px]">
          {!q && (
            <div className="grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
              <SummaryCard icon={PlugZap} tone="success" label={t("connectedCount")} value={`${connectedCount}/${available.length}`} />
              <SummaryCard icon={LayoutGrid} label={tSetup("installedCount")} value={installedApps.length} />
              <SummaryCard icon={BookOpen} tone="accent" label={tSetup("feedsReadyCount")} value={feedsReady} />
            </div>
          )}

          <section aria-labelledby="apps-yours">
            <div className="mb-2.5 flex items-baseline gap-2.5">
              <h2 id="apps-yours" className="text-base font-bold text-(--s-ink)">
                {tSetup("yourApps")}
              </h2>
              <span className="font-montserrat text-[12.5px] text-(--s-faint)">{matches.length}</span>
              <button
                type="button"
                onClick={() => setView("explore")}
                className="ms-auto inline-flex min-h-6 cursor-pointer items-center text-[13px] font-bold text-(--s-link) hover:underline max-[600px]:min-h-10"
              >
                {tSetup("addApp")}
              </button>
            </div>
            {matches.length === 0 ? (
              <SellerCard>
                <AppsEmpty none={noneInstalled} />
              </SellerCard>
            ) : (
              <SellerCard className="flex flex-col overflow-hidden">
                {matches.map((app) => (
                  <InstalledRow
                    key={app.key}
                    app={app}
                    current={currentOf(app)}
                    priceLabel={priceLabel(storeAppPricing(app))}
                    disabled={readOnly && !isConnected(app)}
                    onOpen={() => openApp(app)}
                  />
                ))}
              </SellerCard>
            )}
          </section>

          {!q && feeds}

          {!q && suggested.length > 0 && (
            <section aria-labelledby="apps-suggested">
              <h2 id="apps-suggested" className="mb-2.5 text-base font-bold text-(--s-ink)">
                {tSetup("suggestedTitle")}
              </h2>
              <div className={APP_GRID}>{suggested.map(renderCard)}</div>
            </section>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[220px_minmax(0,1fr)] items-start gap-5 max-[1000px]:grid-cols-1">
          {/* A row of pills on small screens, a sidebar from 1000px up. */}
          <nav
            aria-label={t("views.categories")}
            className="sticky top-[88px] flex flex-col gap-0.5 rounded-[20px] border border-(--s-line) bg-(--s-surface) p-2 max-[1000px]:static max-[1000px]:flex-row max-[1000px]:overflow-x-auto max-[1000px]:rounded-full max-[1000px]:p-1 max-[1000px]:[scrollbar-width:none] max-[1000px]:[&::-webkit-scrollbar]:hidden"
          >
            {categoryTabs.map(({ key, label, count }) => {
              const Icon = GROUP_ICONS[key];
              const active = category === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(key)}
                  className={cn(
                    "flex min-h-[38px] shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-start text-[13.5px] font-semibold whitespace-nowrap text-(--s-body) transition-colors duration-150 hover:bg-(--s-hover) max-[1000px]:min-h-10 max-[1000px]:rounded-full",
                    active && "bg-(--s-solid) text-(--s-solid-fg) hover:bg-(--s-solid)",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0 text-(--s-subtle)", active && "text-current")} aria-hidden />
                  <span className="flex-1">{label}</span>
                  <em className={cn("font-montserrat text-[11px] font-semibold text-(--s-faint) not-italic max-[1000px]:hidden", active && "text-current")}>{count}</em>
                </button>
              );
            })}
          </nav>

          <div className="flex min-w-0 flex-col gap-[22px]">
            {category === "all" && !q && (
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-[24px] bg-(--tallaby-teal-900) px-[22px] py-5 text-white max-[600px]:grid-cols-1">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold">{tSetup("featuredTitle")}</h3>
                  <p className="mt-1 max-w-[460px] text-pretty text-[13px] text-[#c6d8dc]">{tSetup("featuredBody")}</p>
                </div>
                <span aria-hidden className="flex">
                  {(["paymob", "kashier", "bosta"] as const).map((key) => (
                    <AppLogo key={key} app={key} className="-ms-2.5 size-[46px] rounded-[14px] ring-2 ring-(--tallaby-teal-900) first:ms-0" />
                  ))}
                </span>
              </div>
            )}
            {matches.length === 0 ? (
              <SellerCard>
                <AppsEmpty none={false} />
              </SellerCard>
            ) : category === "all" && !q ? (
              STORE_APP_GROUPS.map((group) => {
                const list = matches.filter((app) => app.group === group);
                return (
                  <section key={group} aria-labelledby={`apps-${group}`}>
                    <div className="mb-2.5 flex items-baseline gap-2.5">
                      <h2 id={`apps-${group}`} className="text-base font-bold text-(--s-ink)">
                        {t(`groups.${group}`)}
                      </h2>
                      <span className="text-[12.5px] text-(--s-faint)">{t("groupCount", { count: list.length })}</span>
                    </div>
                    <div className={APP_GRID}>{list.map(renderCard)}</div>
                  </section>
                );
              })
            ) : (
              <div className={APP_GRID}>{matches.map(renderCard)}</div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3.5 rounded-[22px] border-[1.5px] border-dashed border-(--s-field-strong) bg-(--s-tint) px-5 py-[18px]">
        <Lightbulb className="size-6 shrink-0 text-(--tallaby-amber-700)" aria-hidden />
        <div className="min-w-0 flex-1 basis-[200px]">
          <b className="block text-sm font-bold text-(--s-ink)">{t("request.title")}</b>
          <span className="text-[13px] text-(--s-muted)">{t("request.body")}</span>
        </div>
        <SellerButton variant="outline" size="sm" asChild>
          <Link href="/help">{t("request.cta")}</Link>
        </SellerButton>
      </div>

      <AppSheet
        key={editing ?? "none"}
        storeId={storeId}
        provider={editing}
        current={editing ? byProvider.get(editing) : undefined}
        pixelConnected={byProvider.get("meta_pixel")?.status === "connected"}
        capiConnected={Boolean(byProvider.get("meta_capi")?.credentialsSaved)}
        store={store}
        categories={categories}
        readOnly={readOnly}
        onClose={() => setEditing(null)}
        onSaved={(summary) => setItems((list) => [...list.filter((i) => i.provider !== summary.provider), summary])}
        onRemoved={(provider) => setItems((list) => list.filter((i) => i.provider !== provider))}
      />

      <AppInstallDialog
        storeId={storeId}
        target={
          installTarget && {
            key: installTarget.key,
            name: t(`providers.${installTarget.key}.name`),
            pricing: storeAppPricing(installTarget),
            // Removed but paid until the period ends: the dialog offers to keep it, for free.
            installed: hasInstallRow(installTarget) && !installOf(installTarget)?.cancelAtPeriodEnd,
          }
        }
        onClose={() => setInstallTarget(null)}
      />
    </>
  );
}

function TabLabel({ label, count }: { label: string; count: number }) {
  return (
    <>
      {label}
      <em className="ms-1 grid h-5 min-w-[22px] place-items-center rounded-full bg-current/10 px-1.5 font-montserrat text-[11px] font-bold not-italic">{count}</em>
    </>
  );
}

function SummaryCard({ icon, tone, label, value }: { icon: LucideIcon; tone?: "success" | "accent"; label: string; value: string | number }) {
  return (
    <SellerCard className="flex items-center gap-3 px-[18px] py-4">
      <IconTile icon={icon} tone={tone} />
      <div className="min-w-0">
        <small className="block text-xs text-(--s-subtle)">{label}</small>
        <b dir="ltr" className="block text-start font-montserrat text-[22px] font-extrabold leading-tight text-(--s-ink) tabular-nums rtl:text-end">
          {value}
        </b>
      </div>
    </SellerCard>
  );
}

function AppsEmpty({ none }: { none: boolean }) {
  const t = useTranslations("storeApps");
  return (
    <EmptyState
      icon={Search}
      title={none ? t("empty.noneTitle") : t("empty.noMatchTitle")}
      description={none ? t("empty.noneBody") : t("empty.noMatchBody")}
    />
  );
}

/** One app on the Installed tab: its state, what it is connected to and Manage. */
function InstalledRow({
  app,
  current,
  priceLabel,
  disabled,
  onOpen,
}: {
  app: StoreApp;
  current?: StoreIntegrationSummary;
  priceLabel: string;
  disabled: boolean;
  onOpen: () => void;
}) {
  const t = useTranslations("storeApps");
  const isImport = app.key === "shopify_import";
  const connected = Boolean(current);
  const failing = current?.status === "error";
  const identifier = current?.identifier ?? current?.details.shopDomain;

  return (
    <div className="flex flex-wrap items-center gap-3.5 px-[18px] py-3.5 [&+&]:border-t [&+&]:border-(--s-line-soft)">
      <AppLogo app={app.key} connected={connected && !failing} className="size-11 rounded-[14px]" />
      <div className="min-w-0 flex-1 basis-[180px]">
        <b className="flex flex-wrap items-center gap-2 text-[14.5px] font-bold text-(--s-ink)">
          {t(`providers.${app.key}.name`)}
          {failing ? (
            <StatusBadge tone="danger">{t("error")}</StatusBadge>
          ) : (
            <StatusBadge tone="success">{connected ? (isImport ? t("imported") : t("connected")) : t("views.installed")}</StatusBadge>
          )}
        </b>
        <small className="mt-px block text-xs text-(--s-subtle)">
          {t(`groups.${app.group}`)} · {priceLabel}
        </small>
        {identifier && (
          <bdi dir="ltr" className="mt-0.5 block truncate font-montserrat text-xs text-(--s-faint)">
            {identifier}
          </bdi>
        )}
        {current?.details.pickupLocationName && (
          <small dir="auto" className="mt-0.5 block truncate text-xs text-(--s-faint)">
            {current.details.pickupLocationName}
          </small>
        )}
      </div>
      <SellerButton variant="mini" size="xs" className="ms-auto" disabled={disabled} onClick={onOpen}>
        {isImport ? t("view") : t("manage")}
        <ChevronRight className="rtl:rotate-180" aria-hidden />
      </SellerButton>
    </div>
  );
}

function AppCard({
  app,
  current,
  available,
  installed,
  paidLocked,
  priceLabel,
  disabled,
  requestStatus,
  requesting,
  onRequest,
  onOpen,
}: {
  app: StoreApp;
  current?: StoreIntegrationSummary;
  available: boolean;
  /** Default, connected or bought; `connected` below is only the integration kind. */
  installed: boolean;
  /** Paid, and can't be bought before the USD switch. */
  paidLocked: boolean;
  priceLabel: string;
  disabled: boolean;
  requestStatus: "requested" | "enabled" | "declined" | null;
  requesting: boolean;
  onRequest: () => void;
  onOpen: () => void;
}) {
  const t = useTranslations("storeApps");
  const tSetup = useTranslations("storeSetup");
  const isImport = app.key === "shopify_import";
  const connected = Boolean(current);
  const failing = current?.status === "error";
  const interactive = available && !disabled && !paidLocked;
  const requestable = isStoreAppRequestable(app);

  const pill =
    requestStatus === "enabled" ? (
      <StatusBadge tone="success">{t("appRequest.enabled")}</StatusBadge>
    ) : requestStatus === "requested" ? (
      <Tag tone="info">{t("appRequest.requested")}</Tag>
    ) : requestable ? (
      <Tag tone="warning">
        <Clock aria-hidden />
        {t("soon")}
      </Tag>
    ) : !available ? (
      <Tag tone="warning">
        <Clock aria-hidden />
        {t("comingSoon")}
      </Tag>
    ) : paidLocked ? (
      <Tag tone="warning" className="whitespace-normal">
        <Wallet aria-hidden />
        {tSetup("paidAfterSwitch")}
      </Tag>
    ) : failing ? (
      <StatusBadge tone="danger">{t("error")}</StatusBadge>
    ) : connected ? (
      <StatusBadge tone="success">{isImport ? t("imported") : t("connected")}</StatusBadge>
    ) : installed ? (
      <StatusBadge tone="success">{t("views.installed")}</StatusBadge>
    ) : (
      <Tag>{t(`kinds.${app.kind}`)}</Tag>
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
        "flex min-w-0 flex-col gap-3 rounded-[24px] border border-(--s-line) bg-(--s-glass) p-[18px] text-start shadow-(--s-shadow-card) transition-[transform,box-shadow,border-color] duration-200 max-[600px]:rounded-[20px]",
        interactive && "cursor-pointer hover:-translate-y-[3px] hover:shadow-(--s-shadow-hover) motion-reduce:hover:translate-y-0",
        connected && !failing && "border-success/35",
        !available && "[&_.app-logo]:opacity-80 [&_.app-logo]:grayscale-[.35]",
        available && disabled && "opacity-60",
      )}
    >
      <div className="flex items-center gap-3">
        <AppLogo app={app.key} connected={connected && !failing} className="app-logo size-[46px] rounded-[14px]" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[14.5px] leading-snug font-bold text-(--s-ink)">{t(`providers.${app.key}.name`)}</h3>
          <small className="mt-px block text-xs text-(--s-faint)">
            {t(`providers.${app.key}.vendor`)} · {priceLabel}
          </small>
          {connected && (current?.identifier || current?.details.shopDomain) && (
            <bdi dir="ltr" className="mt-0.5 block truncate font-montserrat text-xs text-(--s-faint)">
              {current?.identifier ?? current?.details.shopDomain}
            </bdi>
          )}
          {connected && current?.details.pickupLocationName && (
            <small dir="auto" className="mt-0.5 block truncate text-xs text-(--s-faint)">
              {current.details.pickupLocationName}
            </small>
          )}
        </div>
      </div>
      <p className="flex-1 text-pretty text-[12.5px] leading-[1.7] text-(--s-muted)">{t(`providers.${app.key}.description`)}</p>
      <div className="flex items-center justify-between gap-2">
        {pill}
        {requestable && !requestStatus && !disabled && (
          <SellerButton variant="solid" size="xs" disabled={requesting} onClick={onRequest}>
            {requesting && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("appRequest.request")}
          </SellerButton>
        )}
        {available &&
          !paidLocked &&
          // A label, not a second control: the whole card is the button.
          (installed ? (
            <span className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-(--s-outline) bg-(--s-surface) px-3 text-[12.5px] font-bold text-(--s-ink) max-[600px]:h-10">
              {isImport ? t("view") : t("manage")}
              <ChevronRight className="size-[15px] rtl:rotate-180" aria-hidden />
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full bg-(--s-solid) px-3 text-[12.5px] font-bold text-(--s-solid-fg) max-[600px]:h-10",
                disabled && "opacity-45",
              )}
            >
              {isImport ? <Download className="size-[15px]" aria-hidden /> : <Plug className="size-[15px]" aria-hidden />}
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
  capiConnected,
  store,
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
  capiConnected: boolean;
  store: AppsStore;
  categories: AppCategoryOption[];
  readOnly: boolean;
  onClose: () => void;
  onSaved: (summary: StoreIntegrationSummary) => void;
  onRemoved: (provider: IntegrationProvider) => void;
}) {
  const t = useTranslations("storeApps");
  const format = useFormatter();
  const locale = useLocale();
  const since = current?.connectedAt
    ? format.dateTime(new Date(current.connectedAt), { day: "numeric", month: "short" })
    : null;

  return (
    <Sheet open={provider !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={locale.startsWith("ar") ? "left" : "right"} className={APP_DRAWER_CLASS}>
        {provider && (
          <>
            <SheetHeader className="flex-row items-center gap-3 border-b border-(--s-line-soft) px-[18px] py-4 pe-14">
              <AppLogo app={provider} className="size-[52px] rounded-2xl" />
              <div className="min-w-0">
                <SheetTitle className="text-[17px] font-bold text-(--s-ink)">{t(`providers.${provider}.name`)}</SheetTitle>
                <SheetDescription className="text-[12.5px] text-(--s-subtle)">
                  {current && since
                    ? t("connectedSince", {
                        state: provider === "shopify_import" ? t("imported") : t("connected"),
                        date: since,
                      })
                    : t(`providers.${provider}.vendor`)}
                </SheetDescription>
              </div>
            </SheetHeader>
            <p className="px-[18px] pt-4 text-[13.5px] text-(--s-muted)">{t(`providers.${provider}.description`)}</p>
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
                capiConnected={capiConnected}
                store={store}
                readOnly={readOnly}
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
  capiConnected,
  store,
  readOnly,
  onClose,
  onSaved,
  onRemoved,
}: {
  storeId: string;
  provider: IntegrationProvider;
  current?: StoreIntegrationSummary;
  capiConnected: boolean;
  store: AppsStore;
  readOnly: boolean;
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
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-[18px]">
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
          <MetaEventsSettings
            storeId={storeId}
            current={current}
            capiConnected={capiConnected}
            readOnly={readOnly}
            onSaved={onSaved}
          />
        )}
        {provider === "meta_pixel" && (
          <MetaDomainVerification
            storeId={storeId}
            initial={store.metaDomainToken}
            hasCustomDomain={store.hasCustomDomain}
            readOnly={readOnly}
          />
        )}
        <p className="text-xs text-(--s-faint)">{t("onlyThisStore")}</p>
      </div>
      <SheetFooter className={APP_DRAWER_FOOTER_CLASS}>
        {current ? (
          <DisconnectAppButton pending={isPending} onConfirm={remove} />
        ) : (
          <SellerButton variant="outline" disabled={isPending} onClick={onClose}>
            {t("cancel")}
          </SellerButton>
        )}
        <SellerButton disabled={isPending || !valid} onClick={save}>
          {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : !current && <Plug aria-hidden />}
          {current ? t("save") : t("connect")}
        </SellerButton>
      </SheetFooter>
    </>
  );
}
