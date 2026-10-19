/**
 * Admin ad campaign requests (docs/admin-saas.md §3.8, closes the P6-11 gap).
 * Status moves follow AD_STATUS_TRANSITIONS. A rejected wallet-paid request is
 * refunded through the approved `refundRejectedWalletAdRequest` (P6-11),
 * after the status change commits; the refund is idempotent, so "Retry
 * refund" is safe.
 */
import { adCampaignRequests, and, db, desc, eq, sellers, sql } from "@workspace/db";
import type { SQL } from "drizzle-orm";
import { refundRejectedWalletAdRequest } from "../store-wallet/ads.server";
import { assertAdminActor, AdminActorError, writeAdminAudit, type Queryable } from "./guard.server";
import {
  ADMIN_LIST_PAGE_SIZE,
  adStatusSchema,
  canMoveAdRequest,
  isUuid,
  likePattern,
  type AdRequestStatus,
} from "./saas.lib";

export interface AdminAdListInput {
  status: AdRequestStatus | null;
  sellerId: string | null;
  q: string | null;
  page: number;
}

export async function listAdRequestsForAdmin(input: AdminAdListInput, q: Queryable = db) {
  const conditions: SQL[] = [];
  if (input.status) conditions.push(eq(adCampaignRequests.status, input.status));
  if (input.sellerId && isUuid(input.sellerId)) conditions.push(eq(adCampaignRequests.sellerId, input.sellerId));
  if (input.q) {
    const like = likePattern(input.q);
    conditions.push(sql`(${sellers.businessName} ILIKE ${like} OR ${adCampaignRequests.payerPhone} ILIKE ${like} OR ${adCampaignRequests.transferReference} ILIKE ${like})`);
  }

  const rows = await q
    .select({
      id: adCampaignRequests.id,
      sellerId: adCampaignRequests.sellerId,
      sellerName: sql<string | null>`coalesce(nullif(${sellers.displayName}, ''), ${sellers.businessName})`,
      productId: adCampaignRequests.productId,
      productName: sql<string | null>`(
        SELECT pt.title FROM product_translations pt
        WHERE pt.product_id = ${adCampaignRequests.productId}
        ORDER BY (pt.locale = 'en') DESC LIMIT 1
      )`,
      packageKey: adCampaignRequests.packageKey,
      amount: adCampaignRequests.amount,
      paymentMethod: adCampaignRequests.paymentMethod,
      payerPhone: adCampaignRequests.payerPhone,
      transferReference: adCampaignRequests.transferReference,
      status: adCampaignRequests.status,
      adminNotes: adCampaignRequests.adminNotes,
      startsAt: adCampaignRequests.startsAt,
      endsAt: adCampaignRequests.endsAt,
      reviewedAt: adCampaignRequests.reviewedAt,
      createdAt: adCampaignRequests.createdAt,
      refunded: sql<boolean>`EXISTS (
        SELECT 1 FROM wallet_transactions wt
        WHERE wt.reference_type = 'ad_request' AND wt.reference_id = ${adCampaignRequests.id}::text AND wt.type = 'adjustment'
      )`,
      totalCount: sql<number>`count(*) OVER ()::int`,
    })
    .from(adCampaignRequests)
    .innerJoin(sellers, eq(sellers.id, adCampaignRequests.sellerId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`(${adCampaignRequests.status} = 'pending') DESC`, desc(adCampaignRequests.createdAt))
    .limit(ADMIN_LIST_PAGE_SIZE)
    .offset((input.page - 1) * ADMIN_LIST_PAGE_SIZE);

  return {
    rows: rows.map(({ totalCount: _total, ...row }) => row),
    total: Number(rows[0]?.totalCount ?? 0),
  };
}

export type AdminAdRequestRow = Awaited<ReturnType<typeof listAdRequestsForAdmin>>["rows"][number];

export type AdStatusError = "not_admin" | "invalid_input" | "not_found" | "invalid_transition";
export type AdStatusResult = {
  sellerId: string;
  status: AdRequestStatus;
  /** Only for a rejection of a wallet-paid request. */
  refund: "refunded" | "already_refunded" | "not_applicable" | "failed" | null;
};

/** Moves one request along its status flow, audited; refunds wallet payments on rejection. */
export async function setAdRequestStatusByAdmin(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<{ success: true; data: AdStatusResult } | { success: false; error: AdStatusError }> {
  const parsed = adStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { requestId, status, reason } = parsed.data;

  let moved: { sellerId: string; paymentMethod: string };
  try {
    const data = await q.transaction(async (tx): Promise<{ sellerId: string; paymentMethod: string } | { error: AdStatusError }> => {
      await assertAdminActor(tx, actorId);
      const [request] = await tx
        .select({
          id: adCampaignRequests.id,
          sellerId: adCampaignRequests.sellerId,
          status: adCampaignRequests.status,
          paymentMethod: adCampaignRequests.paymentMethod,
        })
        .from(adCampaignRequests)
        .where(eq(adCampaignRequests.id, requestId))
        .for("update");
      if (!request) return { error: "not_found" };
      if (!canMoveAdRequest(request.status, status)) return { error: "invalid_transition" };

      await tx
        .update(adCampaignRequests)
        .set({
          status,
          adminNotes: reason,
          reviewedAt: sql`coalesce(${adCampaignRequests.reviewedAt}, now())`,
          ...(status === "active" ? { startsAt: sql`coalesce(${adCampaignRequests.startsAt}, now())` } : {}),
          ...(status === "completed" ? { endsAt: sql`coalesce(${adCampaignRequests.endsAt}, now())` } : {}),
          updatedAt: sql`now()`,
        })
        .where(eq(adCampaignRequests.id, request.id));
      await writeAdminAudit(tx, {
        actorId,
        sellerId: request.sellerId,
        action: "set_ad_status",
        before: { requestId: request.id, status: request.status },
        after: { requestId: request.id, status },
        reason,
      });
      return { sellerId: request.sellerId, paymentMethod: request.paymentMethod };
    });
    if ("error" in data) return { success: false, error: data.error };
    moved = data;
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    throw error;
  }

  let refund: AdStatusResult["refund"] = null;
  if (status === "rejected" && moved.paymentMethod === "wallet") {
    // Its own transaction, after the rejection committed (the refund reads the committed status).
    try {
      refund = await refundRejectedWalletAdRequest(requestId, actorId);
    } catch {
      refund = "failed";
    }
  }
  return { success: true, data: { sellerId: moved.sellerId, status, refund } };
}

/** Re-runs the idempotent refund of a rejected wallet-paid request (after a failure). */
export async function retryAdRefundByAdmin(actorId: string, requestId: string, q: Queryable = db) {
  if (!isUuid(requestId)) return "not_applicable" as const;
  await assertAdminActor(q, actorId);
  return refundRejectedWalletAdRequest(requestId, actorId);
}
