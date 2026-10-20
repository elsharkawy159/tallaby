# Admin website builder — design

Date: 2026-10-20 · Status: draft for owner review

## 1. Intent

The platform admin (the owner and admin staff) needs to manage every website artefact from the
Admin app (`apps/admin`) with **the same website builder sellers use** in the dashboard:

1. **Any seller's store website.** This is usually done at the seller's request, for example "please
   fix my header". The admin opens the store in the builder, edits it, and publishes.
2. **Library templates** (Tallaby Classic, Atelier, the 37 category templates, and new ones).
3. **Library sections** (the headers, heroes and other designs in the seller's "Add section" palette).

Today the admin can only look: the store detail "Website" tab is read-only, and the Templates page
edits metadata only (price, order, active, default). Template and section content is TypeScript in
`packages/store-sections`, and changing it requires a developer, a generated migration and a deploy.

## 2. Decisions the owner made (2026-10-20)

- **Edits apply directly.** An admin edit to a store goes live when the admin publishes. No seller
  approval step.
- **Template and section edits change the library only.** Stores that already installed a
  template, or already inserted a section, keep their copy. Only new installs and inserts get the
  new version. (This matches how install works today: `applyStoreTemplate` copies the config into
  the store's drafts.)
- **Admin changes win over the seller's.** The admin acts on the seller's request, so an admin
  publish also replaces the seller's drafts. A seller editor that is open at that moment must not
  be able to overwrite the admin's change.
- **Full management.** Create (from scratch or by duplicating), edit, hide and delete, for both
  templates and sections.
- **The admin works on the store's drafts like the seller does.** Publish puts the whole draft live
  (§5.2).
- **New stores get the default template from the database.** Editing Classic in Admin changes what
  new stores receive (§5.4).
- **Inserted library sections keep industry-matched photos** (§5.3).
- **Roles:** `admin` and `super_admin` only. **Moderators are excluded**, in the UI and in every
  server action.

## 3. Goals, non-goals, anti-goals

**Goals**
- One builder codebase serving both apps, so a fix or feature lands once.
- From Admin, edit and publish any store's site, every audited.
- The database is the master copy for templates and sections. Admin edits are never overwritten by a
  code re-seed.
- Sellers' template gallery and Add-section palette reflect admin changes (new, edited, hidden,
  deleted) without a deploy.

**Non-goals**
- Pushing template or section changes into stores that already use them.
- Real-time co-editing or presence between seller and admin.
- Translating the Admin app. The builder appears in **English** in Admin.
- Custom HTML/JS nodes. Rule 9 (no seller-supplied code) applies to admins too.
- Editing store data other than the website (products, wallet and so on) from the builder.

**Anti-goals** (failure even if it "works")
- The seller's builder changes behaviour or regresses. This is the main risk of the refactor.
- An admin edit is silently lost, or silently undone by a seller's open tab.
- Any path that lets a seller, or a moderator, reach admin-scoped write actions, or that lets a
  store-scoped admin action touch another store's rows.
- Deleting a template or section breaks a store that uses it.

## 4. Current state (verified in code, 2026-10-20)

- **Builder:** `apps/dashboard/app/(builder)/stores/[storeId]/editor` is about 75 files and 14k lines.
  Components import the dashboard server actions directly (`server/editor.server.ts`,
  `templates.server`, `forms.server`, `explore.server`). They are not passed in as props. The UI uses
  next-intl (`storeEditor` namespace).
  - Dashboard-only dependencies: media picker and library (`@/components/media/*`), industries, stock
    photos (Pexels), the `(main)/…/website` templates, forms, site-preview, design.lib and
    store-fonts modules, `require-seller`, and the rate limiter.
  - The canvas is an iframe portal that renders `@workspace/store-sections` directly. It does not
    depend on the ecommerce app.
- **Storage:** `packages/lib/src/store-sites/server.ts` keys every function on `sellerId`, with
  ownership in SQL.
  - Drafts live in `store_pages.draft_content` and `draft_version`, `stores.shared_header` and
    `shared_footer`, and `store_design_systems` (which has a `version`).
  - Publish (`publishStoreSite`) writes an immutable `store_site_revisions` snapshot, requires an
    approved seller, and calls `startFeeTrialIfNeeded`.
- **Concurrency:** autosave relies on optimistic version checks. A conflict shows a reload banner.
  There are two gaps:
  - `saveStoreChrome` (header/footer) has **no** version check.
  - An idle editor only finds out on its next save.
- **Templates:** `templates`, `template_versions` (`config` = full `SiteConfig`) and
  `template_installs`. The gallery, apply and undo read from the database.
  - Code (`CODE_TEMPLATES` / `getCodeTemplate`) still supplies `pageNames`, the `demo` preview
    catalog, `palette` and `designs`.
  - Seeds are generated SQL (`template:sql`, for example `0071` and `0084`) that **overwrites** the
    current version.
- **Sections:** `defineDesign` trees in `packages/store-sections/src/designs/**`.
  `LIBRARY_PRESETS = DESIGNS.map(designPreset)` feeds the Add palette.
  - Templates embed full element trees. They do **not** reference design ids. `SectionInstance.source`
    is informational only.
  - No database table holds the section library. `saved_blocks` is per store.
- **Admin app:** `getCurrentAdminUser` lets admin, super_admin and moderator in.
  `assertAdminActor` / `writeAdminAudit` (`packages/lib/src/admin/guard.server.ts`) allow only
  admin and super_admin to write, and require a reason. The audit action list is closed
  (`admin.lib.ts`).
  - The admin app has no `next-intl` and no `@workspace/store-sections` dependency.
- **Cache:** `invalidateStoreSite` and `invalidateTemplateCatalog` broadcast across apps. Admin
  already calls `invalidateStoreSite` from seller actions.

## 5. How it gets built (builder's calls, approved in conversation)

### 5.1 One shared editor package
Move the builder UI into a workspace package, for example `packages/store-editor`. Both apps render
it.
- The package takes an **adapter**: a typed object of server actions and capabilities passed in by
  the host app, instead of direct imports. It covers:
  - load, save page, save design system, save chrome, publish, pages CRUD, revisions, forms, media,
    explore/stock photos and templates
  - a capabilities map, so a host can hide features it does not support (for example, a template
    has no "unpublish" and no forms panel)
- The dashboard supplies today's seller-scoped actions unchanged. Admin supplies admin-scoped
  actions. Server actions stay in each app. The package holds only client and pure code.
- Translations ship with the package (`ar` and `en`). The dashboard keeps passing its locale. Admin
  wraps the editor in a `NextIntlClientProvider` with `en` only.
- **The dashboard editor must behave exactly as before.** Do this extraction first, on its own,
  with no feature changes, and verify it before the admin work starts.

### 5.2 Admin editing a store's site
- Entry: an "Edit website" button on the admin store detail page →
  `apps/admin/app/(builder)/stores/[storeId]/editor`.
- When the admin opens it, the admin enters a **reason**, which the audit log requires (for example
  "Seller asked on WhatsApp to change the hero"). It is kept for the session and written on every
  audited write.
- Admin actions resolve the store's real `sellerId` server-side from `storeId`, then call admin
  variants of the store-sites functions. Each variant does the following:
  - runs `assertAdminActor` (admin or super_admin)
  - checks the store exists and is not deleted
  - filters every child row by `store_id`
  - never accepts a seller id from the client
- **The admin works on the store's drafts, exactly as the seller does** (owner, 2026-10-20). The
  editor opens on the current drafts, including any unpublished work of the seller's, and Publish
  puts the whole draft live, just as the seller's Publish would. There is no separate "start from
  live" mode. Discard and restore revision stay available, as in the seller editor.
- Autosaves go into the store's drafts, exactly as the seller's do. They bump `draft_version` and
  `store_design_systems.version`, so an open seller editor hits `version_conflict` on its next save
  and must reload.
- **Admin wins:**
  - Add a version check to header/footer saves (`stores` gets a `chrome_version`, or an equivalent
    approach).
  - The seller editor checks the draft versions on window focus and every ~30 s, plus on conflict.
    When an admin changed them, it shows "An admin updated your website at your request. Reload to
    see the latest version." and stops autosaving until the seller reloads.
  - Admin publish = flush the admin drafts, then publish the snapshot. The seller's drafts are the
    admin's drafts at that point, so nothing of the seller's survives to undo it.
- Publish follows today's rules: the seller must be approved, and `startFeeTrialIfNeeded` still runs
  (the admin publishes on the seller's behalf). The revision's `published_by` is the admin's user
  id. Invalidate with `invalidateStoreSite`.
- **Audit** (new actions in the closed list): `store_site.open_editor`, `store_site.publish`,
  `store_site.restore_revision`, `store_site.discard_draft` and `store_site.page_change` (create,
  delete, rename). Record before/after revision ids. Autosaves are **not** audited one by one.
- Media: the admin uses that store's media library (the store-media bucket under the seller's
  prefix), uploaded server-side with the service role.

### 5.3 Sections move into the database
- New table `library_sections` (migration `0085`). The builder settles exact columns. Expected:
  - `id`, `key` (unique, = today's design id), `name` (jsonb ar/en), `category`, `tags`
  - `tree` (the published `section` root node), `draft_tree`, `version`
  - `thumbnail_url`, `is_hidden`, `sort_order`, `deleted_at`
  - `created_by`, `updated_by`, timestamps
  - RLS on, no policies (server-only)
- **Inserted sections keep matching the store's industry** (owner, 2026-10-20). Today
  `instantiatePreset` → `instantiateDesign(design, { industry, defaultLocale })` rebuilds the tree on
  every insert: `createTreeBuilder(industry)` picks `stockPhoto(industry, n)` and `swapToEnglish`
  sets the language (`designs/builder.ts`). The stored tree must therefore keep **photo slots**: an
  image source that is a stock-photo placeholder (index n), resolved to the inserting store's
  industry when the section is inserted. The admin section editor previews slots with a chosen
  industry (a switcher on the canvas toolbar). An admin can leave an image as a slot or replace it
  with a fixed uploaded image. The seed generator writes slots wherever the design used
  `stockPhoto`. The exact encoding is the builder's call, but it must pass `validateSiteConfig` once
  it has been resolved, and a stored tree must never reach a store unresolved.
- Seed once from today's `DESIGNS` with generated idempotent SQL, insert-if-absent (`ON CONFLICT
  (key) DO NOTHING`).
- The seller Add palette reads `library_sections` (non-hidden, non-deleted, published tree) through
  `@workspace/cache` with a new `library:sections` tag. Admin writes invalidate it.
  `instantiatePreset` runs on the DB tree instead of the code design.
- Admin section editor: the shared editor with a single-section "page" adapter. The canvas shows one
  `section` root, and saves write `draft_tree`. **Publish** copies draft to `tree` and bumps
  `version`.
- Create from blank (an empty `section` root) or duplicate. Hide toggles `is_hidden`. Delete is soft
  (`deleted_at`). Stores never reference library sections (they hold copies), so hiding or deleting
  never breaks a store.
- Template-internal designs (`getTemplateDesign`) are not part of the palette and are not migrated.

### 5.4 Templates become database-mastered
- Template drafts: add `templates.draft_config` (jsonb `SiteConfig`) and a `draft_updated_at`, or an
  equivalent. The admin template editor uses a multi-page `SiteConfig` adapter: pages, design
  system, header and footer all map onto the editor's state. Saves write `draft_config`.
- **Publish version** inserts a new `template_versions` row (`version + 1`, `changelog` optional,
  `published_by`) and points `current_version_id` at it. Earlier versions stay, and the admin can
  "restore version N to draft". Invalidate `invalidateTemplateCatalog`.
- The metadata that lives in code today (`pageNames`, `demo` preview catalog, `palette`) moves into a
  `templates.meta` jsonb so admin-created templates have it. Code values are the seed. When a field
  is missing, the gallery falls back to a default demo catalog.
- Create from blank (one empty home page plus the default design system) or duplicate (copy current
  config and meta under a new key). Hide = `is_active = false`, as today. Delete is soft
  (`deleted_at`): `template_installs` keeps its FK, and undoing an install still works because it
  uses `previous_draft`. The default template cannot be hidden or deleted.
- **New stores start from the database default** (owner, 2026-10-20). `seedStarterSite`
  (`packages/lib/src/stores/starter-site.server.ts`) reads the template with `is_default = true` and
  its current version from the database, inside the store-creation transaction. It no longer uses
  the code constant `DEFAULT_TEMPLATE`. Its `pageNames` and form lookups come from `templates.meta`.
  An admin edit to Classic, once published as a version, therefore reaches every store created
  afterwards, and switching the default in Admin changes what new stores get. The code constant
  stays only as a fallback if the database read finds nothing (it should never happen; log it).
  The marketing template preview (`apps/ecommerce/.../template-preview`) also reads `demo` and
  `pageNames` from the database instead of `getCodeTemplate`.
- **Re-seed policy change:** from `0085` on, code seeds only **insert new keys**. They never replace
  the current version of an existing template or section. `template:sql` and its test change to
  match. Updating `CLAUDE.md` rules 12 and 17 and the "do not change the default template" note is
  part of the work, because the database becomes the master copy.

### 5.5 Admin app shell
- New admin dependencies: `@workspace/store-sections`, `@workspace/store-editor` and `next-intl`
  (editor provider only).
- The builder routes sit in their own full-screen `(builder)` group, outside the dashboard layout.
- Templates page: add "Edit", "Duplicate", "New template" and "Delete". New Sections page with the
  same controls, plus a hidden filter and a category filter.
- The proxy blocks moderators from builder routes, and every action re-checks with
  `assertAdminActor`. Hiding the menu is not authorization.

### 5.6 Migrations and rollout
- `0085` (and `0086` if split): `library_sections` plus seed, `templates.draft_config` / `meta` /
  `deleted_at`, and a chrome version column. Idempotent, mirrored in `schema.ts` / `relations.ts`.
- **Owner pre-approved (2026-10-20):** apply this feature's migrations directly on Supabase, staging
  first and then production, without asking again. Verify each on staging (and dry-run on
  production) before applying it to production, and record both in `PLAN.md` §23.

## 6. Suggested order (each step shippable, with lint, typecheck and tests)

1. Extract the editor into the package with the adapter. The dashboard behaves exactly the same.
2. Concurrency fixes: chrome version check, plus the focus/poll "admin updated" notice in the seller
   editor.
3. Admin store editing (routes, admin actions, audit, publish).
4. Sections table, seed, seller palette reading from the database, admin section editor and
   management.
5. Template draft/meta columns, admin template editor and management, new stores and the marketing
   preview reading the database default, and the re-seed policy change.

Record each step in `PLAN.md` §22/§23 as a new phase (it is not in the current roadmap).

## 7. Left to the builder
- Exact package boundaries, adapter type shape, and column names and types.
- Poll interval and notice copy (ar/en for the seller side).
- Thumbnail generation for new sections and templates (manual upload is acceptable at first).
- Rate limits on admin actions (keyed by admin user id).

## 8. Builder's calls to check (not explicitly decided by the owner)
- Publish from admin still requires an approved seller and still starts the fee trial.
- The admin enters a reason once per editing session. Autosaves are not individually audited.
- Templates and sections use draft + "Publish version", not a new version on every autosave.
- Deletes are soft. The default template cannot be hidden or deleted.
- The builder is English-only in Admin.
