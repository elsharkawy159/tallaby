import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { OPTIMIZED_IMAGE_HOSTS } from "./lib/image-hosts";

const nextConfig: NextConfig = {
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

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
