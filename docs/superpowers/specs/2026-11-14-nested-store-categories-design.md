# Nested store categories (two levels) — design

Date: 2026-11-14 · Owner request (ROADMAP.md F-95) · Status: approved by the owner in chat ("do what you recommend")

## Why

Sellers with large catalogs need main categories that hold sub-categories. First user: hossamvoltix
(electrics) wants two main categories, **تأسيس** (rough-in) and **تشطيب** (finishing), with their
existing categories inside. Today the store fakes this by hand-building home sections per group.

## Decisions (owner)

- **Two levels**: a main category (parent) and its sub-categories (children). A child has exactly one
  parent; a parent has no parent. Stored as `seller_product_categories.parent_id`, so a deeper tree
  later only relaxes a check.
- **One parent per category** (option 1, not a many-to-many "groups" table).
- Builder categories sections get a **level** option (main categories / sub-categories of a chosen
  parent / all) next to today's hand-pick of categories.

## Rules (my calls, stated to the owner)

- A product still links to ONE store category (`products.seller_category_id`), a parent or a child.
  A parent **covers its own products plus its children's** everywhere a category is used as a scope:
  the storefront category page and filter, product counts, "Arrange products", discount rules,
  size charts (child's own chart wins, else the parent's), MCP product search.
- A parent with no direct products but with children that have products is shown (counts roll up).
- Names are unique **among siblings** (same store, same parent; top level counts as one parent).
  Name lookups that find-or-create by name (`ensureTaxonomyItem`, MCP `storeCategoryName`, file
  import) prefer a top-level match, then the first by position — deterministic, never creates a
  duplicate sibling.
- Deleting a parent never deletes children: they become main categories (`ON DELETE SET NULL`).
  Products of the deleted category keep today's behaviour (link set to null).
- Order: the existing single `position` keeps the flattened tree order (parent, its children, next
  parent…); the dashboard reorders siblings only and sends the full flattened list to the existing
  reorder action.
- The store's flat category order (used by templates' `categoryIndex`, "Nth category") is the
  flattened tree order, so a store with no parents behaves exactly as today.
- Brands (`seller_product_brands`, same generic taxonomy code) get no hierarchy.
- Storefront URL stays `/products?category=<id>`. A parent page shows its sub-categories as chips
  above the products. Breadcrumb: Store › Parent › Child. Product feed `product_type`:
  `Parent > Child`.

## Backward compatibility

- Additive migration `0171`: nullable `parent_id`, same-store + depth-2 guard trigger, unique index
  swapped from `(store_id, lower(btrim(name)))` to `(store_id, coalesce(parent_id, nil-uuid),
  lower(btrim(name)))` (strictly looser, so it cannot fail on existing data). Apply on staging, then
  production with owner approval, BEFORE deploying (Drizzle selects every column).
- Every existing store has `parent_id IS NULL` everywhere → identical output. Existing builder
  sections have no `level` prop → today's behaviour ("all", flat).
- Storefront categories cache key bumped (`-v3-` → `-v4-`) because the cached shape gains fields.

## Approaches considered

1. **`parent_id` on the category (chosen).** One parent each; every rule stays unambiguous; deeper
   later without a new model.
2. **Separate groups table (many-to-many).** A category could show under several parents, but adds a
   second concept for sellers and makes breadcrumbs, SEO and discount/size-chart overlaps ambiguous.
3. **Closure table / materialized path.** Built for deep trees; wasted at two levels.

## Out of scope

Three or more levels; a category under two parents; a structured header menu editor (menus stay
link nodes); a dedicated `/category/<slug>` route; hierarchy for brands.
