import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Matches admin/dashboard/ecommerce: `next build` no longer runs its own
  // full tsc pass, avoiding a redundant type-check on every Vercel build.
  // Run `pnpm typecheck` locally/in CI before merging.
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sakwqwocbccpyrmwjowq.supabase.co",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
