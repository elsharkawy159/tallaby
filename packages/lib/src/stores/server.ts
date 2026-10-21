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
  storeSettingsAudit,
  storeShippingZones,
  stores,
  sql,
} from "@workspace/db";
import {
  maskPaymentDetails,
  parseStorePayments,
  validateMethodChange,
  type MethodChange,
  type MethodChangeError,
  type StorePayments,
} from "../payments/store-methods";
import { emptyHomeContent } from "@workspace/store-sections/templates";
import { seedStarterSite } from "./starter-site.server";
import { canCreateStore } from "../plans";
import { z } from "zod";
import {
  MAX_ZONES_PER_STORE,
  SHIPPING_TEMPLATES,
  templateZones,
  type ZoneForQuote,
  findZoneOverlap,
  parseStoreShipping,
  storeShippingSettingsSchema,
  zoneInputSchema,
  type StoreShippingSettings,
} from "../shipping/store-zones";
import { TALLABY_SERVICES_ENABLED } from "../fulfillment/constants";
import { normalizeSubdomain, validateSubdomain } from "../storefront";
import {
  createStoreInputSchema,
  storeGeneralSettingsSchema,
  storeSocialLinksSchema,
  storeSeoSchema,
  subdomainCandidates,
  type StoreSocialLink,
  type CreateStoreInput,
  type StoreGeneralSettings,
  type StoreSeo,
  type StoreSeoInput,
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

/**
 * Design system row + a home page, so the editor always has something to
 * open. A store that has never been published starts from the default
 * template (the database row with `is_default`, owner 2026-10-20) in its drafts;
 * anything else gets an empty home page.
 */
export async function ensureStoreSiteScaffold(q: Queryable, storeId: string): Promise<void> {
  const [createdDesign] = await q.insert(storeDesignSystems).values({ storeId }).onConflictDoNothing().returning({ storeId: storeDesignSystems.storeId });

  const [home] = await q
    .select({ id: storePages.id })
    .from(storePages)
    .where(and(eq(storePages.storeId, storeId), eq(storePages.isHome, true)))
    .limit(1);
  if (home) return;

  const [store] = await q
    .select({
      id: stores.id,
      sellerId: stores.sellerId,
      name: stores.name,
      defaultLocale: stores.defaultLocale,
      status: stores.status,
      publishedRevisionId: stores.publishedRevisionId,
      sharedHeader: stores.sharedHeader,
      sharedFooter: stores.sharedFooter,
    })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);
  if (store && store.status === "active" && !store.publishedRevisionId) {
    // One transaction (a savepoint inside the caller's): never a claimed but empty home.
    await q.transaction((tx) => seedStarterSite(tx, store, Boolean(createdDesign)));
    return;
  }
  await q
    .insert(storePages)
    .values({ storeId, slug: "home", isHome: true, name: { ar: "الرئيسية", en: "Home" }, draftContent: emptyHomeContent() })
    .onConflictDoNothing();
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

  const { contact, currency, currencyLabel, ...fields } = parsed.data;
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
      // Other settings keys (payments, …) are kept.
      ...(currency &&
        currencyLabel && {
          settings: sql`coalesce(${stores.settings}, '{}'::jsonb) || jsonb_build_object('currency', ${currency}::text, 'currencyLabel', ${currencyLabel}::text)`,
        }),
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
 * Website › Social media (PLAN.md §8.8, P4-15): replaces `contact.social`
 * with the validated, normalized list. Set in SQL with jsonb_set, so phone,
 * WhatsApp and email in the same column are never touched.
 */
export async function updateStoreSocialLinks(
  sellerId: string,
  storeId: string,
  input: unknown,
  q: Queryable = db,
): Promise<StoreResult<{ links: StoreSocialLink[] }, StoreWriteError>> {
  const parsed = storeSocialLinksSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const store = await getStore(sellerId, storeId, q);
  if (!store) return { success: false, error: "not_found" };
  if (store.status !== "active") return { success: false, error: "store_read_only" };

  const updated = await q
    .update(stores)
    .set({
      contact: sql`jsonb_set(coalesce(${stores.contact}, '{}'::jsonb), '{social}', ${JSON.stringify(parsed.data)}::jsonb, true)`,
      updatedAt: sql`now()`,
    })
    .where(and(ownStore(sellerId, storeId), eq(stores.status, "active")))
    .returning({ id: stores.id });
  return updated.length ? { success: true, data: { links: parsed.data } } : { success: false, error: "store_read_only" };
}

/**
 * Website › Domain & SEO › SEO (P4-14). Replaces the SEO fields of
 * stores.seo with the validated form (an empty field is removed); keys the
 * form does not own are kept. Archived and suspended stores are read-only.
 */
export async function updateStoreSeo(
  sellerId: string,
  storeId: string,
  input: StoreSeoInput,
  q: Queryable = db,
): Promise<StoreResult<StoreSeo, StoreWriteError>> {
  const parsed = storeSeoSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const store = await getStore(sellerId, storeId, q);
  if (!store) return { success: false, error: "not_found" };
  if (store.status !== "active") return { success: false, error: "store_read_only" };

  const next: Record<string, unknown> = { ...(store.seo as Record<string, unknown>) };
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === null) delete next[key];
    else next[key] = value;
  }
  const updated = await q
    .update(stores)
    .set({ seo: next, updatedAt: sql`now()` })
    .where(and(ownStore(sellerId, storeId), eq(stores.status, "active")))
    .returning({ id: stores.id });
  return updated.length ? { success: true, data: parsed.data } : { success: false, error: "store_read_only" };
}

/**
 * Whether the store shows at least one product: an active product of its
 * seller, and in "selected" mode one of its picks (D24). Stores without one
 * are kept out of search (noindex, no sitemap; PLAN.md §10.3).
 */
export async function storeHasVisibleProducts(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<boolean> {
  if (!UUID_RE.test(storeId)) return false;
  const rows = await q.execute(sql`
    SELECT 1 FROM stores st
    JOIN products p ON p.seller_id = st.seller_id AND p.status = 'active'
    WHERE st.id = ${storeId} AND st.seller_id = ${sellerId}
      AND (st.catalog_mode <> 'selected'
           OR EXISTS (SELECT 1 FROM store_products sp WHERE sp.store_id = st.id AND sp.product_id = p.id))
    LIMIT 1
  `);
  return [...rows].length > 0;
}

export type StorePaymentsError = StoreWriteError | MethodChangeError;

/** The store's payment settings (defaults when none are saved). */
export async function getStorePayments(sellerId: string, storeId: string, q: Queryable = db): Promise<StorePayments | null> {
  const store = await getStore(sellerId, storeId, q);
  if (!store) return null;
  return parseStorePayments((store.settings as Record<string, unknown> | null)?.payments);
}

/**
 * Store settings › Payment methods (P3-07). Changes one method under a row
 * lock, keeps at least one method enabled, and writes a masked audit row.
 * Storefront checkout offers only the enabled methods (storefrontCheckoutMethods).
 */
export async function updateStorePaymentMethod(
  sellerId: string,
  actorId: string,
  storeId: string,
  key: string,
  change: MethodChange,
  q: Queryable = db,
): Promise<StoreResult<StorePayments, StorePaymentsError>> {
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  try {
    const data = await q.transaction(async (tx) => {
      const [store] = await tx
        .select({ settings: stores.settings, status: stores.status })
        .from(stores)
        .where(ownStore(sellerId, storeId))
        .for("update");
      if (!store) throw new StoreActionError("not_found");
      if (store.status !== "active") throw new StoreActionError("store_read_only");

      const settings = (store.settings ?? {}) as Record<string, unknown>;
      const current = parseStorePayments(settings.payments);
      const result = validateMethodChange(current, key, change);
      if (!result.success) throw new StoreActionError(result.error);

      await tx
        .update(stores)
        .set({ settings: { ...settings, payments: result.data }, updatedAt: sql`now()` })
        .where(ownStore(sellerId, storeId));

      const before = current[key as keyof StorePayments] as { enabled?: boolean } | undefined;
      const after = result.data[key as keyof StorePayments] as { enabled: boolean; details?: unknown } & Record<string, unknown>;
      const action = before?.enabled === after.enabled ? "updated" : after.enabled ? "enabled" : "disabled";
      const { details, ...rest } = after;
      await tx.insert(storeSettingsAudit).values({
        storeId,
        sellerId,
        actorId,
        section: "payments",
        action,
        changes: { method: key, ...rest, ...(details !== undefined && { details: maskPaymentDetails(details) }) },
      });
      return result.data;
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof StoreActionError) return { success: false, error: error.code as StorePaymentsError };
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Shipping (P3-08). Zones cover places; checkout quotes them (shipping/store-quote.ts).
// Tallaby's governorate rates, which are also the default seller-delivery rates.
// ---------------------------------------------------------------------------

export type StoreShippingZone = ZoneForQuote;

export type StoreShippingError = StoreWriteError | "overlap" | "too_many_zones" | "no_zones" | "tallaby_unavailable";

function toZone(row: typeof storeShippingZones.$inferSelect): StoreShippingZone {
  const name = (row.name ?? {}) as { ar?: string; en?: string };
  return {
    id: row.id,
    nameAr: name.ar ?? "",
    nameEn: name.en ?? null,
    places: row.places.length ? row.places : row.governorates.map((g) => `EG/${g}`),
    price: Number(row.price),
    freeOver: row.freeOver === null ? null : Number(row.freeOver),
    deliveryDaysMin: row.deliveryDaysMin,
    deliveryDaysMax: row.deliveryDaysMax,
    codEnabled: row.codEnabled,
    enabled: row.enabled,
  };
}

const egp = (n: number) => n.toFixed(2);

/** Settings + zones for Store settings › Shipping, or null for a foreign store. */
export async function getStoreShipping(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<{ settings: StoreShippingSettings; zones: StoreShippingZone[] } | null> {
  const store = await getStore(sellerId, storeId, q);
  if (!store) return null;
  const rows = await q
    .select()
    .from(storeShippingZones)
    .where(eq(storeShippingZones.storeId, storeId))
    .orderBy(asc(storeShippingZones.sortOrder), asc(storeShippingZones.createdAt));
  return {
    settings: parseStoreShipping((store.settings as Record<string, unknown> | null)?.shipping),
    zones: rows.map(toZone),
  };
}

async function lockActiveStore(tx: Tx, sellerId: string, storeId: string) {
  if (!UUID_RE.test(storeId)) throw new StoreActionError("not_found");
  const [store] = await tx
    .select({ settings: stores.settings, status: stores.status })
    .from(stores)
    .where(ownStore(sellerId, storeId))
    .for("update");
  if (!store) throw new StoreActionError("not_found");
  if (store.status !== "active") throw new StoreActionError("store_read_only");
  return store;
}

async function zonesOf(tx: Tx, storeId: string) {
  return (await tx.select().from(storeShippingZones).where(eq(storeShippingZones.storeId, storeId))).map(toZone);
}

function shippingFailure(error: unknown): { success: false; error: StoreShippingError } {
  if (error instanceof StoreActionError) return { success: false, error: error.code as StoreShippingError };
  if (pgErrorCode(error) === "23P01") return { success: false, error: "overlap" };
  throw error;
}

/** Creates (zoneId null) or updates one own-delivery zone. No place key may sit in two enabled zones (a city inside a covered region is fine). */
export async function saveStoreShippingZone(
  sellerId: string,
  actorId: string,
  storeId: string,
  zoneId: string | null,
  input: unknown,
  q: Queryable = db,
): Promise<StoreResult<StoreShippingZone, StoreShippingError>> {
  const parsed = zoneInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  if (zoneId !== null && !UUID_RE.test(zoneId)) return { success: false, error: "not_found" };
  const z = parsed.data;
  const values = {
    name: { ar: z.nameAr, ...(z.nameEn && { en: z.nameEn }) },
    places: z.places,
    governorates: [] as string[],
    price: egp(z.price),
    freeOver: z.freeOver === null ? null : egp(z.freeOver),
    deliveryDaysMin: z.deliveryDaysMin,
    deliveryDaysMax: z.deliveryDaysMax,
    codEnabled: z.codEnabled,
    enabled: z.enabled,
  };
  try {
    const data = await q.transaction(async (tx) => {
      await lockActiveStore(tx, sellerId, storeId);
      const existing = await zonesOf(tx, storeId);
      if (zoneId !== null && !existing.some((e) => e.id === zoneId)) throw new StoreActionError("not_found");
      if (zoneId === null && existing.length >= MAX_ZONES_PER_STORE) throw new StoreActionError("too_many_zones");
      const id = zoneId ?? "new";
      const next = [...existing.filter((e) => e.id !== id), { id, places: z.places, enabled: z.enabled }];
      if (findZoneOverlap(next)) throw new StoreActionError("overlap");
      // Own delivery no longer needs a zone (owner, 2026-10-21): an uncovered governorate uses the default (Tallaby) rate.

      const [row] =
        zoneId === null
          ? await tx
              .insert(storeShippingZones)
              .values({ storeId, sortOrder: existing.length, ...values })
              .returning()
          : await tx
              .update(storeShippingZones)
              .set({ ...values, updatedAt: sql`now()` })
              .where(and(eq(storeShippingZones.id, zoneId), eq(storeShippingZones.storeId, storeId)))
              .returning();
      await tx.insert(storeSettingsAudit).values({
        storeId,
        sellerId,
        actorId,
        section: "shipping",
        action: zoneId === null ? "zone_created" : "zone_updated",
        changes: { zoneId: row!.id, ...values },
      });
      return toZone(row!);
    });
    return { success: true, data };
  } catch (error) {
    return shippingFailure(error);
  }
}

/** Deletes one zone. */
export async function deleteStoreShippingZone(
  sellerId: string,
  actorId: string,
  storeId: string,
  zoneId: string,
  q: Queryable = db,
): Promise<StoreResult<{ id: string }, StoreShippingError>> {
  if (!UUID_RE.test(zoneId)) return { success: false, error: "not_found" };
  try {
    await q.transaction(async (tx) => {
      await lockActiveStore(tx, sellerId, storeId);
      const zones = await zonesOf(tx, storeId);
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) throw new StoreActionError("not_found");
      // The last zone may go: uncovered governorates use the default (Tallaby) rates.
      await tx.delete(storeShippingZones).where(and(eq(storeShippingZones.id, zoneId), eq(storeShippingZones.storeId, storeId)));
      await tx.insert(storeSettingsAudit).values({
        storeId,
        sellerId,
        actorId,
        section: "shipping",
        action: "zone_deleted",
        changes: { zoneId, name: { ar: zone.nameAr }, places: zone.places },
      });
    });
    return { success: true, data: { id: zoneId } };
  } catch (error) {
    return shippingFailure(error);
  }
}

/**
 * Store-level shipping settings. Own (seller) delivery is the default and needs
 * no zone; "tallaby" is refused while TALLABY_SERVICES_ENABLED is off.
 */
export async function updateStoreShippingSettings(
  sellerId: string,
  actorId: string,
  storeId: string,
  input: unknown,
  q: Queryable = db,
): Promise<StoreResult<StoreShippingSettings, StoreShippingError>> {
  const parsed = storeShippingSettingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  try {
    const data = await q.transaction(async (tx) => {
      const store = await lockActiveStore(tx, sellerId, storeId);
      const settings = (store.settings ?? {}) as Record<string, unknown>;
      const before = parseStoreShipping(settings.shipping);
      // Tallaby delivery is disabled (owner, 2026-10-21); parseStoreShipping already reads a stored "tallaby" as "own".
      if (parsed.data.method === "tallaby" && !TALLABY_SERVICES_ENABLED) {
        throw new StoreActionError("tallaby_unavailable");
      }
      await tx
        .update(stores)
        .set({ settings: { ...settings, shipping: parsed.data }, updatedAt: sql`now()` })
        .where(ownStore(sellerId, storeId));
      await tx.insert(storeSettingsAudit).values({
        storeId,
        sellerId,
        actorId,
        section: "shipping",
        action: before.method === parsed.data.method ? "settings_updated" : `method_${parsed.data.method}`,
        changes: { before, after: parsed.data },
      });
      return parsed.data;
    });
    return { success: true, data };
  } catch (error) {
    return shippingFailure(error);
  }
}

const templateInputSchema = z
  .object({
    template: z.enum(SHIPPING_TEMPLATES),
    names: z
      .array(z.object({ nameAr: z.string().trim().min(1).max(60), nameEn: z.string().trim().max(60).optional() }).strict())
      .max(MAX_ZONES_PER_STORE),
    price: z.number().optional(),
    replace: z.boolean(),
  })
  .strict();

/**
 * Saves a shipping template (`templateZones`) as the store's own delivery zones.
 * Places and prices are computed here; the client sends only the translated
 * zone names, by group index. Without `replace` only a store with no zones
 * qualifies; with it the store's zones are deleted first, in the same transaction.
 */
export async function applyStoreShippingTemplate(
  sellerId: string,
  actorId: string,
  storeId: string,
  input: unknown,
  q: Queryable = db,
): Promise<StoreResult<StoreShippingZone[], StoreShippingError | "zones_exist">> {
  const parsed = templateInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { template, names, price, replace } = parsed.data;
  const groups = templateZones(template, { price });
  if (groups.length === 0 || names.length !== groups.length) return { success: false, error: "invalid_input" };
  try {
    const data = await q.transaction(async (tx) => {
      await lockActiveStore(tx, sellerId, storeId);
      const existing = await zonesOf(tx, storeId);
      if (existing.length > 0) {
        if (!replace) throw new StoreActionError("zones_exist");
        await tx.delete(storeShippingZones).where(eq(storeShippingZones.storeId, storeId));
      }
      const rows = await tx
        .insert(storeShippingZones)
        .values(
          groups.map((g, i) => {
            const n = names[i]!;
            return {
              storeId,
              sortOrder: i,
              name: { ar: n.nameAr, ...(n.nameEn && { en: n.nameEn }) },
              places: g.places,
              governorates: [] as string[],
              price: egp(g.price),
              freeOver: null,
              deliveryDaysMin: 1,
              deliveryDaysMax: 3,
              codEnabled: true,
              enabled: true,
            };
          }),
        )
        .returning();
      await tx.insert(storeSettingsAudit).values({
        storeId,
        sellerId,
        actorId,
        section: "shipping",
        action: "template_applied",
        changes: {
          template,
          replaced: existing.length,
          zones: rows.map((r) => ({ zoneId: r.id, places: r.places, price: r.price })),
        },
      });
      return rows.sort((x, y) => x.sortOrder - y.sortOrder).map(toZone);
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof StoreActionError && error.code === "zones_exist") return { success: false, error: "zones_exist" };
    return shippingFailure(error);
  }
}

/**
 * Customer-side loader: the store's shipping settings and enabled zones by store
 * id alone. The caller passes a server-trusted id (resolved from the request host).
 */
export async function getStorefrontShippingContext(
  storeId: string,
  q: Queryable = db,
): Promise<{ settings: StoreShippingSettings; zones: StoreShippingZone[] } | null> {
  if (!UUID_RE.test(storeId)) return null;
  const [store] = await q.select({ settings: stores.settings }).from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) return null;
  const rows = await q
    .select()
    .from(storeShippingZones)
    .where(and(eq(storeShippingZones.storeId, storeId), eq(storeShippingZones.enabled, true)))
    .orderBy(asc(storeShippingZones.sortOrder), asc(storeShippingZones.createdAt));
  return {
    settings: parseStoreShipping((store.settings as Record<string, unknown> | null)?.shipping),
    zones: rows.map(toZone),
  };
}

export * from "./catalog.server";
