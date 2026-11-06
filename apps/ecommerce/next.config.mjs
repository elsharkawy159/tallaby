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
    // inlineCss stays off (2026-11-06). It put ~445 KB of CSS (341 KB Tailwind, 70 KB @font-face) in a
    // <style> before every <meta> (React writes styles first), so a store product page's og:image sat at
    // byte ~455,000, past where WhatsApp and other link previews stop reading; the same CSS was also
    // repeated twice in the RSC payload (2.0 MB of HTML instead of ~0.7 MB). It was on for PageSpeed
    // (2026-10-30, est. 490 ms on mobile); the stylesheets are cached <link>s again.
    // inlineCss: true,
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
  poweredByHeader: false,
  // Link-preview crawlers that read only the HTML get the metadata in <head> (not streamed into <body>).
  // Next 16.3's default list (next/dist/shared/lib/router/utils/html-bots.js), which this replaces,
  // plus TelegramBot, Facebot, meta-externalagent, Pinterest, Viber, Snapchat, Embedly, Iframely, Mastodon.
  htmlLimitedBots:
    /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|TelegramBot|Facebot|meta-externalagent|Pinterest|Viber|Snapchat|Embedly|Iframely|Mastodon/i,
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
      // Store app service worker (ROADMAP.md F-36d; Next.js PWA guide): never cached, own scripts only.
      {
        source: "/store-sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      // Old marketplace policy pages: still reachable on tallaby.com but written for the marketplace
      // (docs/seo-audit-tallaby-com.md), so out of search there. Store hosts are not matched.
      ...["shipping", "returns", "payment", "cookies"].flatMap((page) => [`/${page}`, `/en/${page}`]).map((source) => ({
        source,
        has: [{ type: "host", value: "(?:www\\.)?tallaby\\.com" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      })),
      // The section and template library is open but never indexed (also a noindex meta).
      ...["/dev-library", "/dev-library/:path*", "/:locale(ar|en)/dev-library", "/:locale(ar|en)/dev-library/:path*"].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      })),
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
