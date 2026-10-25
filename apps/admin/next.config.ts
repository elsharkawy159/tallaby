import type { NextConfig } from "next";
import { OPTIMIZED_IMAGE_HOSTS } from "./lib/image-hosts";

const nextConfig: NextConfig = {
  // `eslint` was removed in Next.js 16 — builds no longer run ESLint, so the
  // key only produced an "Unrecognized key(s)" warning on every dev start.
  // Linting runs via the `lint` script instead.
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

export default nextConfig;
