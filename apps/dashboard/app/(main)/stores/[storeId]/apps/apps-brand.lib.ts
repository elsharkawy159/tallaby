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

/** Bosta has no Simple Icons mark: a parcel on Bosta red. */
const BOSTA_ICON = {
  path: "M12 1.5 2.5 6.25v11.5L12 22.5l9.5-4.75V6.25L12 1.5Zm0 2.24 6.8 3.4-2.86 1.43-6.8-3.4L12 3.74ZM7.13 6.18l6.8 3.4L12 10.55 5.2 7.14l1.93-.96ZM4.5 8.76l6.5 3.25v7.73l-6.5-3.25V8.76Zm15 0v7.73L13 19.74v-7.73l6.5-3.25Z",
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
export type AppGroup = "tracking" | "shipping" | "data";

export const groupOf = (category: IntegrationCategory): AppGroup =>
  category === "tracking" ? "tracking" : category === "shipping" ? "shipping" : "data";

/** How each app works, shown on the card before it is connected. */
export type AppKindLabel = "script" | "server" | "import" | "account" | "carrier";

export function kindLabelOf(provider: IntegrationProvider): AppKindLabel {
  if (provider === "meta_capi") return "server";
  if (provider === "shopify_import") return "import";
  if (provider === "google_sheets") return "account";
  if (provider === "bosta") return "carrier";
  return "script";
}
