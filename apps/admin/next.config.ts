import type { NextConfig } from "next";
import { OPTIMIZED_IMAGE_HOSTS } from "./lib/image-hosts";

const nextConfig: NextConfig = {
  // `eslint` was removed in Next.js 16 — builds no longer run ESLint, so the
  // key only produced an "Unrecognized key(s)" warning on every dev start.
  // Linting runs via the `lint` script instead.
  typescript: { ignoreBuildErrors: true },
  images: {
    // Vercel Image Optimization returns 402 once the included quota is used.
    // unoptimized: true,
    remotePatterns: OPTIMIZED_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
};

export default nextConfig;
