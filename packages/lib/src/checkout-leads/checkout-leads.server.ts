import { db, sql } from "@workspace/db";
import { storeUrl } from "../storefront";
import {
  LEAD_RETENTION_DAYS,
  LEAD_TEMPLATE_MAX,
  normalizeLeadPhone,
  parseLeadTemplate,
  type CheckoutLeadItem,
  type LeadRange,
  type LeadStatus,
} from "./checkout-leads.lib";

/**
 * Missed orders (0120, ROADMAP.md F-03). Server-only. Phones are personal
 * data: never logged, never cached, only returned to the store's own seller.
 *
 * - The storefront side (saveStoreCheckoutLead) is called with the store from
 *   the request host and the user, cart and address from the session; it
 *   never sees a client id.
 * - The dashboard side always takes the session's sellerId and scopes every
 *   query by it (CLAUDE.md rule 5); writes also take an explicit storeId.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const rowsOf = (result: unknown) => [...(result as Iterable<Record<string, unknown>>)];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SaveCheckoutLeadInput = {
  storeId: string;
  sellerId: string;
  userId: string;
  cartId: string;
  fullName: string;
  phone: string;
  /** A signed-in customer's real email; null for guests. */
  email: string | null;
  governorate: string | null;
  city: string | null;
  items: CheckoutLeadItem[];
  subtotal: number;
  shipping: number | null;
  total: number | null;
};

const money = (value: number | null) => (value == null || !Number.isFinite(value) ? null : Math.max(0, value).toFixed(2));
const clip = (value: string | null | undefined, max: number) => (value ? value.trim().slice(0, max) : null);

/**
 * Creates or refreshes the store's open lead for this phone. Returns false
 * (and writes nothing) when the phone is not an Egyptian mobile or the cart is
 * empty. The caller resolved every id from the host and session.
 */
export async function saveStoreCheckoutLead(input: SaveCheckoutLeadInput, q: Queryable = db): Promise<boolean> {
  const phone = normalizeLeadPhone(input.phone);
  const name = clip(input.fullName, 120);
  if (!phone || !name || input.items.length === 0) return false;

  const items = input.items.slice(0, 50).map((item) => ({
    productId: item.productId,
    title: item.title.slice(0, 200),
    quantity: Math.max(1, Math.floor(item.quantity)),
    price: item.price,
    image: item.image,
  }));

  await q.execute(sql`
    INSERT INTO store_checkout_leads
      (store_id, seller_id, user_id, cart_id, full_name, phone, email, governorate, city, items, subtotal, shipping, total)
    SELECT st.id, st.seller_id, ${input.userId}, ${input.cartId}, ${name}, ${phone}, ${clip(input.email, 254)},
           ${clip(input.governorate, 100)}, ${clip(input.city, 100)}, ${JSON.stringify(items)}::jsonb,
           ${money(input.subtotal) ?? "0.00"}::numeric, ${money(input.shipping)}::numeric, ${money(input.total)}::numeric
      FROM stores st
     WHERE st.id = ${input.storeId} AND st.seller_id = ${input.sellerId} AND st.deleted_at IS NULL
    ON CONFLICT (store_id, phone) WHERE order_id IS NULL DO UPDATE SET
      user_id = EXCLUDED.user_id,
      cart_id = EXCLUDED.cart_id,
      full_name = EXCLUDED.full_name,
      email = coalesce(EXCLUDED.email, store_checkout_leads.email),
      governorate = EXCLUDED.governorate,
      city = EXCLUDED.city,
      items = EXCLUDED.items,
      subtotal = EXCLUDED.subtotal,
      shipping = EXCLUDED.shipping,
      total = EXCLUDED.total,
      updated_at = now()
  `);
  return true;
}

export type CheckoutLeadRow = {
  id: string;
  storeId: string;
  storeName: string;
  storeLink: string;
  storeLocale: "ar" | "en";
  template: string | null;
  fullName: string;
  phone: string;
  governorate: string | null;
  city: string | null;
  items: CheckoutLeadItem[];
  subtotal: string;
  shipping: string | null;
  total: string | null;
  updatedAt: string;
  contactedAt: string | null;
  /** When the store-branded reminder email went out (the cart's reminder, F-03e). */
  emailSentAt: string | null;
};

const RANGE_SQL: Record<LeadRange, string> = {
  today: "1 day",
  "7d": "7 days",
  "30d": "30 days",
};

/**
 * The seller's open leads, newest first, across their stores (or one store).
 * Only stores owned by `sellerId`; a foreign storeId just returns nothing.
 */
export async function listStoreCheckoutLeads(
  sellerId: string,
  options: { storeId?: string | null; range: LeadRange; status: LeadStatus; limit?: number },
  q: Queryable = db,
): Promise<CheckoutLeadRow[]> {
  const storeFilter = options.storeId && UUID_RE.test(options.storeId) ? sql`AND l.store_id = ${options.storeId}` : sql``;
  const statusFilter =
    options.status === "open"
      ? sql`AND l.contacted_at IS NULL`
      : options.status === "contacted"
        ? sql`AND l.contacted_at IS NOT NULL`
        : sql``;
  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500);

  const rows = rowsOf(
    await q.execute(sql`
      SELECT l.id, l.store_id, st.name AS store_name, st.subdomain, st.default_locale, st.settings,
             (SELECT d.domain FROM seller_custom_domains d
               WHERE d.store_id = st.id AND d.status = 'active' ORDER BY d.created_at LIMIT 1) AS custom_domain,
             l.full_name, l.phone, l.governorate, l.city, l.items,
             l.subtotal::text AS subtotal, l.shipping::text AS shipping, l.total::text AS total,
             l.updated_at::text AS updated_at, l.contacted_at::text AS contacted_at,
             (SELECT c.reminder_sent_at::text FROM carts c
               WHERE c.id = l.cart_id AND c.user_id = l.user_id AND c.reminder_sent_at IS NOT NULL) AS email_sent_at
        FROM store_checkout_leads l
        JOIN stores st ON st.id = l.store_id AND st.seller_id = ${sellerId} AND st.deleted_at IS NULL
       WHERE l.seller_id = ${sellerId}
         AND l.order_id IS NULL
         AND l.updated_at >= now() - ${RANGE_SQL[options.range]}::interval
         ${storeFilter}
         ${statusFilter}
       ORDER BY l.updated_at DESC
       LIMIT ${limit}
    `),
  );

  return rows.map((r) => ({
    id: String(r.id),
    storeId: String(r.store_id),
    storeName: String(r.store_name ?? ""),
    storeLink: storeUrl(String(r.subdomain), (r.custom_domain as string | null) ?? null),
    storeLocale: r.default_locale === "en" ? "en" : "ar",
    template: parseLeadTemplate(r.settings),
    fullName: String(r.full_name),
    phone: String(r.phone),
    governorate: (r.governorate as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    items: Array.isArray(r.items) ? (r.items as CheckoutLeadItem[]) : [],
    subtotal: String(r.subtotal ?? "0"),
    shipping: (r.shipping as string | null) ?? null,
    total: (r.total as string | null) ?? null,
    updatedAt: String(r.updated_at),
    contactedAt: (r.contacted_at as string | null) ?? null,
    emailSentAt: (r.email_sent_at as string | null) ?? null,
  }));
}

/** Marks or unmarks a lead as contacted. False when it is not this seller's store's lead. */
export async function setStoreCheckoutLeadContacted(
  sellerId: string,
  input: { storeId: string; leadId: string; contacted: boolean; userId: string },
  q: Queryable = db,
): Promise<boolean> {
  if (!UUID_RE.test(input.storeId) || !UUID_RE.test(input.leadId)) return false;
  const rows = rowsOf(
    await q.execute(sql`
      UPDATE store_checkout_leads l
         SET contacted_at = ${input.contacted ? sql`now()` : sql`NULL`},
             contacted_by = ${input.contacted ? input.userId : null}
        FROM stores st
       WHERE l.id = ${input.leadId}
         AND l.store_id = ${input.storeId}
         AND l.seller_id = ${sellerId}
         AND st.id = l.store_id AND st.seller_id = ${sellerId} AND st.deleted_at IS NULL
      RETURNING l.id
    `),
  );
  return rows.length === 1;
}

export type SaveLeadTemplateResult = { success: true } | { success: false; error: "not_found" | "too_long" };

/** Saves the store's WhatsApp message (null or blank = back to the default). */
export async function saveStoreLeadTemplate(
  sellerId: string,
  input: { storeId: string; template: string | null },
  q: Queryable = db,
): Promise<SaveLeadTemplateResult> {
  if (!UUID_RE.test(input.storeId)) return { success: false, error: "not_found" };
  const template = input.template?.trim() ? input.template.trim() : null;
  if (template && template.length > LEAD_TEMPLATE_MAX) return { success: false, error: "too_long" };
  const rows = rowsOf(
    await q.execute(sql`
      UPDATE stores
         SET settings = jsonb_set(
               coalesce(settings, '{}'::jsonb),
               '{missedOrders}',
               coalesce(settings->'missedOrders', '{}'::jsonb) || jsonb_build_object('whatsappTemplate', ${template}::text),
               true
             ),
             updated_at = now()
       WHERE id = ${input.storeId} AND seller_id = ${sellerId} AND deleted_at IS NULL AND status = 'active'
      RETURNING id
    `),
  );
  return rows.length === 1 ? { success: true } : { success: false, error: "not_found" };
}

/** Daily cleanup: leads older than LEAD_RETENTION_DAYS, converted or not. */
export async function deleteOldStoreCheckoutLeads(q: Queryable = db): Promise<number> {
  const rows = rowsOf(
    await q.execute(sql`
      DELETE FROM store_checkout_leads
       WHERE created_at < now() - make_interval(days => ${LEAD_RETENTION_DAYS})
      RETURNING id
    `),
  );
  return rows.length;
}

export type StoreLeadSettings = {
  storeId: string;
  name: string;
  locale: "ar" | "en";
  link: string;
  /** The saved message, or null for the default. */
  template: string | null;
};

/** The seller's stores with their WhatsApp message, for the editor and the store filter. */
export async function listStoreLeadSettings(sellerId: string, q: Queryable = db): Promise<StoreLeadSettings[]> {
  const rows = rowsOf(
    await q.execute(sql`
      SELECT st.id, st.name, st.subdomain, st.default_locale, st.settings,
             (SELECT d.domain FROM seller_custom_domains d
               WHERE d.store_id = st.id AND d.status = 'active' ORDER BY d.created_at LIMIT 1) AS custom_domain
        FROM stores st
       WHERE st.seller_id = ${sellerId} AND st.deleted_at IS NULL
       ORDER BY st.is_primary DESC, st.created_at
    `),
  );
  return rows.map((r) => ({
    storeId: String(r.id),
    name: String(r.name ?? ""),
    locale: r.default_locale === "en" ? "en" : "ar",
    link: storeUrl(String(r.subdomain), (r.custom_domain as string | null) ?? null),
    template: parseLeadTemplate(r.settings),
  }));
}
