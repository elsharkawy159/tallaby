import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Matches the other apps: run `pnpm typecheck` before merging instead.
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ["@workspace/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "sakwqwocbccpyrmwjowq.supabase.co" },
      { protocol: "https", hostname: "cxqjrwjianxskhzmrkla.supabase.co" },
    ],
  },
};

export default withNextIntl(nextConfig);
