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
export type AppBrand = { icon: Pick<SimpleIcon, "path">; bg: string; fg: string; dark?: boolean };

/** Bosta is not in simple-icons: a parcel mark on Bosta red. */
const BOSTA_ICON = {
  path: "M12 1 2 6v12l10 5 10-5V6L12 1zm0 2.2L19.5 7 12 10.8 4.5 7 12 3.2zM4 8.6l7 3.5v8.7l-7-3.5V8.6zm9 12.2v-8.7l7-3.5v8.7l-7 3.5z",
};

export const APP_BRANDS: Record<IntegrationProvider, AppBrand> = {
  meta_pixel: { icon: siMeta, bg: "#0866FF", fg: "#FFFFFF" },
  meta_capi: { icon: siMeta, bg: "#0B1F3A", fg: "#5AA0FF", dark: true },
  google_analytics: { icon: siGoogleanalytics, bg: "#F9AB00", fg: "#FFFFFF" },
  google_tag_manager: { icon: siGoogletagmanager, bg: "#246FDB", fg: "#FFFFFF" },
  tiktok_pixel: { icon: siTiktok, bg: "#000000", fg: "#FFFFFF", dark: true },
  snapchat_pixel: { icon: siSnapchat, bg: "#FFFC00", fg: "#000000" },
  shopify_import: { icon: siShopify, bg: "#95BF47", fg: "#FFFFFF" },
  google_sheets: { icon: siGooglesheets, bg: "#0F9D58", fg: "#FFFFFF" },
  bosta: { icon: BOSTA_ICON, bg: "#E30613", fg: "#FFFFFF" },
};

/** The page groups apps in tabs; export and import share "Import & export". */
export type AppGroup = "shipping" | "tracking" | "data";

export const groupOf = (category: IntegrationCategory): AppGroup =>
  category === "tracking" ? "tracking" : category === "shipping" ? "shipping" : "data";

/** How each app works, shown on the card before it is connected. */
export type AppKindLabel = "script" | "server" | "import" | "account" | "courier";

export function kindLabelOf(provider: IntegrationProvider): AppKindLabel {
  if (provider === "meta_capi") return "server";
  if (provider === "shopify_import") return "import";
  if (provider === "google_sheets") return "account";
  if (provider === "bosta") return "courier";
  return "script";
}
