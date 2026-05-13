# Phase 1: Schema & Migrations - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Define all new Drizzle schema tables, enum additions, and column changes for the Digital Products milestone in `packages/db/src/drizzle/schema.ts` and `relations.ts`. Generate the migration file via `drizzle-kit generate`. Zero application code changes in this phase.

</domain>

<decisions>
## Implementation Decisions

### sellers Table — Column Collisions
- **D-01:** Do NOT add `storeSlug` — reuse the existing `sellers.slug` column (already unique-indexed). They are the same field.
- **D-02:** Do NOT add `storeBannerUrl` or `storeLogoUrl` — reuse the existing `sellers.bannerUrl` and `sellers.logoUrl` columns. They are the same fields.
- **D-03:** `sellers.stripeAccountId` already exists — keep it as-is. Only add the new columns from DB-04: `stripeOnboardingComplete` (boolean, default false), `payoutEnabled` (boolean, default false), `identityVerified` (boolean, default false), `identityDocsUrl` (text, nullable), `onboardingStep` (integer, default 0), `onboardingComplete` (boolean, default false), `storeDescription` (text, nullable).

### Wallet — sellerWallet vs. sellers.walletBalance
- **D-04:** Add the `sellerWallet` table as specified (DB-06). `sellerWallet.balance` is the **authoritative** source. `sellers.walletBalance` remains as a denormalized read-cache (to be kept in sync by the webhook handler in Phase 5). Do NOT drop `sellers.walletBalance` in this migration.
- **D-05:** `sellerWallet.balance` represents the **available-for-withdrawal** balance (settled, after platform fee). Pending amounts are tracked separately via `walletTransactions` entries of type `sale` with a pending flag — not in the `balance` column.

### Download Token Indexing
- **D-06:** `digitalOrders.downloadToken` MUST have a **unique index** at the schema level. This is the hot-path lookup for every download request — O(log n) lookup is required, and uniqueness must be enforced at the DB level.

### DB-10 — orders.status
- **D-07:** DB-10 is a **verified no-op**. `orders.status` already uses the `orderStatus` pgEnum which already contains `'pending'` as a value (and as the default). No schema change needed. The planner should document this as satisfied rather than generate a migration for it.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema & Migrations
- `packages/db/src/drizzle/schema.ts` — existing schema; all new tables/columns must be added here
- `packages/db/src/drizzle/relations.ts` — relation definitions; DB-08 requires new relations for every new table
- `packages/db/migrations/` — migration output directory; `drizzle-kit generate` writes here
- `packages/db/drizzle.config.ts` — Drizzle config; verify `out` and `schema` paths before generating

### Requirements (authoritative)
- `.planning/REQUIREMENTS.md` — DB-01 through DB-10 are the exact column specs for this phase; read before writing any table definition

### Project Context
- `.planning/PROJECT.md` — Architectural Decisions table; contains locked decisions about productType default, signed URLs, etc.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sellers` table (`schema.ts` line 274): Already has `stripeAccountId`, `slug`, `logoUrl`, `bannerUrl`, `walletBalance` — do not duplicate these; only add the new fields from D-01 to D-03.
- `orderStatus` pgEnum: Already contains `'pending'` — `orders.status` already supports the pending state needed for Stripe checkout (DB-10 is satisfied).
- `fulfillmentType` pgEnum: Already has `'digital'` value, but DB-03 requires a **separate** `productType` pgEnum (`physical | digital`) as a column on `products`. These serve different purposes — `fulfillmentType` is about how an item is delivered, `productType` is about what kind of product it is.

### Established Patterns
- All tables use `uuid().defaultRandom().primaryKey()` for IDs except where specified (e.g., `sellers.id` uses `uuid().primaryKey()` without defaultRandom — it references `users.id`).
- Timestamps: `timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow()` pattern throughout.
- Numeric amounts: `numeric({ precision: 10, scale: 2 })` pattern for all monetary values.
- All new tables need entries in `relations.ts`.

### Integration Points
- `products` table gets a new `productType` column — must be nullable or have a `default('physical')` to avoid breaking existing rows.
- `orders` table: no change needed.
- All new tables (`digitalProducts`, `digitalOrders`, `sellerWallet`, `walletTransactions`, `sellerCategories`) must be exported from `packages/db/src/drizzle/schema.ts` and re-exported via `packages/db/index.ts` (or whatever the package entry point is) so all apps can import them.

</code_context>

<specifics>
## Specific Ideas

- The `downloadToken` unique index should use btree (consistent with other index patterns in the schema).
- `walletTransactions.type` should be a pgEnum (not plain text) for type safety — values: `sale`, `refund`, `withdrawal`, `fee`.
- `sellerCategories` join table: primary key on `(sellerId, categoryId)` composite — no separate `id` column needed (saves space, enforces uniqueness naturally).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Schema & Migrations*
*Context gathered: 2026-05-14*
