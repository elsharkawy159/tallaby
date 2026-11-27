import {
  db as defaultDb,
  digitalAccessLogs,
  digitalBundleItems,
  digitalFiles,
  digitalOrders,
  digitalProducts,
  licenseKeys,
  orderItems,
  orders,
  stores,
  users,
  and,
  asc,
  eq,
  gt,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from "@workspace/db";
import {
  DIGITAL_LINK_MAX_DOWNLOADS,
  DIGITAL_SIGNED_URL_TTL_SECONDS,
  USABLE_DIGITAL_STATUSES,
  digitalDownloadUrl,
  digitalLinkExpiresAt,
  isDownloadTokenShape,
} from "./access.lib";
import { generateDownloadToken } from "./token.lib";
import { getSignedUrlForPath } from "./storage";
import type { DigitalProductType } from "./types";

type Database = typeof defaultDb;

/**
 * The buyer's download link (ROADMAP.md F-108c): `GET /d/<token>` reads with
 * getDigitalDownloadView and never changes anything (link previews in
 * WhatsApp or Gmail fetch it), `POST` uses it up with consumeDigitalDownload.
 * The token is the only secret: no sign-in is needed, since a store customer
 * may open it signed in to another account or none.
 */

/** A link that can still download, in SQL. Same rule as isDigitalLinkUsable. */
function usableLinkWhere() {
  return and(
    inArray(digitalOrders.fulfillmentStatus, [...USABLE_DIGITAL_STATUSES]),
    sql`(coalesce(${digitalOrders.maxDownloads}, 0) <= 0 OR coalesce(${digitalOrders.downloadCount}, 0) < ${digitalOrders.maxDownloads})`,
    or(isNull(digitalOrders.expiresAt), gt(digitalOrders.expiresAt, sql`now()`)),
  );
}

export interface DeliverableFile {
  name: string;
  path: string;
  size: number | null;
  type: string | null;
}

export interface DigitalDownloadView {
  digitalOrderId: string;
  digitalProductId: string;
  digitalType: DigitalProductType;
  productName: string;
  /** The store the order was placed on; null for a marketplace order. */
  storeName: string | null;
  buyerLanguage: string | null;
  files: DeliverableFile[];
  /** A license key, a link or instructions are shown after the download, never before. */
  hasLicenseKey: boolean;
  hasExternalUrl: boolean;
}

/**
 * The page before the download: what the link gives, or null when the link
 * can't be used (unknown, used, expired, revoked, waiting for the seller, or
 * nothing left to deliver). Read-only.
 */
export async function getDigitalDownloadView(
  token: string,
  database: Database = defaultDb,
): Promise<DigitalDownloadView | null> {
  if (!isDownloadTokenShape(token)) return null;

  const [row] = await database
    .select({
      digitalOrderId: digitalOrders.id,
      licenseKeyId: digitalOrders.licenseKeyId,
      productName: orderItems.productName,
      storeName: stores.name,
      buyerLanguage: users.preferredLanguage,
      product: digitalProducts,
    })
    .from(digitalOrders)
    .innerJoin(digitalProducts, eq(digitalProducts.id, digitalOrders.digitalProductId))
    .innerJoin(orders, eq(orders.id, digitalOrders.orderId))
    .leftJoin(orderItems, eq(orderItems.id, digitalOrders.orderItemId))
    .leftJoin(stores, eq(stores.id, orders.storeId))
    .leftJoin(users, eq(users.id, digitalOrders.buyerId))
    .where(and(eq(digitalOrders.downloadToken, token), usableLinkWhere()))
    .limit(1);
  if (!row) return null;

  const product = row.product;
  const digitalType = product.digitalType as DigitalProductType;
  const files = await listDeliverableFiles(product, database);
  const hasLicenseKey = Boolean(row.licenseKeyId);
  const hasExternalUrl = digitalType === "external_access" && isHttpUrl(product.externalUrl);
  // Nothing to hand over (the seller removed every file): don't offer a button that would use the link up.
  if (files.length === 0 && !hasLicenseKey && !hasExternalUrl && !product.accessInstructions?.trim()) return null;

  return {
    digitalOrderId: row.digitalOrderId,
    digitalProductId: product.id,
    digitalType,
    productName: row.productName?.trim() || product.fileName || "",
    storeName: row.storeName ?? null,
    buyerLanguage: row.buyerLanguage ?? null,
    files,
    hasLicenseKey,
    hasExternalUrl,
  };
}

export interface SignedDeliverable {
  name: string;
  url: string;
  size: number | null;
}

export type ConsumeDownloadResult =
  | {
      ok: true;
      view: DigitalDownloadView;
      files: SignedDeliverable[];
      licenseKey: string | null;
      externalUrl: string | null;
      accessInstructions: string | null;
    }
  | { ok: false; reason: "unavailable" | "storage_error" };

/**
 * The one real download. The storage links are signed first, so a storage
 * failure leaves the link unused; then one conditional UPDATE uses the link
 * up, so of two downloads at the same moment exactly one wins (the second
 * re-checks the row after the first commits and matches nothing).
 */
export async function consumeDigitalDownload(
  token: string,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {},
  database: Database = defaultDb,
): Promise<ConsumeDownloadResult> {
  const view = await getDigitalDownloadView(token, database);
  if (!view) return { ok: false, reason: "unavailable" };

  let files: SignedDeliverable[];
  try {
    files = await Promise.all(
      view.files.map(async (file) => ({
        name: file.name,
        size: file.size,
        url: await getSignedUrlForPath(file.path, DIGITAL_SIGNED_URL_TTL_SECONDS, { downloadName: file.name }),
      })),
    );
  } catch (error) {
    console.error("consumeDigitalDownload: signing failed", error);
    return { ok: false, reason: "storage_error" };
  }

  const [used] = await database
    .update(digitalOrders)
    .set({
      downloadCount: sql`coalesce(${digitalOrders.downloadCount}, 0) + 1`,
      downloadedAt: sql`coalesce(${digitalOrders.downloadedAt}, now())`,
      lastAccessedAt: sql`now()`,
      fulfillmentStatus: "downloaded",
    })
    .where(and(eq(digitalOrders.downloadToken, token), eq(digitalOrders.id, view.digitalOrderId), usableLinkWhere()))
    .returning({ id: digitalOrders.id, licenseKeyId: digitalOrders.licenseKeyId });
  if (!used) return { ok: false, reason: "unavailable" };

  await database
    .insert(digitalAccessLogs)
    .values({
      digitalOrderId: used.id,
      action: "download",
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent?.slice(0, 500) ?? null,
    })
    .catch((error) => console.error("consumeDigitalDownload: access log failed", error));

  const [product] = await database
    .select({ externalUrl: digitalProducts.externalUrl, accessInstructions: digitalProducts.accessInstructions })
    .from(digitalProducts)
    .where(eq(digitalProducts.id, view.digitalProductId))
    .limit(1);
  const [key] = used.licenseKeyId
    ? await database.select({ code: licenseKeys.code }).from(licenseKeys).where(eq(licenseKeys.id, used.licenseKeyId)).limit(1)
    : [];

  return {
    ok: true,
    view,
    files,
    licenseKey: key?.code ?? null,
    externalUrl: view.hasExternalUrl ? (product?.externalUrl ?? null) : null,
    accessInstructions: product?.accessInstructions?.trim() || null,
  };
}

export type ReissueDigitalAccessResult =
  | { success: true; digitalOrderId: string; token: string; url: string; expiresAt: string }
  | { success: false; error: "not_found" | "revoked" };

/**
 * A new link for one purchased item (for the seller's "New link", F-108d):
 * a fresh token, one download, 7 more days. The old link stops working at
 * once. Only the seller of that order line can do it (CLAUDE.md rule 5): the
 * row is matched through `order_items.seller_id`, never a client-sent owner.
 * A revoked grant stays revoked.
 */
export async function reissueDigitalAccess(
  digitalOrderId: string,
  actor: { sellerId: string; actorUserId?: string | null },
  database: Database = defaultDb,
): Promise<ReissueDigitalAccessResult> {
  const token = generateDownloadToken();
  const expiresAt = digitalLinkExpiresAt();

  const [row] = await database
    .update(digitalOrders)
    .set({
      downloadToken: token,
      downloadCount: 0,
      maxDownloads: DIGITAL_LINK_MAX_DOWNLOADS,
      expiresAt,
      fulfillmentStatus: "delivered",
    })
    .where(
      and(
        eq(digitalOrders.id, digitalOrderId),
        ne(digitalOrders.fulfillmentStatus, "revoked"),
        sql`exists (select 1 from order_items oi where oi.id = ${digitalOrders.orderItemId} and oi.seller_id = ${actor.sellerId})`,
      ),
    )
    .returning({ id: digitalOrders.id });

  if (!row) {
    // Tell "revoked" apart only for the seller's own row; anything else is not found.
    const [own] = await database
      .select({ status: digitalOrders.fulfillmentStatus })
      .from(digitalOrders)
      .innerJoin(orderItems, eq(orderItems.id, digitalOrders.orderItemId))
      .where(and(eq(digitalOrders.id, digitalOrderId), eq(orderItems.sellerId, actor.sellerId)))
      .limit(1);
    return { success: false, error: own?.status === "revoked" ? "revoked" : "not_found" };
  }

  await database.insert(digitalAccessLogs).values({
    digitalOrderId: row.id,
    action: "resend",
    actorUserId: actor.actorUserId ?? null,
    notes: "new link",
  });

  return { success: true, digitalOrderId: row.id, token, url: digitalDownloadUrl(token), expiresAt };
}

/** Files a purchase delivers: the product's own (or a bundle's items'), in the seller's order. */
export async function listDeliverableFiles(
  product: typeof digitalProducts.$inferSelect,
  database: Database = defaultDb,
): Promise<DeliverableFile[]> {
  if (product.digitalType === "external_access" || product.digitalType === "gift_card" || product.digitalType === "license_key") {
    return [];
  }

  let productIds = [product.id];
  if (product.digitalType === "bundle") {
    const children = await database
      .select({ id: digitalBundleItems.childProductId })
      .from(digitalBundleItems)
      .where(eq(digitalBundleItems.bundleProductId, product.id))
      .orderBy(asc(digitalBundleItems.sortOrder));
    productIds = children.map((child) => child.id);
    if (productIds.length === 0) return [];
  }

  const rows = await database
    .select()
    .from(digitalFiles)
    .where(inArray(digitalFiles.digitalProductId, productIds))
    .orderBy(asc(digitalFiles.sortOrder), asc(digitalFiles.createdAt));

  const files: DeliverableFile[] = [];
  for (const id of productIds) {
    for (const f of rows) {
      if (f.digitalProductId === id) files.push({ name: f.fileName, path: f.fileUrl, size: f.fileSize, type: f.fileType });
    }
  }
  // Older products keep a single file on the product row itself.
  if (files.length === 0 && product.digitalType !== "bundle" && product.fileUrl) {
    files.push({
      name: product.fileName || "download",
      path: product.fileUrl,
      size: product.fileSize ?? null,
      type: product.fileType ?? null,
    });
  }
  return files;
}

function isHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
