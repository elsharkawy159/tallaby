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
