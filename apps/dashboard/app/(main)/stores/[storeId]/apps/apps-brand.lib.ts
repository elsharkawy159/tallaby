import {
  siGoogleanalytics,
  siGooglesheets,
  siGoogletagmanager,
  siMeta,
  siShopify,
  siSnapchat,
  siTiktok,
  type SimpleIcon,
} from "simple-icons";
import type { IntegrationCategory, IntegrationProvider } from "@workspace/lib/integrations";

/** Brand mark and tile colours for each app card (Apps & integrations design). */
export type AppBrand = { icon: SimpleIcon; bg: string; fg: string; dark?: boolean };

export const APP_BRANDS: Record<IntegrationProvider, AppBrand> = {
  meta_pixel: { icon: siMeta, bg: "#0866FF", fg: "#FFFFFF" },
  meta_capi: { icon: siMeta, bg: "#0B1F3A", fg: "#5AA0FF", dark: true },
  google_analytics: { icon: siGoogleanalytics, bg: "#F9AB00", fg: "#FFFFFF" },
  google_tag_manager: { icon: siGoogletagmanager, bg: "#246FDB", fg: "#FFFFFF" },
  tiktok_pixel: { icon: siTiktok, bg: "#000000", fg: "#FFFFFF", dark: true },
  snapchat_pixel: { icon: siSnapchat, bg: "#FFFC00", fg: "#000000" },
  shopify_import: { icon: siShopify, bg: "#95BF47", fg: "#FFFFFF" },
  google_sheets: { icon: siGooglesheets, bg: "#0F9D58", fg: "#FFFFFF" },
};

/** The page groups apps in two tabs; export and import share "Import & export". */
export type AppGroup = "tracking" | "data";

export const groupOf = (category: IntegrationCategory): AppGroup => (category === "tracking" ? "tracking" : "data");

/** How each app works, shown on the card before it is connected. */
export type AppKindLabel = "script" | "server" | "import" | "account";

export function kindLabelOf(provider: IntegrationProvider): AppKindLabel {
  if (provider === "meta_capi") return "server";
  if (provider === "shopify_import") return "import";
  if (provider === "google_sheets") return "account";
  return "script";
}
