import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

/** tallaby.com. */
const TALLABY_MANIFEST: MetadataRoute.Manifest = {
  name: "Tallaby – Create your online store",
  short_name: "Tallaby",
  description:
    "Tallaby is a platform for creating your own online store. Sellers build and run their store under their own name.",
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
  categories: ["business", "ecommerce"],
  // The manifest is served once at /manifest.webmanifest, outside the
  // `[locale]` segment, so it can only describe the default locale.
  lang: routing.defaultLocale,
  dir: routing.defaultLocale === "ar" ? "rtl" : "ltr",
  scope: "/",
};

/**
 * tallaby.com's manifest (the TALLABY_MANIFEST branch of
 * apps/ecommerce/app/manifest.ts; a store's own app manifest is served by the
 * storefront app on the store's host).
 */
export default function manifest(): MetadataRoute.Manifest {
  return TALLABY_MANIFEST;
}
