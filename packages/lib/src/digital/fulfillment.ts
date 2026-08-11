import {
  db,
  orders,
  orderItems,
  users,
  digitalProducts,
  digitalFiles,
  digitalOrders,
  digitalBundleItems,
  licenseKeys,
  digitalAccessLogs,
  eq,
  and,
} from "@workspace/db";
import { randomBytes } from "crypto";
import { getSignedUrlForPath } from "./storage";
import { sendDigitalDeliveryEmail } from "./notify";
import type { DigitalDeliveryPayload, DigitalProductType } from "./types";

export function generateDownloadToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Creates (or reuses, idempotently) a digitalOrders access record for every
 * digital line item on an order, once the order's payment has succeeded.
 * Safe to call more than once for the same order — existing rows are
 * skipped, so a duplicated webhook/status-update event cannot double-grant
 * or double-consume a license key.
 */
export async function fulfillDigitalOrderItems(
  orderId: string,
  options: { actorUserId?: string; notify?: boolean } = {}
) {
  const { actorUserId, notify = true } = options;

  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) {
    return { success: false as const, error: "Order not found" };
  }

  const buyer = await db.query.users.findFirst({ where: eq(users.id, order.userId) });

  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, orderId),
    with: {
      product: {
        with: { digitalProducts: true },
      },
    },
  });

  const createdRows: Array<{
    digitalOrderId: string;
    productName: string;
    downloadToken: string;
    licenseKeyCode: string | null;
    expiresAt: string | null;
    maxDownloads: number | null;
    fulfillmentStatus: string;
  }> = [];

  for (const item of items as any[]) {
    const product = item.product;
    if (!product || product.productType !== "digital") continue;

    const digitalProduct = product.digitalProducts?.[0];
    if (!digitalProduct) continue;

    const existing = await db.query.digitalOrders.findFirst({
      where: eq(digitalOrders.orderItemId, item.id),
    });
    if (existing) {
      createdRows.push({
        digitalOrderId: existing.id,
        productName: item.productName,
        downloadToken: existing.downloadToken,
        licenseKeyCode: null,
        expiresAt: existing.expiresAt,
        maxDownloads: existing.maxDownloads,
        fulfillmentStatus: existing.fulfillmentStatus,
      });
      continue;
    }

    let licenseKeyId: string | null = null;
    let licenseKeyCode: string | null = null;
    if (digitalProduct.requiresLicenseKey) {
      const availableKey = await db.query.licenseKeys.findFirst({
        where: and(
          eq(licenseKeys.digitalProductId, digitalProduct.id),
          eq(licenseKeys.status, "available")
        ),
      });

      if (availableKey) {
        await db
          .update(licenseKeys)
          .set({
            status: "assigned",
            assignedToOrderId: orderId,
            assignedAt: new Date().toISOString(),
          })
          .where(eq(licenseKeys.id, availableKey.id));
        licenseKeyId = availableKey.id;
        licenseKeyCode = availableKey.code;
      }
    }

    const token = generateDownloadToken();
    const expiresAt = digitalProduct.downloadExpiryHours
      ? new Date(Date.now() + digitalProduct.downloadExpiryHours * 3600 * 1000).toISOString()
      : null;

    // Manual delivery needs a seller/admin to act before the buyer gets access;
    // automatic delivery (the default) is available immediately.
    const canAutoDeliver =
      digitalProduct.deliveryMethod === "automatic" &&
      (!digitalProduct.requiresLicenseKey || licenseKeyId);
    const fulfillmentStatus = canAutoDeliver ? "delivered" : "pending";

    const [row] = await db
      .insert(digitalOrders)
      .values({
        orderId,
        orderItemId: item.id,
        digitalProductId: digitalProduct.id,
        buyerId: order.userId,
        licenseKeyId,
        downloadToken: token,
        maxDownloads: digitalProduct.downloadLimit ?? 5,
        expiresAt,
        fulfillmentStatus,
      })
      .returning();

    if (!row) continue;

    await db.insert(digitalAccessLogs).values({
      digitalOrderId: row.id,
      action: "grant",
      actorUserId: actorUserId ?? null,
    });

    createdRows.push({
      digitalOrderId: row.id,
      productName: item.productName,
      downloadToken: token,
      licenseKeyCode,
      expiresAt,
      maxDownloads: row.maxDownloads,
      fulfillmentStatus,
    });
  }

  if (notify && buyer?.email && createdRows.some((r) => r.fulfillmentStatus === "delivered")) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    await sendDigitalDeliveryEmail({
      email: buyer.email,
      name: buyer.fullName || "there",
      orderNumber: order.orderNumber,
      items: createdRows
        .filter((r) => r.fulfillmentStatus === "delivered")
        .map((r) => ({
          productName: r.productName,
          downloadUrl: `${siteUrl}/api/downloads/${r.downloadToken}`,
          licenseKey: r.licenseKeyCode,
          expiresAt: r.expiresAt,
          maxDownloads: r.maxDownloads,
        })),
    });
  }

  return { success: true as const, data: createdRows };
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

/** Re-sends the existing (unmodified) access link/key by email; does not reset limits. */
export async function resendDigitalAccess(digitalOrderId: string, actorUserId?: string) {
  const digitalOrder = await db.query.digitalOrders.findFirst({
    where: eq(digitalOrders.id, digitalOrderId),
    with: {
      buyer: true,
      order: true,
      digitalProduct: true,
      licenseKey: true,
    },
  });
  if (!digitalOrder) return { success: false as const, error: "Digital order not found" };
  if (digitalOrder.fulfillmentStatus === "revoked") {
    return { success: false as const, error: "Access has been revoked" };
  }
  if (!digitalOrder.buyer?.email) {
    return { success: false as const, error: "Buyer has no email on file" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  await sendDigitalDeliveryEmail({
    email: digitalOrder.buyer.email,
    name: digitalOrder.buyer.fullName || "there",
    orderNumber: digitalOrder.order.orderNumber,
    items: [
      {
        productName: (digitalOrder.digitalProduct as any)?.fileName || "Your digital product",
        downloadUrl: `${siteUrl}/api/downloads/${digitalOrder.downloadToken}`,
        licenseKey: digitalOrder.licenseKey?.code ?? null,
        expiresAt: digitalOrder.expiresAt,
        maxDownloads: digitalOrder.maxDownloads,
      },
    ],
  });

  await db.insert(digitalAccessLogs).values({
    digitalOrderId,
    action: "resend",
    actorUserId: actorUserId ?? null,
  });

  return { success: true as const };
}

export type ValidateDownloadResult =
  | { success: true; payload: DigitalDeliveryPayload }
  | { success: false; status: 403 | 404 | 410; error: string };

/**
 * Validates a download token against ownership/expiry/limit rules and, if
 * valid, resolves the deliverable content with freshly-minted signed URLs.
 * Never persist the returned URLs — they expire in ~60s by design.
 */
export async function validateAndConsumeDownload(
  token: string,
  meta: { ipAddress?: string; userAgent?: string; requesterUserId?: string } = {}
): Promise<ValidateDownloadResult> {
  const digitalOrder = await db.query.digitalOrders.findFirst({
    where: eq(digitalOrders.downloadToken, token),
    with: { digitalProduct: true, licenseKey: true },
  });

  if (!digitalOrder) {
    return { success: false, status: 404, error: "Download link not found" };
  }

  if (
    meta.requesterUserId &&
    digitalOrder.buyerId !== meta.requesterUserId
  ) {
    return { success: false, status: 403, error: "This link does not belong to your account" };
  }

  if (digitalOrder.fulfillmentStatus === "revoked") {
    return { success: false, status: 410, error: "Access to this item has been revoked" };
  }

  if (digitalOrder.expiresAt && new Date(digitalOrder.expiresAt) < new Date()) {
    if (digitalOrder.fulfillmentStatus !== "expired") {
      await db
        .update(digitalOrders)
        .set({ fulfillmentStatus: "expired" })
        .where(eq(digitalOrders.id, digitalOrder.id));
    }
    return { success: false, status: 410, error: "This download link has expired" };
  }

  const maxDownloads = digitalOrder.maxDownloads ?? 0;
  if (maxDownloads > 0 && (digitalOrder.downloadCount ?? 0) >= maxDownloads) {
    return { success: false, status: 410, error: "Download limit reached for this item" };
  }

  const digitalProduct = digitalOrder.digitalProduct;
  if (!digitalProduct) {
    return { success: false, status: 404, error: "Digital product no longer available" };
  }

  const payload = await resolveDeliveryPayload(digitalProduct, digitalOrder.licenseKey?.code ?? null);

  const now = new Date().toISOString();
  const isFirstDownload = !digitalOrder.downloadedAt;
  await db
    .update(digitalOrders)
    .set({
      downloadCount: (digitalOrder.downloadCount ?? 0) + 1,
      downloadedAt: isFirstDownload ? now : digitalOrder.downloadedAt,
      lastAccessedAt: now,
      fulfillmentStatus: "downloaded",
    })
    .where(eq(digitalOrders.id, digitalOrder.id));

  await db.insert(digitalAccessLogs).values({
    digitalOrderId: digitalOrder.id,
    action: "download",
    actorUserId: meta.requesterUserId ?? null,
    ipAddress: meta.ipAddress ?? null,
    userAgent: meta.userAgent ?? null,
  });

  return { success: true, payload };
}

async function resolveDeliveryPayload(
  digitalProduct: typeof digitalProducts.$inferSelect,
  licenseKeyCode: string | null
): Promise<DigitalDeliveryPayload> {
  const digitalType = digitalProduct.digitalType as DigitalProductType;

  if (digitalType === "external_access") {
    return {
      digitalType,
      files: [],
      externalUrl: digitalProduct.externalUrl,
      accessInstructions: digitalProduct.accessInstructions,
    };
  }

  if (digitalType === "gift_card" || digitalType === "license_key") {
    return {
      digitalType,
      files: [],
      licenseKey: licenseKeyCode,
      accessInstructions: digitalProduct.accessInstructions,
    };
  }

  if (digitalType === "bundle") {
    const children = await db.query.digitalBundleItems.findMany({
      where: eq(digitalBundleItems.bundleProductId, digitalProduct.id),
      with: { childProduct: { with: { digitalFiles: true } } },
    });

    const files = (
      await Promise.all(
        children.map(async (child: any) => resolveFilesForProduct(child.childProduct))
      )
    ).flat();

    return { digitalType, files };
  }

  const files = await resolveFilesForProduct(digitalProduct);
  return {
    digitalType,
    files,
    courseContent: digitalType === "course" ? digitalProduct.courseContent : undefined,
    accessInstructions: digitalProduct.accessInstructions,
  };
}

async function resolveFilesForProduct(
  digitalProduct: (typeof digitalProducts.$inferSelect) & {
    digitalFiles?: (typeof digitalFiles.$inferSelect)[];
  }
) {
  const multiFiles =
    digitalProduct.digitalFiles ??
    (await db.query.digitalFiles.findMany({
      where: eq(digitalFiles.digitalProductId, digitalProduct.id),
    }));

  const paths: Array<{ name: string; path: string; fileType?: string | null; fileSize?: number | null }> = [];

  if (multiFiles.length > 0) {
    for (const f of multiFiles) {
      paths.push({ name: f.fileName, path: f.fileUrl, fileType: f.fileType, fileSize: f.fileSize });
    }
  } else if (digitalProduct.fileUrl) {
    paths.push({
      name: digitalProduct.fileName || "download",
      path: digitalProduct.fileUrl,
      fileType: digitalProduct.fileType,
      fileSize: digitalProduct.fileSize,
    });
  }

  return Promise.all(
    paths.map(async (f) => ({
      name: f.name,
      url: await getSignedUrlForPath(f.path),
      fileType: f.fileType,
      fileSize: f.fileSize,
    }))
  );
}
