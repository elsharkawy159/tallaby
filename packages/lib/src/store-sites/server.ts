/**
 * Server-only website-builder storage (PLAN.md §12, P1-04).
 *
 * Drafts live in store_pages (+ stores.shared_header/footer and
 * store_design_systems). Publishing validates everything as one SiteConfig
 * (@workspace/store-sections), writes an immutable store_site_revisions row and
 * moves stores.published_revision_id in the SAME transaction, so a multi-page
 * publish is atomic. The public storefront only ever reads the published
 * revision (getPublishedStoreSite), never drafts.
 *
 * Every function takes the session's sellerId and checks store ownership.
 */
import { z } from "zod";
import {
  and,
  asc,
  db,
  desc,
  eq,
  isNull,
  max,
  sellers,
  sql,
  storeDesignSystems,
  storePages,
  storeSiteRevisions,
  stores,
} from "@workspace/db";
import {
  CURRENT_SITE_CONFIG_VERSION,
  MAX_PAGES,
  RESERVED_PAGE_SLUGS,
  designSystemSchema,
  pageSeoSchema,
  type SiteConfig,
  type SiteConfigIssue,
  siteConfigSchema,
  validatePageContent,
  validateSiteConfig,
} from "@workspace/store-sections";
import { ensureStoreSiteScaffold } from "../stores/server";
import { startFeeTrialIfNeeded } from "../sellers/fee-trial.server";
import { storeDraftKey } from "./preview-token";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export type SiteResult<T, E extends string> =
  | { success: true; data: T }
  | { success: false; error: E; issues?: SiteConfigIssue[] };

export type BuilderOptions = {
  /** Section registry (id → newest version). Arrives with P4-02; omit to skip the check. */
  allowedSections?: Readonly<Record<string, number>>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class SiteError extends Error {
  constructor(readonly code: string, readonly issues?: SiteConfigIssue[]) {
    super(code);
  }
}

async function loadOwnStore(q: Queryable, sellerId: string, storeId: string, lock = false) {
  if (!UUID_RE.test(storeId)) return null;
  const query = q
    .select({
      id: stores.id,
      status: stores.status,
      templateKey: stores.templateKey,
      defaultLocale: stores.defaultLocale,
      supportedLocales: stores.supportedLocales,
      sharedHeader: stores.sharedHeader,
      sharedFooter: stores.sharedFooter,
      chromeVersion: stores.chromeVersion,
      sellerStatus: sellers.status,
    })
    .from(stores)
    .innerJoin(sellers, eq(sellers.id, stores.sellerId))
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .limit(1);
  const [row] = lock ? await query.for("update", { of: stores }) : await query;
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

export async function getStoreForEditor(sellerId: string, storeId: string, q: Queryable = db) {
  const found = await loadOwnStore(q, sellerId, storeId);
  if (!found) return null;
  // Backfilled stores have no design system or pages yet (0050 only creates the store row).
  // The scaffold can write the header/footer and bump chrome_version, so re-read the row after it.
  let store = found;
  if (found.status === "active") {
    await ensureStoreSiteScaffold(q, storeId);
    store = (await loadOwnStore(q, sellerId, storeId)) ?? found;
  }

  const [designSystem] = await q
    .select({
      colors: storeDesignSystems.colors,
      typography: storeDesignSystems.typography,
      spacing: storeDesignSystems.spacing,
      version: storeDesignSystems.version,
    })
    .from(storeDesignSystems)
    .where(eq(storeDesignSystems.storeId, storeId));
  const pages = await q
    .select({
      id: storePages.id,
      slug: storePages.slug,
      isHome: storePages.isHome,
      name: storePages.name,
      seo: storePages.seo,
      showInNav: storePages.showInNav,
      orderIndex: storePages.orderIndex,
      draftContent: storePages.draftContent,
      draftVersion: storePages.draftVersion,
      updatedAt: storePages.updatedAt,
    })
    .from(storePages)
    .where(eq(storePages.storeId, storeId))
    .orderBy(asc(storePages.orderIndex), asc(storePages.createdAt));

  const { sellerStatus: _sellerStatus, ...rest } = store;
  return {
    store: rest,
    designSystem: designSystem ?? { colors: {}, typography: {}, spacing: {}, version: 0 },
    pages,
  };
}

/**
 * Autosave one page. Optimistic concurrency: the UPDATE only applies when the
 * stored draft_version still equals the client's; otherwise `version_conflict`
 * (the editor shows a "reload" banner).
 */
export async function saveStorePageDraft(
  sellerId: string,
  storeId: string,
  pageId: string,
  content: unknown,
  clientVersion: number,
  options: BuilderOptions = {},
  q: Queryable = db,
): Promise<SiteResult<{ draftVersion: number }, "not_found" | "store_read_only" | "invalid_content" | "version_conflict">> {
  if (!UUID_RE.test(pageId) || !Number.isInteger(clientVersion)) return { success: false, error: "not_found" };
  const store = await loadOwnStore(q, sellerId, storeId);
  if (!store) return { success: false, error: "not_found" };
  if (store.status !== "active") return { success: false, error: "store_read_only" };

  const validated = validatePageContent(content, { allowedSections: options.allowedSections });
  if (!validated.success) return { success: false, error: "invalid_content", issues: validated.issues };

  const [updated] = await q
    .update(storePages)
    .set({
      draftContent: validated.data,
      draftVersion: sql`${storePages.draftVersion} + 1`,
      updatedAt: sql`now()`,
    })
    .where(and(eq(storePages.id, pageId), eq(storePages.storeId, storeId), eq(storePages.draftVersion, clientVersion)))
    .returning({ draftVersion: storePages.draftVersion });
  if (updated) return { success: true, data: { draftVersion: updated.draftVersion } };

  const [exists] = await q
    .select({ id: storePages.id })
    .from(storePages)
    .where(and(eq(storePages.id, pageId), eq(storePages.storeId, storeId)))
    .limit(1);
  return { success: false, error: exists ? "version_conflict" : "not_found" };
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

type LocalizedName = { ar?: string; en?: string };

/** The draft SiteConfig of a store, as stored (not yet validated). */
async function buildDraftSiteConfig(
  q: Queryable,
  store: Pick<OwnStore, "id" | "defaultLocale" | "supportedLocales" | "sharedHeader" | "sharedFooter">,
) {
  const [designSystem] = await q
    .select({ colors: storeDesignSystems.colors, typography: storeDesignSystems.typography, spacing: storeDesignSystems.spacing })
    .from(storeDesignSystems)
    .where(eq(storeDesignSystems.storeId, store.id));
  const pages = await q
    .select()
    .from(storePages)
    .where(eq(storePages.storeId, store.id))
    .orderBy(asc(storePages.orderIndex), asc(storePages.createdAt));

  return {
    schemaVersion: CURRENT_SITE_CONFIG_VERSION,
    designSystem: designSystem ?? {},
    header: store.sharedHeader ?? null,
    footer: store.sharedFooter ?? null,
    settings: { defaultLocale: store.defaultLocale, locales: store.supportedLocales },
    pages: pages.map((page) => {
      const name = (page.name ?? {}) as LocalizedName;
      return {
        id: page.id,
        slug: page.slug,
        isHome: page.isHome,
        name: (name[store.defaultLocale as keyof LocalizedName] ?? name.ar ?? name.en ?? page.slug).slice(0, 80),
        showInNav: page.showInNav,
        seo: page.seo ?? {},
        content: page.draftContent,
      };
    }),
  };
}

export type PublishError = "not_found" | "store_read_only" | "publish_blocked" | "invalid_site";

/**
 * Publish all drafts as one revision (PLAN.md §12 step 5). Locks the store row
 * so two publishes cannot take the same revision number.
 * DB-dependent reference checks (product ids in the store's catalog, media
 * owned by the seller, form/CMS ids in the store) are added together with the
 * sections that use them (P4-07, P4-09, P4-10, P4-11).
 */
export async function publishStoreSite(
  sellerId: string,
  storeId: string,
  publishedBy: string,
  options: BuilderOptions = {},
  q: Queryable = db,
): Promise<SiteResult<{ revisionId: string; revisionNumber: number }, PublishError>> {
  try {
    const data = await q.transaction(async (tx) => {
      const store = await loadOwnStore(tx, sellerId, storeId, true);
      if (!store) throw new SiteError("not_found");
      if (store.status !== "active") throw new SiteError("store_read_only");
      if (store.sellerStatus !== "approved") throw new SiteError("publish_blocked");

      const raw = await buildDraftSiteConfig(tx, store);
      const validated = validateSiteConfig(raw, { allowedSections: options.allowedSections });
      if (!validated.success) throw new SiteError("invalid_site", validated.issues);

      const [{ last } = { last: 0 }] = await tx
        .select({ last: max(storeSiteRevisions.revisionNumber) })
        .from(storeSiteRevisions)
        .where(eq(storeSiteRevisions.storeId, storeId));
      const revisionNumber = (last ?? 0) + 1;

      const [revision] = await tx
        .insert(storeSiteRevisions)
        .values({
          storeId,
          revisionNumber,
          schemaVersion: validated.data.schemaVersion,
          templateKey: store.templateKey,
          snapshot: validated.data,
          publishedBy,
        })
        .returning({ id: storeSiteRevisions.id });

      await tx
        .update(stores)
        .set({
          publishedRevisionId: revision!.id,
          siteStatus: "published",
          lastPublishedAt: sql`now()`,
          firstPublishedAt: sql`COALESCE(${stores.firstPublishedAt}, now())`,
          updatedAt: sql`now()`,
        })
        .where(eq(stores.id, storeId));

      // The first publish can start the seller's fee trial (D20).
      await startFeeTrialIfNeeded(tx, sellerId, "publish");
      return { revisionId: revision!.id, revisionNumber };
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof SiteError) {
      return { success: false, error: error.code as PublishError, ...(error.issues && { issues: error.issues }) };
    }
    throw error;
  }
}

/**
 * Copies an old revision into the drafts (pages, design system, header,
 * footer). The live site does not change until the seller publishes again.
 * Draft pages that are not in the revision are kept, never deleted.
 */
export async function restoreRevisionToDraft(
  sellerId: string,
  storeId: string,
  revisionId: string,
  q: Queryable = db,
): Promise<SiteResult<{ pages: number }, "not_found" | "store_read_only" | "invalid_site">> {
  if (!UUID_RE.test(revisionId)) return { success: false, error: "not_found" };
  try {
    const pages = await q.transaction(async (tx) => {
      const store = await loadOwnStore(tx, sellerId, storeId, true);
      if (!store) throw new SiteError("not_found");
      if (store.status !== "active") throw new SiteError("store_read_only");

      const [revision] = await tx
        .select({ snapshot: storeSiteRevisions.snapshot })
        .from(storeSiteRevisions)
        .where(and(eq(storeSiteRevisions.id, revisionId), eq(storeSiteRevisions.storeId, storeId)))
        .limit(1);
      if (!revision) throw new SiteError("not_found");
      const parsed = siteConfigSchema.safeParse(revision.snapshot);
      if (!parsed.success) throw new SiteError("invalid_site");
      const config = parsed.data;

      await tx
        .update(storeDesignSystems)
        .set({ ...config.designSystem, version: sql`${storeDesignSystems.version} + 1`, updatedAt: sql`now()` })
        .where(eq(storeDesignSystems.storeId, storeId));
      await tx
        .update(stores)
        .set({
          sharedHeader: config.header,
          sharedFooter: config.footer,
          chromeVersion: sql`${stores.chromeVersion} + 1`,
          updatedAt: sql`now()`,
        })
        .where(eq(stores.id, storeId));

      for (const [index, page] of config.pages.entries()) {
        const [existing] = await tx
          .select({ id: storePages.id, isHome: storePages.isHome })
          .from(storePages)
          .where(and(eq(storePages.storeId, storeId), eq(storePages.slug, page.slug)))
          .limit(1);
        if (existing) {
          await tx
            .update(storePages)
            .set({
              draftContent: page.content,
              seo: page.seo,
              draftVersion: sql`${storePages.draftVersion} + 1`,
              updatedAt: sql`now()`,
            })
            .where(eq(storePages.id, existing.id));
        } else {
          await tx.insert(storePages).values({
            storeId,
            slug: page.slug,
            // Keep the one-home-page rule: a restored home page only lands on a free slot.
            isHome: false,
            name: { [store.defaultLocale]: page.name },
            seo: page.seo,
            showInNav: page.showInNav ?? true,
            orderIndex: index,
            draftContent: page.content,
          });
        }
      }
      return config.pages.length;
    });
    return { success: true, data: { pages } };
  } catch (error) {
    if (error instanceof SiteError) return { success: false, error: error.code as "not_found" | "invalid_site" };
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

/**
 * The published SiteConfig for the storefront, or null when the store has
 * never published (the storefront then renders the legacy Tallaby Classic
 * path). Only active stores of approved sellers.
 */
export async function getPublishedStoreSite(storeId: string, q: Queryable = db): Promise<SiteConfig | null> {
  if (!UUID_RE.test(storeId)) return null;
  const [row] = await q
    .select({ snapshot: storeSiteRevisions.snapshot })
    .from(stores)
    .innerJoin(sellers, eq(sellers.id, stores.sellerId))
    .innerJoin(storeSiteRevisions, eq(storeSiteRevisions.id, stores.publishedRevisionId))
    .where(
      and(eq(stores.id, storeId), eq(stores.status, "active"), isNull(stores.deletedAt), eq(sellers.status, "approved")),
    )
    .limit(1);
  if (!row) return null;
  const parsed = siteConfigSchema.safeParse(row.snapshot);
  return parsed.success ? parsed.data : null;
}

// ---------------------------------------------------------------------------
// Preview on the store host (PLAN.md P4-08)
// ---------------------------------------------------------------------------

/**
 * Fingerprint of the store's current draft, for a preview token. Owner-checked;
 * null for a missing, foreign or archived store.
 */
export async function getStoreDraftKey(sellerId: string, storeId: string, q: Queryable = db): Promise<string | null> {
  const store = await loadOwnStore(q, sellerId, storeId);
  if (!store || store.status !== "active") return null;
  await ensureStoreSiteScaffold(q, storeId);
  return storeDraftKey(await buildDraftSiteConfig(q, store));
}

export type StoreDraftPreview =
  | { success: true; site: SiteConfig }
  | { success: false; error: "not_found" | "draft_changed" | "invalid_site" };

/**
 * The DRAFT site of a store, for a verified preview token only. `storeId` must
 * be the store of the request host and `draftKey` the one the token carries:
 * when the drafts changed since the token was issued, nothing is returned.
 * Never cache the result (PLAN.md §10.5).
 */
export async function getStoreDraftSiteForPreview(
  storeId: string,
  draftKey: string,
  options: BuilderOptions = {},
  q: Queryable = db,
): Promise<StoreDraftPreview> {
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  const [store] = await q
    .select({
      id: stores.id,
      defaultLocale: stores.defaultLocale,
      supportedLocales: stores.supportedLocales,
      sharedHeader: stores.sharedHeader,
      sharedFooter: stores.sharedFooter,
    })
    .from(stores)
    .innerJoin(sellers, eq(sellers.id, stores.sellerId))
    .where(
      and(eq(stores.id, storeId), eq(stores.status, "active"), isNull(stores.deletedAt), eq(sellers.status, "approved")),
    )
    .limit(1);
  if (!store) return { success: false, error: "not_found" };

  const raw = await buildDraftSiteConfig(q, store);
  if (storeDraftKey(raw) !== draftKey) return { success: false, error: "draft_changed" };
  const validated = validateSiteConfig(raw, { allowedSections: options.allowedSections });
  return validated.success ? { success: true, site: validated.data } : { success: false, error: "invalid_site" };
}

// ---------------------------------------------------------------------------
// Builder: design system, header/footer, pages, revisions (PLAN.md P4-04)
// ---------------------------------------------------------------------------

const PAGE_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

const pageNameSchema = z.object({
  ar: z.string().trim().max(80).optional(),
  en: z.string().trim().max(80).optional(),
});

function checkPageSlug(slug: string): "invalid_slug" | "reserved_slug" | null {
  if (!PAGE_SLUG_RE.test(slug)) return "invalid_slug";
  if ((RESERVED_PAGE_SLUGS as readonly string[]).includes(slug)) return "reserved_slug";
  return null;
}

function pgCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.cause?.code ?? e?.code;
}

type WriteError = "not_found" | "store_read_only";

type OwnStore = NonNullable<Awaited<ReturnType<typeof loadOwnStore>>>;

async function writableStore(
  q: Queryable,
  sellerId: string,
  storeId: string,
  lock = false,
): Promise<{ error: WriteError } | { store: OwnStore }> {
  const store = await loadOwnStore(q, sellerId, storeId, lock);
  if (!store) return { error: "not_found" as const };
  if (store.status !== "active") return { error: "store_read_only" as const };
  return { store };
}

/** Theme tokens (draft; live on publish). Optimistic concurrency on `version`. */
export async function saveStoreDesignSystem(
  sellerId: string,
  storeId: string,
  input: unknown,
  clientVersion: number,
  q: Queryable = db,
): Promise<SiteResult<{ version: number }, WriteError | "invalid_content" | "version_conflict">> {
  const found = await writableStore(q, sellerId, storeId);
  if ("error" in found) return { success: false, error: found.error };
  const parsed = designSystemSchema.safeParse(input);
  if (!parsed.success || !Number.isInteger(clientVersion)) return { success: false, error: "invalid_content" };
  await ensureStoreSiteScaffold(q, storeId);
  const [row] = await q
    .update(storeDesignSystems)
    .set({ ...parsed.data, version: sql`${storeDesignSystems.version} + 1`, updatedAt: sql`now()` })
    .where(and(eq(storeDesignSystems.storeId, storeId), eq(storeDesignSystems.version, clientVersion)))
    .returning({ version: storeDesignSystems.version });
  return row ? { success: true, data: { version: row.version } } : { success: false, error: "version_conflict" };
}

/**
 * The shared header or footer (null removes it). Validated like page content.
 * Optimistic concurrency on `stores.chrome_version` (one counter for both
 * parts): the UPDATE only applies while it still equals the client's.
 */
export async function saveStoreChrome(
  sellerId: string,
  storeId: string,
  part: "header" | "footer",
  instance: unknown,
  clientVersion: number,
  options: BuilderOptions = {},
  q: Queryable = db,
): Promise<SiteResult<{ version: number }, WriteError | "invalid_content" | "version_conflict">> {
  if (part !== "header" && part !== "footer") return { success: false, error: "invalid_content" };
  if (!Number.isInteger(clientVersion)) return { success: false, error: "invalid_content" };
  const found = await writableStore(q, sellerId, storeId);
  if ("error" in found) return { success: false, error: found.error };
  let value: unknown = null;
  if (instance !== null) {
    const validated = validatePageContent({ sections: [instance] }, { allowedSections: options.allowedSections });
    if (!validated.success) return { success: false, error: "invalid_content", issues: validated.issues };
    if (validated.data.sections.length !== 1) return { success: false, error: "invalid_content" };
    value = validated.data.sections[0];
  }
  const bump = { chromeVersion: sql`${stores.chromeVersion} + 1`, updatedAt: sql`now()` };
  const [row] = await q
    .update(stores)
    .set(part === "header" ? { sharedHeader: value, ...bump } : { sharedFooter: value, ...bump })
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), eq(stores.chromeVersion, clientVersion)))
    .returning({ version: stores.chromeVersion });
  return row ? { success: true, data: { version: row.version } } : { success: false, error: "version_conflict" };
}

export type PageWriteError = WriteError | "invalid_input" | "invalid_slug" | "reserved_slug" | "slug_taken" | "too_many_pages";

/** A new, empty page at the end of the menu. */
export async function createStorePage(
  sellerId: string,
  storeId: string,
  input: { name: unknown; slug: unknown },
  q: Queryable = db,
): Promise<SiteResult<{ id: string; slug: string }, PageWriteError>> {
  const name = pageNameSchema.safeParse(input?.name);
  const slug = typeof input?.slug === "string" ? input.slug.trim().toLowerCase() : "";
  if (!name.success || !(name.data.ar || name.data.en)) return { success: false, error: "invalid_input" };
  const slugProblem = checkPageSlug(slug);
  if (slugProblem) return { success: false, error: slugProblem };
  try {
    const row = await q.transaction(async (tx) => {
      const found = await writableStore(tx, sellerId, storeId, true);
      if ("error" in found) throw new SiteError(found.error);
      const [stats] = await tx
        .select({ count: sql<number>`count(*)::int`, last: sql<number>`coalesce(max(${storePages.orderIndex}), 0)::int` })
        .from(storePages)
        .where(eq(storePages.storeId, storeId));
      if ((stats?.count ?? 0) >= MAX_PAGES) throw new SiteError("too_many_pages");
      const [created] = await tx
        .insert(storePages)
        .values({ storeId, slug, name: name.data, orderIndex: (stats?.last ?? 0) + 1 })
        .returning({ id: storePages.id, slug: storePages.slug });
      return created!;
    });
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof SiteError) return { success: false, error: error.code as PageWriteError };
    if (pgCode(error) === "23505") return { success: false, error: "slug_taken" };
    throw error;
  }
}

/** Rename, re-slug, SEO and menu visibility of a page. The home page keeps its slug. */
export async function updateStorePage(
  sellerId: string,
  storeId: string,
  pageId: string,
  input: { name?: unknown; slug?: unknown; seo?: unknown; showInNav?: unknown },
  q: Queryable = db,
): Promise<SiteResult<null, PageWriteError>> {
  if (!UUID_RE.test(pageId)) return { success: false, error: "not_found" };
  const found = await writableStore(q, sellerId, storeId);
  if ("error" in found) return { success: false, error: found.error };

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = pageNameSchema.safeParse(input.name);
    if (!name.success || !(name.data.ar || name.data.en)) return { success: false, error: "invalid_input" };
    patch.name = name.data;
  }
  if (input.seo !== undefined) {
    const seo = pageSeoSchema.safeParse(input.seo);
    if (!seo.success) return { success: false, error: "invalid_input" };
    patch.seo = seo.data;
  }
  if (input.showInNav !== undefined) {
    if (typeof input.showInNav !== "boolean") return { success: false, error: "invalid_input" };
    patch.showInNav = input.showInNav;
  }
  let slug: string | undefined;
  if (input.slug !== undefined) {
    slug = typeof input.slug === "string" ? input.slug.trim().toLowerCase() : "";
    const slugProblem = checkPageSlug(slug);
    if (slugProblem) return { success: false, error: slugProblem };
  }

  try {
    const [page] = await q
      .select({ isHome: storePages.isHome })
      .from(storePages)
      .where(and(eq(storePages.id, pageId), eq(storePages.storeId, storeId)));
    if (!page) return { success: false, error: "not_found" };
    if (slug !== undefined && !page.isHome) patch.slug = slug;
    if (Object.keys(patch).length === 0) return { success: true, data: null };
    await q
      .update(storePages)
      .set({ ...patch, updatedAt: sql`now()` })
      .where(and(eq(storePages.id, pageId), eq(storePages.storeId, storeId)));
    return { success: true, data: null };
  } catch (error) {
    if (pgCode(error) === "23505") return { success: false, error: "slug_taken" };
    throw error;
  }
}

/** Deletes a draft page (it leaves the live site at the next publish). Never the home page. */
export async function deleteStorePage(
  sellerId: string,
  storeId: string,
  pageId: string,
  q: Queryable = db,
): Promise<SiteResult<null, WriteError | "home_page">> {
  if (!UUID_RE.test(pageId)) return { success: false, error: "not_found" };
  const found = await writableStore(q, sellerId, storeId);
  if ("error" in found) return { success: false, error: found.error };
  const [page] = await q
    .select({ isHome: storePages.isHome })
    .from(storePages)
    .where(and(eq(storePages.id, pageId), eq(storePages.storeId, storeId)));
  if (!page) return { success: false, error: "not_found" };
  if (page.isHome) return { success: false, error: "home_page" };
  await q.delete(storePages).where(and(eq(storePages.id, pageId), eq(storePages.storeId, storeId)));
  return { success: true, data: null };
}

/** New menu order; `pageIds` must be exactly this store's pages. */
export async function reorderStorePages(
  sellerId: string,
  storeId: string,
  pageIds: unknown,
  q: Queryable = db,
): Promise<SiteResult<null, WriteError | "invalid_input">> {
  if (!Array.isArray(pageIds) || pageIds.some((id) => typeof id !== "string" || !UUID_RE.test(id))) {
    return { success: false, error: "invalid_input" };
  }
  const ids = pageIds as string[];
  try {
    await q.transaction(async (tx) => {
      const found = await writableStore(tx, sellerId, storeId, true);
      if ("error" in found) throw new SiteError(found.error);
      const pages = await tx.select({ id: storePages.id }).from(storePages).where(eq(storePages.storeId, storeId));
      const own = new Set(pages.map((p) => p.id));
      if (ids.length !== own.size || new Set(ids).size !== own.size || ids.some((id) => !own.has(id))) {
        throw new SiteError("invalid_input");
      }
      for (const [index, id] of ids.entries()) {
        await tx.update(storePages).set({ orderIndex: index }).where(and(eq(storePages.id, id), eq(storePages.storeId, storeId)));
      }
    });
    return { success: true, data: null };
  } catch (error) {
    if (error instanceof SiteError) return { success: false, error: error.code as WriteError | "invalid_input" };
    throw error;
  }
}

/**
 * Takes the store's website offline (`site_status` 'unpublished'): every
 * storefront route of the store shows a "store unavailable" page (noindex)
 * and the store takes no orders until it is published again. Drafts and
 * revisions are kept; marketplace listings are unaffected. Only a
 * never-published store ('draft') falls back to the Tallaby Classic page.
 */
export async function unpublishStoreSite(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<SiteResult<null, WriteError | "not_published">> {
  const found = await writableStore(q, sellerId, storeId);
  if ("error" in found) return { success: false, error: found.error };
  const updated = await q
    .update(stores)
    .set({ publishedRevisionId: null, siteStatus: "unpublished", updatedAt: sql`now()` })
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), sql`${stores.publishedRevisionId} IS NOT NULL`))
    .returning({ id: stores.id });
  return updated.length ? { success: true, data: null } : { success: false, error: "not_published" };
}

/** Throws away unpublished changes: drafts become the live revision again. */
export async function discardStoreDrafts(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<SiteResult<{ pages: number }, WriteError | "not_published" | "invalid_site">> {
  const store = await loadOwnStore(q, sellerId, storeId);
  if (!store) return { success: false, error: "not_found" };
  const [row] = await q.select({ revisionId: stores.publishedRevisionId }).from(stores).where(eq(stores.id, storeId));
  if (!row?.revisionId) return { success: false, error: "not_published" };
  return restoreRevisionToDraft(sellerId, storeId, row.revisionId, q);
}

export type StoreRevisionRow = {
  id: string;
  revisionNumber: number;
  createdAt: string;
  publishedBy: string | null;
  isLive: boolean;
};

/** Newest first. */
export async function listStoreRevisions(
  sellerId: string,
  storeId: string,
  limit = 20,
  q: Queryable = db,
): Promise<StoreRevisionRow[] | null> {
  const store = await loadOwnStore(q, sellerId, storeId);
  if (!store) return null;
  const [live] = await q.select({ id: stores.publishedRevisionId }).from(stores).where(eq(stores.id, storeId));
  const rows = await q
    .select({
      id: storeSiteRevisions.id,
      revisionNumber: storeSiteRevisions.revisionNumber,
      createdAt: storeSiteRevisions.createdAt,
      publishedBy: storeSiteRevisions.publishedBy,
    })
    .from(storeSiteRevisions)
    .where(eq(storeSiteRevisions.storeId, storeId))
    .orderBy(desc(storeSiteRevisions.revisionNumber))
    .limit(Math.min(Math.max(limit, 1), 100));
  return rows.map((row) => ({ ...row, isLive: row.id === live?.id }));
}

/** JSON with sorted object keys, for comparing configs. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * Publish state for the editor and the Website overview. "Unpublished
 * changes" compares the validated drafts with the live revision, so store
 * settings changes (which also touch the stores row) never count.
 */
export async function getStoreSiteStatus(sellerId: string, storeId: string, q: Queryable = db) {
  const store = await loadOwnStore(q, sellerId, storeId);
  if (!store) return null;
  const [row] = await q
    .select({
      siteStatus: stores.siteStatus,
      lastPublishedAt: stores.lastPublishedAt,
      snapshot: storeSiteRevisions.snapshot,
    })
    .from(stores)
    .leftJoin(storeSiteRevisions, eq(storeSiteRevisions.id, stores.publishedRevisionId))
    .where(eq(stores.id, storeId));

  const draft = validateSiteConfig(await buildDraftSiteConfig(q, store));
  const live = row?.snapshot ? siteConfigSchema.safeParse(row.snapshot) : null;
  const hasUnpublishedChanges =
    !live?.success || !draft.success || stableStringify(draft.data) !== stableStringify(live.data);

  return {
    siteStatus: row!.siteStatus as "draft" | "published" | "unpublished",
    isLive: Boolean(row?.snapshot),
    lastPublishedAt: row!.lastPublishedAt,
    hasUnpublishedChanges,
  };
}

/**
 * Versions of the saved drafts, so an open editor can notice edits made
 * elsewhere (another tab, or an admin editing at the seller's request).
 * Pages are keyed by page id; `editedByAdminAt` is an ISO string or null.
 */
export async function getStoreDraftVersions(sellerId: string, storeId: string, q: Queryable = db) {
  const store = await loadOwnStore(q, sellerId, storeId);
  if (!store) return null;
  const [pageRows, [design], [meta]] = await Promise.all([
    q.select({ id: storePages.id, version: storePages.draftVersion }).from(storePages).where(eq(storePages.storeId, storeId)),
    q.select({ version: storeDesignSystems.version }).from(storeDesignSystems).where(eq(storeDesignSystems.storeId, storeId)),
    q.select({ editedByAdminAt: stores.siteEditedByAdminAt }).from(stores).where(eq(stores.id, storeId)),
  ]);
  return {
    pages: Object.fromEntries(pageRows.map((p) => [p.id, p.version])) as Record<string, number>,
    designVersion: design?.version ?? 0,
    chromeVersion: store.chromeVersion,
    editedByAdminAt: meta?.editedByAdminAt ? new Date(meta.editedByAdminAt).toISOString() : null,
  };
}

// Templates gallery and apply (P4-05).
export * from "./templates.server";
