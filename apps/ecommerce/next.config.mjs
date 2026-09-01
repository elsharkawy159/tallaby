import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ["@workspace/ui"],
  // Avoid serving stale homepage RSC payloads on client-side navigation.
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
  async redirects() {
    return [
      {
        source: '/become-seller',
        destination: '/sell',
        permanent: true,
      },
    ]
  },
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
