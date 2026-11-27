import { and, asc, db, digitalOrders, eq, inArray, orders, sql, stores } from "@workspace/db";
import {
  DIGITAL_LINK_TTL_DAYS,
  digitalDownloadUrl,
  fulfillDigitalOrderItems,
  reissueDigitalAccess,
  resendDigitalAccess,
} from "@workspace/lib/digital";
import { orderEmailRecipient } from "@workspace/lib/orders/notification-email";
import { resolveCustomerName, resolveCustomerPhone } from "../orders.lib";
import {
  buildDigitalWhatsAppUrl,
  digitalLinkStatus,
  isSellerConfirmedPaymentMethod,
  resolveDigitalPanelStage,
  type DigitalLinkStatus,
  type DigitalMessageLocale,
  type DigitalPanelStage,
} from "./digital-delivery.lib";

/**
 * Digital delivery on the order screen (ROADMAP.md F-108d), on the server.
 * Every function takes the seller and the store from an already-checked
 * session (digital-delivery.server.ts) and checks them again in SQL: the
 * order must be in that store, the store this seller's, and every line of the
 * order this seller's (a multi-seller order stays read-only). Test orders
 * (F-76) are left out. Download tokens are secrets: they leave this module
 * only inside a link the seller asked for, and are never logged or cached.
 */

/** What the panel shows. Never carries a token or a link. */
export interface DigitalDeliveryView {
  stage: DigitalPanelStage;
  links: {
    digitalOrderId: string;
    productName: string;
    status: DigitalLinkStatus;
    expiresAt: string | null;
  }[];
  /** Digital lines whose product lost its digital setup: no link can be made for them. */
  undeliverableLines: number;
  hasPhone: boolean;
  hasEmail: boolean;
  /** How long a new link lasts (DIGITAL_LINK_TTL_DAYS), for the "New link" dialog. */
  linkTtlDays: number;
}

export type DigitalDeliveryError = "not_found" | "not_allowed" | "revoked" | "nothing_to_send" | "no_phone";

type Context = NonNullable<Awaited<ReturnType<typeof loadContext>>>;

const CLOSED: readonly string[] = ["cancelled", "refund_requested", "refunded", "returned"];

async function loadContext(sellerId: string, storeId: string, orderId: string) {
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.id, orderId),
      eq(orders.storeId, storeId),
      sql`exists (select 1 from ${stores} s where s.id = ${orders.storeId} and s.seller_id = ${sellerId} and s.deleted_at is null)`,
    ),
    columns: { id: true, status: true, paymentStatus: true, paymentMethod: true, isTest: true, metadata: true },
    with: {
      store: { columns: { name: true, defaultLocale: true } },
      user: { columns: { email: true, fullName: true, phone: true, preferredLanguage: true } },
      userAddress_shippingAddressId: { columns: { fullName: true, phone: true } },
      orderItems: {
        columns: { id: true, sellerId: true, productName: true },
        with: { product: { columns: { productType: true }, with: { digitalProducts: { columns: { id: true } } } } },
      },
    },
  });
  if (!order || order.isTest) return null;
  if (order.orderItems.length === 0 || !order.orderItems.every((line) => line.sellerId === sellerId)) return null;

  const digitalLines = order.orderItems.filter((line) => line.product?.productType === "digital");
  if (digitalLines.length === 0) return null;

  const rows = await db
    .select({
      id: digitalOrders.id,
      orderItemId: digitalOrders.orderItemId,
      fulfillmentStatus: digitalOrders.fulfillmentStatus,
      downloadCount: digitalOrders.downloadCount,
      maxDownloads: digitalOrders.maxDownloads,
      expiresAt: digitalOrders.expiresAt,
      token: digitalOrders.downloadToken,
    })
    .from(digitalOrders)
    .where(
      and(
        eq(digitalOrders.orderId, order.id),
        inArray(
          digitalOrders.orderItemId,
          digitalLines.map((line) => line.id),
        ),
      ),
    )
    .orderBy(asc(digitalOrders.createdAt));

  return { order, digitalLines, rows };
}

function customerLocale(ctx: Context): DigitalMessageLocale {
  const preferred = ctx.order.user?.preferredLanguage;
  if (preferred === "ar" || preferred === "en") return preferred;
  return ctx.order.store?.defaultLocale === "en" ? "en" : "ar";
}

function toView(ctx: Context, now: Date): DigitalDeliveryView {
  const nameByLine = new Map(ctx.digitalLines.map((line) => [line.id, line.productName]));
  const deliverable = ctx.digitalLines.filter((line) => (line.product?.digitalProducts?.length ?? 0) > 0);
  const linked = new Set(ctx.rows.map((row) => row.orderItemId));
  return {
    stage: resolveDigitalPanelStage({
      orderStatus: ctx.order.status,
      paymentStatus: ctx.order.paymentStatus,
      paymentMethod: ctx.order.paymentMethod,
      deliverableLines: deliverable.length,
      linkedLines: deliverable.filter((line) => linked.has(line.id)).length,
    }),
    links: ctx.rows.map((row) => ({
      digitalOrderId: row.id,
      productName: nameByLine.get(row.orderItemId ?? "") ?? "",
      status: digitalLinkStatus(row, now),
      expiresAt: row.expiresAt,
    })),
    undeliverableLines: ctx.digitalLines.length - deliverable.length,
    hasPhone: Boolean(resolveCustomerPhone(ctx.order)),
    hasEmail: Boolean(orderEmailRecipient({ metadata: ctx.order.metadata, accountEmail: ctx.order.user?.email })),
    linkTtlDays: DIGITAL_LINK_TTL_DAYS,
  };
}

export async function getDigitalDeliveryView(
  sellerId: string,
  storeId: string,
  orderId: string,
  now: Date = new Date(),
): Promise<DigitalDeliveryView | null> {
  const ctx = await loadContext(sellerId, storeId, orderId);
  return ctx ? toView(ctx, now) : null;
}

type Outcome = { ok: true; view: DigitalDeliveryView } | { ok: false; error: DigitalDeliveryError };

async function freshView(sellerId: string, storeId: string, orderId: string): Promise<Outcome> {
  const view = await getDigitalDeliveryView(sellerId, storeId, orderId);
  return view ? { ok: true, view } : { ok: false, error: "not_found" };
}

/**
 * "Payment received" on a transfer the seller checked (InstaPay, a mobile
 * wallet, a bank transfer). The same move as Admin's mark-paid
 * (apps/admin/actions/orders.ts updateOrderPaymentStatus): payment_status
 * 'paid' and paid_at, then fulfillDigitalOrderItems. No money or ledger moves:
 * the order fee was taken when the order was placed (only payment_processing
 * orders pay it later, and those never get here), and the money went to the
 * seller's own account. The UPDATE only matches an unpaid, open order, so a
 * double click or a second tab marks it once; fulfillment is idempotent
 * (per-order advisory lock), so the links are made once too.
 */
export async function confirmDigitalOrderPayment(
  sellerId: string,
  storeId: string,
  orderId: string,
  actorUserId: string,
): Promise<Outcome> {
  const ctx = await loadContext(sellerId, storeId, orderId);
  if (!ctx) return { ok: false, error: "not_found" };

  const view = toView(ctx, new Date());
  if (view.stage === "awaiting_payment") {
    if (!isSellerConfirmedPaymentMethod(ctx.order.paymentMethod)) return { ok: false, error: "not_allowed" };
    const now = new Date().toISOString();
    await db
      .update(orders)
      .set({ paymentStatus: "paid", paidAt: now, updatedAt: now })
      .where(
        and(
          eq(orders.id, ctx.order.id),
          eq(orders.storeId, storeId),
          sql`coalesce(${orders.paymentStatus}::text, 'pending') not in ('paid', 'collected')`,
          sql`coalesce(${orders.status}::text, 'pending') not in (${sql.join(
            [...CLOSED, "payment_processing"].map((status) => sql`${status}`),
            sql`, `,
          )})`,
        ),
      );
  } else if (view.stage !== "missing_links" && view.stage !== "ready") {
    return { ok: false, error: "not_allowed" };
  }

  return createLinks(sellerId, storeId, orderId, actorUserId);
}

/** "Create links" on a paid order with a digital line and no link (a failed webhook), and the end of "Payment received". */
export async function createMissingDigitalLinks(
  sellerId: string,
  storeId: string,
  orderId: string,
  actorUserId: string,
): Promise<Outcome> {
  const ctx = await loadContext(sellerId, storeId, orderId);
  if (!ctx) return { ok: false, error: "not_found" };
  const stage = toView(ctx, new Date()).stage;
  if (stage !== "missing_links" && stage !== "ready") return { ok: false, error: "not_allowed" };
  return createLinks(sellerId, storeId, orderId, actorUserId);
}

async function createLinks(sellerId: string, storeId: string, orderId: string, actorUserId: string): Promise<Outcome> {
  const result = await fulfillDigitalOrderItems(orderId, { actorUserId });
  if (!result.success) return { ok: false, error: "not_found" };
  return freshView(sellerId, storeId, orderId);
}

/**
 * The wa.me link with every usable link of the order, in the customer's
 * language. Only built when the seller presses "Send on WhatsApp".
 */
export async function buildDigitalWhatsAppLink(
  sellerId: string,
  storeId: string,
  orderId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: DigitalDeliveryError }> {
  const ctx = await loadContext(sellerId, storeId, orderId);
  if (!ctx) return { ok: false, error: "not_found" };
  const now = new Date();
  const locale = customerLocale(ctx);
  const nameByLine = new Map(ctx.digitalLines.map((line) => [line.id, line.productName]));
  const links = ctx.rows
    .filter((row) => digitalLinkStatus(row, now) === "ready")
    .map((row) => ({
      productName: nameByLine.get(row.orderItemId ?? "") ?? "",
      url: digitalDownloadUrl(row.token, { lang: locale }),
      expiresAt: row.expiresAt,
    }));
  if (links.length === 0) return { ok: false, error: "nothing_to_send" };
  const url = buildDigitalWhatsAppUrl(resolveCustomerPhone(ctx.order), {
    locale,
    customerName: resolveCustomerName(ctx.order, ""),
    storeName: ctx.order.store?.name ?? "",
    links,
  });
  return url ? { ok: true, url } : { ok: false, error: "no_phone" };
}

/** One usable link, for "Copy link". */
export async function readDigitalLink(
  sellerId: string,
  storeId: string,
  orderId: string,
  digitalOrderId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: DigitalDeliveryError }> {
  const ctx = await loadContext(sellerId, storeId, orderId);
  const row = ctx?.rows.find((r) => r.id === digitalOrderId);
  if (!ctx || !row) return { ok: false, error: "not_found" };
  if (digitalLinkStatus(row, new Date()) !== "ready") return { ok: false, error: "nothing_to_send" };
  return { ok: true, url: digitalDownloadUrl(row.token, { lang: customerLocale(ctx) }) };
}

/**
 * "New link" (and "Email a new link"): a fresh token through
 * reissueDigitalAccess, which checks the line's seller again; the old link
 * stops working at once. With `email`, the new link is emailed too: a link
 * already emailed can't be sent again (each email is sent once per link), so
 * the email always carries a new one.
 */
export async function issueNewDigitalLink(
  sellerId: string,
  storeId: string,
  orderId: string,
  digitalOrderId: string,
  actorUserId: string,
  options: { email?: boolean } = {},
): Promise<Outcome & { emailed?: boolean }> {
  const ctx = await loadContext(sellerId, storeId, orderId);
  if (!ctx || !ctx.rows.some((row) => row.id === digitalOrderId)) return { ok: false, error: "not_found" };
  if (CLOSED.includes(ctx.order.status ?? "")) return { ok: false, error: "not_allowed" };

  const issued = await reissueDigitalAccess(digitalOrderId, { sellerId, actorUserId });
  if (!issued.success) return { ok: false, error: issued.error };

  let emailed: boolean | undefined;
  if (options.email) emailed = (await resendDigitalAccess(digitalOrderId, actorUserId)).success;

  const view = await freshView(sellerId, storeId, orderId);
  return view.ok ? { ...view, emailed } : view;
}
