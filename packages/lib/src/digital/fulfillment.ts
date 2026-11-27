import {
  db,
  orders,
  orderItems,
  digitalOrders,
  licenseKeys,
  digitalAccessLogs,
  eq,
  sql,
} from "@workspace/db";
import { DIGITAL_LINK_MAX_DOWNLOADS, digitalLinkExpiresAt } from "./access.lib";
import { generateDownloadToken } from "./token.lib";
import { sendDigitalDeliveryEmail } from "./notify";

export { generateDownloadToken } from "./token.lib";

type CreatedDigitalOrder = {
  digitalOrderId: string;
  orderItemId: string;
  productName: string;
  downloadToken: string;
  licenseKeyCode: string | null;
  expiresAt: string | null;
  maxDownloads: number | null;
  fulfillmentStatus: "delivered" | "pending";
};

/**
 * Creates one digital_orders access row (one link) per digital line of a paid
 * order, then emails the buyer the links that are ready. Every new link opens
 * once and expires after 7 days (access.lib.ts, F-108c).
 *
 * Safe to call more than once and at the same time (two payment webhooks):
 * the order's rows are made inside one transaction holding a per-order
 * advisory lock, so a second call waits, sees the rows and adds nothing.
 * The lock is what prevents duplicates; 0190 adds a unique partial index on
 * digital_orders.order_item_id as a second guard where it could be created
 * (F-108d), and the code does not need it. Only rows made by this call are emailed, so a repeated
 * webhook never mails twice. A license key is claimed with
 * FOR UPDATE SKIP LOCKED, so two orders never get the same key.
 */
export async function fulfillDigitalOrderItems(
  orderId: string,
  options: { actorUserId?: string; notify?: boolean } = {}
) {
  const { actorUserId, notify = true } = options;

  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`digital_fulfill:${orderId}`}, 0))`);

    const order = await tx.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: { id: true, userId: true },
    });
    if (!order) return null;

    const items = await tx.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
      columns: { id: true, productName: true },
      with: {
        product: {
          columns: { productType: true },
          with: { digitalProducts: true },
        },
      },
    });

    const existing = await tx
      .select({ orderItemId: digitalOrders.orderItemId })
      .from(digitalOrders)
      .where(eq(digitalOrders.orderId, orderId));
    const done = new Set(existing.map((row) => row.orderItemId));

    const created: CreatedDigitalOrder[] = [];
    for (const item of items) {
      const product = item.product;
      if (!product || product.productType !== "digital" || done.has(item.id)) continue;
      const digitalProduct = product.digitalProducts?.[0];
      if (!digitalProduct) continue;

      let licenseKeyId: string | null = null;
      let licenseKeyCode: string | null = null;
      if (digitalProduct.requiresLicenseKey) {
        const [key] = [
          ...(await tx.execute(sql`
            UPDATE ${licenseKeys}
            SET status = 'assigned', assigned_to_order_id = ${orderId}, assigned_at = now()
            WHERE id = (
              SELECT id FROM ${licenseKeys}
              WHERE digital_product_id = ${digitalProduct.id} AND status = 'available'
              ORDER BY created_at
              LIMIT 1
              FOR UPDATE SKIP LOCKED
            )
            RETURNING id, code
          `)),
        ] as Array<{ id: string; code: string }>;
        if (key) {
          licenseKeyId = key.id;
          licenseKeyCode = key.code;
        }
      }

      // Manual delivery needs the seller to act before the buyer gets access;
      // automatic delivery (the default) is available at once.
      const canAutoDeliver =
        digitalProduct.deliveryMethod === "automatic" && (!digitalProduct.requiresLicenseKey || licenseKeyId);
      const fulfillmentStatus = canAutoDeliver ? "delivered" : "pending";
      const downloadToken = generateDownloadToken();
      const expiresAt = digitalLinkExpiresAt();

      const [row] = await tx
        .insert(digitalOrders)
        .values({
          orderId,
          orderItemId: item.id,
          digitalProductId: digitalProduct.id,
          buyerId: order.userId,
          licenseKeyId,
          downloadToken,
          maxDownloads: DIGITAL_LINK_MAX_DOWNLOADS,
          expiresAt,
          fulfillmentStatus,
        })
        .returning({ id: digitalOrders.id, maxDownloads: digitalOrders.maxDownloads });
      if (!row) continue;

      created.push({
        digitalOrderId: row.id,
        orderItemId: item.id,
        productName: item.productName,
        downloadToken,
        licenseKeyCode,
        expiresAt,
        maxDownloads: row.maxDownloads,
        fulfillmentStatus,
      });
    }

    if (created.length > 0) {
      await tx.insert(digitalAccessLogs).values(
        created.map((row) => ({ digitalOrderId: row.digitalOrderId, action: "grant" as const, actorUserId: actorUserId ?? null }))
      );
    }
    return created;
  });

  if (result === null) return { success: false as const, error: "Order not found" };

  // Only links made now and ready to use. The backend finds the address
  // (a guest's order email or the account's), the language and the store.
  const delivered = result.filter((row) => row.fulfillmentStatus === "delivered");
  if (notify && delivered.length > 0) {
    await sendDigitalDeliveryEmail({ orderId, digitalOrderIds: delivered.map((row) => row.digitalOrderId) });
  }

  return { success: true as const, data: result };
}

/** Marks a digitalOrders row (and its stored license key, if any) revoked. */
export async function revokeDigitalAccess(
  digitalOrderId: string,
  reason: string,
  actorUserId?: string
) {
  const digitalOrder = await db.query.digitalOrders.findFirst({
    where: eq(digitalOrders.id, digitalOrderId),
  });
  if (!digitalOrder) return { success: false as const, error: "Digital order not found" };

  await db
    .update(digitalOrders)
    .set({
      fulfillmentStatus: "revoked",
      revokedAt: new Date().toISOString(),
      revokedReason: reason,
    })
    .where(eq(digitalOrders.id, digitalOrderId));

  if (digitalOrder.licenseKeyId) {
    await db
      .update(licenseKeys)
      .set({ status: "revoked", revokedAt: new Date().toISOString() })
      .where(eq(licenseKeys.id, digitalOrder.licenseKeyId));
  }

  await db.insert(digitalAccessLogs).values({
    digitalOrderId,
    action: "revoke",
    actorUserId: actorUserId ?? null,
    notes: reason,
  });

  return { success: true as const };
}

/** Reinstates a previously revoked access grant (does not restore a revoked license key). */
export async function reinstateDigitalAccess(digitalOrderId: string, actorUserId?: string) {
  const digitalOrder = await db.query.digitalOrders.findFirst({
    where: eq(digitalOrders.id, digitalOrderId),
  });
  if (!digitalOrder) return { success: false as const, error: "Digital order not found" };

  await db
    .update(digitalOrders)
    .set({
      fulfillmentStatus: digitalOrder.downloadCount ? "downloaded" : "delivered",
      revokedAt: null,
      revokedReason: null,
    })
    .where(eq(digitalOrders.id, digitalOrderId));

  await db.insert(digitalAccessLogs).values({
    digitalOrderId,
    action: "reinstate",
    actorUserId: actorUserId ?? null,
  });

  return { success: true as const };
}

/**
 * Re-sends the existing (unchanged) link by email; does not reset limits. A
 * used link stays used: for a fresh one, use reissueDigitalAccess. The email
 * is sent once per link (its reference is derived from the token).
 */
export async function resendDigitalAccess(digitalOrderId: string, actorUserId?: string) {
  const digitalOrder = await db.query.digitalOrders.findFirst({
    where: eq(digitalOrders.id, digitalOrderId),
    columns: { id: true, orderId: true, fulfillmentStatus: true },
  });
  if (!digitalOrder) return { success: false as const, error: "Digital order not found" };
  if (digitalOrder.fulfillmentStatus === "revoked") {
    return { success: false as const, error: "Access has been revoked" };
  }

  const sent = await sendDigitalDeliveryEmail({ orderId: digitalOrder.orderId, digitalOrderIds: [digitalOrder.id] });
  if (!sent.success) return { success: false as const, error: sent.error ?? "Email not sent" };

  await db.insert(digitalAccessLogs).values({
    digitalOrderId,
    action: "resend",
    actorUserId: actorUserId ?? null,
  });

  return { success: true as const };
}
