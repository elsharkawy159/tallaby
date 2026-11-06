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
| GP-02 | **Account deletion** (Google Play requires it for apps with sign-up), owner's rules 2026-11-06: the account closes at once for the seller, the data is kept 30 days, then purged; the wallet balance is lost. Migration `0157_account_deletion_requests.sql` (server-only table, one scheduled deletion per user, purge date, previous seller status, admin bell) | [x] |
| GP-03 | Dashboard › Settings › "Delete my account": reason, confirmation checkbox; on submit the seller is suspended (storefronts stop resolving), the auth user is banned, push devices removed, caches dropped, every session signed out, and the seller lands on the public page with "Your account is closed". Login shows "This account was deleted… email omar@tallaby.com" for a banned user | [x] |
| GP-04 | Public page `dashboard.tallaby.com/account-deletion` (no login needed): how to delete, what happens at once, what is deleted after 30 days, how to get it back, what is kept. This is the "delete account URL" for Play | [x] |
| GP-05 | Admin › Account deletions: list (waiting / deleted / restored), purge date, what the account holds, **Restore account** before the purge. Daily cron `/api/cron/account-deletions` (dashboard) deletes the auth user after 30 days (0134 cascades) and marks it deleted. Pro and paid-app renewals skip closed accounts | [x] |
| GP-06 | Bubblewrap project config in `apps/android/` (`twa-manifest.json`, README, keystore git-ignored) so every build is the same | [x] |
| GP-07 | Store listing copy in Arabic and English, data safety answers, content rating answers, reviewer notes: `docs/google-play/listing.md` | [x] |
| GP-08 | Store graphics: 512 icon and 1024×500 feature graphic in `docs/google-play/assets/` | [x] |
| GP-09 | Screenshot script (Playwright, phone size, Arabic) that signs in with the demo account and saves the Play screenshots: `apps/android/scripts/screenshots.mjs` | [x] |
| GP-10 | ROADMAP.md F-82 tasks, intake, log; CLAUDE.md migration note | [x] |

Account deletion rules (owner, 2026-11-06): "delete the account from the user's perspective but keep the data for 30 days"; "he loses all wallet balance on delete". Nothing is paid out; the wallet stays frozen and goes with the purge (a restore brings the account back as it is). Orders still open at the store are not finished by anyone and go with the purge too.

Not covered: files in storage buckets (logos, product photos, documents) are not deleted by the purge; they stay until a storage clean-up job exists (separate task).

## Phase 2 — Review and go live (owner)

1. **Review the branch** and the open questions at the end of this file.
2. **Apply migration `0157`** on staging (`packages/db/migrations/0157_account_deletion_requests.sql`), test, then on production **before** deploying (closing an account, the purge cron, the renewal jobs and the Admin sidebar read the table). **(owner approval)**
   The dashboard needs `SUPABASE_SERVICE_ROLE_KEY` (ban, purge) and `CRON_SECRET` (the new daily cron in `apps/dashboard/vercel.json`), both already used by other features.
3. **Merge and deploy** the dashboard and admin apps.
4. Check these links in a browser:
   - `https://dashboard.tallaby.com/manifest.webmanifest` → lists `/app-icons/...`
   - `https://dashboard.tallaby.com/.well-known/assetlinks.json` → `[]` (filled in step 9)
   - `https://dashboard.tallaby.com/account-deletion` → opens without login
   - On a TEST seller account: Settings → Delete my account → signed out, lands on the "Your account is closed" page; the store's address shows not found; signing in again shows the "account was deleted" message; Admin → Account deletions shows it; **Restore account** brings it back and sign-in works again.

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
3. ~~Account deletion~~ **Decided (owner, 2026-11-06):** the account closes at once, the data is kept 30 days then purged, the wallet balance is lost. Built as GP-02…GP-05.
4. ~~Support email~~ **Decided (owner, 2026-11-06):** `omar@tallaby.com` on the deletion page (`ACCOUNT_DELETION_SUPPORT_EMAIL` in `packages/lib/src/account-deletion/account-deletion.lib.ts`) and the Play listing.

## Costs

| Item | Cost |
| --- | --- |
| Google Play developer account | USD 25 once |
| PWABuilder / Bubblewrap / Firebase | free |
| Extra hosting | none |
