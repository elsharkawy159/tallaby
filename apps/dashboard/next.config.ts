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
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
