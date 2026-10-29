# Welcome gift: EGP 100 for new sellers who finish setup (design)

Date: 2026-10-29. Owner request in chat (ROADMAP.md §5 intake). This replaces the 7-day free trial for new sellers. It changes the business model in `PLAN.md` §13, and the owner asked for it directly.

## 1. Why

The owner wants new sellers to finish setting up a store (choose a theme, add a product, publish the website). A clear reward does that better than a quiet 7-day fee holiday. The reward is EGP 100 in the Tallaby store wallet, valid for 30 days, shown in a celebration pop-up. The owner may later charge for AI from the same wallet (not part of this work; see §8), and the gift would then also cover early AI use.

## 2. Rules (decided by the owner)

1. **Who:** only sellers whose account is created **after this ships**. Existing sellers never get the gift, even if they have never published.
2. **When:** the gift is granted the first time all three are true for the seller:
   - they chose a template for a store (the existing `storeTemplateChosen` rule),
   - they have an active product (`products.status = 'active'`, seller-level, the same check as the home setup checklist), and
   - that store's website is published (`site_status = 'published'`).
3. **Amount and expiry:** EGP 100 into the store wallet. After 30 days, whatever is left of the gift is removed from the wallet. Money the seller topped up or earned is never removed.
4. **Celebration pop-up:** shown when the gift is granted, using `apps/dashboard/public/100EGP gift.png` (the image already says «مبروك! لقد حصلت على 100 جنيه في محفظة طلبي»).
5. **7-day trial paused for new sellers:** sellers created after this ships get no 7-day fee trial. Sellers who already have a trial window keep it unchanged. Existing sellers who have no store yet still get the trial when they create their first store (they are not "new", and they get no gift).

## 3. Calls made in the design (owner can override)

- **One gift per seller account, ever.** A second store, or unpublishing and publishing again, gives nothing more.
- **What the gift pays for:** anything the store wallet pays today (the EGP 5 delivered-order fee, product ads / service charges). It is just wallet balance.
- **Gift money is spent first, on platform charges only.** For expiry, the gift's remaining amount = EGP 100 minus (a) any debt the wallet had at grant time (`max(0, −balance_before)`: the gift clears it) and (b) every `fee` and `service_charge` debit posted after the grant, floored at 0. Withdrawals, payouts and admin adjustments do **not** spend the gift (so earnings paid out never "use up" the gift and the gift can't be cashed out). Credits after the grant (top-ups, sales, fee reversals) do not refill it. Wallet entries are seller-level, so the sum is per seller.
- **The gift is never withdrawable.** Any payout of a seller's earnings must leave the unspent gift in the wallet. Today no seller-side withdrawal exists; admin payout/adjustment screens should show "EGP X of this balance is an unspent welcome gift" while one is active.
- **What expiry removes:** `min(remaining gift, max(current balance, 0))`. Expiry never pushes a wallet below zero and never touches money the seller added.
- **New seller = seller account created after this ships**, through either creation path (`packages/lib/src/sellers/ensure-seller-account.ts`, `apps/ecommerce/components/onboarding/become-seller.server.ts`), including a customer who becomes a seller. Both paths set `welcome_gift_eligible = true` and `fee_trial_eligible = false` explicitly (`ensure-seller-account.ts:105` sets `feeTrialEligible: true` today; change it and `schema.ts:446`'s default).
- **Only the seller's own setup counts.** The template condition is a real choice (`template_installs` not undone, the `requireTemplateChoice` rule), not "was ever published", so an admin publishing from Admin › editor never grants a gift on its own. The grant is called from the dashboard publish paths (builder Publish and the home checklist Publish), not from inside the shared `publishStoreSite` used by admin.
- **Grant moments:** (1) dashboard publish success, (2) the dashboard's popup check, which runs on every page change (and when a page asks after Publish) while a new seller has no gift yet, so adding a product after publishing grants it on the next page (built this way instead of hooking the product form, so `apps/dashboard/actions/products.ts` is untouched, CLAUDE.md rule 14), and (3) the daily gift cron, which also grants any eligible seller who completed setup through another path (bulk status, import, AI) or whose grant failed (e.g. wallet not active). The cron grant shows the pop-up on the next dashboard visit.
- **Pop-up timing:** right after the grant in the same session (publish success in the builder / home checklist, or product save). If the seller misses it (published from another tab, closed the page), it shows once on their next dashboard page load until dismissed. Dismissal is stored server-side.
- **Wallet page:** shows the gift's remaining amount and its expiry date while it is active; the ledger rows read "Welcome gift" and "Welcome gift expired".
- **Seller notification:** one `seller_notifications` row at grant ("You got EGP 100 …") and one 3 days before expiry ("Your gift expires on …"), plus one when it expires. *(Builder may drop the reminder if notification types make it heavy; grant + expiry rows are required.)*
- **Affiliate program (F-37):** referral commission comes only from `seller_wallet_top_ups`. The gift is not a top-up, so it earns no commission. Keep it that way (test it).
- **Admin:** the gift appears in Admin › wallet history like any entry. No admin screen to grant or revoke gifts in this work.

## 4. Non-goals

- Charging the wallet for AI use (owner will decide after watching AI usage).
- Any gift for existing sellers, or a way for admins to give gifts.
- Changing the EGP 5 fee, the trial of existing sellers, or the negative-wallet pop-up rules.
- Protection against one person opening many accounts to collect gifts (accepted risk for now; note it in ROADMAP).

**Anti-goals (a failure even if it "works"):** a seller gets two gifts; expiry removes money the seller paid in or earned; a referrer earns commission on gift money; an existing seller's trial changes; the wallet balance moves outside `postStoreWalletEntry`.

## 5. Constraints (from CLAUDE.md)

- Money in integer piastres, stored in the existing `numeric(10,2)` columns. Every wallet change goes through `postStoreWalletEntry` with a unique claim; replays are no-ops (`DuplicateStoreWalletEntryError`).
- Grant claim: `(reference_type 'welcome_gift', reference_id <sellerId>)`, type `adjustment` (credit). Expiry claim: `(reference_type 'welcome_gift_expiry', reference_id <sellerId>)`, type `adjustment` (debit). Add both reference types to `STORE_WALLET_REFERENCE_TYPES`. *(Builder may instead add new `transaction_type` enum values if the wallet page/admin views need them; adjustment + reference type is preferred because it needs no enum change.)*
- Hand-written idempotent migration `packages/db/migrations/0119_welcome_gift.sql`, mirrored in `schema.ts` / `relations.ts`. Staging first, production with owner approval, before the deploy (the code reads the new columns).
- New server-only table gets RLS on, no policies. All queries scoped by the session seller; never trust IDs from the client.
- Arabic is the default; every string in both `ar.json` and `en.json`. Arabic brand name طلبي.
- Feature file split (`*.server.ts`, `*.lib.ts`, `*.client.tsx` …). Do not add to `apps/dashboard/actions/products.ts`.
- Never cache wallet data.

## 6. Data (suggested shape)

Migration `0119_welcome_gift.sql`:

- `sellers.welcome_gift_eligible boolean NOT NULL`: add with default `false` (every existing seller false), then set the column default to `true` so only rows created afterwards are eligible.
- `sellers.fee_trial_eligible`: set the column **default** to `false` (new sellers get no trial). Do not update existing rows. `start_fee_trial_if_needed` already checks `fee_trial_eligible`, so no SQL function change is needed, but the app code sets it explicitly (`ensure-seller-account.ts:105`), so change both creation paths and the `schema.ts` default.
- `seller_welcome_gifts` (server-only, RLS on, no policies): `seller_id uuid PK REFERENCES sellers(id)`, `store_id uuid` (the store whose publish completed setup), `amount numeric(10,2)`, `granted_at timestamptz`, `expires_at timestamptz` (granted_at + 30 days), `expired_at timestamptz NULL`, `expired_amount numeric(10,2) NULL`, `popup_seen_at timestamptz NULL`, `wallet_entry_id`, `expiry_entry_id`. The primary key is the one-gift guarantee alongside the ledger claim.
- Seller notification types for grant / expiring soon / expired (widen the `seller_notifications` type check the same way 0117 did).

## 7. Flow

1. **Grant (`grantWelcomeGiftIfEligible(tx, sellerId)`, `packages/lib`):** lock the seller row; return if not `welcome_gift_eligible` or a gift row exists; check the three setup conditions; insert the gift row (`ON CONFLICT DO NOTHING`), post the +100.00 entry, store its id, insert the notification. Called after a successful dashboard publish, after the dashboard product save when a product becomes active, and by the daily cron (§3 grant moments). Publishing or saving a product must never fail because of the gift: the grant runs in its own transaction after the main one commits, and an error is logged; the cron retries it.
2. **Pop-up:** the dashboard layout reads "unseen granted gift" for the session seller (uncached) and renders a dialog with the image, a short text line in both languages under it (English sellers see the Arabic image, so add `alt` text and an English caption), and buttons "Go to wallet" / "Close". Closing calls a server action that sets `popup_seen_at` for the session seller only. The builder publish success and product save responses return `giftGranted: true` so the dialog can open at once without a reload.
3. **Expiry (daily cron, in the app that already runs seller crons):** for gifts with `expires_at <= now()` and `expired_at IS NULL`: compute the remaining gift (§3), post the debit when > 0 with the expiry claim, set `expired_at` / `expired_amount`, add the notification. Idempotent: a re-run finds the claim and only finishes the row. Protected like the existing cron routes (`CRON_SECRET`).
4. **Expiring-soon reminder:** the same cron, for gifts expiring within 3 days with no reminder yet (dedupe key).

## 8. Later (not now)

The owner may charge for AI from the wallet later (e.g. 0.25 EGP per autofill). Nothing here should block that; the gift is plain wallet balance and would pay for it.

## 9. Done means

- Unit tests: remaining-gift and expiry-amount maths (fees and service charges spend it, withdrawals/adjustments don't, credits after grant don't refill, debt at grant, negative balance, zero left).
- Integration tests (staging, `TEST_DATABASE_URL`): grant once on publish; replay / second store / republish give nothing; existing seller (eligible false) gets nothing; admin publish without a seller template choice gives nothing; publish before product then product activation grants; cron grants a missed eligible seller; expiry removes only the unspent gift and never goes below 0; cron re-run is a no-op; no referral commission row for the gift; new seller gets no trial window, existing seller trial unchanged.
- Dashboard: pop-up shows once in ar and en, at 360 px and desktop; wallet page shows remaining gift and expiry.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` (filters) run and recorded; `PLAN.md` §13 updated with the new rule, §22/§23 updated; ROADMAP.md §5 status, §6 checklist and §7 log updated; CLAUDE.md rule 6 note for `0119` and rule 7 updated (trial paused for new sellers, gift).
- Migration applied on staging; production waits for owner approval.
