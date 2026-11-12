"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeftRight,
  ChartLine,
  ChevronRight,
  CreditCard,
  LayoutGrid,
  Lightbulb,
  MessageSquare,
  PackageCheck,
  Ruler,
  Search,
  Sparkles,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";

import { APP_CATEGORIES, appPaths, getApp, localize, matchesAppQuery, type AppCategory, type AppId } from "@workspace/apps";
import { getStoreApp, storeAppPricing } from "@workspace/lib/integrations";
import { EmptyState, InputGroup, PageHeader, PageTabs, SellerButton, SellerCard, StatusBadge, Tag } from "@/components/seller-ui";
import { StoreLogo } from "@/components/stores/store-logo.client";
import { StoreSiteStatusNote } from "@/components/stores/store-site-status-note";
import { cn } from "@/lib/utils";
import { AppLogo } from "./app-logo";
import { useAppPriceLabel } from "./app-install.client";
import type { AppBadge, AppState, AppTab } from "./app-center.lib";

/**
 * The App Center (ROADMAP.md F-93): every app and integration in the
 * registry (`@workspace/apps`), searchable, by category, with an Installed
 * tab. A card opens the app's page; its settings live under it. The tab,
 * category and search are in the URL, so Back returns to the same list.
 */

const CATEGORY_ICONS: Record<AppCategory, LucideIcon> = {
  ai: Sparkles,
  storefront: Ruler,
  tracking: ChartLine,
  shipping: Truck,
  payments: CreditCard,
  data: ArrowLeftRight,
  messaging: MessageSquare,
};

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3";

export type AppCenterItem = { id: AppId; state: AppState };

export type AppCenterStore = { name: string; logoUrl: string | null; hostname: string; siteStatus: string };

const isCategory = (value: string | null): value is AppCategory => (APP_CATEGORIES as readonly string[]).includes(value ?? "");

export function AppCenter({ storeId, store, items, readOnly }: { storeId: string; store: AppCenterStore; items: AppCenterItem[]; readOnly: boolean }) {
  const t = useTranslations("appCenter");
  const tApps = useTranslations("storeApps");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const tab: AppTab = params.get("tab") === "installed" ? "installed" : "all";
  const rawCategory = params.get("category");
  const category: AppCategory | "all" = isCategory(rawCategory) ? rawCategory : "all";

  const setParams = (next: Record<string, string | null>) => {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    const qs = search.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const rows = useMemo(() => items.map((item) => ({ ...item, manifest: getApp(item.id)! })), [items]);
  const installed = rows.filter((row) => row.state.installed);
  const inTab = tab === "installed" ? installed : rows;
  const q = query.trim();
  const matches = inTab.filter((row) => (category === "all" || row.manifest.category === category) && matchesAppQuery(row.manifest, q));
  // Live first, coming soon last, keeping the registry's order otherwise.
  const ordered = [...matches].sort((a, b) => Number(a.state.badge === "coming_soon") - Number(b.state.badge === "coming_soon"));
  const grouped = category === "all" && !q;

  const counts = new Map<AppCategory, number>(APP_CATEGORIES.map((c) => [c, inTab.filter((row) => row.manifest.category === c).length]));
  const categoryTabs = [{ key: "all" as const, count: inTab.length }, ...APP_CATEGORIES.filter((c) => (counts.get(c) ?? 0) > 0).map((c) => ({ key: c, count: counts.get(c) ?? 0 }))];

  const card = (row: (typeof rows)[number]) => <AppCard key={row.id} storeId={storeId} id={row.id} state={row.state} />;

  return (
    <>
      <PageHeader
        title={t("title")}
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
            {readOnly && <Tag tone="warning">{tApps("readOnlyBadge")}</Tag>}
          </div>
        }
      />
      <StoreSiteStatusNote siteStatus={store.siteStatus} className="text-[13px]" />

      <div className="flex flex-col gap-3">
        <InputGroup
          type="search"
          className="h-[52px] rounded-[18px] text-[15px] max-[600px]:h-12"
          start={<Search className="size-[18px]" aria-hidden />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onBlur={() => setParams({ q: query.trim() || null })}
          onKeyDown={(event) => {
            if (event.key === "Enter") setParams({ q: query.trim() || null });
          }}
          placeholder={t("search")}
          aria-label={t("search")}
        />
        <div className="flex flex-wrap items-center gap-2.5">
          <PageTabs
            sticky={false}
            className="max-[720px]:w-full"
            value={tab}
            onChange={(key) => setParams({ tab: key === "installed" ? "installed" : null })}
            tabs={[
              { key: "all", icon: LayoutGrid, label: <TabLabel label={t("tabs.all")} count={rows.length} /> },
              { key: "installed", icon: PackageCheck, label: <TabLabel label={t("tabs.installed")} count={installed.length} /> },
            ]}
          />
          <nav
            aria-label={t("categoriesLabel")}
            className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categoryTabs.map(({ key, count }) => {
              const Icon = key === "all" ? LayoutGrid : CATEGORY_ICONS[key];
              const active = category === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setParams({ category: key === "all" ? null : key })}
                  className={cn(
                    "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-(--s-line) bg-(--s-surface) px-3 text-[12.5px] font-semibold whitespace-nowrap text-(--s-body) transition-colors duration-150 hover:border-(--s-outline-hover) max-[600px]:h-10",
                    active && "border-(--s-solid) bg-(--s-solid) text-(--s-solid-fg) hover:border-(--s-solid)",
                  )}
                >
                  <Icon className={cn("size-[15px] text-(--s-subtle)", active && "text-current")} aria-hidden />
                  {key === "all" ? t("allCategories") : tApps(`groups.${key}`)}
                  <em className={cn("font-montserrat text-[11px] text-(--s-faint) not-italic", active && "text-current")}>{count}</em>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {ordered.length === 0 ? (
        <SellerCard>
          {q ? (
            <EmptyState
              icon={Search}
              title={t("empty.searchTitle", { query: q })}
              description={t("empty.searchBody")}
              action={
                <SellerButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setParams({ q: null });
                  }}
                >
                  <X aria-hidden />
                  {t("empty.clear")}
                </SellerButton>
              }
            />
          ) : tab === "installed" ? (
            <EmptyState
              icon={PackageCheck}
              title={t("empty.installedTitle")}
              description={t("empty.installedBody")}
              action={
                <SellerButton variant="solid" size="sm" onClick={() => setParams({ tab: null })}>
                  {t("empty.browse")}
                </SellerButton>
              }
            />
          ) : (
            <EmptyState icon={LayoutGrid} title={t("empty.categoryTitle")} description={t("empty.categoryBody")} />
          )}
        </SellerCard>
      ) : grouped ? (
        <div className="flex flex-col gap-6">
          {APP_CATEGORIES.map((group) => {
            const list = ordered.filter((row) => row.manifest.category === group);
            if (!list.length) return null;
            const Icon = CATEGORY_ICONS[group];
            return (
              <section key={group} aria-labelledby={`apps-${group}`}>
                <div className="mb-2.5 flex items-center gap-2">
                  <Icon className="size-[17px] text-(--s-subtle)" aria-hidden />
                  <h2 id={`apps-${group}`} className="text-base font-bold text-(--s-ink)">
                    {tApps(`groups.${group}`)}
                  </h2>
                  <span className="text-[12.5px] text-(--s-faint)">{t("resultCount", { count: list.length })}</span>
                </div>
                <div className={GRID}>{list.map(card)}</div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <p className="text-[12.5px] text-(--s-faint)" aria-live="polite">
            {t("resultCount", { count: ordered.length })}
          </p>
          <div className={GRID}>{ordered.map(card)}</div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3.5 rounded-[22px] border-[1.5px] border-dashed border-(--s-field-strong) bg-(--s-tint) px-5 py-[18px]">
        <Lightbulb className="size-6 shrink-0 text-(--tallaby-amber-700)" aria-hidden />
        <div className="min-w-0 flex-1 basis-[200px]">
          <b className="block text-sm font-bold text-(--s-ink)">{tApps("request.title")}</b>
          <span className="text-[13px] text-(--s-muted)">{tApps("request.body")}</span>
        </div>
        <SellerButton variant="outline" size="sm" asChild>
          <Link href="/help">{tApps("request.cta")}</Link>
        </SellerButton>
      </div>
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

/** The badge's look. Exported for the app page header. */
export function AppStateBadge({ badge }: { badge: AppBadge }) {
  const t = useTranslations("appCenter.badge");
  if (badge === "available") return null;
  if (badge === "error") return <StatusBadge tone="danger">{t("error")}</StatusBadge>;
  if (badge === "connected" || badge === "installed" || badge === "enabled") return <StatusBadge tone="success">{t(badge)}</StatusBadge>;
  if (badge === "requested") return <Tag tone="info">{t("requested")}</Tag>;
  return (
    <Tag tone="warning" className="whitespace-normal">
      {t(badge)}
    </Tag>
  );
}

function AppCard({ storeId, id, state }: { storeId: string; id: AppId; state: AppState }) {
  const t = useTranslations("appCenter");
  const locale = useLocale();
  const priceLabel = useAppPriceLabel();
  const manifest = getApp(id)!;
  const app = getStoreApp(id)!;
  const soon = state.badge === "coming_soon";

  return (
    <Link
      href={appPaths.detail(storeId, manifest)}
      className={cn(
        "group flex min-w-0 flex-col gap-3 rounded-[22px] border border-(--s-line) bg-(--s-glass) p-[18px] text-start no-underline shadow-(--s-shadow-card) transition-[border-color,box-shadow] duration-150 hover:border-(--s-outline-hover) hover:shadow-(--s-shadow-hover) focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-(--s-focus) max-[600px]:rounded-[20px] max-[600px]:p-4",
        state.connected && !state.failing && "border-success/35",
        state.failing && "border-destructive/40",
      )}
    >
      <div className="flex items-start gap-3">
        <AppLogo app={id} connected={state.connected && !state.failing} className={cn("size-[46px] rounded-[14px]", soon && "opacity-80 grayscale-[.35]")} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[14.5px] leading-snug font-bold text-(--s-ink)">{localize(manifest.name, locale)}</h3>
          <small className="mt-px block truncate text-xs text-(--s-faint)">
            <bdi>{localize(manifest.vendor, locale)}</bdi>
            <span aria-hidden> · </span>
            {t(`kind.${manifest.kind}`)}
          </small>
        </div>
        <AppStateBadge badge={state.badge} />
      </div>
      <p className="line-clamp-2 flex-1 text-pretty text-[12.5px] leading-[1.7] text-(--s-muted)">{localize(manifest.summary, locale)}</p>
      <div className="flex items-center justify-between gap-2 border-t border-(--s-line-soft) pt-2.5">
        <span className="text-[12px] font-semibold text-(--s-subtle)">{priceLabel(storeAppPricing(app))}</span>
        <ChevronRight className="size-4 text-(--s-faint) transition-transform duration-150 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden />
      </div>
    </Link>
  );
}
