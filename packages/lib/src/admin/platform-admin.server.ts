/**
 * Admin read models for the platform pages: Payments, Shipping and Settings.
 * Read-only. Never selects payment card data, gateway payloads or secrets.
 */
import { db, sql } from "@workspace/db";
import { CODE_TEMPLATES, DEFAULT_TEMPLATE } from "@workspace/store-sections/templates";
import type { Queryable } from "./guard.server";

type Row = Record<string, unknown>;

function iso(value: unknown): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

/* Payments */

/**
 * Customer payments as recorded on orders (method × payment status), the
 * gateway transactions in `payments`, and seller store top-ups by status.
 */
export async function getPaymentsOverviewForAdmin(q: Queryable = db) {
  const [byMethod, transactions, topUps] = await Promise.all([
    q.execute(sql`
      SELECT payment_method, payment_status::text AS payment_status,
             count(*)::int AS orders, coalesce(sum(total_amount), 0)::text AS amount
      FROM orders
      GROUP BY 1, 2
    `),
    q.execute(sql`
      SELECT p.id, p.order_id, o.order_number, p.amount::text AS amount, p.method, p.currency,
             p.status::text AS status, p.transaction_id, p.error_message, p.created_at, p.captured_at
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      ORDER BY p.created_at DESC
      LIMIT 100
    `),
    q.execute(sql`
      SELECT provider, status::text AS status, count(*)::int AS count, coalesce(sum(amount), 0)::text AS amount
      FROM seller_wallet_top_ups
      GROUP BY 1, 2
    `),
  ]);

  return {
    byMethod: ([...byMethod] as Row[]).map((row) => ({
      method: String(row.payment_method),
      paymentStatus: String(row.payment_status ?? "pending"),
      orders: Number(row.orders ?? 0),
      amount: Number(row.amount ?? 0),
    })),
    transactions: ([...transactions] as Row[]).map((row) => ({
      id: String(row.id),
      orderId: String(row.order_id),
      orderNumber: String(row.order_number),
      amount: Number(row.amount ?? 0),
      method: String(row.method),
      currency: String(row.currency ?? "EGP"),
      status: String(row.status ?? "pending"),
      transactionId: (row.transaction_id as string | null) ?? null,
      errorMessage: (row.error_message as string | null) ?? null,
      createdAt: iso(row.created_at),
      capturedAt: iso(row.captured_at),
    })),
    topUps: ([...topUps] as Row[]).map((row) => ({
      provider: String(row.provider),
      status: String(row.status),
      count: Number(row.count ?? 0),
      amount: Number(row.amount ?? 0),
    })),
  };
}

export type AdminPaymentsOverview = Awaited<ReturnType<typeof getPaymentsOverviewForAdmin>>;

/* Shipping */

/** Providers with their shipment counts, the automation switches, shipments by status and the latest shipments. */
export async function getShippingOverviewForAdmin(q: Queryable = db) {
  const [providers, automation, byStatus, latest, zones] = await Promise.all([
    q.execute(sql`
      SELECT sp.id, sp.name, sp.code, sp.is_active, sp.contact_name, sp.contact_phone, sp.website,
             (SELECT count(*)::int FROM shipments s WHERE s.provider_id = sp.id) AS shipments,
             (SELECT count(*)::int FROM shipments s WHERE s.provider_id = sp.id AND s.status = 'delivered') AS delivered
      FROM shipping_providers sp
      ORDER BY sp.name
    `),
    q.execute(sql`
      SELECT a.auto_confirm, a.auto_assign, a.updated_at, sp.name AS provider_name
      FROM shipping_automation a
      LEFT JOIN shipping_providers sp ON sp.id = a.auto_assign_provider_id
      LIMIT 1
    `),
    q.execute(sql`SELECT status::text AS status, count(*)::int AS count FROM shipments GROUP BY 1`),
    q.execute(sql`
      SELECT s.id, s.order_id, o.order_number, s.status::text AS status, s.tracking_number, s.carrier,
             s.cost::text AS cost, s.failure_reason, s.created_at, s.shipped_at, s.delivered_at,
             sp.name AS provider_name
      FROM shipments s
      JOIN orders o ON o.id = s.order_id
      LEFT JOIN shipping_providers sp ON sp.id = s.provider_id
      ORDER BY s.created_at DESC
      LIMIT 100
    `),
    q.execute(sql`
      SELECT count(*)::int AS zones, count(DISTINCT store_id)::int AS stores FROM store_shipping_zones
    `),
  ]);

  const auto = ([...automation] as Row[])[0];
  const zoneRow = ([...zones] as Row[])[0] ?? {};
  return {
    providers: ([...providers] as Row[]).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      code: String(row.code),
      isActive: Boolean(row.is_active),
      contactName: (row.contact_name as string | null) ?? null,
      contactPhone: (row.contact_phone as string | null) ?? null,
      website: (row.website as string | null) ?? null,
      shipments: Number(row.shipments ?? 0),
      delivered: Number(row.delivered ?? 0),
    })),
    automation: auto
      ? {
          autoConfirm: Boolean(auto.auto_confirm),
          autoAssign: Boolean(auto.auto_assign),
          providerName: (auto.provider_name as string | null) ?? null,
          updatedAt: iso(auto.updated_at),
        }
      : null,
    byStatus: Object.fromEntries(([...byStatus] as Row[]).map((row) => [String(row.status), Number(row.count ?? 0)])) as Record<
      string,
      number
    >,
    shipments: ([...latest] as Row[]).map((row) => ({
      id: String(row.id),
      orderId: String(row.order_id),
      orderNumber: String(row.order_number),
      status: String(row.status),
      trackingNumber: (row.tracking_number as string | null) ?? null,
      carrier: (row.carrier as string | null) ?? null,
      providerName: (row.provider_name as string | null) ?? null,
      cost: Number(row.cost ?? 0),
      failureReason: (row.failure_reason as string | null) ?? null,
      createdAt: iso(row.created_at),
      shippedAt: iso(row.shipped_at),
      deliveredAt: iso(row.delivered_at),
    })),
    zones: { zones: Number(zoneRow.zones ?? 0), stores: Number(zoneRow.stores ?? 0) },
  };
}

export type AdminShippingOverview = Awaited<ReturnType<typeof getShippingOverviewForAdmin>>;

/* Settings */

/** Users with admin access, the default template, and platform-wide counts. */
export async function getPlatformSettingsForAdmin(q: Queryable = db) {
  const [team, counts] = await Promise.all([
    q.execute(sql`
      SELECT id, email, full_name, is_verified, is_suspended, last_login_at, created_at
      FROM users
      WHERE role = 'admin'
      ORDER BY created_at
    `),
    q.execute(sql`
      SELECT
        (SELECT count(*)::int FROM sellers) AS sellers,
        (SELECT count(*)::int FROM stores WHERE deleted_at IS NULL) AS stores
    `),
  ]);

  const count = ([...counts] as Row[])[0] ?? {};
  return {
    team: ([...team] as Row[]).map((row) => ({
      id: String(row.id),
      email: (row.email as string | null) ?? null,
      fullName: (row.full_name as string | null) ?? null,
      isVerified: Boolean(row.is_verified),
      isSuspended: Boolean(row.is_suspended),
      lastLoginAt: iso(row.last_login_at),
      createdAt: iso(row.created_at),
    })),
    // Templates are code-only since 2026-10-27 (0109).
    defaultTemplate: { key: DEFAULT_TEMPLATE.key, name: DEFAULT_TEMPLATE.name as unknown },
    counts: {
      sellers: Number(count.sellers ?? 0),
      stores: Number(count.stores ?? 0),
      templates: CODE_TEMPLATES.length,
    },
  };
}

export type AdminPlatformSettings = Awaited<ReturnType<typeof getPlatformSettingsForAdmin>>;
