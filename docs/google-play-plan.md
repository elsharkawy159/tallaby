# Tallaby Seller on Google Play — full plan

ROADMAP.md **F-82**. Owner request 2026-11-06: "make a full plan and start work
on it without pushing to live, just commit everything in one branch and I
review later, make everything ready".

- **Branch:** `claude/talabi-mobile-app-strategy-9i9xy1` (not merged, not deployed, no migration applied anywhere).
- **How the app works:** a Trusted Web Activity (TWA). A tiny Android app opens
  `https://dashboard.tallaby.com` full screen in the phone's Chrome. All
  screens, styles, login and server code are the existing dashboard. Every web
  deploy updates the app; a new Play upload is only needed for the icon, name
  or Android version. How-to details: [`docs/android-app.md`](android-app.md).
- **Platform:** Android first. iOS needs a Capacitor app with native features
  (App Store rule 4.2) and is a later, separate feature.

Legend: `[x]` done on the branch · `[ ]` to do · **(owner)** only the owner can do it.

---

## Phase 1 — Code in the repo (this branch)

| ID | Task | Status |
| --- | --- | --- |
| GP-01 | Manifest icons at real sizes (192, 512) + maskable 512; Digital Asset Links route `/.well-known/assetlinks.json` from `ANDROID_APP_PACKAGE` / `ANDROID_APP_SHA256_FINGERPRINTS` | [x] |
| GP-02 | **Account deletion** (Google Play requires it for apps with sign-up): migration `0157_account_deletion_requests.sql` (server-only table, one pending request per user, admin bell `account_deletion_requested`) | [x] |
| GP-03 | Dashboard › Settings › "Delete my account" card: request with optional reason, typed confirmation, shows the pending request, cancel | [x] |
| GP-04 | Public page `dashboard.tallaby.com/account-deletion` (no login needed): what is deleted, what is kept, how to ask (sign in → Settings, or email). This is the "delete account URL" for Play | [x] |
| GP-05 | Admin › Account deletions: list, filter, mark completed / declined with a note, steps to delete the user | [x] |
| GP-06 | Bubblewrap project config in `apps/android/` (`twa-manifest.json`, README, keystore git-ignored) so every build is the same | [x] |
| GP-07 | Store listing copy in Arabic and English, data safety answers, content rating answers, reviewer notes: `docs/google-play/listing.md` | [x] |
| GP-08 | Store graphics: 512 icon and 1024×500 feature graphic in `docs/google-play/assets/` | [x] |
| GP-09 | Screenshot script (Playwright, phone size, Arabic) that signs in with the demo account and saves the Play screenshots: `apps/android/scripts/screenshots.mjs` | [x] |
| GP-10 | ROADMAP.md F-82 tasks, intake, log; CLAUDE.md migration note | [x] |

Not done on purpose (needs the owner first, CLAUDE.md rule 4):

- **Automatic account deletion.** Deleting the auth user deletes everything the
  seller owns (0134 CASCADE), including the store wallet ledger and orders.
  Admin marks the request completed after deleting the user by hand
  (Supabase › Authentication › Users › Delete user), following the checks on
  the admin page. A one-click "Delete now" button can come later once the owner
  decides what happens to a positive wallet balance and open orders.

## Phase 2 — Review and go live (owner)

1. **Review the branch** and the open questions at the end of this file.
2. **Apply migration `0157`** on staging (`packages/db/migrations/0157_account_deletion_requests.sql`), test, then on production **before** deploying (the Settings page and the Admin sidebar read the table). **(owner approval)**
3. **Merge and deploy** the dashboard and admin apps.
4. Check these links in a browser:
   - `https://dashboard.tallaby.com/manifest.webmanifest` → lists `/app-icons/...`
   - `https://dashboard.tallaby.com/.well-known/assetlinks.json` → `[]` (filled in step 9)
   - `https://dashboard.tallaby.com/account-deletion` → opens without login
   - Settings → "Delete my account" card works; Admin → Account deletions shows the request.

## Phase 3 — Google Play account (owner, 1–3 days)

5. Create the developer account at <https://play.google.com/console/signup> (USD 25 once).
   - **Organization** (needs a D-U-N-S number) skips the tester rule.
   - **Personal** needs a closed test with **12 testers for 14 days** before production.
6. Create the **demo reviewer account** on production: a seller with one published store, 5+ products and 3+ orders, a strong password. Not a real seller.

## Phase 4 — Build the app (owner, ~1 hour)

7. Build with **PWABuilder** (pwabuilder.com → `https://dashboard.tallaby.com` → Package for stores → Android) using the values in `apps/android/README.md`, **or** with **Bubblewrap** from `apps/android/` (`bubblewrap build`).
8. Back up `signing.keystore` and its passwords (password manager + offline copy). Never commit them.

## Phase 5 — Upload and link (owner, ~1 day)

9. Play Console → Create app (`Tallaby Seller`, default language Arabic, App, Free).
   Internal testing → upload the `.aab` → accept Play App Signing.
10. Setup → App integrity → copy **both** SHA-256 fingerprints. In Vercel (dashboard, Production) set
    `ANDROID_APP_PACKAGE=com.tallaby.seller` and `ANDROID_APP_SHA256_FINGERPRINTS=<app signing>,<upload>`; redeploy;
    open `/.well-known/assetlinks.json` and check both appear.
11. Install from the internal test link. No address bar = linked. Test login (email + Google), Arabic layout,
    product photo from the camera, an order, notifications, "Delete my account" card.

## Phase 6 — Store listing (owner, half a day)

12. Run `apps/android/scripts/screenshots.mjs` with the demo account (see its header) or take screenshots on the phone.
13. Paste the texts from `docs/google-play/listing.md` (Arabic main, English translation), upload
    `docs/google-play/assets/icon-512.png` and `feature-graphic-1024x500.png`, the screenshots.
14. App content: privacy policy `https://tallaby.com/privacy`, app access (demo login), ads No,
    content rating, target audience 18+, data safety (answers in `listing.md`),
    delete account URL `https://dashboard.tallaby.com/account-deletion`.

## Phase 7 — Release (owner, 1–3 weeks)

15. Personal account only: closed test, 12+ testers, 14 days, then "Apply for production".
16. Production → new release with the same `.aab` → countries → **Send for review** (1–7 days).
17. Live at `https://play.google.com/store/apps/details?id=com.tallaby.seller`. Add the Play badge to tallaby.com and the dashboard later (separate task).

## Updates after launch

- Dashboard changes: deploy the website, the app updates itself.
- New icon, name or Android target: `bubblewrap update && bubblewrap build` with the **same keystore**, raise `appVersionCode`, upload a new release.
- Google raises the required Android target API every year (August): rebuild once a year.

## Open questions for the owner

1. Organization or personal Play account? (Decides the 14-day test.)
2. ~~App name~~ **Decided (owner left it to Claude, 2026-11-06):** Play title `طلبي للبائعين – Tallaby` (Arabic listing), `Tallaby Seller` (English listing and PWABuilder app name), launcher label `Tallaby`.
3. Account deletion: what happens to a **positive store wallet balance** and **orders still being delivered**? Until decided, admin checks them by hand (the admin page shows both) and the public page promises deletion within 30 days.
4. ~~Support email~~ **Decided (owner, 2026-11-06):** `omar@tallaby.com` on the deletion page (`ACCOUNT_DELETION_SUPPORT_EMAIL` in `packages/lib/src/account-deletion/account-deletion.lib.ts`) and the Play listing.

## Costs

| Item | Cost |
| --- | --- |
| Google Play developer account | USD 25 once |
| PWABuilder / Bubblewrap / Firebase | free |
| Extra hosting | none |
