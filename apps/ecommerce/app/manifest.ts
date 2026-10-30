import type { MetadataRoute } from "next";
import { appShortName } from "@workspace/lib/stores/app";
import { routing } from "@/i18n/routing";
import { getRequestStoreApp } from "@/lib/store-app.server";

/** tallaby.com (and any host that is not a published store). */
const TALLABY_MANIFEST: MetadataRoute.Manifest = {
  name: "Tallaby.com – Online Shopping in Egypt",
  short_name: "Tallaby",
  description:
    "Tallaby is a multi-vendor marketplace in Egypt — shop accessories, beauty, fashion and home products from verified sellers, with cash on delivery.",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#0f172a",
  orientation: "portrait-primary",
  icons: [
    { src: "/logo/logo.png", sizes: "16x16", type: "image/png" },
    { src: "/logo/logo.png", sizes: "32x32", type: "image/png" },
    { src: "/logo/logo.png", sizes: "180x180", type: "image/png" },
    { src: "/logo/logo.png", sizes: "192x192", type: "image/png" },
    { src: "/logo/logo.png", sizes: "512x512", type: "image/png" },
  ],
  categories: ["shopping", "ecommerce", "marketplace"],
  // The manifest is served once at /manifest.webmanifest, outside the
  // `[locale]` segment, so it can only describe the default locale.
  lang: routing.defaultLocale,
  dir: routing.defaultLocale === "ar" ? "rtl" : "ltr",
  scope: "/",
};

/**
 * One file for every host (ROADMAP.md F-36): a published store's host (its
 * subdomain or own domain) gets the store's own app, named after the store,
 * with icons drawn from its favicon (`/app-icon/<size>.png`); everything else
 * gets Tallaby's. Reading the host makes this a request-time route.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const app = await getRequestStoreApp();
  if (!app) return TALLABY_MANIFEST;
  const { store, iconVersion: v, locale } = app;
  const icon = (size: number) => `/app-icon/${size}.png?v=${v}`;
  return {
    id: "/",
    name: store.displayName,
    short_name: appShortName(store.displayName),
    ...(store.description && { description: store.description.slice(0, 300) }),
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    orientation: "portrait-primary",
    icons: [
      { src: icon(192), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: icon(512), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${icon(512)}&maskable=1`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["shopping"],
    lang: locale,
    dir: locale === "ar" ? "rtl" : "ltr",
  };
}
