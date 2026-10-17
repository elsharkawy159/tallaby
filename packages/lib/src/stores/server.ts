/**
 * Server-only data access for stores, the tenant (PLAN.md §8.0, P1-04).
 *
 * Every function takes the session's sellerId (never a client value) and
 * scopes every query by it. Missing, deleted and foreign stores all come back
 * as `not_found`. Functions accept an optional Drizzle handle (`q`) so tests
 * and callers can run them inside a transaction.
 */
import {
  and,
  asc,
  count,
  db,
  desc,
  eq,
  isNull,
  ne,
  sellerSubdomainRedirects,
  sellers,
  storeDesignSystems,
  storePages,
  stores,
  sql,
} from "@workspace/db";
import { canCreateStore } from "../plans";
import { normalizeSubdomain, validateSubdomain } from "../storefront";
import {
  createStoreInputSchema,
  storeGeneralSettingsSchema,
  storePoliciesSchema,
  subdomainCandidates,
  type CreateStoreInput,
  type StoreGeneralSettings,
  type StorePolicies,
  type StoreSubdomainStatus,
} from "./stores.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export type StoreResult<T, E extends string> = { success: true; data: T } | { success: false; error: E };

export type StoreSummary = {
  id: string;
  name: string;
  subdomain: string;
  isPrimary: boolean;
  status: string;
  logoUrl: string | null;
  siteStatus: string;
  createdAt: string;
};

export type StoreRow = typeof stores.$inferSelect;

const SUMMARY_COLUMNS = {
  id: stores.id,
  name: stores.name,
  subdomain: stores.subdomain,
  isPrimary: stores.isPrimary,
  status: stores.status,
  logoUrl: stores.logoUrl,
  siteStatus: stores.siteStatus,
  createdAt: stores.createdAt,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pgErrorCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.cause?.code ?? e?.code;
}

class StoreActionError<E extends string> extends Error {
  constructor(readonly code: E) {
    super(code);
  }
}

const ownStore = (sellerId: string, storeId: string) =>
  and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt));

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** The seller's stores (archived included, deleted excluded): primary first, then oldest. */
export async function listStores(sellerId: string, q: Queryable = db): Promise<StoreSummary[]> {
  return q
    .select(SUMMARY_COLUMNS)
    .from(stores)
    .where(and(eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .orderBy(desc(stores.isPrimary), asc(stores.createdAt));
}

export async function getStore(sellerId: string, storeId: string, q: Queryable = db): Promise<StoreRow | null> {
  if (!UUID_RE.test(storeId)) return null;
  const [row] = await q.select().from(stores).where(ownStore(sellerId, storeId)).limit(1);
  return row ?? null;
}

export async function getPrimaryStore(sellerId: string, q: Queryable = db): Promise<StoreSummary | null> {
  const [row] = await q
    .select(SUMMARY_COLUMNS)
    .from(stores)
    .where(and(eq(stores.sellerId, sellerId), eq(stores.isPrimary, true), isNull(stores.deletedAt)))
    .limit(1);
  return row ?? null;
}

/**
 * Public storefront lookup by host subdomain. Only active, non-deleted stores
 * of approved sellers resolve (today's rule for storefronts).
 */
export async function getStoreBySubdomain(subdomain: string, q: Queryable = db) {
  const [row] = await q
    .select({
      id: stores.id,
      sellerId: stores.sellerId,
      name: stores.name,
      subdomain: stores.subdomain,
      isPrimary: stores.isPrimary,
      publishedRevisionId: stores.publishedRevisionId,
      templateKey: stores.templateKey,
    })
    .from(stores)
    .innerJoin(sellers, eq(sellers.id, stores.sellerId))
    .where(
      and(
        eq(stores.subdomain, normalizeSubdomain(subdomain)),
        eq(stores.status, "active"),
        isNull(stores.deletedAt),
        eq(sellers.status, "approved"),
      ),
    )
    .limit(1);
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Subdomains
// ---------------------------------------------------------------------------

/**
 * A subdomain is taken when any other store uses it, another seller uses it
 * (legacy mirror), or it is another seller's old address (redirect). The
 * seller's own old addresses can be taken back.
 */
export async function isStoreSubdomainTaken(
  q: Queryable,
  subdomain: string,
  sellerId: string,
  exceptStoreId?: string,
): Promise<boolean> {
  const [store] = await q
    .select({ id: stores.id })
    .from(stores)
    .where(and(eq(stores.subdomain, subdomain), exceptStoreId ? ne(stores.id, exceptStoreId) : undefined))
    .limit(1);
  if (store) return true;
  const [seller] = await q
    .select({ id: sellers.id })
    .from(sellers)
    .where(and(eq(sellers.subdomain, subdomain), ne(sellers.id, sellerId)))
    .limit(1);
  if (seller) return true;
  const [redirect] = await q
    .select({ id: sellerSubdomainRedirects.sellerId })
    .from(sellerSubdomainRedirects)
    .where(and(eq(sellerSubdomainRedirects.subdomain, subdomain), ne(sellerSubdomainRedirects.sellerId, sellerId)))
    .limit(1);
  return Boolean(redirect);
}

export type SubdomainCheck = { status: StoreSubdomainStatus; subdomain: string; suggestions: string[] };

/** Shared by signup and "create store" (P2-02). `storeId`: the store being renamed, if any. */
export async function checkStoreSubdomain(
  sellerId: string,
  input: string,
  options: { storeId?: string } = {},
  q: Queryable = db,
): Promise<SubdomainCheck> {
  const subdomain = normalizeSubdomain(input);
  const problem = validateSubdomain(subdomain);
  if (problem) return { status: problem, subdomain, suggestions: [] };
  if (!(await isStoreSubdomainTaken(q, subdomain, sellerId, options.storeId))) {
    return { status: "available", subdomain, suggestions: [] };
  }
  const suggestions: string[] = [];
  for (const candidate of subdomainCandidates(subdomain)) {
    if (suggestions.length === 3) break;
    if (!(await isStoreSubdomainTaken(q, candidate, sellerId))) suggestions.push(candidate);
  }
  return { status: "taken", subdomain, suggestions };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** Design system row + an empty home page, so the editor always has something to open. */
export async function ensureStoreSiteScaffold(q: Queryable, storeId: string): Promise<void> {
  await q.insert(storeDesignSystems).values({ storeId }).onConflictDoNothing();
  const [home] = await q
    .select({ id: storePages.id })
    .from(storePages)
    .where(and(eq(storePages.storeId, storeId), eq(storePages.isHome, true)))
    .limit(1);
  if (!home) {
    await q
      .insert(storePages)
      .values({ storeId, slug: "home", isHome: true, name: { ar: "الرئيسية", en: "Home" } })
      .onConflictDoNothing();
  }
}

export type CreateStoreError = "invalid_input" | "no_seller" | "limit_reached" | "taken" | StoreSubdomainStatus;

/**
 * Creates a non-primary store. The seller row is locked while counting, so two
 * concurrent creates at the limit cannot both succeed (isolation test 11).
 * Archived stores count toward the limit, deleted ones do not (D26).
 */
export async function createStore(
  sellerId: string,
  input: CreateStoreInput,
  q: Queryable = db,
): Promise<StoreResult<StoreSummary, CreateStoreError>> {
  const parsed = createStoreInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { name, subdomain } = parsed.data;
  const problem = validateSubdomain(subdomain);
  if (problem) return { success: false, error: problem };

  try {
    const store = await q.transaction(async (tx) => {
      const [seller] = await tx
        .select({ plan: sellers.plan, maxStoresOverride: sellers.maxStoresOverride })
        .from(sellers)
        .where(eq(sellers.id, sellerId))
        .for("update");
      if (!seller) throw new StoreActionError("no_seller");

      const [{ value: current } = { value: 0 }] = await tx
        .select({ value: count() })
        .from(stores)
        .where(and(eq(stores.sellerId, sellerId), isNull(stores.deletedAt)));
      if (!canCreateStore(seller.plan, current, { maxStoresOverride: seller.maxStoresOverride })) {
        throw new StoreActionError("limit_reached");
      }

      if (await isStoreSubdomainTaken(tx, subdomain, sellerId)) throw new StoreActionError("taken");
      // Taking back one of the seller's own old addresses: it stops redirecting.
      await tx
        .delete(sellerSubdomainRedirects)
        .where(and(eq(sellerSubdomainRedirects.subdomain, subdomain), eq(sellerSubdomainRedirects.sellerId, sellerId)));

      const [created] = await tx
        .insert(stores)
        .values({ sellerId, name, subdomain, isPrimary: false })
        .returning(SUMMARY_COLUMNS);
      await ensureStoreSiteScaffold(tx, created!.id);
      return created!;
    });
    return { success: true, data: store };
  } catch (error) {
    if (error instanceof StoreActionError) return { success: false, error: error.code };
    if (pgErrorCode(error) === "23505") return { success: false, error: "taken" };
    throw error;
  }
}

export type StoreWriteError = "not_found" | "store_read_only" | "invalid_input";

/** Store settings › General. Archived and suspended stores are read-only. */
export async function updateStoreSettings(
  sellerId: string,
  storeId: string,
  patch: StoreGeneralSettings,
  q: Queryable = db,
): Promise<StoreResult<{ id: string }, StoreWriteError>> {
  const parsed = storeGeneralSettingsSchema.safeParse(patch);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const store = await getStore(sellerId, storeId, q);
  if (!store) return { success: false, error: "not_found" };
  if (store.status !== "active") return { success: false, error: "store_read_only" };

  const { contact, ...fields } = parsed.data;
  const locales = fields.supportedLocales ?? store.supportedLocales;
  const defaultLocale = fields.defaultLocale ?? store.defaultLocale;
  if (!locales.includes(defaultLocale)) return { success: false, error: "invalid_input" };

  // phone / whatsapp / email are edited together and replaced as a set (a
  // cleared field is removed); other contact keys (e.g. social links) are kept.
  let nextContact: Record<string, unknown> | undefined;
  if (contact) {
    const { phone: _p, whatsapp: _w, email: _e, ...rest } = store.contact as Record<string, unknown>;
    nextContact = { ...rest, ...contact };
  }

  const updated = await q
    .update(stores)
    .set({
      ...fields,
      ...(nextContact && { contact: nextContact }),
      updatedAt: sql`now()`,
    })
    .where(and(ownStore(sellerId, storeId), eq(stores.status, "active")))
    .returning({ id: stores.id });
  return updated.length ? { success: true, data: updated[0]! } : { success: false, error: "store_read_only" };
}

/** Archive (soft, seller-side). The primary store cannot be archived. */
export async function archiveStore(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<StoreResult<{ id: string }, "not_found" | "primary_store">> {
  const store = await getStore(sellerId, storeId, q);
  if (!store) return { success: false, error: "not_found" };
  if (store.isPrimary) return { success: false, error: "primary_store" };
  await q
    .update(stores)
    .set({ status: "archived", updatedAt: sql`now()` })
    .where(and(ownStore(sellerId, storeId), eq(stores.status, "active")));
  return { success: true, data: { id: storeId } };
}

/** Un-archive. Admin-suspended stores stay suspended. */
export async function restoreStore(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<StoreResult<{ id: string }, "not_found">> {
  const store = await getStore(sellerId, storeId, q);
  if (!store) return { success: false, error: "not_found" };
  await q
    .update(stores)
    .set({ status: "active", updatedAt: sql`now()` })
    .where(and(ownStore(sellerId, storeId), eq(stores.status, "archived")));
  return { success: true, data: { id: storeId } };
}

/**
 * Moves a store to a new subdomain. The old one becomes a redirect owned by
 * the seller (old links keep working, nobody else can claim it). For the
 * primary store, the 0050 trigger keeps sellers.subdomain in sync.
 */
export async function updateStoreSubdomain(
  sellerId: string,
  storeId: string,
  input: string,
  q: Queryable = db,
): Promise<StoreResult<{ subdomain: string; previous: string }, StoreWriteError | "taken" | StoreSubdomainStatus>> {
  const subdomain = normalizeSubdomain(input);
  const problem = validateSubdomain(subdomain);
  if (problem) return { success: false, error: problem };
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };

  try {
    const previous = await q.transaction(async (tx) => {
      const [store] = await tx
        .select({ subdomain: stores.subdomain, status: stores.status })
        .from(stores)
        .where(ownStore(sellerId, storeId))
        .for("update");
      if (!store) throw new StoreActionError("not_found");
      if (store.status !== "active") throw new StoreActionError("store_read_only");
      if (store.subdomain === subdomain) return store.subdomain;
      if (await isStoreSubdomainTaken(tx, subdomain, sellerId, storeId)) throw new StoreActionError("taken");

      await tx
        .delete(sellerSubdomainRedirects)
        .where(and(eq(sellerSubdomainRedirects.subdomain, subdomain), eq(sellerSubdomainRedirects.sellerId, sellerId)));
      await tx
        .insert(sellerSubdomainRedirects)
        .values({ subdomain: store.subdomain, sellerId, storeId })
        .onConflictDoNothing();
      await tx
        .update(stores)
        .set({ subdomain, subdomainUpdatedAt: sql`now()`, updatedAt: sql`now()` })
        .where(ownStore(sellerId, storeId));
      return store.subdomain;
    });
    return { success: true, data: { subdomain, previous } };
  } catch (error) {
    if (error instanceof StoreActionError) return { success: false, error: error.code as StoreWriteError | "taken" };
    if (pgErrorCode(error) === "23505") return { success: false, error: "taken" };
    throw error;
  }
}

/** Old addresses that still redirect to one of the seller's stores. */
export async function listStoreRedirects(sellerId: string, storeId: string, q: Queryable = db) {
  return q
    .select({ subdomain: sellerSubdomainRedirects.subdomain, createdAt: sellerSubdomainRedirects.createdAt })
    .from(sellerSubdomainRedirects)
    .where(and(eq(sellerSubdomainRedirects.sellerId, sellerId), eq(sellerSubdomainRedirects.storeId, storeId)))
    .orderBy(desc(sellerSubdomainRedirects.createdAt));
}

/**
 * Store settings › Policies. Merges into stores.policies; an empty string
 * removes that policy. For the primary store, the 0050 trigger mirrors
 * return/shipping to the sellers row the storefront still reads (until P5-00).
 */
export async function updateStorePolicies(
  sellerId: string,
  storeId: string,
  patch: StorePolicies,
  q: Queryable = db,
): Promise<StoreResult<{ id: string }, StoreWriteError>> {
  const parsed = storePoliciesSchema.safeParse(patch);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const store = await getStore(sellerId, storeId, q);
  if (!store) return { success: false, error: "not_found" };
  if (store.status !== "active") return { success: false, error: "store_read_only" };

  const next: Record<string, string> = { ...(store.policies as Record<string, string>) };
  for (const [key, value] of Object.entries(parsed.data) as [string, string][]) {
    if (value) next[key] = value;
    else delete next[key];
  }
  const updated = await q
    .update(stores)
    .set({ policies: next, updatedAt: sql`now()` })
    .where(and(ownStore(sellerId, storeId), eq(stores.status, "active")))
    .returning({ id: stores.id });
  return updated.length ? { success: true, data: updated[0]! } : { success: false, error: "store_read_only" };
}
