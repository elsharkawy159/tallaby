import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { appPaths, type AppManifest, type AppSettingsRoute } from "@workspace/apps";
import { asc, db, sellerProductCategories } from "@workspace/db";
import { DEFAULT_CURRENCY, parseStoreCurrency } from "@workspace/lib";
import { DEFAULT_MCP_RESOURCE } from "@workspace/lib/agents";
import { getBillingState } from "@workspace/lib/billing/server";
import { isIntegrationProvider } from "@workspace/lib/integrations";
import { getBostaOverview, getWassalhaOverview, type StoreIntegrationSummary } from "@workspace/lib/integrations/server";
import { easykashCallbackUrl } from "@workspace/lib/payments/store-gateways";
import { getStoreGatewayOverview } from "@workspace/lib/payments/store-gateways/server";
import { TALLABY_PAY_DEFAULT_SETTINGS } from "@workspace/lib/tallaby-pay";
import { SIZE_CHART_APP, listStoreSizeCharts } from "@workspace/lib/size-charts/server";
import { DOWNSELL_APP } from "@workspace/lib/downsell";
import { listDownsellCoupons, listStoreDownsells } from "@workspace/lib/downsell/server";
import { parseStoreSalesPopup } from "@workspace/lib/stores/sales-popup";
import { parseStoreTopLoader } from "@workspace/lib/stores/top-loader";
import { WHATSAPP_BUTTON_APP, parseStoreWhatsAppButton } from "@workspace/lib/stores/whatsapp-button";
import { formatPhone } from "@workspace/store-sections/social";
import { readPriceRoundingSetting } from "@workspace/lib/products/price-rounding";
import { storeUrl } from "@workspace/lib/storefront";
import { getStoreWhatsAppOverview, listStoreWhatsAppMessages } from "@workspace/lib/whatsapp/store/server";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { parseStoreSeo } from "@workspace/lib/stores";
import { taxonomyInStore } from "@workspace/lib/stores/scope/server";
import type { StoreRow } from "@workspace/lib/stores/server";
import { getAllCategories } from "@/actions/categories";
import { filterCategoryTreeByKind } from "@workspace/lib/products/category-kind"; // F-108e
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { StoreGatewaysCard } from "../../settings/payments/gateways.client";
import { StoreSalesPopupSettings } from "../../settings/sales-popup/sales-popup.client";
import type { AppCenterStoreState } from "../app-center.lib";
import type { AppCategoryOption } from "../apps.types";
import { labelStoreCategories } from "@/lib/stores/category-labels.lib";
import { ProductFeeds } from "../product-feeds.client";
import { storeFeedUrls } from "../product-feeds.lib";
import { SearchConsoleApp } from "../search-console.client";
import { searchConsoleUrls } from "../search-console.lib";
import { AiAssistantsApp } from "./ai-assistants/ai-assistants.client";
import { BostaApp } from "./bosta/bosta.client";
import { CrossSellApp } from "./cross-sell/cross-sell.client";
import { DownsellApp } from "./downsell/downsell.client";
import { IntegrationSettings } from "./integration-settings.client";
import { PriceRoundingApp } from "./price-rounding/price-rounding.client";
import { FeaturePageApp } from "./feature-page/feature-page";
import { StoreQrCodesScreen } from "./qr-codes/qr-codes.data";
import { SizeChartApp } from "./size-chart/size-chart.client";
import { TopLoaderApp } from "./top-loader/top-loader.client";
import { readStoreBrandColor } from "./top-loader/top-loader.query";
import { WassalhaApp } from "./wassalha/wassalha.client";
import { WhatsAppApp } from "./whatsapp/whatsapp.client";
import { WhatsAppButtonApp } from "./whatsapp-button/whatsapp-button.client";

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
  // F-108e: Shopify products are physical, so only physical categories are offered.
  const categories = tree?.success ? categoryOptions(filterCategoryTreeByKind(tree.data ?? [], "physical") as CategoryNode[], locale) : [];
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

  // F-39 / F-100: the same card as Store settings › Payment methods, showing only this gateway (Tallaby Pay: Turn on / off).
  gateway: async ({ store, manifest, readOnly }) => {
    const [{ usdLive }, overview, feeOnDelivery] = await Promise.all([
      getBillingState(),
      getStoreGatewayOverview(store.sellerId, store.id),
      isSwitchOn("fee_on_delivery"),
    ]);
    return (
      <StoreGatewaysCard
        storeId={store.id}
        initial={overview ?? { connected: null, webhooksReady: false, tallabyPay: { ...TALLABY_PAY_DEFAULT_SETTINGS } }}
        readOnly={readOnly}
        usdLive={usdLive}
        feeOnDelivery={feeOnDelivery}
        currency={parseStoreCurrency(store.settings).currency ?? DEFAULT_CURRENCY}
        only={[manifest.id]}
        // The store was loaded for the session seller, so this is their own URL (never from the client).
        easykashCallbackUrl={manifest.id === "easykash" ? easykashCallbackUrl(store.sellerId) : null}
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
        .select({
          id: sellerProductCategories.id,
          name: sellerProductCategories.name,
          nameAr: sellerProductCategories.nameAr,
          parentId: sellerProductCategories.parentId,
          position: sellerProductCategories.position,
        })
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
        categories={labelStoreCategories(categories, locale)}
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
  // Moved from Website › SEO (2026-11-27): the same stores.seo.googleSiteVerification, on the store's own address.
  google_search_console: async ({ store, readOnly }) => {
    const customDomain = await findActiveCustomDomainForSubdomain(store.subdomain);
    return (
      <SearchConsoleApp
        storeId={store.id}
        initial={parseStoreSeo(store.seo).googleSiteVerification}
        urls={searchConsoleUrls(storeUrl(store.subdomain, customDomain))}
        published={store.siteStatus === "published"}
        readOnly={readOnly}
      />
    );
  },
  qr_codes: async ({ store }) => <StoreQrCodesScreen store={store} />,

  // Top loader (owner, 2026-11-27): on by default, brand colour or a custom one, in stores.settings.topLoader.
  top_loader: async ({ store, readOnly }) => (
    <TopLoaderApp storeId={store.id} brandColor={await readStoreBrandColor(store)} initial={parseStoreTopLoader(store.settings)} readOnly={readOnly} />
  ),

  // WhatsApp button (owner, 2026-11-27): install switch and settings in stores.settings.whatsappButton.
  whatsapp_button: async ({ store, state, readOnly }) => {
    const contact = (store.contact ?? {}) as { whatsapp?: unknown; phone?: unknown };
    const storeNumber =
      [contact.whatsapp, contact.phone].map((value) => (typeof value === "string" && value.length <= 40 ? formatPhone(value) : null)).find(Boolean) ?? null;
    return (
      <WhatsAppButtonApp
        storeId={store.id}
        installed={state.installs.some((install) => install.appKey === WHATSAPP_BUTTON_APP)}
        storeNumber={storeNumber}
        initial={parseStoreWhatsAppButton(store.settings)}
        readOnly={readOnly}
      />
    );
  },

  // Marketing tools (owner, 2026-11-27). F-32: the store-wide switch (from Store settings › Checkout); offers stay per product.
  cross_sell: async ({ store, readOnly }) => <CrossSellApp storeId={store.id} enabled={store.crossSellEnabled} readOnly={readOnly} />,

  // F-22: the same settings as the old Store settings › Sales pop-up page (that URL redirects here).
  // F-112: the Round prices card, moved here from Store settings › General (owner, 2026-11-27).
  price_rounding: async ({ store, readOnly }) => {
    const currency = parseStoreCurrency(store.settings);
    return (
      <PriceRoundingApp
        storeId={store.id}
        money={{ currency: currency.currency, label: currency.label }}
        initial={readPriceRoundingSetting(store.settings)}
        readOnly={readOnly}
      />
    );
  },

  // Features with their own page (coupons, automatic discounts …), listed as apps too (owner, 2026-11-27).
  feature_page: async ({ store, manifest }) => (manifest.opens ? <FeaturePageApp storeId={store.id} page={manifest.opens} /> : null),

  sales_popup: async ({ store, readOnly }) => (
    <StoreSalesPopupSettings storeId={store.id} siteUrl={storeUrl(store.subdomain, null)} initial={parseStoreSalesPopup(store.settings)} readOnly={readOnly} />
  ),

  // F-116: on/off and one offer per product. "Not available yet" while 0185 is missing.
  downsell: async ({ store, state, readOnly }) => {
    const [locale, catalogSplit] = await Promise.all([getLocale(), isSwitchOn("stores_catalog_split")]);
    const scope = { sellerId: store.sellerId, storeId: store.id, catalogSplit };
    const [list, coupons] = await Promise.all([listStoreDownsells(scope, locale), listDownsellCoupons(scope)]);
    return (
      <DownsellApp
        storeId={store.id}
        installed={state.installs.some((install) => install.appKey === DOWNSELL_APP)}
        readOnly={readOnly}
        list={list}
        coupons={coupons}
      />
    );
  },

  // F-109: on/off, chosen events with previews, 30-day numbers and history. Read-only "Coming soon" while the
  // admin has WhatsApp off; every read falls back to that when 0180 is missing (shipped dark, owner 2026-11-26).
  whatsapp: async ({ store, readOnly }) => {
    const [overview, messages] = await Promise.all([
      getStoreWhatsAppOverview(store.sellerId, store.id),
      listStoreWhatsAppMessages(store.sellerId, store.id, { page: 1 }),
    ]);
    return <WhatsAppApp storeId={store.id} storeName={store.name} readOnly={readOnly} overview={overview} initialMessages={messages} />;
  },
};

