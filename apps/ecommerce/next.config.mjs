import createNextIntlPlugin from "next-intl/plugin";
import { redirects } from "./redirects.mjs";
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ["@workspace/ui"],
  // Avoid serving stale homepage RSC payloads on client-side navigation.
  experimental: {
    // app/global-not-found.tsx: the root layout sits under [locale].
    globalNotFound: true,
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
  poweredByHeader: false,
  // Baseline headers for every host. No X-Frame-Options / frame-ancestors:
  // the dashboard editor and site preview embed storefronts in iframes.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  // The list lives in redirects.mjs.
  async redirects() {
    return redirects;
  },
  images: {
    // Storage paths are unique (uploads never overwrite), so optimized sizes
    // stay cached 30 days instead of the 4 h default (docs/egress-audit.md §9).
    minimumCacheTTL: 2_592_000,
    // Vercel Image Optimization returns 402 once the included quota is used.
    // unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sakwqwocbccpyrmwjowq.supabase.co",
      },
      {
        protocol: "https",
        hostname: "cxqjrwjianxskhzmrkla.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
