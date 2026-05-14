---
phase: 01-schema-migrations
reviewed: 2026-05-14T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - packages/db/src/drizzle/schema.ts
  - packages/db/src/drizzle/relations.ts
  - packages/db/migrations/0002_digital_commerce.sql
  - packages/db/migrations/meta/_journal.json
findings:
  critical: 7
  warning: 8
  info: 3
  total: 18
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files were reviewed covering the digital-commerce schema extension (migration 0002). The migration itself is additive and structurally sound, but the schema.ts source contains several critical correctness bugs that will corrupt stored data. The most severe are three string-literal defaults with broken escaping that will store a leading apostrophe character as part of every default value. A wildcard RLS policy on the `products` table allows anonymous public writes. The `unique_product_seller_sku_idx` index uses the wrong operator class for its UUID column, which will fail at execution time. The `digitalOrders.expires_at` column is nullable, allowing permanent download grants. Several quality issues are also present including a denormalized wallet balance with a dual source of truth and a missing reverse relation on categories.

---

## Critical Issues

### CR-01: Corrupted string defaults due to broken SQL escaping (three columns)

**Files:**
- `packages/db/src/drizzle/schema.ts:791` — `userAddresses.country`
- `packages/db/src/drizzle/schema.ts:899` — `orderItems.currency`
- `packages/db/src/drizzle/schema.ts:1097` — `orders.currency`
- `packages/db/src/drizzle/schema.ts:1100` — `orders.paymentMethod`

**Issue:** The default values `'\'Egypt'`, `'\'EGP'`, and `'\'cash'` contain a literal leading apostrophe. Drizzle passes these strings verbatim to PostgreSQL's `DEFAULT` clause, so every row inserted without an explicit value will store `'Egypt` (with a leading apostrophe) instead of `Egypt`. This corrupts every address row's country, every order's currency, and every order's payment method at the database default level.

**Fix:**
```typescript
// userAddresses.country
country: text().default('Egypt').notNull(),

// orderItems.currency
currency: text().default('EGP'),

// orders.currency
currency: text().default('EGP'),

// orders.paymentMethod
paymentMethod: text("payment_method").default('cash').notNull(),
```

---

### CR-02: Wrong operator class on UUID column in `unique_product_seller_sku_idx`

**File:** `packages/db/src/drizzle/schema.ts:1032`

**Issue:** The composite unique index on `(sellerId, sku)` specifies `table.sellerId.asc().nullsLast().op("text_ops")`. The `sellerId` column is of type `uuid`, but `text_ops` is the operator class for `text`. PostgreSQL will reject this index definition with an error like `operator class "text_ops" does not accept data type uuid`. This bug prevents the products table from being created or the index from being built.

**Fix:**
```typescript
uniqueIndex("unique_product_seller_sku_idx").using(
  "btree",
  table.sellerId.asc().nullsLast().op("uuid_ops"),
  table.sku.asc().nullsLast().op("text_ops")
),
```

---

### CR-03: `digitalOrders.expires_at` is nullable — allows permanent download grants

**File:** `packages/db/src/drizzle/schema.ts:1237`

**Issue:** `expiresAt: timestamp("expires_at", ...) ` has no `.notNull()`. A `digital_orders` row with `expires_at = NULL` will never expire. Any application code that checks `expires_at > NOW()` will correctly reject expired tokens, but if the check is written as `expires_at IS NULL OR expires_at > NOW()` (common pattern for "no expiry"), an accidentally null expiry becomes a permanent download grant. The schema must enforce expiry at the column level.

**Fix:**
```typescript
expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
```

The migration SQL must also be updated:
```sql
"expires_at" timestamp with time zone NOT NULL,
```

---

### CR-04: `products` RLS — "Public full access" policy grants ALL operations to anonymous users

**File:** `packages/db/src/drizzle/schema.ts:1049`

**Issue:**
```typescript
pgPolicy("Public full access", { as: "permissive", for: "all", to: ["public"] }),
```
This policy grants `INSERT`, `UPDATE`, `DELETE`, and `SELECT` to the `public` role (unauthenticated users). Because Supabase/PostgreSQL evaluates permissive policies with `OR`, the presence of this policy means authenticated-only policies for `INSERT` (line 1048, 1051) are completely bypassed. Any anonymous user can insert, update, or delete products.

**Fix:** Remove the "Public full access" policy entirely. Use targeted policies:
```typescript
pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"] }),
pgPolicy("Enable insert for authenticated users only", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`true` }),
pgPolicy("Enable update for authenticated sellers only", { as: "permissive", for: "update", to: ["authenticated"] }),
pgPolicy("Enable delete for authenticated sellers only", { as: "permissive", for: "delete", to: ["authenticated"] }),
```

---

### CR-05: `uniq_referral_reward` index uses `text_ops` for UUID columns

**File:** `packages/db/src/drizzle/schema.ts:1156`

**Issue:** The unique index on `(userId, action, referenceId)` in `userRewards` specifies `text_ops` for both `userId` (uuid) and `referenceId` (uuid) columns. PostgreSQL will reject this, preventing index creation on the `user_rewards` table.

**Fix:**
```typescript
uniqueIndex("uniq_referral_reward").using(
  "btree",
  table.userId.asc().nullsLast().op("uuid_ops"),
  table.action.asc().nullsLast().op("text_ops"),
  table.referenceId.asc().nullsLast().op("uuid_ops")
),
```

---

### CR-06: `digitalProducts.fileUrl` stored as plaintext — direct object reference exposure

**File:** `packages/db/src/drizzle/schema.ts:1203`

**Issue:** `fileUrl: text("file_url").notNull()` stores a direct, permanent URL to the digital product file. If this is a cloud storage URL (S3, Supabase Storage), storing it permanently means the URL never rotates. Any user who obtains the URL (e.g., through a data leak, a misconfigured RLS policy, or an API response) can download the file forever, bypassing all `downloadCount`, `maxDownloads`, and `expiresAt` access controls in `digital_orders`. The schema provides no mechanism for token-based or signed URLs.

**Fix:** Store only a storage path/key, not a full URL. Generate signed URLs at query time:
```typescript
// Store the storage object key, not the full URL
fileKey: text("file_key").notNull(),
// Remove: fileUrl: text("file_url").notNull(),
```

---

### CR-07: `contacts` RLS — "Enable read access for authenticated users" lacks a row filter

**File:** `packages/db/src/drizzle/schema.ts:188`

**Issue:**
```typescript
pgPolicy("Enable read access for authenticated users", { as: "permissive", for: "select", to: ["authenticated"] }),
```
No `using` clause is provided. In PostgreSQL, a permissive SELECT policy with no `USING` clause defaults to `USING (true)`, meaning every authenticated user can read every contact submission including those from other users — exposing names, emails, phone numbers, and messages.

**Fix:**
```typescript
pgPolicy("Enable read access for own contacts", {
  as: "permissive",
  for: "select",
  to: ["authenticated"],
  using: sql`user_id = auth.uid()`
}),
```

---

## Warnings

### WR-01: Dual source of truth for seller wallet balance

**File:** `packages/db/src/drizzle/schema.ts:308` and `1282`

**Issue:** `sellers.walletBalance` (line 308) and `sellerWallet.balance` (line 1282) both store the seller's wallet balance. `walletTransactions` credits and debits the `sellerWallet` table, but `sellers.walletBalance` is a denormalized copy with no FK-enforced synchronization. These two values will diverge, causing incorrect balance displays depending on which field an application query reads.

**Fix:** Remove `sellers.walletBalance` and `sellers.lastPayoutAmount`/`sellers.lastPayoutDate` denormalizations. Derive balance exclusively from `sellerWallet` and compute payout info from `sellerPayouts`. If denormalization is required for performance, enforce updates via a database trigger.

---

### WR-02: `sellerWallet` table missing `created_at`

**File:** `packages/db/src/drizzle/schema.ts:1279–1292`

**Issue:** The `seller_wallet` table has `updated_at` but no `created_at`. There is no way to know when a wallet was created, which is required for audit trails and debugging.

**Fix:**
```typescript
createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
```

---

### WR-03: `digitalOrders.downloadedAt` is a single timestamp — incorrect for multiple downloads

**File:** `packages/db/src/drizzle/schema.ts:1238`

**Issue:** `downloadedAt` is a single `timestamp` field, but `downloadCount` can exceed 1 (up to `maxDownloads`). Each download overwrites the previous timestamp, making it impossible to audit which downloads occurred and when. If a buyer downloads twice, only the last download timestamp is retained.

**Fix:** Either create a separate `digital_download_logs` table, or remove `downloadedAt` and rely on `downloadCount` alone. If a "first downloaded at" semantic is desired, add a `firstDownloadedAt` column and only set it once.

---

### WR-04: `categories.name` and `categories.slug` are nullable with no uniqueness on `slug`

**File:** `packages/db/src/drizzle/schema.ts:101–102`

**Issue:** Both `name` and `slug` are `varchar()` with no `NOT NULL` and no unique constraint on `slug`. Duplicate slugs corrupt URL routing (two categories with the same slug makes one unreachable). A category without a name is not meaningful.

**Fix:**
```typescript
name: varchar().notNull(),
slug: varchar().notNull(),
// Add unique constraint:
unique("categories_slug_unique").on(table.slug),
```

---

### WR-05: `deliveries.status` uses unvalidated `text` instead of an enum

**File:** `packages/db/src/drizzle/schema.ts:25`

**Issue:** `status: text().default('pending')` allows any string. The `orders` table uses the `orderStatus` enum for its status column (line 1098). The delivery status should be constrained similarly to prevent silent misspellings (e.g., `'compelted'` instead of `'completed'`).

**Fix:** Define a `deliveryStatus` enum and apply it:
```typescript
export const deliveryStatus = pgEnum("delivery_status", ['pending', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned'])

// In deliveries table:
status: deliveryStatus().default('pending'),
```

---

### WR-06: `products.quantity` is `numeric()` without precision/scale — should be `integer`

**File:** `packages/db/src/drizzle/schema.ts:1019`

**Issue:** `quantity: numeric().notNull()` stores inventory quantity as an arbitrary-precision decimal. Inventory quantities are always whole numbers. Using `numeric` without precision allows values like `0.5` units, which is meaningless for most physical goods. Using a bare `numeric()` also means no storage-level enforcement of sensible bounds.

**Fix:**
```typescript
quantity: integer().default(0).notNull(),
```

---

### WR-07: `products.price` stored as `jsonb` — loses numeric type safety

**File:** `packages/db/src/drizzle/schema.ts:1025`

**Issue:** `price: jsonb()` stores price as an opaque JSON blob. This prevents price-range queries (`WHERE price BETWEEN x AND y`), sorting by price, and any aggregate operations. It also allows storing structurally invalid price data with no schema enforcement. There is no documented shape for this JSON.

**Fix:** Either define a `numeric(10, 2)` column for a single price, or if multi-currency pricing is needed, use a separate `product_prices` table. At minimum, add a `CHECK` constraint documenting the required JSON structure.

---

### WR-08: `categoriesRelations` missing `sellerCategories` many-relation

**File:** `packages/db/src/drizzle/relations.ts:124–134`

**Issue:** `sellerCategories` has a FK to `categories`, but `categoriesRelations` does not declare the inverse `many(sellerCategories)` relation. Drizzle ORM will not be able to join from a category to its associated sellers using the relations API. This is a missing relation that will cause runtime query failures if attempted.

**Fix:**
```typescript
export const categoriesRelations = relations(categories, ({one, many}) => ({
  category: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categories_parentId_categories_id"
  }),
  categories: many(categories, {
    relationName: "categories_parentId_categories_id"
  }),
  products: many(products),
  sellerCategories: many(sellerCategories),  // ADD THIS
}));
```

---

## Info

### IN-01: `walletTransactions` missing balance snapshot column

**File:** `packages/db/src/drizzle/schema.ts:1294–1316`

**Issue:** `wallet_transactions` records individual transaction amounts but not the balance before/after the transaction. This makes reconstructing the balance at any point in time require a full table scan of all prior transactions, and makes debugging discrepancies harder.

**Suggestion:** Add `balance_after: numeric({ precision: 10, scale: 2 }).notNull()` to record the wallet balance after each transaction is applied.

---

### IN-02: `digitalProducts.downloadLimit` and `digitalOrders.maxDownloads` are duplicated configuration

**File:** `packages/db/src/drizzle/schema.ts:1207` and `1236`

**Issue:** `digitalProducts.downloadLimit` (default 5) sets the per-product download limit. `digitalOrders.maxDownloads` (default 5) stores the same value per order. There is no FK or constraint linking them. An order could be created with a `maxDownloads` that differs from the product's `downloadLimit`, causing inconsistent enforcement.

**Suggestion:** Remove `maxDownloads` from `digitalOrders` and always read the limit from the linked `digitalProducts.downloadLimit`, or add a check constraint.

---

### IN-03: Migration journal timestamp for entry idx=2 is set in the future

**File:** `packages/db/migrations/meta/_journal.json:22`

**Issue:** Entry idx=2 (`0002_digital_commerce`) has `"when": 1778719304945`, which is approximately 2026-05-13 — far in the future relative to entries idx=0 (2025-08-24) and idx=1 (2025-08-25). While this does not affect migration execution, it indicates the timestamp was manually set rather than generated by Drizzle, which can cause ordering confusion if further migrations are generated.

**Suggestion:** Let Drizzle Kit generate journal timestamps automatically. Do not hand-edit `_journal.json`.

---

_Reviewed: 2026-05-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
