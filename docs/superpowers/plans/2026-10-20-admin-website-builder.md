# Admin Website Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the seller's website builder inside `apps/admin` to edit and publish any store's site, and to create, edit, publish, hide and delete library templates and library sections. The database becomes the master copy of templates and sections.

**Architecture:** The builder UI moves out of `apps/dashboard` into a new client package, `packages/store-editor`. That package receives every server call through an `EditorAdapter` prop.
- The dashboard keeps its seller-scoped server actions and wraps them in a seller adapter.
- Admin gets admin-scoped actions. These resolve the store's real `sellerId` server-side and reuse the existing `@workspace/lib/store-sites/server` functions, so there is no second copy of the storage logic.
- Library sections move to a new `library_sections` table. Their trees keep photo slots that are resolved per industry when a section is inserted.
- Templates gain a draft, a meta column and a soft delete. New stores read the default template from the database.

**Tech Stack:**
- Next.js 16.3.3 (read `node_modules/next/dist/docs/` before Next code; use `proxy.ts`, not middleware)
- React 19, zustand, @dnd-kit, next-intl, Drizzle and Supabase Postgres
- Hand-written SQL migrations, vitest, pnpm/Turborepo

**Spec:** `docs/superpowers/specs/2026-10-20-admin-website-builder-design.md`. Read it first. Every task argues from it.

## Global Constraints

- **Seller builder behaviour stays the same.** After Tasks 1–3 the dashboard editor must look and behave exactly as before. That task carries no feature changes.
- **Admin write roles:** `admin` and `super_admin` only (`ADMIN_WRITE_ROLES`). Moderators are blocked in `proxy` and by `assertAdminActor` inside every write transaction.
- **IDs:** never trust a seller or store id from the client. Admin resolves `sellerId` from `storeId` server-side. Every child-row query filters by `store_id`.
- **Audit:** every audited admin write calls `writeAdminAudit` in the same transaction, with `reason` between `ADMIN_REASON_MIN` (3) and `ADMIN_REASON_MAX` (500) characters. Autosaves are not audited.
- **Migrations:** `0085`, `0086` and `0087` are hand-written and idempotent (`IF NOT EXISTS` / `ON CONFLICT`), mirrored in `packages/db/src/drizzle/schema.ts` and `relations.ts`. Never run `drizzle-kit generate`. New server-only tables get RLS enabled with no policies.
- **Applying migrations is pre-approved (owner, 2026-10-20):** staging → verify → production dry-run → production via Supabase. Log each step in `PLAN.md` §23.
- **Cache:** use `@workspace/cache` (`createCachedQuery`, tags in `packages/cache/src/tags.ts`, broadcast). Never cache drafts. Store-data keys include the seller id.
- **No custom HTML/JS nodes.** Library trees go through `validateSiteConfig` / `sectionInstanceSchema`.
- **i18n:** seller-facing strings go in both `ar.json` and `en.json` (in the package's messages). Admin renders the editor with `en` only.
- **File split:** `*.server.ts` (server actions), `*.data.ts` (loaders), `*.client.tsx`, `*.lib.ts` (pure), `*.dto.ts` / `*.types.ts`.
- **Verification per task:** run `pnpm lint`, `pnpm typecheck`, `pnpm test` (or `--filter`). DB integration tests (`*.integration.test.ts`) run only when `TEST_DATABASE_URL` is set. Record manual E2E checks in `PLAN.md` §23.
- **Git:** the branch holds others' uncommitted work. Stage only the files your task touched (`git add <paths>`), never `git add -A`.

## Review Focus

1. **A seller tab open during an admin publish.** The seller's next autosave, or the next focus/30-second check, must lock autosave and show the "admin updated" banner. It must never overwrite the admin's header or footer. Tests in Tasks 4–5.
2. **An admin store action called with a storeId that is deleted, or a moderator session.** It must return not-found/forbidden and write nothing. Tests in Task 6.
3. **A library section with photo slots inserted into a store with no industry, or an unknown one.** It must resolve to the same default photos `stockPhoto(undefined, n)` gives today, and never leave a `stock:` src in a store draft. Tests in Tasks 8 and 10.
4. **Deleting or hiding the default template, or a template some stores installed.** Default: refused. Installed: soft-deleted, and `undoStoreTemplate` still works. Tests in Task 14.
5. **Re-running the seed migrations (`0071`, `0084`, `0086`, `0087`) after admin edits.** Admin edits must survive. Tests in Tasks 9 and 12.

---

## Phase A — Shared editor package

### Task 1: `packages/store-editor` scaffold and adapter contract

**Files:**
- Create: `packages/store-editor/package.json`, `tsconfig.json`, `vitest.config.ts`, `src/index.ts`
- Create: `packages/store-editor/src/adapter.types.ts`, `src/adapter.client.tsx`, `src/adapter.client.test.tsx`

**Interfaces:**
- Produces: `EditorAdapter`, `EditorCapabilities`, `EditorAdapterProvider`, `useEditorAdapter()`. Every later task uses these names.

```ts
// adapter.types.ts. Result types are moved from the dashboard's editor.dto.ts in Task 2.
export type EditorCapabilities = {
  pages: boolean;          // pages panel + page CRUD (false for a section)
  templates: boolean;      // Add › Templates (false for template/section editing)
  forms: boolean;          // forms panel
  explore: boolean;        // stock-photo Explore tab
  mediaLibrary: boolean;   // full library; false = upload-only picker
  revisions: boolean;
  unpublish: boolean;
  preview: boolean;        // "preview on my store" link
  industrySwitcher: boolean; // section/template canvas: pick the industry used for photo slots
  publishLabel: "site" | "templateVersion" | "section";
};
export type EditorAdapter = {
  capabilities: EditorCapabilities;
  saveDraft(pageId: string, content: unknown, clientVersion: number): Promise<EditorResult<{ version: number }>>;
  saveDesignSystem(designSystem: unknown, clientVersion: number): Promise<EditorResult<{ version: number }>>;
  saveChrome(part: "header" | "footer", instance: unknown, clientVersion: number): Promise<EditorResult<{ version: number }>>;
  draftVersions(): Promise<EditorResult<DraftVersions>>;   // Task 5
  refreshData(): Promise<EditorResult<EditorCatalogSnapshot>>;
  publish(): Promise<EditorResult<{ publishedAt: string }>>;
  // Optional groups; present iff the matching capability is true.
  pages?: { create; update; remove; reorder };   // same params as today's editor.server.ts minus storeId
  revisions?: { list; restore; discard };
  unpublish?(): Promise<EditorResult<null>>;
  siteStatus?(): Promise<EditorResult<{ isLive: boolean; hasUnpublishedChanges: boolean }>>;
  previewLink?(): Promise<EditorResult<{ url: string }>>;
  templates?: { apply(key: string); preview(key: string); undo() };
  forms?: { list(); createFromTemplate(templateId: unknown) };
  explore?: { search(query: string, page?: number); import(photoId: string) };
  media: { list; createUploadPaths; recordUpload; update; remove; createFolder; renameFolder; deleteFolder }; // same params as apps/dashboard/components/media/media.server.ts minus storeId; upload-only hosts implement createUploadPaths + recordUpload and return { success:false, error:"notFound" } for the rest
};
```

Copy the exact parameter and return types of each method from the current dashboard action it wraps (`editor.server.ts`, `templates.server.ts`, `forms.server.ts`, `explore.server.ts`, `components/media/media.server.ts`), with the leading `storeId` removed. The adapter closes over it. `saveChrome` gains `clientVersion` (Task 4).

- [ ] **Step 1: Write the failing test** `adapter.client.test.tsx`:
  - `useEditorAdapter()` called outside a provider throws `"EditorAdapterProvider missing"`.
  - Inside `<EditorAdapterProvider adapter={fake}>` it returns `fake`.
- [ ] **Step 2: Run** `pnpm --filter @workspace/store-editor test`. Expected: FAIL (module not found).
- [ ] **Step 3: Scaffold the package.**
  - Name: `@workspace/store-editor`, `"type": "module"`. Exports: `"."` → `src/index.ts`, `"./messages/ar.json"`, `"./messages/en.json"`.
  - Dependencies: `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2`, `zustand`, `@workspace/store-sections`, `@workspace/ui`.
  - Peer dependencies: `react`, `next`, `next-intl`. Copy the versions from `apps/dashboard/package.json`.
  - Add the adapter files.
- [ ] **Step 4: Run** the test. Expected: PASS. Run `pnpm --filter @workspace/store-editor typecheck`. Expected: clean.
- [ ] **Step 5: Commit** `feat(store-editor): package scaffold and adapter contract`.

### Task 2: Move the editor's pure code and its tests into the package

**Files:**
- Move: `apps/dashboard/app/(builder)/stores/[storeId]/editor/lib/**` (the `*.lib.ts` and `*.test.ts` files) → `packages/store-editor/src/lib/`
- Move: `editor/server/editor.dto.ts` → `packages/store-editor/src/editor.dto.ts`. Keep `EDITOR_ERRORS`. Move `EditorCatalogSnapshot` / `EditorForm` types here from `editor.data.ts`, and leave a re-export there.
- Move the pure dashboard helpers the editor imports into the package:
  - `lib/stores/industries.lib.ts` → `src/lib/industries.lib.ts`. The dashboard re-exports from the package.
  - `website/design/design.lib.ts` `COLOR_FIELDS` → `src/lib/design-fields.lib.ts`. `design.lib.ts` imports it from the package.
  - `website/templates/templates.dto.ts` view types → `src/templates.dto.ts`. The dashboard re-exports them.
- Modify: every dashboard import site to import from `@workspace/store-editor`.

**Interfaces:**
- Produces: package exports `editor.dto` (types + `EDITOR_ERRORS`), all `lib/*` helpers under their current names, `INDUSTRIES` helpers, `COLOR_FIELDS`, `TemplateCardView`, `TemplatePreviewView`.

- [ ] **Step 1: Move the files** with `git mv`, keeping the names. Fix the imports.
- [ ] **Step 2: Run** `pnpm --filter @workspace/store-editor test` and `pnpm --filter dashboard test`. Expected: the same test count as before the move, all passing. Note the before-count first with `pnpm --filter dashboard test` on a clean checkout of these files.
- [ ] **Step 3: Run** `pnpm typecheck` and `pnpm lint`. Expected: clean.
- [ ] **Step 4: Commit** `refactor(store-editor): move editor pure logic into package`.

### Task 3: Move the editor UI into the package behind the adapter

**Files:**
- Move: `editor/{editor.client.tsx,canvas,dnd,inspector,panels,shell,state}` → `packages/store-editor/src/`
- Move: `components/media/{media-library.client.tsx,media-picker.client.tsx,use-media-upload.client.ts,media.dto.ts,media.lib.ts}` → `packages/store-editor/src/media/`. They call `useEditorAdapter().media.*` instead of `media.server`. The dashboard's other media users keep working through a thin dashboard wrapper that supplies a media-only adapter (`apps/dashboard/components/media/media-adapter.client.tsx`).
- Move: `website/_components/site-preview.client.tsx` (`SitePreview`, `PreviewCatalog`) → `packages/store-editor/src/preview/`. The dashboard re-exports it.
- Move: the `storeEditor` namespace from `apps/dashboard/messages/{ar,en}.json` → `packages/store-editor/messages/{ar,en}.json`. Also move any other namespaces the moved components call, such as `media`. The dashboard's `i18n/request.ts` deep-merges them back in.
- Create: `apps/dashboard/app/(builder)/stores/[storeId]/editor/seller-adapter.client.tsx`, which exports `useSellerEditorAdapter(storeId: string, capabilities?: Partial<EditorCapabilities>): EditorAdapter` and wraps the existing server actions.
- Create: `editor/seller-editor.client.tsx`, `SellerEditor({ initial })`. It calls `useSellerEditorAdapter(initial.storeId)` and renders `<StoreEditor initial={initial} adapter={adapter} />`. `page.tsx` renders `<SellerEditor initial={initial} />`. The adapter is built client-side by importing the server actions, so no function objects cross the RSC boundary.
- Keep: `editor/server/*`. It stays in the dashboard.
- Modify: `editor/README.md` → move to `packages/store-editor/README.md`, updated with the adapter section. The dashboard folder README says "UI lives in @workspace/store-editor".

**Interfaces:**
- Consumes: Task 1 adapter and Task 2 modules.
- Produces: `StoreEditor({ initial, adapter }: { initial: EditorInitial; adapter: EditorAdapter })`. `EditorInitial` is exported from the package unchanged, plus three optional fields:
  - `presets?: SectionPreset[]` (Task 10)
  - `industry?: string`
  - `title?: string` (top-bar label for template/section editing)

  Panels and buttons whose capability is false are not rendered.

- [ ] **Step 1: Replace every direct server-action import** in the moved files with `useEditorAdapter()`.
  - Grep target after the change: `grep -rn "server\"" packages/store-editor/src` returns nothing.
  - `grep -rn "from \"@/" packages/store-editor/src` returns nothing.
- [ ] **Step 2: Gate the panels and top-bar items on `adapter.capabilities`.** All capabilities are true in the seller adapter.
- [ ] **Step 3: Add a test** `packages/store-editor/src/shell/capabilities.client.test.tsx`. Render `EditorRail` (the left tab rail component) with `pages:false, forms:false, templates:false`, and assert those tabs are absent. With all true, assert they are present.
- [ ] **Step 4: Run** `pnpm lint && pnpm typecheck && pnpm test`. Expected: green, with the dashboard and package test counts at least what they were.
- [ ] **Step 5: Manual E2E in the dashboard** (`pnpm --filter dashboard dev`), one store, in both `ar` and `en`. Check each of these:
  - open editor
  - edit text
  - autosave indicator
  - add a library section
  - drag-reorder
  - change header
  - design colours
  - upload an image and pick it from the media library
  - Explore photo import
  - forms panel
  - apply a template, then undo it
  - publish
  - revisions restore
  - preview link

  Record the result in `PLAN.md` §23.
- [ ] **Step 6: Commit** `refactor(store-editor): editor UI in shared package behind EditorAdapter`.

## Phase B — Admin edits win

### Task 4: Version check on header/footer saves (`0085`)

**Files:**
- Create: `packages/db/migrations/0085_store_chrome_version.sql`. It adds:
  - `stores.chrome_version integer NOT NULL DEFAULT 1`
  - `stores.site_edited_by_admin_at timestamptz` (used in Task 5)
  - `ADD COLUMN IF NOT EXISTS`
- Modify: `packages/db/src/drizzle/schema.ts` (`stores`: `chromeVersion`, `siteEditedByAdminAt`)
- Modify: `packages/lib/src/store-sites/server.ts`:
  - `saveStoreChrome(sellerId, storeId, part, instance, clientVersion: number, q?)` → `{ success: true, data: { version } } | { success: false, error: "version_conflict" | … }`. Optimistic: `UPDATE … SET chrome_version = chrome_version + 1 WHERE … AND chrome_version = $clientVersion`.
  - Every other writer of `shared_header` / `shared_footer` also bumps `chrome_version`: `restoreRevisionToDraft`, `discardStoreDrafts`, `applyStoreTemplate`, `undoStoreTemplate` and `seedStarterSite`.
  - `getStoreForEditor` returns `chromeVersion`.
- Modify: the dashboard `editor.server.ts` `saveChrome` takes `clientVersion`. The editor store keeps `chromeVersion` in state, and autosave sends it and handles `versionConflict` the way pages do.
- Test: `packages/lib/src/store-sites/store-sites.integration.test.ts` (new; follow `admin.integration.test.ts` for setup and skip-without-`TEST_DATABASE_URL`).

**Interfaces:**
- Produces:
  - `saveStoreChrome(sellerId: string, storeId: string, part: "header" | "footer", instance: unknown, clientVersion: number, q?: Queryable)`
  - `EditorInitial.chromeVersion: number`

- [ ] **Step 1: Write the failing integration tests:**
  - `saveStoreChrome with a stale version returns version_conflict and leaves shared_header unchanged`
  - `restoreRevisionToDraft bumps chrome_version`
  - `applyStoreTemplate bumps chrome_version`
- [ ] **Step 2: Run** `TEST_DATABASE_URL=… pnpm --filter @workspace/lib test store-sites.integration`. Expected: FAIL.
- [ ] **Step 3: Write the migration and schema. Implement the version check and the bumps.**
- [ ] **Step 4: Run** the tests. Expected: PASS. Then run `pnpm lint && pnpm typecheck && pnpm test`.
- [ ] **Step 5: Apply `0085` to staging** via Supabase. Verify with `select column_name from information_schema.columns where table_name='stores' and column_name in ('chrome_version','site_edited_by_admin_at')` (2 rows). Dry-run on production, apply to production, then log in `PLAN.md` §23.
- [ ] **Step 6: Commit** `feat(store-sites): chrome version check (0085)`.

### Task 5: Seller editor notices an admin edit

**Files:**
- Modify: `packages/lib/src/store-sites/server.ts`: add `getStoreDraftVersions(sellerId, storeId, q?)`, which returns `DraftVersions`.
- Create: `packages/store-editor/src/lib/draft-watch.lib.ts` + `.test.ts`
- Create: `packages/store-editor/src/state/use-draft-watch.client.ts`
- Modify: the dashboard `editor.server.ts`: `draftVersions(storeId)` action, wired into the seller adapter.
- Modify: `packages/store-editor/messages/{ar,en}.json`: `storeEditor.adminUpdated.{title,body,reload}`.
  - en body: "An admin updated your website at your request. Reload to see the latest version."
  - ar body: "قام أحد مسؤولي طلبي بتحديث موقعك بناءً على طلبك. أعد التحميل لرؤية أحدث نسخة."

**Interfaces:**
- Produces:
  - `type DraftVersions = { pages: Record<string, number>; designVersion: number; chromeVersion: number; editedByAdminAt: string | null }`
  - `detectExternalChange(local: DraftVersions, remote: DraftVersions): { changed: boolean; byAdmin: boolean }`
  - `useDraftWatch(store, adapter)`: runs on window focus/visibility and every 30 000 ms. When `changed`, it sets `saveStatus = "conflict"` and shows the reload banner. When `byAdmin` is true, the banner uses the `adminUpdated` copy.

- [ ] **Step 1: Write the failing tests** in `draft-watch.lib.test.ts`:
  - identical versions → `{changed:false}`
  - remote page version higher → `changed:true`
  - a new page id on remote → `changed:true`
  - `editedByAdminAt` later than the local value → `byAdmin:true`
  - a local version higher than remote (own unsaved bump) → `changed:false`
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** `detectExternalChange`, `getStoreDraftVersions` (one query on `store_pages`, `store_design_systems` and `stores` for this store), the hook and the banner copy. The editor's local versions update after each of its own successful saves, so it never flags itself.
- [ ] **Step 4: Run** `pnpm lint && pnpm typecheck && pnpm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(store-editor): detect external draft changes`.

## Phase C — Admin edits a store's site

### Task 6: Admin store-site lib (guard, audit, flag)

**Files:**
- Modify: `packages/lib/src/admin/admin.lib.ts` `ADMIN_AUDIT_ACTIONS`. Append:
  - `"open_store_editor"`, `"publish_store_site"`, `"unpublish_store_site"`, `"restore_store_revision"`, `"discard_store_draft"`, `"change_store_page"`, `"apply_store_template"`
  - `"create_template"`, `"publish_template_version"`, `"restore_template_version"`, `"delete_template"`
  - `"create_library_section"`, `"update_library_section"`, `"publish_library_section"`, `"hide_library_section"`, `"delete_library_section"`
- Create: `packages/lib/src/admin/store-site-admin.server.ts`, exported from `@workspace/lib/admin/server`
- Test: extend `packages/lib/src/admin/admin.integration.test.ts`

**Interfaces:**
- Produces:
  - `resolveStoreForAdmin(actorId: string, storeId: string, q?: Queryable): Promise<{ sellerId: string; storeId: string; subdomain: string; status: string; sellerStatus: string } | null>`
    - Runs `assertAdminActor`.
    - Returns null for a missing or deleted store or a malformed uuid.
  - `markSiteEditedByAdmin(storeId: string, q?: Queryable): Promise<void>`: sets `stores.site_edited_by_admin_at = now()`.
  - `auditStoreSite(q, { actorId, sellerId, storeId, action, before, after, reason }): Promise<string>`: a thin wrapper over `writeAdminAudit`.

- [ ] **Step 1: Write the failing integration tests:**
  - a moderator actor → throws `AdminActorError`
  - a deleted store → `null`
  - an admin on a live store → returns the store's real `sellerId`
  - `auditStoreSite` writes one row with `store_id` set and the given reason
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `pnpm lint && pnpm typecheck && pnpm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(admin): store-site admin guard and audit actions`.

### Task 7: Admin store editor route and actions

**Files:**
- Modify: `apps/admin/package.json`. Add `@workspace/store-sections`, `@workspace/store-editor`, `next-intl`, `zustand`, `@dnd-kit/*` (same versions), and `transpilePackages` in `next.config` if the dashboard has it.
- Create: `apps/admin/app/(builder)/layout.tsx`. This is a full-screen layout with no admin sidebar. It wraps children in `NextIntlClientProvider locale="en"` with `@workspace/store-editor/messages/en.json`.
- Create: `apps/admin/app/(builder)/stores/[storeId]/editor/page.tsx`. It mirrors the dashboard `page.tsx`, but uses the `sellerId` from `resolveStoreForAdmin`. Unknown store → `notFound()`.
- Create: `…/editor/admin-store-editor.server.ts` (`"use server"`). Same actions as the dashboard `editor.server.ts` + `templates.server.ts` + `forms.server.ts` + `media.server.ts`, each `(storeId, …args, reason?)`:
  - First `adminActorId("canManageUsers")`, then `resolveStoreForAdmin`, then the same `@workspace/lib` function with the resolved `sellerId`.
  - Saves call `markSiteEditedByAdmin`.
  - `publish`, `unpublish`, `restoreRevision`, `discardDraft`, page create/delete/rename and `applyTemplate` run in one transaction with `auditStoreSite`, using the session reason. `before`/`after` = `{ revisionId }` or `{ pageId, slug }`.
  - Invalidate with `invalidateStoreSite(sellerId, storeId, subdomain)` from `"admin"`.
  - Rate-limit saves keyed by the admin's id: copy `createRateLimiter` from the dashboard into `apps/admin/lib/rate-limit.lib.ts` if admin has none.
- Create: `…/editor/reason-gate.client.tsx`. Before the editor mounts, it shows a dialog asking for the reason (min 3, max 500). On submit it calls `openStoreEditor(storeId, reason)`, which audits `open_store_editor`, then renders the editor. The reason lives in React state for the session.
- Create: `…/editor/admin-store-adapter.client.tsx`: `useAdminStoreAdapter(storeId, reason): EditorAdapter`. All capabilities are true except `explore` (false; stock-photo import is seller tooling).
- Modify: `apps/admin/app/(dashboard)/stores/[storeId]/page.tsx`. Add an "Edit website" button linking to `/stores/{id}/editor`, shown only for write roles.
- Modify: `apps/admin/supabase/middleware.ts`. Paths under `/stores/*/editor`, `/templates/*/editor` and `/sections` require role `admin` or `super_admin`. A moderator gets a redirect to `/`.
- Test: `apps/admin/app/(builder)/stores/[storeId]/editor/admin-store-editor.server.test.ts`. Use vitest with `@workspace/lib/admin/server` and the auth helper mocked:
  - no actor → `notFound` error and the lib is not called
  - the resolved `sellerId` (not any client value) is passed to `saveStorePageDraft`
  - publish writes an audit row with the reason

- [ ] **Step 1: Write the failing tests above.**
- [ ] **Step 2: Run** `pnpm --filter admin test`. Expected: FAIL.
- [ ] **Step 3: Implement** the route, actions, adapter, gate, button and proxy rule.
- [ ] **Step 4: Run** `pnpm lint && pnpm typecheck && pnpm test`. Expected: green.
- [ ] **Step 5: Manual E2E:**
  - An admin opens a staging store, enters a reason, edits the hero and publishes. The storefront shows the change, and `admin_audit_log` has `open_store_editor` + `publish_store_site`.
  - With the seller's editor open in another browser, within 30 s the seller sees the "admin updated" banner and autosave stops.
  - A moderator who hits the URL is redirected.

  Log in `PLAN.md` §23.
- [ ] **Step 6: Commit** `feat(admin): edit and publish a store's website`.

## Phase D — Library sections in the database

### Task 8: Photo slots in design trees

**Files:**
- Create: `packages/store-sections/src/designs/photo-slots.ts` + `photo-slots.test.ts`
- Modify: `packages/store-sections/src/designs/builder.ts`:
  - `createTreeBuilder(industry?, photos?, opts?: { slots?: boolean })`. With `slots`, `stock(i)` returns `photoSlot("photo", i)` and `people(i)` returns `photoSlot("person", i)`.
  - `instantiateDesign` is unchanged.
  - Add `instantiateTemplate(tree: NodeTemplate, opts: { id: string; source?: string; defaultLocale?: SiteLocale; makeId?: MakeId; industry?: string }): SectionInstance`. It does `resolvePhotoSlots`, then `swapToEnglish` when the locale is en, then `fromTemplate`. `instantiateDesign` is refactored onto it (same output).
- Modify: the image element renderer. When `src` is a slot, it renders `resolvePhotoSlot(src, industry)`. Industry comes through the existing render context (the same path as `mode="edit"`). Default: `undefined`.

**Interfaces:**
- Produces:
  - `photoSlot(kind: "photo" | "person", index: number): string` → `"stock:photo:3"`
  - `PHOTO_SLOT_RE = /^stock:(photo|person):(\d+)$/`
  - `resolvePhotoSlot(src: string, industry?: string): string`: `stockPhoto(industry, i)` / `peoplePhoto(i)`; a non-slot src is returned unchanged
  - `resolvePhotoSlots(tree: NodeTemplate, industry?: string): NodeTemplate`
  - `designSlotTree(design: Design): NodeTemplate` = `design.tree(createTreeBuilder(undefined, undefined, { slots: true }))`
  - `instantiateTemplate(...)`

- [ ] **Step 1: Write the failing tests:**
  - For every design in `DESIGNS` and every industry in `STOCK_INDUSTRIES` plus `undefined`: `resolvePhotoSlots(designSlotTree(d), ind)` deep-equals `d.tree(createTreeBuilder(ind))`.
  - `instantiateTemplate(designSlotTree(d), {id:"x", industry, defaultLocale})` deep-equals `instantiateDesign(d, {id:"x", industry, defaultLocale})` for `ar` and `en`.
  - `resolvePhotoSlot("https://a/b.jpg")` returns its input.
  - No resolved tree contains a src matching `^stock:`.
- [ ] **Step 2: Run** `pnpm --filter @workspace/store-sections test photo-slots`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the package tests. Expected: all PASS, including the existing `designs.test.tsx`.
- [ ] **Step 5: Commit** `feat(store-sections): photo slots for library trees`.

### Task 9: `library_sections` table and seed (`0086`)

**Files:**
- Create: `packages/store-sections/scripts/section-sql.ts` (script `section:sql` in `package.json`) and `packages/store-sections/src/library/section-seed.ts` + `section-seed.test.ts`
- Create: `packages/db/migrations/0086_library_sections.sql`, generated by `pnpm --filter @workspace/store-sections section:sql 0086_library_sections`, then the hand-written DDL header prepended
- Modify: `packages/db/src/drizzle/schema.ts` (`librarySections`), `relations.ts` (`createdBy`/`updatedBy` → `users`)

DDL:

```sql
CREATE TABLE IF NOT EXISTS library_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE CHECK (key ~ '^[a-z0-9-]+$'),
  category text NOT NULL,
  subcategory text NOT NULL DEFAULT '',
  name jsonb NOT NULL,
  description jsonb NOT NULL DEFAULT '{}',
  keywords text[] NOT NULL DEFAULT '{}',
  tree jsonb NOT NULL,             -- published NodeTemplate, slot form
  draft_tree jsonb,                -- null = no unpublished changes
  version integer NOT NULL DEFAULT 1,
  draft_version integer NOT NULL DEFAULT 1,
  thumbnail_url text,
  is_hidden boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS library_sections_listing_idx ON library_sections (category, sort_order) WHERE deleted_at IS NULL AND NOT is_hidden;
ALTER TABLE library_sections ENABLE ROW LEVEL SECURITY;
-- library-media bucket for admin template/section images: public read, writes by service role only.
-- Copy the allowed MIME list from packages/lib/src/media/media.lib.ts.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('library-media','library-media', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/avif','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;
```

The seed has one `INSERT … ON CONFLICT (key) DO NOTHING` per design in `DESIGNS` order. `sort_order` = index × 10, and `tree` = `designSlotTree(design)`.

**Interfaces:**
- Produces: `librarySectionsSeedSql(designs: readonly Design[]): string`, and the Drizzle table `librarySections` with camelCase fields matching the DDL.

- [ ] **Step 1: Write the failing tests** in `section-seed.test.ts`:
  - the SQL contains one `ON CONFLICT (key) DO NOTHING` per design
  - it contains no `DO UPDATE`
  - the committed `packages/db/migrations/0086_library_sections.sql` contains `librarySectionsSeedSql(DESIGNS)` verbatim (same pattern as the existing template-seed test)
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the generator and script. Generate the migration and add the schema.
- [ ] **Step 4: Run** `pnpm lint && pnpm typecheck && pnpm test`. Expected: green.
- [ ] **Step 5: Apply `0086` to staging.** Verify:
  - `select count(*) from library_sections` = `DESIGNS.length`
  - `select id from storage.buckets where id = 'library-media'` returns 1 row
  - re-running the file changes 0 rows
  - after `update library_sections set name = '{"en":"x"}' where key='hero-classic'` and a re-run, the name is still `x` (then revert it)

  Dry-run on production, apply to production, then log in §23.
- [ ] **Step 6: Commit** `feat(db): library_sections table seeded from designs (0086)`.

### Task 10: Seller palette reads the database

**Files:**
- Modify: `packages/store-sections/src/library/types.ts`. `SectionPreset` gains `tree?: NodeTemplate` (slot form) and `version?: number`.
- Modify: `packages/store-sections/src/library/library.ts`:
  - `instantiatePreset`: `preset.tree` → `instantiateTemplate(preset.tree, { id, source: \`${preset.id}@${preset.version ?? 1}\`, ...opts })`. Otherwise it behaves as today.
  - `getPreset(id, presets = SECTION_PRESETS)`.
- Create: `packages/lib/src/library-sections/server.ts`:
  - `listPublishedLibrarySections(q?)`: not deleted, not hidden, ordered by `sort_order`.
  - `toLibraryPreset(row): SectionPreset`: `id` = `presetId` rule on `key`, `designId` unset, `tree` = row.tree, capabilities from `dataNeeds` on the tree.
  - Export `presetDataNeeds(tree: NodeTemplate)` from `presets/library.ts` for that.
- Modify: `packages/cache/src/tags.ts`. Add `librarySectionTags.catalog() = "library:sections"` and `invalidateLibrarySections()` in `invalidate.ts`.
- Modify: the dashboard editor `page.tsx` loads `presets` through `createCachedQuery({ name: "library:sections", ttl: 300, tags: () => [librarySectionTags.catalog()] })`. On error, log and fall back to `SECTION_PRESETS`.
- Modify: `packages/store-editor/src/panels/add/section-library.client.tsx`, `src/lib/editor-library.lib.ts`, quick insert and DnD. They read presets from the editor store (`initial.presets ?? SECTION_PRESETS`) and pass them to `filterPresets`, `presetCountByCategory`, `getPreset` and `instantiatePreset`. Pass `industry: initial.industry` (the store category, as today).
- Test: `packages/store-sections/src/library/library.test.ts` (extend).

**Interfaces:**
- Consumes: Task 8 `instantiateTemplate`, Task 9 `librarySections`.
- Produces: `listPublishedLibrarySections`, `toLibraryPreset`, `librarySectionTags`, `invalidateLibrarySections`, `EditorInitial.presets`.

- [ ] **Step 1: Write the failing tests:**
  - A preset built from `designSlotTree(d)` with `tree` instantiates deep-equal to the design preset, for the `fashion` industry and for `undefined`.
  - `getPreset("hero.classic", customList)` finds it in the custom list.
  - The instantiated tree contains no `stock:` src.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `pnpm lint && pnpm typecheck && pnpm test`. Expected: green. Manual check: in the dashboard, add a hero to a food store and a fashion store, and confirm the photos differ by industry.
- [ ] **Step 5: Commit** `feat(store-sections): section palette from library_sections`.

### Task 11: Admin section management and section editor

**Files:**
- Create: `packages/lib/src/admin/library-sections-admin.server.ts`. Every function runs `assertAdminActor` and the audit write in one transaction, then `invalidateLibrarySections()` after commit:
  - `listLibrarySectionsForAdmin(filter: { category?: string; includeHidden: boolean; query?: string })`
  - `createLibrarySection(actorId, input: { key; category; subcategory; name; description }, reason)`: tree = an empty `section` root `NodeTemplate`, written into both `tree` and `draft_tree`
  - `duplicateLibrarySection(actorId, id, newKey, reason)`
  - `saveLibrarySectionDraft(actorId, id, tree: unknown, clientVersion)`: validate the tree as a `custom-section` via `sectionInstanceSchema`, with `fromTemplate` ids. Optimistic on `draft_version`. Not audited.
  - `publishLibrarySection(actorId, id, reason)`: `tree = draft_tree`, `draft_tree = null`, `version + 1`
  - `updateLibrarySectionMeta(actorId, id, input, reason)`
  - `setLibrarySectionHidden(actorId, id, hidden, reason)`
  - `deleteLibrarySection(actorId, id, reason)` (sets `deleted_at`)
- Create: `packages/store-sections/src/elements/tree.ts` `toTemplate(node: ComponentNode): NodeTemplate`. It strips ids recursively and is the inverse of `fromTemplate`. Test the round-trip.
- Create: `apps/admin/app/(dashboard)/sections/{page.tsx,sections.server.ts,section-row-actions.client.tsx,new-section-dialog.client.tsx}`. A table using `AdminTable`: name, key, category, version, "Unpublished changes" badge, hidden; actions Edit / Duplicate / Hide-Show / Delete via `ReasonActionButton`. Filters: category, show hidden. Add "Sections" to the admin sidebar under Templates.
- Create: `apps/admin/app/(builder)/sections/[id]/editor/{page.tsx,section-editor.server.ts,section-adapter.client.tsx}`. The adapter presents one synthetic page `{ id: "section", slug: "section", isHome: true, content: { sections: [instantiateTemplate(draft_tree ?? tree, { id: key })] }, version: draft_version }`, with `defaultLocale: "ar"` and no header or footer.
  - `saveDraft` sends `toTemplate(content.sections[0].componentTree[0])`.
  - `publish` = `publishLibrarySection`.
  - Capabilities: all false except `mediaLibrary: false` (upload-only), `industrySwitcher: true`, `publishLabel: "section"`.
  - `saveDesignSystem` / `saveChrome` return success without writing, since the platform default design system is shown (`DEFAULT_TEMPLATE` design system).
  - The catalog is the template demo catalog (`getCodeTemplate("tallaby-classic").demo`).
- Media for library editing: create `apps/admin/lib/library-media.server.ts`. It provides `createLibraryUploadPath(mime)` and `recordLibraryUpload(path)` on the public bucket `library-media` (created in `0086`, Task 9). Paths are `library/<uuid>.<ext>`, and MIME types are limited to `isMediaMimeType`. Task 15 reuses it for templates.
- Modify: `packages/store-editor`. Add an industry switcher to the top bar when `capabilities.industrySwitcher`. It sets the render-context industry only, and never changes the saved tree.
- Tests:
  - `library-sections-admin.integration.test.ts`:
    - a moderator is refused
    - a stale `clientVersion` → `version_conflict`
    - publish copies the draft and bumps the version, and the seller listing reflects it
    - a hidden section is absent from `listPublishedLibrarySections`
    - a deleted section is absent from both lists
    - each audited action writes one row with `target_type = 'library_section'`, `seller_id = null`
  - `tree.test.ts`: `toTemplate(fromTemplate(t, makeId))` deep-equals `t`.

- [ ] **Step 1: Write the failing tests.**
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the lib, the admin pages and the editor route.
- [ ] **Step 4: Run** `pnpm lint && pnpm typecheck && pnpm test`. Expected: green.
- [ ] **Step 5: Manual E2E:**
  - Create a section, edit it, switch the industry preview, then publish. In the dashboard it appears in Add.
  - Hide it: it disappears. Delete it: it is gone in admin too.

  Log in §23.
- [ ] **Step 6: Commit** `feat(admin): manage and edit library sections`.

## Phase E — Templates mastered in the database

### Task 12: Template draft, meta and soft delete (`0087`), and the re-seed policy

**Files:**
- Create: `packages/db/migrations/0087_template_drafts.sql`:

```sql
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS draft_config jsonb,
  ADD COLUMN IF NOT EXISTS draft_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS draft_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
```

  After the DDL comes one generated `UPDATE templates SET meta = $json WHERE key = $key AND meta = '{}'` per code template, from the new `templatesMetaSql(CODE_TEMPLATES)`.
- Modify: `packages/store-sections/src/templates/catalog.ts`:
  - `templateSeedSql` becomes insert-only. The template upsert becomes `ON CONFLICT (key) DO NOTHING`. The version insert and the `current_version_id` update happen only when the template row was inserted by this statement, using a CTE on `RETURNING id`, so an existing template's current version is never replaced.
  - Add `templateMeta(t: TemplateDefinition): TemplateMeta` and `templatesMetaSql`.
- Modify: the template-seed test so it asserts there is no `DO UPDATE` in newly generated SQL. **Do not edit `0071` or `0084`.** They are already applied, and the policy applies from `0087` on. Document that in the test's comment.
- Modify: `schema.ts` (`templates`: `draftConfig`, `draftVersion`, `draftUpdatedAt`, `meta`, `deletedAt`).
- Modify: `CLAUDE.md`:
  - rule 6: next migration number `0088`, plus the `0085`–`0087` notes
  - rule 12: the default template is the DB row with `is_default`, editable from Admin
  - rule 17: code designs are the **seed** for `library_sections`. The admin edits the DB copy, and new code designs reach the DB through a new `section:sql` insert-only migration.

**Interfaces:**
- Produces: `type TemplateMeta = { pageNames: Record<string, Localized>; demo: PreviewCatalog; palette: string[] }`, `templateMeta`, `templatesMetaSql`.

- [ ] **Step 1: Write the failing tests:**
  - `templateSeedSql(t, "x")` contains no `DO UPDATE` and does not set `current_version_id` outside the insert CTE
  - `templateMeta(getCodeTemplate("tallaby-classic"))` has the `home` page name and a non-empty `demo.products`
  - the `0087` file contains `templatesMetaSql(CODE_TEMPLATES)` verbatim
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Generate `0087`.
- [ ] **Step 4: Run** `pnpm lint && pnpm typecheck && pnpm test`. Expected: green.
- [ ] **Step 5: Apply `0087` to staging.** Verify:
  - `select count(*) from templates where meta = '{}'` = 0
  - re-running changes nothing

  Dry-run on production, apply to production, then log in §23.
- [ ] **Step 6: Commit** `feat(db): template drafts and meta (0087)`.

### Task 13: New stores and previews read templates from the database

**Files:**
- Modify: `packages/lib/src/store-sites/templates.server.ts`. Add:
  - `loadDefaultTemplate(q): Promise<{ key: string; config: SiteConfig; meta: TemplateMeta } | null>`: `is_default AND is_active AND deleted_at IS NULL`, joined with the current version
  - `getTemplateMeta(key, q)`
- Modify: `packages/lib/src/stores/starter-site.server.ts` `seedStarterSite`:
  - Use `loadDefaultTemplate(q)` in the caller's transaction, with `meta.pageNames`.
  - Fallback when it returns null: `DEFAULT_TEMPLATE` plus `logServerError("store-sites", "default template missing in DB", {})`.
  - Form needs are still computed with `templateFormNeeds(config)` on the DB config.
- Modify: the gallery and preview readers that use `getCodeTemplate(key).{demo,pageNames,palette}` read `meta` from the DB row instead, with a code fallback when a field is missing:
  - `listStoreTemplates`
  - dashboard `templatePreview`
  - `apps/ecommerce/app/**/template-preview/**/page.tsx`
  - `templates.lib.ts` `toTemplateCardViews`

  Find them all with `grep -rn "getCodeTemplate" apps packages --include=*.ts*`. Leave the template-internal `designs` (`getTemplateDesign`) in code.
- Modify: `listStoreTemplates` and `getPublicTemplateConfig` exclude `deleted_at IS NOT NULL`.
- Test: `packages/lib/src/store-sites/store-sites.integration.test.ts` (extend):
  - after inserting a new `template_versions` row for the default template with a changed hero heading, then creating a store, the new store's home draft contains the changed heading
  - switching `is_default` to another template makes the next new store get that template's `template_key`

- [ ] **Step 1: Write the failing integration tests.**
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `pnpm lint && pnpm typecheck && pnpm test`. Expected: green. Also run `pnpm --filter @workspace/store-sections test classic` (the Classic seed tests stay green).
- [ ] **Step 5: Commit** `feat(store-sites): default template and template meta from DB`.

### Task 14: Admin template management lib

**Files:**
- Create: `packages/lib/src/admin/templates-studio-admin.server.ts`, exported via `@workspace/lib/admin/server`. Each write runs `assertAdminActor` and `writeAdminAudit` (`target_type = 'template'`, `seller_id = null`), then `invalidateTemplateCatalog()` after commit:
  - `createTemplate(actorId, input: { key; name; description; category }, reason)`:
    - config = one home page with empty content, `DEFAULT_TEMPLATE.config().designSystem`, no header or footer
    - `meta` = Classic's demo catalog
    - version 1 inserted and set current
    - `is_active = false` until the first publish
  - `duplicateTemplate(actorId, sourceId, newKey, reason)`: copies the current config to version 1 and `meta`; inactive
  - `saveTemplateDraft(actorId, id, config: unknown, clientVersion)`: `validateSiteConfig`, optimistic on `draft_version`, sets `draft_updated_at`. Not audited.
  - `publishTemplateVersion(actorId, id, changelog: string | null, reason)`: inserts `template_versions` (`version = max + 1`, `config = draft_config`, `published_by`), sets `current_version_id`, clears `draft_config`
  - `restoreTemplateVersionToDraft(actorId, id, versionId, reason)`
  - `deleteTemplate(actorId, id, reason)`: refuses `is_default` (error `default_template`); sets `deleted_at`, `is_active = false`
  - `getTemplateForStudio(id)`: draft or current config, `draft_version`, meta
- Modify: `updateTemplateByAdmin` refuses `is_active = false` on the default template (`default_template`). `setDefaultTemplateByAdmin` refuses deleted or inactive templates. `listTemplatesForAdmin` excludes deleted rows and adds `hasDraft`.
- Modify: `SAAS_ADMIN_ERROR_MESSAGES`. Add `default_template: "The default template can't be hidden or deleted."` and `template_key_taken: "That key is already used."`.
- Test: `packages/lib/src/admin/templates-studio.integration.test.ts`:
  - delete or hide the default → `default_template`, row unchanged
  - delete a template with a `template_installs` row → soft-deleted; `undoStoreTemplate` for that install still restores `previous_draft`
  - publish creates version N+1, and the dashboard `listStoreTemplates` returns the new config
  - stale `clientVersion` → `version_conflict`
  - a moderator is refused
  - a duplicate key → `template_key_taken`

- [ ] **Step 1: Write the failing tests.**
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `pnpm lint && pnpm typecheck && pnpm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(admin): template studio lib`.

### Task 15: Admin template editor and Templates page actions

**Files:**
- Create: `apps/admin/app/(builder)/templates/[id]/editor/{page.tsx,template-editor.server.ts,template-adapter.client.tsx,template-adapter.lib.ts,template-adapter.lib.test.ts}`
  - `template-adapter.lib.ts` (pure):
    - `siteConfigToEditorInitial(config: SiteConfig, meta: TemplateMeta, draftVersion: number): Pick<EditorInitial, "pages" | "header" | "footer" | "designSystem" | "defaultLocale" | "locales" | "catalog">`. Page ids are `page:<slug>`, every page `version` = `draftVersion`, the catalog is `meta.demo`.
    - `applyEditorChange(config, change: { kind: "page"; pageId; content } | { kind: "design"; designSystem } | { kind: "chrome"; part; instance } | { kind: "pages"; op: "create" | "update" | "remove" | "reorder"; … }): SiteConfig`
  - `template-adapter.client.tsx`: the adapter keeps the working `SiteConfig` in a ref.
    - Every save applies `applyEditorChange`, then calls `saveTemplateDraft(id, config, draftVersion)` (debounced by the editor's existing autosave), and bumps the local `draftVersion` on success.
    - Capabilities: `pages: true`, `templates: false`, `forms: false`, `explore: false`, `mediaLibrary: false`, `revisions: true` (lists template versions; restore = `restoreTemplateVersionToDraft`), `unpublish: false`, `preview: false`, `industrySwitcher: false`, `publishLabel: "templateVersion"`.
    - Publish asks for an optional changelog plus the reason.
  - Concurrency: two admins on one template get `version_conflict`, which shows the existing reload banner.
- Modify: `apps/admin/app/(dashboard)/templates/page.tsx` and `template-edit.client.tsx`:
  - Add "New template" (dialog: key, name ar/en, category, reason), "Edit design" (link to the editor), "Duplicate" and "Delete" (`ReasonActionButton`, hidden for the default).
  - Add a "Draft" badge when `hasDraft`.
  - Versions list: add "Restore to draft".
- Test: `template-adapter.lib.test.ts`:
  - `siteConfigToEditorInitial` → `applyEditorChange` for each change kind → round-trip equals the expected `SiteConfig`
  - removing the home page is refused (`home_page`)
  - a duplicate slug is refused (`slug_taken`)
  - the result passes `validateSiteConfig`

- [ ] **Step 1: Write the failing tests.**
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `pnpm lint && pnpm typecheck && pnpm test`. Expected: green.
- [ ] **Step 5: Manual E2E on staging:**
  - Edit Classic's hero and publish version N+1. A newly created store's draft has the change, and existing stores are unchanged.
  - Create a new template from blank, publish it, activate it, and confirm it shows in the seller gallery.
  - Duplicate Atelier.
  - Deleting the default is refused. Delete the duplicate: it disappears from the gallery.

  Log in §23.
- [ ] **Step 6: Commit** `feat(admin): edit and manage templates with the builder`.

## Phase F — Close-out

### Task 16: Roadmap, docs and final verification

**Files:**
- Modify: `PLAN.md`. Add a new phase "Admin website builder" with tasks matching Tasks 1–15 in §22 (checked), §23 log entries (the migrations applied to staging and production, with dates, and the manual E2E results), and notes on where the code differed from this plan.
- Modify: `PROJECT.md` (the architecture sections that name the editor location and the template/section source of truth) and `docs/website-builder.md` (editor location, adapter, library sources).

- [ ] **Step 1: Run** `pnpm lint && pnpm typecheck && pnpm test`, and with `TEST_DATABASE_URL` set, `pnpm --filter @workspace/lib test integration`. Expected: all green. Paste the summary lines into §23.
- [ ] **Step 2: Production smoke check:**
  - Admin opens one real store's editor without publishing, then exits.
  - The Sections and Templates pages load.
  - Log in §23.
- [ ] **Step 3: Commit** `docs: admin website builder in PLAN/PROJECT`.
