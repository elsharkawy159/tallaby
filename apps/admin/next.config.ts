import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `eslint` was removed in Next.js 16 — builds no longer run ESLint, so the
  // key only produced an "Unrecognized key(s)" warning on every dev start.
  // Linting runs via the `lint` script instead.
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sakwqwocbccpyrmwjowq.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
