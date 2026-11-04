# Tallaby's Meta Pixel (sign-up tracking)

Tallaby's own Pixel, used by our Meta ads, on tallaby.com and dashboard.tallaby.com. Seller storefronts never load it (they carry the seller's own Pixel, `store_integrations.meta_pixel`).

- **Pixel / dataset:** `3628548033960332` ("Tallaby_dataset"). The other pixel in the Business account (`1550740293762147`, "Tallaby - طلبي") is not used anywhere in the code.
- **Env:** `NEXT_PUBLIC_META_PIXEL_ID=3628548033960332` in the ecommerce (tallaby.com) and dashboard Vercel projects. Empty = no pixel. The Conversions API also reads `META_PIXEL_ID` and `META_CAPI_TOKEN` (server only).
- **Code:** one helper, `packages/lib/src/integrations/meta-pixel.lib.ts` (`tallabyPixel`, `trackTallabyPageView`, `trackTallabySignup`). It is mounted by `apps/ecommerce/components/meta/meta-pixel.tsx` (only in the tallaby.com layouts: `(marketing)`, and the Tallaby-chrome `fallback` of `(shop)/(main)`, `(shop)/auth` and `(shop)/cart`; never in the `[locale]` root layout or `(shop)` layout, which also wrap every storefront) and `apps/dashboard/components/meta-pixel.client.tsx` (the root layout, so `/signup` and every dashboard page).

## Where it runs

- Only on `tallaby.com`, `www.tallaby.com` and `dashboard.tallaby.com` (`TALLABY_PIXEL_HOSTS`, exact match, never a suffix check like `endsWith('tallaby.com')`), and never inside a frame (template previews). localhost, 127.0.0.1, `*.local`, Vercel previews, staging and storefront hosts load nothing, even with the env set.
- Meta's base code (`fbevents.js`) loads once and `init` runs once per page load.
- **PageView** on the first load and on every client-side route change (keyed on the pathname, so a strict-mode re-run or a query-only change does not send a second one). Meta's automatic history tracking is off (`fbq.disablePushState = true`), so nothing is counted twice.
- Tallaby's server events (AddToCart, InitiateCheckout, Purchase through `sendMetaCapiEvent` without store credentials) follow the same rule: skipped unless the request host is one of the three hosts and the event's page URL is on one of them.
- A seller's own pixel is separate: `seller-tracking.client.tsx` loads only the ID the seller connected (`store_integrations.meta_pixel`), and the store CAPI uses only the store's credentials.
- **Consent (F-70a):** on tallaby.com the pixel, GA4 and Tallaby's server events (including the signup CAPI copy sent from tallaby.com) wait for Accept in `tracking-consent-banner.client.tsx`. A decline is remembered (`lib/tracking-consent.client.ts`, per host), revokes a loaded pixel, sets GA's off switch and expires `_ga*`, `_gid`, `_gat*`, `_fbp`, `_fbc`. "Cookie settings" in the footer reopens the banner. Seller stores keep their own banner for the seller's pixels.
- **The dashboard has no banner:** `dashboard.tallaby.com` still loads the pixel and fires CompleteRegistration without asking, and a choice made on tallaby.com doesn't reach it (the choice is per host).

## CompleteRegistration

Fired once per new seller account with `{ content_name: "seller_signup", registration_method: "google" | "email" }` and event id `signup_<userId>`:

1. **Dashboard home** `/?welcome=1&signup=<method>` (`apps/dashboard/app/(main)/_components/signup-pixel.*`). The server adds `signup=` only when the account was just created, and the page also checks the seller row is under one hour old, so a hand-typed URL does not count. Every sign-up path ends here: Google or email from tallaby.com (`/api/auth/signup-callback`), Google or email from the dashboard (`/api/auth/callback` and the `/signup` form), email confirmation links included.
2. **tallaby.com sign-up dialog**, when an email signup finishes in place (no email confirmation needed): the dialog fires it (`trackSignupComplete`); its "Go to dashboard" link has `?welcome=1` without `signup`, so the dashboard does not fire again.

Duplicates: a `tb_reg_session_signup_<userId>` flag in sessionStorage (dashboard home), a `tb_reg_sent_signup_<userId>` flag in localStorage, and the shared event id (Meta deduplicates the browser event against the server one). `signup` is removed from the URL with `history.replaceState` only after the event is queued.

**Server copy (Conversions API):** `sendSignupCapiEvent` sends the same event with the same id from the signup server code, and only when the request came from one of the hosts above (never from localhost). Its `user_data` holds SHA-256 hashed email, phone and user id plus IP, user agent and `_fbp`/`_fbc`, which is how CAPI matches users.

**No personal data in event parameters.** The browser pixel sends no email/phone (no advanced matching). To turn on advanced matching later, pass hashed `em`/`ph` to `fbq('init', id, userData)` in `tallabyPixel` (or rely on the CAPI copy, which already hashes them).

## How to test

- Unit: `pnpm --filter @workspace/lib exec vitest run src/integrations/meta-pixel.lib.test.ts`.
- Local: nothing loads on localhost by design (check the Network tab: no `fbevents.js`).
- Production: Meta Events Manager › Tallaby_dataset › Test events › open `https://www.tallaby.com`, sign up with a new Google account. Expect PageView on www.tallaby.com, PageView on dashboard.tallaby.com/signup, then PageView + CompleteRegistration on dashboard.tallaby.com/?welcome=1. For the CAPI copy, set `META_CAPI_TEST_EVENT_CODE` to the code shown there.
