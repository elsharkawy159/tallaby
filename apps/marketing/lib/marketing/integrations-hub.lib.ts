import { Banknote, Bike, MessageCircle, Smartphone, type LucideIcon } from "lucide-react";
import { INTEGRATION_PAGES } from "./detail-pages.lib";

/**
 * The /integrations list. Status follows the code: `STORE_APPS` and the
 * integrations registry in packages/lib (soon = no live provider there).
 * Words are under `integrationsHub.items.<id>`. No logo files: `mark` is a
 * coloured tile with the brand's initial, or an icon for our own features.
 */

export const INTEGRATION_CATEGORIES = ["ship", "pay", "ads", "catalog", "data", "messaging"] as const;
export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];

export type HubMark = { initial: string; color: string; onColor?: string } | { icon: LucideIcon };

export type IntegrationItem = {
  id: string;
  category: IntegrationCategory;
  mark: HubMark;
  /** Latin name, so an Arabic visitor's Latin search still finds it. */
  keywords?: string;
  soon?: boolean;
  featured?: boolean;
};

export const INTEGRATION_ITEMS: readonly IntegrationItem[] = [
  { id: "bosta", category: "ship", mark: { initial: "B", color: "#e30613" }, keywords: "Bosta", featured: true },
  { id: "wassalha", category: "ship", mark: { initial: "W", color: "#0f9d58" }, keywords: "Wassalha" },
  { id: "riders", category: "ship", mark: { icon: Bike } },
  { id: "aramex", category: "ship", mark: { initial: "A", color: "#e2231a" }, keywords: "Aramex", soon: true },
  { id: "jt", category: "ship", mark: { initial: "J", color: "#d6001c" }, keywords: "J&T Express", soon: true },
  { id: "mylerz", category: "ship", mark: { initial: "M", color: "#ff6a00" }, keywords: "Mylerz", soon: true },

  { id: "paymob", category: "pay", mark: { initial: "P", color: "#1f6bff" }, keywords: "Paymob", featured: true },
  { id: "kashier", category: "pay", mark: { initial: "K", color: "#0b3c5d" }, keywords: "Kashier" },
  { id: "cod", category: "pay", mark: { icon: Banknote }, keywords: "COD" },
  { id: "transfer", category: "pay", mark: { icon: Smartphone }, keywords: "InstaPay Vodafone Cash" },

  { id: "meta-pixel", category: "ads", mark: { initial: "M", color: "#0866ff" }, keywords: "Meta Pixel Facebook Instagram Conversions API", featured: true },
  { id: "ga4", category: "ads", mark: { initial: "G", color: "#f9ab00", onColor: "#0f3a46" }, keywords: "Google Analytics GA4" },
  { id: "gtm", category: "ads", mark: { initial: "G", color: "#4285f4" }, keywords: "Google Tag Manager GTM" },
  { id: "tiktok-pixel", category: "ads", mark: { initial: "T", color: "#111111" }, keywords: "TikTok Pixel", soon: true },
  { id: "snap-pixel", category: "ads", mark: { initial: "S", color: "#fffc00", onColor: "#111111" }, keywords: "Snapchat Pixel", soon: true },

  { id: "meta-catalog", category: "catalog", mark: { initial: "M", color: "#0866ff" }, keywords: "Meta catalog Commerce Manager feed" },
  { id: "gmc", category: "catalog", mark: { initial: "G", color: "#4285f4" }, keywords: "Google Merchant Center feed" },
  { id: "tiktok-catalog", category: "catalog", mark: { initial: "T", color: "#111111" }, keywords: "TikTok catalog feed" },

  { id: "sheets", category: "data", mark: { initial: "S", color: "#0f9d58" }, keywords: "Google Sheets" },
  { id: "shopify", category: "data", mark: { initial: "S", color: "#5e8e3e" }, keywords: "Shopify" },

  { id: "whatsapp", category: "messaging", mark: { icon: MessageCircle }, keywords: "WhatsApp", soon: true },
];

/** Cards link only to detail pages that exist. */
export function integrationHref(id: string): string | undefined {
  return INTEGRATION_PAGES.some((page) => page.slug === id) ? `/integrations/${id}` : undefined;
}
