import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: {
    // Vercel Image Optimization returns 402 once the included quota is used.
    // unoptimized: true,
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

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
