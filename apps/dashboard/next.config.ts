import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { OPTIMIZED_IMAGE_HOSTS } from "./lib/image-hosts";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: {
    // Storage paths are unique (uploads never overwrite), so optimized sizes
    // stay cached 30 days instead of the 4 h default (docs/egress-audit.md §9).
    minimumCacheTTL: 2_592_000,
    // Vercel Image Optimization returns 402 once the included quota is used.
    // unoptimized: true,
    remotePatterns: OPTIMIZED_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
  // Push alerts service worker (F-06): never cached, so a fixed sw.js reaches
  // every device on its next visit (Next docs, Progressive Web Apps guide).
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
