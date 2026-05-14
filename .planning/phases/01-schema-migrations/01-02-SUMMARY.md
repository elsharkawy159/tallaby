---
phase: 01-schema-migrations
plan: "02"
subsystem: database
tags: [schema, drizzle, digital-products, wallet, postgres]
dependency_graph:
  requires: []
  provides:
    - digitalProducts table
    - digitalOrders table
    - sellerCategories table
    - sellerWallet table
    - walletTransactions table
    - transactionType pgEnum
  affects:
    - packages/db/src/drizzle/schema.ts
tech_stack:
  added: []
  patterns:
    - composite primary key via primaryKey({ columns: [...] })
    - uniqueIndex btree on download token (security constraint)
    - numeric(10,2) for financial precision
    - nullable FK for optional orderId on walletTransactions
key_files:
  created: []
  modified:
    - packages/db/src/drizzle/schema.ts
decisions:
  - "sellers.walletBalance NOT dropped — D-04: sellerWallet is authoritative source; walletBalance is denormalized cache synced by Phase 5 webhook handler"
  - "sellerCategories has no id column — composite PK (sellerId, categoryId) per D-05 spec"
  - "downloadToken uniqueIndex at DB level — collision-proof under concurrent inserts (T-01-03)"
  - "sellerWallet uniqueIndex on sellerId — enforces one-wallet-per-seller at DB level (T-01-05)"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 1 Plan 02: Digital Commerce Tables Summary

**One-liner:** Added 5 new tables (digitalProducts, digitalOrders, sellerCategories, sellerWallet, walletTransactions) and transactionType pgEnum to schema.ts for the digital products milestone.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add transactionType pgEnum, digitalProducts and digitalOrders tables | af1d15f | packages/db/src/drizzle/schema.ts |
| 2 | Add sellerCategories, sellerWallet, and walletTransactions tables | 6e2e4ac | packages/db/src/drizzle/schema.ts |

## What Was Built

### New pgEnum

- `transactionType` — values: `['sale', 'refund', 'withdrawal', 'fee']`

### New Tables

**digitalProducts** (13 columns)
- id, productId (FK→products), sellerId (FK→sellers), fileUrl, fileName, fileSize, fileType, downloadLimit (default 5), downloadExpiryHours (default 72), price (numeric 10,2), currency (default EGP), status (default draft), createdAt, updatedAt
- Indexes: btree on productId, btree on sellerId

**digitalOrders** (10 columns)
- id, orderId (FK→orders), digitalProductId (FK→digitalProducts), buyerId (FK→users), downloadToken, downloadCount (default 0), maxDownloads (default 5), expiresAt, downloadedAt, createdAt
- Indexes: uniqueIndex btree on downloadToken, btree on orderId, btree on buyerId

**sellerCategories** (3 columns, no id)
- sellerId (FK→sellers), categoryId (FK→categories), createdAt
- Composite PK: (sellerId, categoryId)

**sellerWallet** (5 columns)
- id, sellerId (FK→sellers, uniqueIndex), balance (numeric 10,2, default '0'), currency (default EGP), updatedAt

**walletTransactions** (9 columns)
- id, sellerId (FK→sellers), type (transactionType enum), amount (numeric 10,2), currency, stripeTransferId (nullable), orderId (nullable FK→orders), description, createdAt
- Indexes: btree on sellerId, btree on type

### Import Update

Added `primaryKey` to the `drizzle-orm/pg-core` import on line 1.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID | Mitigation |
|-----------|-----------|
| T-01-03 | `uniqueIndex("digital_orders_download_token_idx")` on downloadToken — btree unique index prevents token collision |
| T-01-04 | `numeric({ precision: 10, scale: 2 })` on walletTransactions.amount — no floating-point drift |
| T-01-05 | `uniqueIndex("seller_wallet_seller_id_idx")` on sellerWallet.sellerId — one wallet per seller enforced at DB level |

## Known Stubs

None.

## Threat Flags

None — no new trust boundaries beyond those declared in the plan's threat model.

## Self-Check: PASSED

- `export const digitalProducts = pgTable` — FOUND in schema.ts
- `export const digitalOrders = pgTable` — FOUND in schema.ts
- `export const sellerCategories = pgTable` — FOUND in schema.ts
- `export const sellerWallet = pgTable` — FOUND in schema.ts
- `export const walletTransactions = pgTable` — FOUND in schema.ts
- `export const transactionType = pgEnum` — FOUND in schema.ts
- `digital_orders_download_token_idx` uniqueIndex — FOUND in schema.ts
- `primaryKey` in imports — FOUND on line 1
- Commit af1d15f — EXISTS
- Commit 6e2e4ac — EXISTS
