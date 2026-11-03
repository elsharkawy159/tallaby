// Redirects for this app, read by next.config.mjs. Add a row here to send a
// path somewhere else; `destination` may be a path or a full URL.
// `permanent: true` (308) is cached by browsers for good, so use it only when
// the old path will never come back; otherwise leave it false (307).
// Rows with `has: [PLATFORM_HOST]` only fire on tallaby.com, never on seller
// storefronts (subdomains and custom domains). The default locale (ar) has no
// prefix, so list the /en variant too.

const PLATFORM_HOST = { type: "host", value: "(?:www\\.)?tallaby\\.com" };

export const redirects = [
  // The marketplace seller pages are gone: the marketing home has the signup.
  { source: "/become-seller", destination: "/", permanent: true },
  { source: "/sell", destination: "/", permanent: true },
  { source: "/en/become-seller", destination: "/en", permanent: true, has: [PLATFORM_HOST] },
  { source: "/en/sell", destination: "/en", permanent: true, has: [PLATFORM_HOST] },

  // Old marketplace addresses with a page that does the same job now.
  { source: "/help", destination: "/faq", permanent: false, has: [PLATFORM_HOST] },
  { source: "/en/help", destination: "/en/faq", permanent: false, has: [PLATFORM_HOST] },
  { source: "/affiliate", destination: "/affiliates", permanent: false, has: [PLATFORM_HOST] },
  { source: "/en/affiliate", destination: "/en/affiliates", permanent: false, has: [PLATFORM_HOST] },

  // Seller onboarding lives in the dashboard.
  {
    source: "/onboarding",
    destination: "https://dashboard.tallaby.com/",
    permanent: false,
    has: [PLATFORM_HOST],
  },
  {
    source: "/en/onboarding",
    destination: "https://dashboard.tallaby.com/",
    permanent: false,
    has: [PLATFORM_HOST],
  },
];
