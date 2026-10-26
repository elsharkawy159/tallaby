// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// /**
//  * One-off backfill: gives an existing store the template's product page
//  * (spec 2026-10-23-template-product-page-design.md §8). Run by
//  * `packages/lib/scripts/backfill-product-pages.ts`; new stores get the page
//  * through `seedStarterSite` and template applies through `mergeTemplateIntoDraft`.
//  *
//  * For one store, in one transaction (the store row is locked):
//  * 1. skip when the store already has a product page or its `product` slug is taken by a normal page;
//  * 2. pick the template page: the DB template of `stores.template_key` (not soft-deleted), else the
//  *    DB default template, else the code default (`DEFAULT_TEMPLATE`);
//  * 3. fit it to the store like "Use template" does (`prepareTemplateForStore`: language, name);
//  * 4. insert it as a `store_pages` draft row (`kind = 'product'`, not in the nav);
//  * 5. when the store has a live revision, insert a NEW revision (revisions are append-only, 0051 trigger
//  *    `store_site_revisions_immutable`): its snapshot is the live snapshot plus the same page, with the
//  *    live revision's schema_version and template_key, revision_number = max + 1 (under the store lock),
//  *    published_by NULL (not a publish by the seller); then point `stores.published_revision_id` at it.
//  *    The old revision is not changed, and the seller's other drafts stay drafts (the new snapshot is
//  *    built from the live one, never from the drafts). The whole snapshot is re-validated first; when
//  *    it is invalid the store is skipped.
//  *
//  * Idempotent: a store with a product page is skipped. Cache invalidation is the caller's job after
//  * commit (`publishedUpdated` says whether the live site changed). Server-only; no money or ledger.
//  */
// import { randomUUID } from "node:crypto";
// import { and, asc, db, eq, isNull, max, storePages, storeSiteRevisions, stores, templateVersions, templates } from "@workspace/db";
// import { expandTemplateConfig } from "./template-refs.server";
// import { productPageOf, validateSiteConfig, PRODUCT_PAGE_SLUG, type SiteConfig } from "@workspace/store-sections";
// import { DEFAULT_TEMPLATE, prepareTemplateForStore, resolveTemplateMeta, templateEssentials, templateMeta, type TemplateMeta } from "@workspace/store-sections/templates";
// import { loadDefaultTemplate } from "./template-rows.server";
//
// type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
// type Queryable = Tx | typeof db;
//
// export type BackfillOutcome = {
//   result: "added" | "skipped";
//   /** Why: "added", "added (draft only)", or the skip reason. */
//   reason: string;
//   /** Template the page came from; null when the store was skipped before choosing. */
//   templateKey: string | null;
//   /** True when a new live revision was (in a dry run: would be) published; the caller busts the published-site cache. */
//   publishedUpdated: boolean;
//   /** Number of the new live revision; null when the store has no live revision or was skipped. */
//   revisionNumber: number | null;
//   sellerId: string | null;
//   subdomain: string | null;
// };
//
// type Source = { key: string; config: SiteConfig; meta: TemplateMeta };
//
// const skipped = (reason: string, extra: Partial<BackfillOutcome> = {}): BackfillOutcome => ({
//   result: "skipped",
//   reason,
//   templateKey: null,
//   publishedUpdated: false,
//   revisionNumber: null,
//   sellerId: null,
//   subdomain: null,
//   ...extra,
// });
//
// /** The store's own template's current config, when it exists, is not soft-deleted and has a product page. */
// async function ownTemplate(q: Queryable, key: string): Promise<Source | null> {
//   const [row] = await q
//     .select({ meta: templates.meta, category: templates.category, config: templateVersions.config })
//     .from(templates)
//     .innerJoin(templateVersions, eq(templateVersions.id, templates.currentVersionId))
//     .where(and(eq(templates.key, key), isNull(templates.deletedAt)))
//     .limit(1);
//   if (!row) return null;
//   const config = validateSiteConfig(await expandTemplateConfig(row.config, row.category, q));
//   if (!config.success || !productPageOf(config.data)) return null;
//   return { key, config: config.data, meta: resolveTemplateMeta(row.meta, key) };
// }
//
// /** Store's template, else the DB default, else the code default. */
// async function pickTemplate(q: Queryable, templateKey: string): Promise<Source> {
//   const own = await ownTemplate(q, templateKey);
//   if (own) return own;
//   const fallback = await loadDefaultTemplate(q);
//   if (fallback && productPageOf(fallback.config)) return fallback;
//   return { key: DEFAULT_TEMPLATE.key, config: DEFAULT_TEMPLATE.config(), meta: templateMeta(DEFAULT_TEMPLATE) };
// }
//
// /**
//  * Backfills one store. `dryRun` does every read, build and validation but writes nothing.
//  * Throws only on unexpected database errors; expected problems come back as `skipped`.
//  */
// export async function backfillStoreProductPageDetailed(q: Queryable, storeId: string, options: { dryRun?: boolean } = {}): Promise<BackfillOutcome> {
//   return q.transaction(async (tx) => {
//     const lock = options.dryRun ? undefined : "update";
//     const base = tx
//       .select({
//         id: stores.id,
//         sellerId: stores.sellerId,
//         subdomain: stores.subdomain,
//         name: stores.name,
//         defaultLocale: stores.defaultLocale,
//         templateKey: stores.templateKey,
//         publishedRevisionId: stores.publishedRevisionId,
//       })
//       .from(stores)
//       .where(and(eq(stores.id, storeId), isNull(stores.deletedAt)))
//       .limit(1);
//     const [store] = lock ? await base.for("update") : await base;
//     if (!store) return skipped("store not found");
//     const who = { sellerId: store.sellerId, subdomain: store.subdomain };
//
//     const existing = await tx
//       .select({ slug: storePages.slug, kind: storePages.kind })
//       .from(storePages)
//       .where(eq(storePages.storeId, storeId));
//     if (existing.some((p) => p.kind === "product")) return skipped("already has a product page", who);
//     if (existing.some((p) => p.slug === PRODUCT_PAGE_SLUG)) return skipped(`slug "${PRODUCT_PAGE_SLUG}" is used by a normal page`, who);
//
//     const template = await pickTemplate(tx, store.templateKey);
//     const locale = store.defaultLocale === "en" ? "en" : "ar";
//     const fitted = productPageOf(prepareTemplateForStore(templateEssentials(template.config), { defaultLocale: locale, storeName: store.name, formIds: {} }));
//     if (!fitted) return skipped(`template ${template.key} has no product page`, { ...who, templateKey: template.key });
//     const pageId = randomUUID();
//     // Same name rule as seedStarterSite for the row, and the snapshot gets what buildDraftSiteConfig
//     // would read back from that row, so the live snapshot equals the drafts (no false "unpublished changes").
//     const rowName: Record<string, string> = template.meta.pageNames.product ?? { [locale]: fitted.name };
//     const snapshotName = (rowName[store.defaultLocale] ?? rowName.ar ?? rowName.en ?? PRODUCT_PAGE_SLUG).slice(0, 80);
//     const page = { ...fitted, id: pageId, name: snapshotName, slug: PRODUCT_PAGE_SLUG, kind: "product" as const, isHome: false, showInNav: false };
//
//     // The live snapshot, when the store has one: validated whole with the page appended, before any write.
//     let nextRevision: { revisionNumber: number; schemaVersion: number; templateKey: string; snapshot: SiteConfig } | null = null;
//     if (store.publishedRevisionId) {
//       const [revision] = await tx
//         .select({
//           snapshot: storeSiteRevisions.snapshot,
//           schemaVersion: storeSiteRevisions.schemaVersion,
//           templateKey: storeSiteRevisions.templateKey,
//         })
//         .from(storeSiteRevisions)
//         .where(and(eq(storeSiteRevisions.id, store.publishedRevisionId), eq(storeSiteRevisions.storeId, storeId)))
//         .limit(1);
//       if (revision) {
//         // No `allowedSections`: that registry lives in the render layer, which this server module does
//         // not import. The page's sections come from a template that passed validateSiteConfig, and
//         // the live ones were validated when they were published.
//         const live = validateSiteConfig(revision.snapshot);
//         if (!live.success) return skipped("live snapshot is invalid before the change", { ...who, templateKey: template.key });
//         if (productPageOf(live.data) || live.data.pages.some((p) => p.slug === PRODUCT_PAGE_SLUG)) {
//           return skipped("live snapshot already has a page at /product", { ...who, templateKey: template.key });
//         }
//         const next = validateSiteConfig({ ...live.data, pages: [...live.data.pages, page] });
//         if (!next.success) return skipped("live snapshot invalid with the product page", { ...who, templateKey: template.key });
//         // Same numbering as publishStoreSite; in apply mode the store row lock serialises it with publishes.
//         const [{ last } = { last: 0 }] = await tx
//           .select({ last: max(storeSiteRevisions.revisionNumber) })
//           .from(storeSiteRevisions)
//           .where(eq(storeSiteRevisions.storeId, storeId));
//         nextRevision = {
//           revisionNumber: (last ?? 0) + 1,
//           schemaVersion: revision.schemaVersion,
//           templateKey: revision.templateKey,
//           snapshot: next.data,
//         };
//       }
//     }
//
//     if (!options.dryRun) {
//       const [{ last } = { last: 0 }] = await tx.select({ last: max(storePages.orderIndex) }).from(storePages).where(eq(storePages.storeId, storeId));
//       const inserted = await tx
//         .insert(storePages)
//         .values({
//           id: pageId,
//           storeId,
//           slug: PRODUCT_PAGE_SLUG,
//           isHome: false,
//           kind: "product",
//           name: rowName,
//           seo: page.seo,
//           showInNav: false,
//           orderIndex: (last ?? 0) + 1,
//           draftContent: page.content,
//         })
//         .onConflictDoNothing()
//         .returning({ id: storePages.id });
//       if (!inserted.length) return skipped("a product page was added concurrently", { ...who, templateKey: template.key });
//       if (nextRevision) {
//         const [revision] = await tx
//           .insert(storeSiteRevisions)
//           .values({ storeId, ...nextRevision, publishedBy: null })
//           .returning({ id: storeSiteRevisions.id });
//         await tx.update(stores).set({ publishedRevisionId: revision!.id }).where(eq(stores.id, storeId));
//       }
//     }
//
//     return {
//       result: "added",
//       reason: nextRevision ? `added (draft and new live revision #${nextRevision.revisionNumber})` : "added (draft only)",
//       templateKey: template.key,
//       publishedUpdated: Boolean(nextRevision),
//       revisionNumber: nextRevision?.revisionNumber ?? null,
//       ...who,
//     };
//   });
// }
//
// /** Backfills one store; "added" or "skipped" (use the detailed form for the reason). */
// export async function backfillStoreProductPage(q: Queryable, storeId: string): Promise<"added" | "skipped"> {
//   return (await backfillStoreProductPageDetailed(q, storeId)).result;
// }
//
// /** Ids of the stores to backfill: every store that is not soft-deleted, oldest first. */
// export async function listBackfillStoreIds(q: Queryable): Promise<string[]> {
//   const rows = await q.select({ id: stores.id }).from(stores).where(isNull(stores.deletedAt)).orderBy(asc(stores.createdAt));
//   return rows.map((r) => r.id);
// }
//
