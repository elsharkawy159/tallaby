/**
 * Admin read models for stores across all sellers (docs/admin-saas.md §3.3).
 * Every per-store loader takes the store id and reads `stores.seller_id`
 * from the database; nothing trusts a seller id from the client. Never
 * selects integration credentials, form submission contents or payment
 * method details.
 */
import {
  and,
  cmsCollections,
  cmsItems,
  db,
  desc,
  eq,
  isNull,
  mediaAssets,
  sellerCustomDomains,
  sellers,
  sql,
  storeDesignSystems,
  storeForms,
  storeFormSubmissions,
  storeIntegrations,
  storePages,
  stores,
  storeSettingsAudit,
  storeShippingZones,
  storeSiteRevisions,
  users,
  adminAuditLog,
} from "@workspace/db";
import type { SQL } from "drizzle-orm";
import { parseStorePayments } from "../payments/store-methods";
import { assertAdminActor, AdminActorError, writeAdminAudit, type Queryable } from "./guard.server";
import {
  ADMIN_LIST_PAGE_SIZE,
  cmsUnpublishSchema,
  isUuid,
  likePattern,
  publicIntegrationConfig,
  type SaasAdminError,
} from "./saas.lib";

export interface AdminStoreListInput {
  q: string | null;
  status: string | null;
  siteStatus: string | null;
  hasDomain: boolean | null;
  template: string | null;
  sellerId: string | null;
  page: number;
}

/** All stores (not deleted) with seller, host, domain, site and catalog facts. One round trip. */
export async function listStoresForAdmin(input: AdminStoreListInput, q: Queryable = db) {
  const conditions: SQL[] = [sql`st.deleted_at IS NULL`];
  if (input.status) conditions.push(sql`st.status = ${input.status}`);
  if (input.siteStatus) conditions.push(sql`st.site_status = ${input.siteStatus}`);
  if (input.template) conditions.push(sql`st.template_key = ${input.template}`);
  if (input.sellerId && isUuid(input.sellerId)) conditions.push(sql`st.seller_id = ${input.sellerId}`);
  if (input.hasDomain === true) conditions.push(sql`d.domain IS NOT NULL`);
  if (input.hasDomain === false) conditions.push(sql`d.domain IS NULL`);
  if (input.q) {
    const like = likePattern(input.q);
    conditions.push(sql`(st.name ILIKE ${like} OR st.subdomain ILIKE ${like} OR s.business_name ILIKE ${like} OR d.domain ILIKE ${like})`);
  }
  const offset = (input.page - 1) * ADMIN_LIST_PAGE_SIZE;

  const result = await q.execute(sql`
    SELECT
      st.id, st.name, st.subdomain, st.status, st.site_status, st.template_key, st.catalog_mode,
      st.is_primary, st.first_published_at, st.last_published_at, st.created_at,
      st.seller_id, coalesce(nullif(s.display_name, ''), s.business_name) AS seller_name, s.plan,
      d.domain, d.status AS domain_status,
      CASE WHEN st.catalog_mode = 'selected'
        THEN (SELECT count(*) FROM store_products sp WHERE sp.store_id = st.id)
        ELSE (SELECT count(*) FROM products p WHERE p.seller_id = st.seller_id AND p.status = 'active')
      END::int AS product_count,
      count(*) OVER ()::int AS total_count
    FROM stores st
    JOIN sellers s ON s.id = st.seller_id
    LEFT JOIN LATERAL (
      SELECT cd.domain, cd.status FROM seller_custom_domains cd
      WHERE cd.store_id = st.id ORDER BY (cd.status = 'active') DESC, cd.created_at LIMIT 1
    ) d ON true
    WHERE ${sql.join(conditions, sql` AND `)}
    ORDER BY st.created_at DESC, st.id
    LIMIT ${ADMIN_LIST_PAGE_SIZE} OFFSET ${offset}
  `);
  const raw = [...result] as Record<string, unknown>[];
  return {
    rows: raw.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      subdomain: String(row.subdomain),
      status: String(row.status),
      siteStatus: String(row.site_status),
      templateKey: String(row.template_key),
      catalogMode: String(row.catalog_mode),
      isPrimary: Boolean(row.is_primary),
      firstPublishedAt: iso(row.first_published_at),
      lastPublishedAt: iso(row.last_published_at),
      createdAt: iso(row.created_at),
      sellerId: String(row.seller_id),
      sellerName: (row.seller_name as string | null) ?? null,
      plan: String(row.plan ?? "free"),
      domain: (row.domain as string | null) ?? null,
      domainStatus: (row.domain_status as string | null) ?? null,
      productCount: Number(row.product_count ?? 0),
    })),
    total: Number(raw[0]?.total_count ?? 0),
  };
}

export type AdminStoreListRow = Awaited<ReturnType<typeof listStoresForAdmin>>["rows"][number];

/** Template keys in use, for the directory filter. */
export async function listStoreTemplateKeys(q: Queryable = db): Promise<string[]> {
  const rows = await q
    .selectDistinct({ key: stores.templateKey })
    .from(stores)
    .where(isNull(stores.deletedAt))
    .orderBy(stores.templateKey);
  return rows.map((row) => row.key);
}

/** The store header: store row facts, its seller and its domains. Null when missing or deleted. */
export async function getStoreForAdmin(storeId: string, q: Queryable = db) {
  if (!isUuid(storeId)) return null;
  const [store] = await q
    .select({
      id: stores.id,
      sellerId: stores.sellerId,
      name: stores.name,
      subdomain: stores.subdomain,
      isPrimary: stores.isPrimary,
      status: stores.status,
      siteStatus: stores.siteStatus,
      templateKey: stores.templateKey,
      catalogMode: stores.catalogMode,
      logoUrl: stores.logoUrl,
      defaultLocale: stores.defaultLocale,
      firstPublishedAt: stores.firstPublishedAt,
      lastPublishedAt: stores.lastPublishedAt,
      createdAt: stores.createdAt,
      sellerName: sql<string | null>`coalesce(nullif(${sellers.displayName}, ''), ${sellers.businessName})`,
      sellerEmail: users.email,
      sellerSlug: sellers.slug,
      plan: sellers.plan,
      walletBalance: sql<string | null>`(SELECT balance::text FROM seller_wallet w WHERE w.seller_id = ${stores.sellerId})`,
    })
    .from(stores)
    .innerJoin(sellers, eq(sellers.id, stores.sellerId))
    .innerJoin(users, eq(users.id, stores.sellerId))
    .where(and(eq(stores.id, storeId), isNull(stores.deletedAt)))
    .limit(1);
  if (!store) return null;
  const domains = await q
    .select({
      id: sellerCustomDomains.id,
      domain: sellerCustomDomains.domain,
      status: sellerCustomDomains.status,
      lastError: sellerCustomDomains.lastError,
      verifiedAt: sellerCustomDomains.verifiedAt,
    })
    .from(sellerCustomDomains)
    .where(eq(sellerCustomDomains.storeId, storeId));
  return { ...store, domains };
}

export type AdminStoreHeader = NonNullable<Awaited<ReturnType<typeof getStoreForAdmin>>>;

/** Website tab: pages, recent revisions, installed template, design tokens, SEO and social links. */
export async function getStoreWebsiteForAdmin(storeId: string, q: Queryable = db) {
  const [pages, revisions, design, meta] = await Promise.all([
    q
      .select({
        id: storePages.id,
        name: storePages.name,
        slug: storePages.slug,
        isHome: storePages.isHome,
        showInNav: storePages.showInNav,
        draftVersion: storePages.draftVersion,
        updatedAt: storePages.updatedAt,
      })
      .from(storePages)
      .where(eq(storePages.storeId, storeId))
      .orderBy(storePages.orderIndex),
    q
      .select({
        id: storeSiteRevisions.id,
        revisionNumber: storeSiteRevisions.revisionNumber,
        templateKey: storeSiteRevisions.templateKey,
        createdAt: storeSiteRevisions.createdAt,
        publishedBy: sql<string | null>`(SELECT coalesce(full_name, email) FROM users WHERE id = ${storeSiteRevisions.publishedBy})`,
      })
      .from(storeSiteRevisions)
      .where(eq(storeSiteRevisions.storeId, storeId))
      .orderBy(desc(storeSiteRevisions.revisionNumber))
      .limit(20),
    q
      .select({ colors: storeDesignSystems.colors, typography: storeDesignSystems.typography, version: storeDesignSystems.version, updatedAt: storeDesignSystems.updatedAt })
      .from(storeDesignSystems)
      .where(eq(storeDesignSystems.storeId, storeId))
      .limit(1),
    q
      .select({ seo: stores.seo, contact: stores.contact, publishedRevisionId: stores.publishedRevisionId })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1),
  ]);
  const contact = (meta[0]?.contact ?? {}) as Record<string, unknown>;
  const social = contact.social && typeof contact.social === "object" ? (contact.social as Record<string, unknown>) : {};
  return {
    pages,
    revisions,
    publishedRevisionId: meta[0]?.publishedRevisionId ?? null,
    design: design[0] ?? null,
    seo: (meta[0]?.seo ?? {}) as Record<string, unknown>,
    social: Object.fromEntries(Object.entries(social).filter(([, value]) => typeof value === "string" && value)) as Record<string, string>,
  };
}

/** Catalog tab: mode, selection size, and the seller's own category/brand lists when 0068 is applied. */
export async function getStoreCatalogForAdmin(storeId: string, sellerId: string, q: Queryable = db) {
  const result = await q.execute(sql`
    SELECT
      (SELECT count(*) FROM store_products sp WHERE sp.store_id = ${storeId})::int AS selected,
      (SELECT count(*) FROM products p WHERE p.seller_id = ${sellerId} AND p.status = 'active')::int AS active_products,
      (SELECT count(*) FROM products p WHERE p.seller_id = ${sellerId})::int AS all_products
  `);
  const row = ([...result][0] ?? {}) as Record<string, unknown>;
  let lists: { categories: number; brands: number } | null = null;
  try {
    // seller_product_categories / seller_product_brands come from 0068, which may not be applied yet.
    const listResult = await q.execute(sql`
      SELECT
        (SELECT count(*) FROM seller_product_categories WHERE seller_id = ${sellerId})::int AS categories,
        (SELECT count(*) FROM seller_product_brands WHERE seller_id = ${sellerId})::int AS brands
    `);
    const listRow = ([...listResult][0] ?? {}) as Record<string, unknown>;
    lists = { categories: Number(listRow.categories ?? 0), brands: Number(listRow.brands ?? 0) };
  } catch {
    lists = null;
  }
  return {
    selected: Number(row.selected ?? 0),
    activeProducts: Number(row.active_products ?? 0),
    allProducts: Number(row.all_products ?? 0),
    lists,
  };
}

/** Payments & shipping tab: which methods are on (never their account details) and the shipping zones. */
export async function getStoreCommerceForAdmin(storeId: string, q: Queryable = db) {
  const [[store], zones] = await Promise.all([
    q.select({ settings: stores.settings }).from(stores).where(eq(stores.id, storeId)).limit(1),
    q
      .select({
        id: storeShippingZones.id,
        name: storeShippingZones.name,
        governorates: storeShippingZones.governorates,
        price: storeShippingZones.price,
        freeOver: storeShippingZones.freeOver,
        deliveryDaysMin: storeShippingZones.deliveryDaysMin,
        deliveryDaysMax: storeShippingZones.deliveryDaysMax,
        codEnabled: storeShippingZones.codEnabled,
        enabled: storeShippingZones.enabled,
      })
      .from(storeShippingZones)
      .where(eq(storeShippingZones.storeId, storeId))
      .orderBy(storeShippingZones.sortOrder),
  ]);
  const payments = parseStorePayments((store?.settings as Record<string, unknown> | null)?.payments);
  const methods = Object.entries(payments).map(([key, entry]) => ({
    key,
    enabled: Boolean((entry as { enabled?: boolean } | undefined)?.enabled),
    codFee: key === "cod" ? ((entry as { fee?: number }).fee ?? 0) : null,
  }));
  return { methods, zones };
}

/** Integrations tab and hub rows: public config only, never credentials. */
export async function listStoreIntegrationsForAdmin(storeId: string, q: Queryable = db) {
  const rows = await q
    .select({
      id: storeIntegrations.id,
      provider: storeIntegrations.provider,
      status: storeIntegrations.status,
      config: storeIntegrations.config,
      scopes: storeIntegrations.scopes,
      externalAccountId: storeIntegrations.externalAccountId,
      hasCredentials: sql<boolean>`${storeIntegrations.credentialsEncrypted} IS NOT NULL`,
      lastError: storeIntegrations.lastError,
      lastSyncedAt: storeIntegrations.lastSyncedAt,
      connectedAt: storeIntegrations.connectedAt,
      updatedAt: storeIntegrations.updatedAt,
    })
    .from(storeIntegrations)
    .where(eq(storeIntegrations.storeId, storeId))
    .orderBy(storeIntegrations.provider);
  return rows.map(({ config, ...row }) => ({ ...row, publicConfig: publicIntegrationConfig(config) }));
}

/** Forms tab: forms with submission counts and last submission time. No submission contents (D-A2). */
export async function listStoreFormsForAdmin(storeId: string, q: Queryable = db) {
  return q
    .select({
      id: storeForms.id,
      name: storeForms.name,
      key: storeForms.key,
      status: storeForms.status,
      createdAt: storeForms.createdAt,
      submissions: sql<number>`(SELECT count(*)::int FROM ${storeFormSubmissions} WHERE ${storeFormSubmissions.formId} = ${storeForms.id})`,
      lastSubmissionAt: sql<string | null>`(SELECT max(${storeFormSubmissions.createdAt})::text FROM ${storeFormSubmissions} WHERE ${storeFormSubmissions.formId} = ${storeForms.id})`,
    })
    .from(storeForms)
    .where(eq(storeForms.storeId, storeId))
    .orderBy(desc(storeForms.createdAt));
}

/** Blog & CMS tab: collections and their latest items with published state. */
export async function listStoreContentForAdmin(storeId: string, q: Queryable = db) {
  const [collections, items] = await Promise.all([
    q
      .select({
        id: cmsCollections.id,
        name: cmsCollections.name,
        kind: cmsCollections.kind,
        slug: cmsCollections.slug,
        items: sql<number>`(SELECT count(*)::int FROM ${cmsItems} WHERE ${cmsItems.collectionId} = ${cmsCollections.id})`,
        published: sql<number>`(SELECT count(*)::int FROM ${cmsItems} WHERE ${cmsItems.collectionId} = ${cmsCollections.id} AND ${cmsItems.status} = 'published')`,
      })
      .from(cmsCollections)
      .where(eq(cmsCollections.storeId, storeId))
      .orderBy(cmsCollections.name),
    q
      .select({
        id: cmsItems.id,
        collectionId: cmsItems.collectionId,
        slug: cmsItems.slug,
        status: cmsItems.status,
        title: sql<string | null>`coalesce(${cmsItems.data}->>'title', ${cmsItems.data}->>'name', ${cmsItems.slug})`,
        publishedAt: cmsItems.publishedAt,
        updatedAt: cmsItems.updatedAt,
      })
      .from(cmsItems)
      .where(eq(cmsItems.storeId, storeId))
      .orderBy(desc(cmsItems.updatedAt))
      .limit(50),
  ]);
  return { collections, items };
}

/** Media tab: asset count, total bytes and the largest files. */
export async function getStoreMediaForAdmin(storeId: string, q: Queryable = db) {
  const [[totals], largest] = await Promise.all([
    q
      .select({ count: sql<number>`count(*)::int`, bytes: sql<string>`coalesce(sum(${mediaAssets.bytes}), 0)::text` })
      .from(mediaAssets)
      .where(eq(mediaAssets.storeId, storeId)),
    q
      .select({ id: mediaAssets.id, filename: mediaAssets.filename, mimeType: mediaAssets.mimeType, bytes: mediaAssets.bytes, createdAt: mediaAssets.createdAt })
      .from(mediaAssets)
      .where(eq(mediaAssets.storeId, storeId))
      .orderBy(desc(mediaAssets.bytes))
      .limit(10),
  ]);
  return { count: Number(totals?.count ?? 0), bytes: Number(totals?.bytes ?? 0), largest };
}

/** Audit tab: the seller's own settings changes and admin actions on this store, newest first. */
export async function listStoreAuditForAdmin(storeId: string, q: Queryable = db) {
  const [settings, admin] = await Promise.all([
    q
      .select({
        id: storeSettingsAudit.id,
        section: storeSettingsAudit.section,
        action: storeSettingsAudit.action,
        createdAt: storeSettingsAudit.createdAt,
        actorName: sql<string | null>`(SELECT coalesce(full_name, email) FROM users WHERE id = ${storeSettingsAudit.actorId})`,
      })
      .from(storeSettingsAudit)
      .where(eq(storeSettingsAudit.storeId, storeId))
      .orderBy(desc(storeSettingsAudit.createdAt))
      .limit(50),
    q
      .select({
        id: adminAuditLog.id,
        action: adminAuditLog.action,
        reason: adminAuditLog.reason,
        createdAt: adminAuditLog.createdAt,
        actorName: sql<string | null>`(SELECT coalesce(full_name, email) FROM users WHERE id = ${adminAuditLog.actorId})`,
      })
      .from(adminAuditLog)
      .where(eq(adminAuditLog.storeId, storeId))
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(50),
  ]);
  return { settings, admin };
}

/** Tab badges for the store page, in one round trip. */
export async function getStoreTabCounts(storeId: string, q: Queryable = db) {
  const result = await q.execute(sql`
    SELECT
      (SELECT count(*) FROM store_pages WHERE store_id = ${storeId})::int AS pages,
      (SELECT count(*) FROM store_integrations WHERE store_id = ${storeId} AND status = 'error')::int AS integration_errors,
      (SELECT count(*) FROM store_forms WHERE store_id = ${storeId})::int AS forms,
      (SELECT count(*) FROM cms_items WHERE store_id = ${storeId})::int AS content,
      (SELECT count(*) FROM media_assets WHERE store_id = ${storeId})::int AS media
  `);
  const row = ([...result][0] ?? {}) as Record<string, unknown>;
  return {
    pages: Number(row.pages ?? 0),
    integrationErrors: Number(row.integration_errors ?? 0),
    forms: Number(row.forms ?? 0),
    content: Number(row.content ?? 0),
    media: Number(row.media ?? 0),
  };
}

export type CmsUnpublishResult = { sellerId: string; storeId: string; auditId: string };

/** Unpublishes one blog/CMS item (abuse), audited. The item stays as a draft for the seller. */
export async function unpublishCmsItemByAdmin(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<{ success: true; data: CmsUnpublishResult } | { success: false; error: SaasAdminError }> {
  const parsed = cmsUnpublishSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { storeId, itemId, reason } = parsed.data;
  try {
    const data = await q.transaction(async (tx): Promise<CmsUnpublishResult | { error: SaasAdminError }> => {
      await assertAdminActor(tx, actorId);
      const [item] = await tx
        .select({ id: cmsItems.id, status: cmsItems.status, slug: cmsItems.slug, sellerId: stores.sellerId })
        .from(cmsItems)
        .innerJoin(stores, eq(stores.id, cmsItems.storeId))
        .where(and(eq(cmsItems.id, itemId), eq(cmsItems.storeId, storeId)))
        .for("update", { of: cmsItems });
      if (!item) return { error: "not_found" };
      if (item.status !== "published") return { error: "no_change" };
      await tx.update(cmsItems).set({ status: "draft", updatedAt: sql`now()` }).where(eq(cmsItems.id, item.id));
      const auditId = await writeAdminAudit(tx, {
        actorId,
        sellerId: item.sellerId,
        storeId,
        action: "unpublish_cms_item",
        before: { itemId: item.id, slug: item.slug, status: item.status },
        after: { itemId: item.id, slug: item.slug, status: "draft" },
        reason,
      });
      return { sellerId: item.sellerId, storeId, auditId };
    });
    if ("error" in data) return { success: false, error: data.error };
    return { success: true, data };
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    throw error;
  }
}

function iso(value: unknown): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}
