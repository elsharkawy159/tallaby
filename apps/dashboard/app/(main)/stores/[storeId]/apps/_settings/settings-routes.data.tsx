import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { appPaths, type AppManifest, type AppSettingsRoute } from "@workspace/apps";
import { asc, db, sellerProductCategories } from "@workspace/db";
import { DEFAULT_CURRENCY, parseStoreCurrency } from "@workspace/lib";
import { DEFAULT_MCP_RESOURCE } from "@workspace/lib/agents";
import { getBillingState } from "@workspace/lib/billing/server";
import { isIntegrationProvider } from "@workspace/lib/integrations";
import { getBostaOverview, getWassalhaOverview, type StoreIntegrationSummary } from "@workspace/lib/integrations/server";
import { getStoreGatewayOverview } from "@workspace/lib/payments/store-gateways/server";
import { SIZE_CHART_APP, listStoreSizeCharts } from "@workspace/lib/size-charts/server";
import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { parseStoreSeo } from "@workspace/lib/stores";
import { taxonomyInStore } from "@workspace/lib/stores/scope/server";
import type { StoreRow } from "@workspace/lib/stores/server";
import { getAllCategories } from "@/actions/categories";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { StoreGatewaysCard } from "../../settings/payments/gateways.client";
import type { AppCenterStoreState } from "../app-center.lib";
import type { AppCategoryOption } from "../apps.types";
import { ProductFeeds } from "../product-feeds.client";
import { storeFeedUrls } from "../product-feeds.lib";
import { AiAssistantsApp } from "./ai-assistants/ai-assistants.client";
import { BostaApp } from "./bosta/bosta.client";
import { IntegrationSettings } from "./integration-settings.client";
import { SizeChartApp } from "./size-chart/size-chart.client";
import { WassalhaApp } from "./wassalha/wassalha.client";

/**
 * Every `settingsRoute` key of the registry (@workspace/apps) mapped to the
 * EXISTING settings screen it renders at `/stores/:storeId/apps/:slug/settings`
 * (ROADMAP.md F-93). Typed `Record<AppSettingsRoute, …>`: a new key in the
 * registry does not compile until it has a screen here. Each loader reads
 * only the session seller's store (`ctx.store`, from loadStorePage, rule 5).
 */

export type AppSettingsContext = {
  store: StoreRow;
  manifest: AppManifest;
  state: AppCenterStoreState & { summaries: StoreIntegrationSummary[] };
  readOnly: boolean;
};

type CategoryNode = { id: string; name: string | null; nameAr: string | null; categories?: CategoryNode[] };

/** Flattens the admin category tree into "Parent › Child" options (P7-07 mapping). */
function categoryOptions(nodes: CategoryNode[], locale: string, prefix = ""): AppCategoryOption[] {
  return nodes.flatMap((node) => {
    const name = (locale === "ar" ? node.nameAr || node.name : node.name || node.nameAr) ?? "";
    const label = prefix ? `${prefix} › ${name}` : name;
    return [{ id: node.id, label }, ...categoryOptions(node.categories ?? [], locale, label)];
  });
}

async function integration({ store, manifest, state, readOnly }: AppSettingsContext): Promise<ReactNode> {
  const provider = manifest.internal.provider;
  if (!provider || !isIntegrationProvider(provider)) return null;
  const needsCategories = provider === "shopify_import";
  const [customDomain, tree, locale] = await Promise.all([
    provider === "meta_pixel" ? findActiveCustomDomainForSubdomain(store.subdomain) : Promise.resolve(null),
    needsCategories ? getAllCategories() : Promise.resolve(null),
    getLocale(),
  ]);
  const categories = tree?.success ? categoryOptions((tree.data ?? []) as CategoryNode[], locale) : [];
  return (
    <IntegrationSettings
      storeId={store.id}
      provider={provider}
      summaries={state.summaries}
      store={{ hasCustomDomain: Boolean(customDomain), metaDomainToken: parseStoreSeo(store.seo).facebookDomainVerification }}
      categories={categories}
      readOnly={readOnly}
      googleSheetsEnabled={state.googleSheetsEnabled}
      detailHref={appPaths.detail(store.id, manifest)}
    />
  );
}

export const APP_SETTINGS_SCREENS: Record<AppSettingsRoute, (ctx: AppSettingsContext) => Promise<ReactNode>> = {
  identifier: integration,
  meta_capi: integration,
  google_sheets: integration,
  shopify_import: integration,

  // BS-06: the connect wizard, or the settings once connected.
  bosta: async ({ store, readOnly }) => {
    const overview = await getBostaOverview(store.sellerId, store.id);
    return <BostaApp storeId={store.id} initial={overview} readOnly={readOnly} />;
  },

  // F-12c: the account printed on the export sheet.
  wassalha: async ({ store, readOnly }) => {
    const overview = await getWassalhaOverview(store.sellerId, store.id);
    return <WassalhaApp storeId={store.id} storeName={store.name} initial={overview} readOnly={readOnly} />;
  },

  // F-39: the same card as Store settings › Payment methods, showing only this gateway.
  gateway: async ({ store, manifest, readOnly }) => {
    const [{ usdLive }, overview] = await Promise.all([getBillingState(), getStoreGatewayOverview(store.sellerId, store.id)]);
    return (
      <StoreGatewaysCard
        storeId={store.id}
        initial={overview ?? { connected: null, webhooksReady: false }}
        readOnly={readOnly}
        usdLive={usdLive}
        currency={parseStoreCurrency(store.settings).currency ?? DEFAULT_CURRENCY}
        only={[manifest.id]}
      />
    );
  },

  // F-92: install toggle, charts, and what each applies to.
  size_chart: async ({ store, state, readOnly }) => {
    const scope = { sellerId: store.sellerId, storeId: store.id };
    const [locale, catalogSplit] = await Promise.all([getLocale(), isSwitchOn("stores_catalog_split")]);
    const [charts, categories] = await Promise.all([
      listStoreSizeCharts(scope, locale),
      db
        .select({ id: sellerProductCategories.id, name: sellerProductCategories.name, nameAr: sellerProductCategories.nameAr })
        .from(sellerProductCategories)
        .where(taxonomyInStore(sellerProductCategories, { ...scope, catalogSplit }))
        .orderBy(asc(sellerProductCategories.position), asc(sellerProductCategories.name))
        .limit(300),
    ]);
    return (
      <SizeChartApp
        storeId={store.id}
        installed={state.installs.some((install) => install.appKey === SIZE_CHART_APP)}
        readOnly={readOnly}
        charts={charts}
        categories={categories.map((c) => ({ id: c.id, name: (locale === "ar" ? c.nameAr || c.name : c.name || c.nameAr) ?? "" }))}
      />
    );
  },

  // F-29: connect Claude, ChatGPT, Claude Code and Cursor over MCP. `MCP_CONNECT_ENABLED=false` brings back "opening soon".
  ai_assistants: async () => (
    <AiAssistantsApp mcpUrl={process.env.MCP_SERVER_URL || DEFAULT_MCP_RESOURCE} live={process.env.MCP_CONNECT_ENABLED !== "false"} />
  ),

  // F-11b: feed addresses on the store's own address (active custom domain, else subdomain).
  product_feeds: async ({ store }) => {
    const customDomain = await findActiveCustomDomainForSubdomain(store.subdomain);
    const published = store.siteStatus === "published";
    return <ProductFeeds urls={storeFeedUrls(storeUrl(store.subdomain, customDomain), store.supportedLocales)} published={published} />;
  },
};

