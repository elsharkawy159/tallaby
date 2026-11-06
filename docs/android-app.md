# Tallaby Seller — Google Play app (Trusted Web Activity)

ROADMAP.md F-82. The Android app is a thin shell: a **Trusted Web Activity
(TWA)** that opens `https://dashboard.tallaby.com` full screen in the phone's
Chrome. Every web deploy updates the app at once; a new Play upload is only
needed to change the icon, name, package or Android version.

What the repo already gives the app:

| Need | Where |
| --- | --- |
| Web app manifest (name, start URL, standalone, RTL Arabic) | `apps/dashboard/app/manifest.ts` → `/manifest.webmanifest` |
| Icons 192, 512 and a maskable 512 | `apps/dashboard/public/app-icons/` |
| Service worker (push alerts) | `apps/dashboard/public/sw.js` |
| Digital Asset Links (removes the browser address bar) | `apps/dashboard/app/.well-known/assetlinks.json/route.ts`, filled from env |
| Public path (not redirected to login) | `/.well-known/*` in `apps/dashboard/supabase/middleware.ts` |

Web push (F-06) keeps working inside a TWA: Chrome shows the notifications
under the app's name once the seller allows notifications.

## One-time accounts

1. **Google Play Console** developer account: <https://play.google.com/console/signup>, USD 25 once.
   Choose an **Organization** account if Tallaby has a company and a D-U-N-S number.
   A **personal** account created after Nov 2023 must run a **closed test with at least 12 testers for 14 days** before it can publish to production.
2. A privacy policy URL (for example `https://tallaby.com/privacy`) and a support email.

## Path A — PWABuilder (no Android tools needed, ~1 hour)

1. Deploy this branch so `https://dashboard.tallaby.com/manifest.webmanifest` lists the new icons.
2. Open <https://www.pwabuilder.com>, enter `https://dashboard.tallaby.com`, then click **Package for stores → Android → Generate package**.
   - Package ID: `com.tallaby.seller` (permanent, can never change).
   - App name: `Tallaby Seller` · Short name: `Tallaby Seller` (or Arabic `طلبي للبائعين`).
   - Version code `1`, version name `1.0.0`.
   - Start URL `/`, display `standalone`, status-bar and splash colours `#145163` (the logo teal) or the manifest's `#0f172a`.
   - Notification delegation: **on** (lets push alerts show as the app).
   - Signing key: **Create new**. PWABuilder returns the key.
3. Download the zip. It holds `app-release-bundle.aab` (upload this to Play), `app-release-signed.apk` (install on a test phone), `signing.keystore` + `signing-key-info.txt`, and an `assetlinks.json`.
4. **Keep `signing.keystore` and its passwords safe forever** (password manager + an offline copy). Never commit them. Losing them means the upload key has to be reset through Play support.
5. Go to [Digital Asset Links](#digital-asset-links-required).

## Path B — Bubblewrap CLI (same result, scripted)

Needs Node 20+ and a JDK 17; Bubblewrap downloads the Android SDK itself.

```bash
npm i -g @bubblewrap/cli
mkdir tallaby-android && cd tallaby-android      # outside the monorepo, never commit the keystore
bubblewrap init --manifest https://dashboard.tallaby.com/manifest.webmanifest
#  package id com.tallaby.seller, create a new signing key, enable notification delegation
bubblewrap build                                  # → app-release-bundle.aab + app-release-signed.apk
bubblewrap fingerprint list                       # the upload key SHA-256
```

Later versions: bump `appVersionCode` in `twa-manifest.json`, run `bubblewrap update` and `bubblewrap build`, then upload the new `.aab`.

## Digital Asset Links (required)

Without this file the app works but shows a Chrome address bar on top, and Play reviewers may reject it as a plain browser.

1. In Play Console create the app, upload the first `.aab` to **Testing → Internal testing**. Play turns on **Play App Signing** and re-signs the app with Google's own key.
2. Copy **both** SHA-256 fingerprints from **Test and release → Setup → App integrity → App signing**:
   the *App signing key certificate* (Google's) and the *Upload key certificate* (yours, also in `signing-key-info.txt`).
3. Set them on the dashboard's production environment (Vercel → dashboard project → Settings → Environment Variables):
   ```
   ANDROID_APP_PACKAGE=com.tallaby.seller
   ANDROID_APP_SHA256_FINGERPRINTS=AA:BB:…:FF,11:22:…:99
   ```
   Redeploy, then check: `curl https://dashboard.tallaby.com/.well-known/assetlinks.json` returns both fingerprints
   and <https://developers.google.com/digital-asset-links/tools/generator> says the link is valid.
4. On the phone: uninstall, reinstall from the internal test link, open the app. No address bar means it works.
   (Android caches the check; clear Chrome's data if you fixed the file after the first open.)

## Store listing checklist

- App icon 512×512 PNG: `apps/dashboard/public/app-icons/icon-512.png`.
- Feature graphic 1024×500 PNG.
- At least 2 phone screenshots (1080×1920 works): orders list, order details, products, wallet. Arabic first.
- Short description (80 chars) and full description, Arabic and English.
- Category **Business**; contact email; privacy policy URL.
- **App access**: give reviewers a demo seller login (email + password) with a store that has orders. The dashboard needs a login, so without it the review fails.
- **Data safety** form: account data (name, email, phone), store and order data, photos the seller uploads; data is encrypted in transit; sellers can delete their account (deleting the auth user deletes everything, migration 0134).
  Play also asks for an **account deletion URL** for apps with sign-up.
- Content rating questionnaire, target audience 18+, no ads.

## Release order

1. Internal testing (up to 100 testers, live in minutes) → check login, Google sign-in, uploads, push, Arabic RTL, back button.
2. Closed testing (12+ testers for 14 days if the account is personal).
3. Production → review usually takes 1–7 days.

## Things to check in the app

- **Google sign-in**: works, because a TWA is real Chrome (Google blocks only embedded WebViews).
- **Links to other hosts** (tallaby.com, store subdomains, payment pages) open in a Chrome Custom Tab inside the app; that is expected.
- **File uploads and camera**: the normal `<input type="file">` opens Android's picker with the camera option.
- **Offline**: Bubblewrap/PWABuilder show a built-in offline screen; the service worker has no fetch handler on purpose.
- **Notifications**: the seller turns push alerts on from the dashboard as on the web; with notification delegation they show the app icon.

## Costs

| Item | Cost |
| --- | --- |
| Google Play developer account | USD 25 once |
| PWABuilder / Bubblewrap | free |
| Hosting | none extra (same dashboard) |
