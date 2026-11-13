# Nested Store Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two-level store categories (main › sub) in the dashboard, storefront, builder and every category-scoped rule.

**Architecture:** Nullable `seller_product_categories.parent_id` (migration 0171) guarded by a trigger (same store, depth 2). One pure tree module in `@workspace/lib` resolves order, descendants and ancestors; every consumer that today matches a category by exact id expands it to "self + children" through that module or an equivalent SQL join.

**Tech Stack:** Postgres (hand-written SQL), Drizzle, Next.js 16 server actions, zod, vitest, `@workspace/store-sections` element registry.

**Spec:** `docs/superpowers/specs/2026-11-14-nested-store-categories-design.md`

## Global Constraints

- CLAUDE.md rules apply: 5 (tenant isolation: every query checks the store belongs to the session seller; parent must be in the same store), 6 (hand-written idempotent SQL `0171`, mirror in `schema.ts`/`relations.ts`, never `drizzle-kit generate`), 8 (cache keys/tags include seller id), 13 (every string in `ar.json` and `en.json`), 14 (file split), 15 (lint/typecheck/test), 16 (others' uncommitted work in `ROADMAP.md`, `apps/dashboard/messages/{ar,en}.json`, the editor `page.tsx`, `order-details-dialog.client.tsx`, `small-screen-notice.client.tsx` must not be reverted or reformatted), 17 (sections stay element trees; keep every `props.field` name).
- Max depth 2. Brands get no hierarchy. Max 300 categories per store, all levels together (unchanged).
- A store with no parents must render and behave exactly as before.
- Subagents do NOT commit; the manager reviews and commits.

## Review Focus

1. A parent with zero direct products but children with products → shown on the storefront with the rolled-up count (T2 test).
2. Making a category with children into a child, or setting a parent from another store / a parent that is itself a child → rejected by the server AND the trigger (T1 tests).
3. Deleting a parent → children become main categories, nothing else deleted (T1 test).
4. Same child name under two parents → allowed; same name twice under one parent → rejected; `ensureTaxonomyItem("Accessories")` returns a deterministic row (T1 test).
5. A discount rule or size chart on a parent applies to a product in its child; a child's own size chart wins over the parent's (T3 tests).

---

### Task 1: Data model, tree module, dashboard management

**Files:**
- Create: `packages/db/migrations/0171_nested_store_categories.sql`
- Modify: `packages/db/src/drizzle/schema.ts` (`sellerProductCategories`), `relations.ts`
- Create: `packages/lib/src/store-sites/category-tree.lib.ts` (+ export in the package's exports map), `category-tree.lib.test.ts`
- Modify: `apps/dashboard/app/(main)/stores/[storeId]/products/categories-brands/*` (dto, server, data, client, lib, tests)
- Modify: product form option labels (`products/add/category-field.tsx`)
- Modify: `apps/dashboard/messages/{ar,en}.json` (add keys only)

**Interfaces (produces):**
- Column `parent_id uuid NULL REFERENCES seller_product_categories(id) ON DELETE SET NULL`; Drizzle `parentId`.
- Trigger `seller_product_categories_parent_guard` (BEFORE INSERT/UPDATE OF parent_id, store_id): parent ≠ self, parent in same `store_id` and `seller_id`, parent's `parent_id IS NULL`, and the row has no children when it gets a parent.
- Unique index swap: drop `seller_product_categories_store_name_key`, create `seller_product_categories_store_parent_name_key` on `(store_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(btrim(name)))`. Index `seller_product_categories_parent_idx` on `(parent_id) WHERE parent_id IS NOT NULL`.
- `category-tree.lib.ts`:
  - `type CategoryTreeItem = { id: string; parentId: string | null; position: number }`
  - `flattenCategoryTree<T extends CategoryTreeItem>(items: T[]): T[]` — main categories by position, each followed by its children by position; a child whose parent is missing is treated as a main category.
  - `categoryWithChildren(id: string, items: CategoryTreeItem[]): string[]` — `[id, ...childIds]`.
  - `categoryParentChain(id: string, items: CategoryTreeItem[]): string[]` — `[id]` or `[id, parentId]`.
  - `MAX_CATEGORY_DEPTH = 2`.
- Server actions: `addTaxonomyItem` / `updateTaxonomyItem` accept optional `parentId: string | null` (categories only; rejected for brands); validated server-side as a main category of the same store. `loadSellerTaxonomyList` returns `parentId` and the list in `flattenCategoryTree` order; product count of a parent includes children (show both "own" and total if cheap). `reorderTaxonomyItems` unchanged contract (full id list) but the client only moves siblings. `ensureTaxonomyItem` name match prefers `parent_id IS NULL`, then position.
- `loadSellerTaxonomyOptions` returns `parentId` + `parentName` so the product form shows "Parent › Child".

- [ ] Step 1: tests for `category-tree.lib.ts` (flatten order, orphan child, withChildren, parentChain).
- [ ] Step 2: migration 0171 (idempotent, guarded; comment header like 0169/0170), schema + relations.
- [ ] Step 3: dto/server changes + unit tests in `categories-brands.server.test.ts` for Review Focus 2–4 (mock style already used there).
- [ ] Step 4: UI: parent select in add/edit dialogs (only main categories without being self; hidden for brands; disabled for a category that has children, with a hint); list rendered as main rows with indented children, drag reorders within the same level; delete dialog says children become main categories.
- [ ] Step 5: `pnpm --filter dashboard typecheck lint test`, `pnpm --filter @workspace/lib test`, `pnpm --filter @workspace/db typecheck`.

### Task 2: Storefront + builder (deps: Task 1)

**Files:** `packages/lib/src/store-sites/catalog-data.server.ts`, `apps/ecommerce/lib/storefront.server.ts`, `apps/ecommerce/lib/products/product-list.server.ts`, `apps/ecommerce/lib/store-site/{catalog.server.ts,product-detail.lib.ts}`, the products page (`storefront/[subdomain]/products/page.tsx`) sub-category chips, `packages/store-sections/src/{core/types.ts,elements/registry.ts,elements/data.ts}`, `packages/store-editor/src/inspector/editor-inspector.client.tsx`, dashboard + admin editor data loaders, ecommerce/store-editor messages.

**Interfaces:**
- `StoreCategoryGroup` gains `parentKey: string | null` and `childKeys: string[]`; a parent's `productIds`, `productCount` and `categoryIds` include its children's; a parent with only child products is kept. Groups are returned in flattened tree order (Tallaby root groups after, as today).
- `StoreCategoryFilter` gains `children: Array<{ sellerCategoryId: string; sourceCategoryId: string | null }>`; the product list filter matches self OR any child by the same rule as today.
- Cache key `storefront-categories-v4-…` (tags unchanged).
- `CategorySummary` gains optional `parentKey?: string | null` and `childCount?: number`.
- `categoryList` element: new props `level?: "all" | "top" | "children"` (default "all" = today) and `parentCategoryId?: string` (used when `level === "children"`); inspector fields for both (parent picker lists main categories). Hand-picked `categoryIds` still win when set. `OrderedPicker` / `category` select show children indented or as "Parent › Child".
- Breadcrumb: `storeCategoryOf` returns the chain; product page breadcrumb + structured data show Parent › Child.
- Products page with a parent category: chips of its children (link `/products?category=<childKey>`), strings in both locales.

- [ ] Tests: catalog grouping rollup (pure part or integration if DB), `data.ts` resolution for `level` top/children/all, breadcrumb chain; Review Focus 1.
- [ ] `pnpm --filter ecommerce typecheck test`, `pnpm --filter @workspace/store-sections test` (designs + library-fields snapshots unchanged), `pnpm --filter @workspace/store-editor typecheck`.

### Task 3: Category-scoped rules (deps: Task 1; parallel to Task 2)

**Files:** `apps/dashboard/app/(main)/stores/[storeId]/products/category-order/category-order.server.ts`, `packages/lib/src/orders/{automatic-discounts.lib.ts,line-discounts.server.ts}`, `packages/lib/src/size-charts/size-chart.server.ts`, `packages/lib/src/products/agent-products.server.ts` + `apps/backend/src/mcp/tools/products.ts` (description text), `apps/ecommerce/lib/product-feed/product-feed.server.ts`, discount-rules + size-chart target pickers (show Parent › Child).

**Interfaces:**
- Discount line gains `categoryIds: string[]` (= `categoryParentChain` of the product's seller category); `lineInRuleScope` matches if any is in `rule.categoryIds`. Keep `categoryId` for existing callers.
- Size chart resolution: product target, else the product's own category target, else its parent's.
- "Arrange products" of a parent includes its children's products.
- MCP `list_store_categories` returns `parentId`; product search by `storeCategoryId` includes children; create/update can set a category by id as today (no parent creation via MCP).
- Feed `product_type`: `Parent > Child`.

- [ ] Tests for Review Focus 5 (discount lib unit test; size-chart resolution unit/integration per existing test style).
- [ ] `pnpm --filter @workspace/lib test typecheck`, `pnpm --filter backend typecheck`, `pnpm --filter dashboard typecheck`.

### Task 4: Docs + commits (manager)

- ROADMAP.md: §5 intake row, feature F-95 section, §6 checklist, §7 log (migration 0171, apply before deploy). CLAUDE.md rule 6: next free `0172`, one-line 0171 note.
- Review each task's diff, re-run checks, commit per task on `main` staging only this feature's hunks.
