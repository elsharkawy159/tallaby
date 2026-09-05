import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export default function manifest(): MetadataRoute.Manifest {
  return {
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
      {
        src: "/logo/logo.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: "/logo/logo.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/logo/logo.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/logo/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    categories: ["shopping", "ecommerce", "marketplace"],
    // The manifest is served once at /manifest.webmanifest, outside the
    // `[locale]` segment, so it can only describe the default locale.
    lang: routing.defaultLocale,
    dir: routing.defaultLocale === "ar" ? "rtl" : "ltr",
    scope: "/",
  };
}
