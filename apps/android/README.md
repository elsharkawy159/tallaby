# Tallaby Seller — Android app (Trusted Web Activity)

ROADMAP.md F-82 · full plan: [`docs/google-play-plan.md`](../../docs/google-play-plan.md) · how it works: [`docs/android-app.md`](../../docs/android-app.md).

This folder holds the **Bubblewrap** settings for the Google Play app, so every
build uses the same package id, colours, icons and shortcuts. It is not a pnpm
package (no `package.json`), and nothing here is deployed.

The app opens `https://dashboard.tallaby.com`. Changing the dashboard needs no
new app build.

## Fixed values (never change after the first upload)

| Setting | Value |
| --- | --- |
| Package id | `com.tallaby.seller` |
| Host | `dashboard.tallaby.com` |
| Signing key alias | `tallaby-seller` |

## Option A — PWABuilder (website, no tools)

<https://www.pwabuilder.com> → `https://dashboard.tallaby.com` → **Package for stores → Android → Generate package** → **Options**:

| Field | Value |
| --- | --- |
| Package ID | `com.tallaby.seller` |
| App name | `Tallaby Seller` |
| Short name (launcher) | `Tallaby` |
| App version / version code | `1.0.0` / `1` |
| Host | `dashboard.tallaby.com` |
| Start URL | `/` |
| Theme colour | `#145163` |
| Background colour | `#ffffff` |
| Nav colour | `#145163` |
| Display mode | Standalone |
| Notification delegation | **On** |
| Location delegation | Off |
| Google Play billing | Off |
| Icon / maskable icon | taken from the manifest (`/app-icons/…`) |
| Fallback behaviour | Custom Tabs |
| Signing key | **Create new** · alias `tallaby-seller` · strong passwords |

Download the zip, keep `signing.keystore` + `signing-key-info.txt` safe (see below), upload the `.aab`.

## Option B — Bubblewrap (command line, same result)

Needs Node 20+ and JDK 17. Bubblewrap downloads the Android SDK on first run.

```bash
npm i -g @bubblewrap/cli
cd apps/android

# First time only: create the signing key here (git-ignored), alias tallaby-seller.
keytool -genkeypair -v -keystore signing.keystore -alias tallaby-seller \
  -keyalg RSA -keysize 2048 -validity 10000

bubblewrap update      # generates the Android project from twa-manifest.json
bubblewrap build       # → app-release-bundle.aab (upload) + app-release-signed.apk (test phone)
bubblewrap fingerprint list   # the upload key SHA-256
```

`twa-manifest.json` passes `@bubblewrap/core` validation (checked 2026-11-06, v1.27.0).
No Android build was run in the repo: the owner builds with their own key.

## The signing key

- `signing.keystore` and its passwords sign every update. **Back them up** (password manager + an offline copy).
- They are git-ignored here. Never commit them, never send them in chat or email.
- With Play App Signing (default), Google holds the real app key; a lost upload key can be reset through Play support, but it takes days.

## After the first upload: link the app to the website

Play Console → Test and release → Setup → **App integrity** → copy both SHA-256 fingerprints
(App signing key + Upload key) → set on the dashboard's **Production** env in Vercel:

```
ANDROID_APP_PACKAGE=com.tallaby.seller
ANDROID_APP_SHA256_FINGERPRINTS=<app signing SHA-256>,<upload SHA-256>
```

Redeploy, then `https://dashboard.tallaby.com/.well-known/assetlinks.json` must list both.
The route is `apps/dashboard/app/.well-known/assetlinks.json/route.ts`.

## New version (icon, name, Android target)

1. Raise `appVersionCode` (2, 3, …) and `appVersionName` in `twa-manifest.json`.
2. `bubblewrap update && bubblewrap build` with the **same** `signing.keystore` (or rebuild in PWABuilder with "Use mine" key).
3. Upload the new `.aab` as a new release.

Google raises the required target Android version every August: rebuild once a year.

## Store screenshots

`scripts/screenshots.mjs` signs in with the demo seller account and saves phone screenshots for the listing. See its header.
