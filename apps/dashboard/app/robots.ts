import type { MetadataRoute } from "next";
import { PUBLIC_ENTRY_PATH, dashboardOrigin } from "@/lib/seo/public-entry.lib";

// Only the public entry is crawlable: `/` (it redirects to /login when signed out),
// /login, and /signup (crawlable so its noindex is read; it is not indexed).
// Google applies the longest matching rule, so these allows beat `Disallow: /`.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/$", PUBLIC_ENTRY_PATH, "/signup"],
        disallow: "/",
      },
    ],
    sitemap: `${dashboardOrigin()}/sitemap.xml`,
  };
}
