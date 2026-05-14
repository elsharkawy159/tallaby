---
phase: 01-schema-migrations
verified: 2026-05-14T00:00:00Z
status: gaps_found
score: 9/11 must-haves verified
overrides_applied: 0
gaps:
  - truth: "DB-04: sellers table has all required onboarding fields including storeSlug, storeBannerUrl, storeLogoUrl"
    status: failed
    reason: "REQUIREMENTS.md DB-04 lists storeSlug, storeBannerUrl, storeLogoUrl as required sellers columns. These three are absent from the sellers table. The plans intentionally excluded them (citing D-01/D-02 as future-phase scope), but the requirement contract in REQUIREMENTS.md assigns them to Phase 1."
    artifacts:
      - path: "packages/db/src/drizzle/schema.ts"
        issue: "sellers table has no storeSlug, storeBannerUrl, or storeLogoUrl columns. It has the other 7 onboarding columns (stripeOnboardingComplete, payoutEnabled, identityVerified, identityDocsUrl, onboardingStep, onboardingComplete, storeDescription)."
    missing:
      - "Add storeSlug column to sellers table (or formally defer DB-04 sub-requirements to a later phase via ROADMAP amendment)"
      - "Add storeBannerUrl column to sellers table (or defer)"
      - "Add storeLogoUrl column to sellers table (or defer)"

  - truth: "Migration file contains stripe_onboarding_complete and product_type DDL"
    status: failed
    reason: "0002_digital_commerce.sql contains no ALTER TABLE sellers ADD COLUMN statements and no CREATE TYPE product_type statement. The 01-03 PLAN acceptance criteria explicitly required 'The newest .sql file contains stripe_onboarding_complete (sellers column addition)'. The columns exist in schema.ts and the snapshot, but were pre-applied to the DB and were excluded from the diff intentionally. This means the migration is not a complete record of the schema changes in this phase."
    artifacts:
      - path: "packages/db/migrations/0002_digital_commerce.sql"
        issue: "Contains only the 5 new table CREATE statements and transaction_type enum. Missing: CREATE TYPE product_type, ALTER TABLE products ADD COLUMN product_type, ALTER TABLE sellers ADD COLUMN for all 7 onboarding columns."
    missing:
      - "Either generate a corrected migration that includes the sellers column additions and product_type enum/column, OR document that these were pre-applied to the DB and the 0002 migration is intentionally scoped to net-new tables only — in which case the PLAN acceptance criterion must be updated to reflect this decision."
---

# Phase 01: Schema & Migrations Verification Report

**Phase Goal:** Extend the Drizzle schema with all tables, enums, and relations required for digital products, then generate a clean Drizzle migration file.
**Verified:** 2026-05-14
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | productType pgEnum ('physical' \| 'digital') exported from schema.ts | VERIFIED | Line 17: `export const productType = pgEnum("product_type", ['physical', 'digital'])` |
| 2 | products table has productType column with default 'physical' | VERIFIED | Line 1026: `productType: productType("product_type").default('physical')` |
| 3 | sellers table has all 7 new onboarding/Stripe columns | VERIFIED | Lines 310–316: stripeOnboardingComplete, payoutEnabled, identityVerified, identityDocsUrl, onboardingStep, onboardingComplete, storeDescription all present |
| 4 | sellers table has no duplicates of slug/bannerUrl/logoUrl/stripeAccountId | VERIFIED | stripeAccountId appears once (line 309); no storeSlug/storeBannerUrl/storeLogoUrl added |
| 5 | DB-04 (REQUIREMENTS.md): sellers has storeSlug, storeBannerUrl, storeLogoUrl | FAILED | REQUIREMENTS.md lists these three as part of DB-04. They are absent from schema.ts. Plans excluded them citing D-01/D-02 future scope, but REQUIREMENTS.md assigns DB-04 to Phase 1. |
| 6 | digitalProducts table exists with all 13 columns | VERIFIED | Lines 1199–1227: all 13 columns present (id, productId, sellerId, fileUrl, fileName, fileSize, fileType, downloadLimit, downloadExpiryHours, price, currency, status, createdAt, updatedAt) |
| 7 | digitalOrders table exists with all 10 columns including unique-indexed downloadToken | VERIFIED | Lines 1229–1259: all 10 columns; uniqueIndex on downloadToken confirmed (line 1241) |
| 8 | sellerCategories join table with composite PK (sellerId, categoryId), no id column | VERIFIED | Lines 1261–1277: exactly sellerId, categoryId, createdAt; `primaryKey({ columns: [table.sellerId, table.categoryId] })` present |
| 9 | sellerWallet table with balance and currency | VERIFIED | Lines 1279–1292: id, sellerId, balance (numeric 10,2 default '0' notNull), currency (default EGP notNull), updatedAt |
| 10 | walletTransactions table with transactionType pgEnum column | VERIFIED | Lines 1294–1317: type column uses `transactionType().notNull()`; orderId and stripeTransferId are nullable |
| 11 | relations.ts has relation definitions for all 5 new tables | VERIFIED | Lines 507–561: digitalProductsRelations, digitalOrdersRelations, sellerCategoriesRelations, sellerWalletRelations, walletTransactionsRelations all exported |
| 12 | Existing relations extended (sellersRelations, ordersRelations, productsRelations, usersRelations) | VERIFIED | sellersRelations (lines 144–163) has digitalProducts, sellerWallet, sellerCategories, walletTransactions; ordersRelations (lines 72–101) has digitalOrders, walletTransactions; productsRelations (lines 202–224) has digitalProducts; usersRelations (line 45) has digitalOrders |
| 13 | Migration file exists in packages/db/migrations/ | VERIFIED | packages/db/migrations/0002_digital_commerce.sql exists |
| 14 | Migration file contains CREATE TABLE for all 5 new tables | VERIFIED | digital_orders, digital_products, seller_categories, seller_wallet, wallet_transactions all present; transaction_type enum created |
| 15 | Migration file contains stripe_onboarding_complete DDL | FAILED | No ALTER TABLE sellers ADD COLUMN statements in 0002_digital_commerce.sql. The sellers onboarding columns and product_type column/enum were intentionally excluded from the diff (pre-applied to DB via synthetic snapshot) but the 01-03 PLAN acceptance criteria explicitly required their presence in the SQL. |
| 16 | DB-10 no-op verified: orders.status already uses orderStatus pgEnum with 'pending' | VERIFIED | orders table line 1098: `status: orderStatus().default('pending')` — confirmed in schema.ts |

**Score:** 9/11 truths verified (DB-04 and migration completeness both fail)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/db/src/drizzle/schema.ts` | productType enum, products.productType column, sellers onboarding columns, 5 new tables | VERIFIED (partial) | All present except sellers is missing storeSlug, storeBannerUrl, storeLogoUrl per DB-04 requirements contract |
| `packages/db/src/drizzle/relations.ts` | 5 new relation exports + extended existing relations | VERIFIED | All 5 relation exports present; all 4 existing relation objects correctly extended |
| `packages/db/migrations/0002_digital_commerce.sql` | Clean migration with all schema changes | PARTIAL | Contains 5 new table CREATE statements + transaction_type enum. Missing: product_type enum/column DDL, sellers ALTER TABLE statements |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| products table | productType pgEnum | productType() column call | VERIFIED | `productType("product_type").default('physical')` on line 1026 |
| sellers table | stripeOnboardingComplete etc. | new column definitions | VERIFIED | All 7 columns present after stripeAccountId |
| digitalProducts | products | productId FK | VERIFIED | foreignKey to products.id with cascade delete |
| digitalOrders | digitalProducts | digitalProductId FK | VERIFIED | foreignKey to digitalProducts.id with cascade delete |
| digitalOrders.downloadToken | uniqueIndex | btree unique index | VERIFIED | `uniqueIndex("digital_orders_download_token_idx")` confirmed |
| sellerCategories | sellers + categories | composite PK (sellerId, categoryId) | VERIFIED | `primaryKey({ columns: [table.sellerId, table.categoryId] })` present |
| sellerWallet | sellers | sellerId FK + uniqueIndex | VERIFIED | FK + `uniqueIndex("seller_wallet_seller_id_idx")` both present |
| walletTransactions | sellers / orders | sellerId FK + orderId nullable FK | VERIFIED | orderId has no .notNull(); FK present without onDelete (intentional nullable) |
| relations.ts | schema.ts new tables | import statement | VERIFIED | All 5 tables imported on line 2 |
| 0002_digital_commerce.sql | 5 new tables | CREATE TABLE statements | VERIFIED | All 5 tables created in migration |
| 0002_digital_commerce.sql | sellers/products changes | ALTER TABLE statements | FAILED | No ALTER TABLE sellers or ALTER TABLE products DDL present |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DB-01 | 01-02 | digitalProducts table with all 13 columns | SATISFIED | schema.ts lines 1199–1227 |
| DB-02 | 01-02 | digitalOrders table with all 10 columns | SATISFIED | schema.ts lines 1229–1259 |
| DB-03 | 01-01 | productType pgEnum + products.productType column | SATISFIED | schema.ts lines 17, 1026 |
| DB-04 | 01-01 | sellers extended with stripeAccountId, stripeOnboardingComplete, payoutEnabled, storeSlug, storeBannerUrl, storeLogoUrl, storeDescription, identityVerified, identityDocsUrl, onboardingStep, onboardingComplete | BLOCKED | storeSlug, storeBannerUrl, storeLogoUrl absent. 8 of 11 columns present; 3 excluded. REQUIREMENTS.md assigns all 11 to Phase 1. |
| DB-05 | 01-02 | sellerCategories join table with composite PK | SATISFIED | schema.ts lines 1261–1277 |
| DB-06 | 01-02 | sellerWallet table (id, sellerId FK, balance decimal, currency, updatedAt) | SATISFIED | schema.ts lines 1279–1292. Note: REQUIREMENTS.md names this DB-06 (sellerWallet); plans labelled it DB-04. Substance verified regardless. |
| DB-07 | 01-02 | walletTransactions table with correct columns | SATISFIED | schema.ts lines 1294–1317 |
| DB-08 | 01-03 | All new table relations in relations.ts | SATISFIED | relations.ts: 5 new exports + 4 extended existing relations |
| DB-09 | 01-03 | Drizzle migration generated in packages/db/migrations/ | PARTIALLY SATISFIED | 0002_digital_commerce.sql exists and covers the 5 new tables. Sellers/products DDL absent — the migration is incomplete per the phase plan's own acceptance criteria. |
| DB-10 | 01-03 | orders.status supports 'pending' (no-op if already present) | SATISFIED | orderStatus pgEnum already has 'pending' as default; no change needed or made |

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None | — | — | No TODO/FIXME/placeholder patterns found in new schema code |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — this phase produces only schema files and a migration SQL file, not runnable application code. The migration can only be verified by applying it to a database, which requires an external service.

---

### Human Verification Required

None for the schema code itself. The migration completeness gap (DB-09) is deterministically verifiable from the file contents and does not require human judgment.

---

## Gaps Summary

Two gaps block full goal achievement:

**Gap 1 — DB-04 incomplete (BLOCKER against REQUIREMENTS.md)**

REQUIREMENTS.md defines DB-04 as requiring 11 columns on the `sellers` table including `storeSlug`, `storeBannerUrl`, and `storeLogoUrl`. The plans explicitly chose not to add these three, treating them as D-01/D-02 future scope. The plans' own scope was narrower than what REQUIREMENTS.md assigned to Phase 1. This creates a traceability gap: DB-04 cannot be marked satisfied.

Resolution options:
1. Add the three missing columns to sellers now, generate a corrected migration.
2. Formally split DB-04 into two sub-requirements — update REQUIREMENTS.md to assign `storeSlug`/`storeBannerUrl`/`storeLogoUrl` to a later phase (e.g., Phase 6 ONB-02 already covers slug and images in the wizard).

**Gap 2 — Migration does not contain sellers/products DDL (BLOCKER against 01-03 PLAN acceptance criteria)**

The 01-03 plan acceptance criterion explicitly states: "The newest .sql file contains `stripe_onboarding_complete` (sellers column addition)". The generated `0002_digital_commerce.sql` does not contain this. The implementation decision to use a synthetic snapshot (that pre-included the sellers columns) was pragmatic but produced a migration that omits those column additions from the SQL file. If this migration is run against a fresh database that does not already have the sellers onboarding columns, they will be missing.

Resolution options:
1. Generate a corrected migration that explicitly includes `ALTER TABLE "sellers" ADD COLUMN` statements for all 7 onboarding columns, `CREATE TYPE "public"."product_type"`, and `ALTER TABLE "products" ADD COLUMN "product_type"`.
2. If the live database already has these columns from direct application, document this explicitly and mark 0002 as intentionally incomplete — updating the plan acceptance criteria retroactively.

---

_Verified: 2026-05-14_
_Verifier: Claude (gsd-verifier)_
