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
import {
  and,
  asc,
  db,
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
  type SiteConfig,
  type SiteConfigIssue,
  siteConfigSchema,
  validatePageContent,
  validateSiteConfig,
} from "@workspace/store-sections";
import { ensureStoreSiteScaffold } from "../stores/server";
import { startFeeTrialIfNeeded } from "../sellers/fee-trial.server";

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
  const store = await loadOwnStore(q, sellerId, storeId);
  if (!store) return null;
  // Backfilled stores have no design system or pages yet (0050 only creates the store row).
  if (store.status === "active") await ensureStoreSiteScaffold(q, storeId);

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
async function buildDraftSiteConfig(q: Queryable, store: NonNullable<Awaited<ReturnType<typeof loadOwnStore>>>) {
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
        .set({ sharedHeader: config.header, sharedFooter: config.footer, updatedAt: sql`now()` })
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
