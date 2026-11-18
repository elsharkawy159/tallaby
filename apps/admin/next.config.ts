import path from "node:path";
import type { NextConfig } from "next";
import { OPTIMIZED_IMAGE_HOSTS } from "./lib/image-hosts";

// Self-hosted Docker image (docs/plans/hetzner-migration.md §6 step 2.1):
// `NEXT_OUTPUT=standalone` (set only by apps/admin/Dockerfile) emits
// `.next/standalone`, traced from the monorepo root so workspace packages are
// included. Without the flag (Vercel) the config is exactly as before.
const standalone = process.env.NEXT_OUTPUT === "standalone";

const nextConfig: NextConfig = {
  ...(standalone ? { output: "standalone" as const, outputFileTracingRoot: path.join(__dirname, "../..") } : {}),
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
