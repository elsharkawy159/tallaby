import type { CurrencyLabel, StoreCurrency } from "@workspace/lib";
import type { StorePayments } from "@workspace/lib/payments/store-methods";
import type { StoreGatewayProvider } from "@workspace/lib/payments/store-gateways";
import type { StoreShippingSettings } from "@workspace/lib/shipping/store-zones";
import type { StoreShippingZone } from "@workspace/lib/stores/server";
import type { DesignSystem } from "@workspace/store-sections";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import type { CategoryOption } from "../products/add/add-product.schema";
import type { QuickProductCard } from "../products/add/ai/ai-product-uploader.lib";
import type { NicheChoices } from "@/lib/stores/niche-choices.lib";
import type { SetupFlags } from "../../../_components/setup-checklist.lib";
import type { WelcomeShippingDefault, WelcomeWallet } from "./welcome.lib";

/** What the welcome page's loader (`welcome.data.ts`) hands the client. */
export type WelcomeData = {
  storeId: string;
  storeName: string;
  readOnly: boolean;
  flags: SetupFlags;
  /** Website › Templates and the design system are open to this seller (store-builder rollout). */
  themesAvailable: boolean;
  aiEnabled: boolean;
  /** The first-product step. */
  product: {
    /** The store's newest live product, shown once the step is done; null before. */
    latest: QuickProductCard | null;
    /** What the inline AI uploader needs; loaded only while AI is on and the step is not done. */
    uploader: { categories: CategoryOption[]; sellerPricing: SellerPricingSettings } | null;
  };
  industry: {
    /** The saved industry's id, or null (none, or a category that matches no industry). */
    id: string | null;
    /** The saved category as typed, for a category outside the list. */
    category: { en: string; ar: string };
    /** The saved niche of that industry, or "" (the picker starts from it). */
    savedNiche: string;
    /** The niche the galleries sort by (saved, else guessed), or null; shown in the summary. */
    shownNiche: string | null;
    nicheOptions: NicheChoices;
  };
  brand: {
    logoUrl: string;
    faviconUrl: string;
    defaultLocale: "ar" | "en";
    supportedLocales: string[];
    /** The design-system DRAFT and its version (saveDesignSystem's optimistic check); null without the builder. */
    designSystem: { value: DesignSystem; version: number } | null;
  };
  /** Section 3, sharing the store. */
  share: {
    /** The link customers open: the live custom domain, else the Tallaby address. */
    url: string;
    subdomain: string;
    customDomain: string | null;
    /** `stores.site_status`: `draft` (never published) and `unpublished` are offline. */
    siteStatus: string;
  };
  /** Section 4, the top-up step: built on the server from the order lock (`welcomeWallet`). */
  wallet: WelcomeWallet;
  /** Section 2, shipping and payments. Every amount is in the store's currency. */
  delivery: {
    money: { currency: StoreCurrency; label: CurrencyLabel };
    shipping: {
      /** The whole parsed settings object: `saveShippingSettings` takes it whole (strict schema). */
      settings: StoreShippingSettings;
      zones: StoreShippingZone[];
      /** The zone offered while the store has none (`welcomeShippingDefault`). */
      suggested: WelcomeShippingDefault;
      /** That zone's names in both languages, built on the server; null for `none`. */
      zoneNames: { nameAr: string; nameEn: string } | null;
      /** Where the zone sheet's place picker starts, or null (no one country for the currency). */
      country: string | null;
      /** The suggested zone's name in the page locale ("All Egypt", "All Saudi Arabia"). */
      zoneLabel: string | null;
    };
    payments: {
      methods: StorePayments;
      /** The connected card gateway, or null. */
      gateway: StoreGatewayProvider | null;
      /** The card gateways that charge in the store's currency (linked to Settings › Payments). */
      gatewayProviders: StoreGatewayProvider[];
    };
  };
};
