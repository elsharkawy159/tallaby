import type { MetadataRoute } from "next";
import { defaultLocale } from "@/i18n/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Tallaby Seller Dashboard",
    short_name: "Tallaby Seller",
    description:
      "Manage your Tallaby store — products, orders, payouts and marketing.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    orientation: "any",
    // Real sizes, plus a full-bleed maskable icon: the Google Play app
    // (Trusted Web Activity, docs/android-app.md) takes its icons from here.
    icons: [
      {
        src: "/app-icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["business", "productivity"],
    // The manifest is served once at /manifest.webmanifest and the locale is
    // cookie-driven, so it can only describe the default locale.
    lang: defaultLocale,
    dir: defaultLocale === "ar" ? "rtl" : "ltr",
    scope: "/",
  };
}
