import { and, db, desc, eq, ne, sellers, sql, storeAppRequests, stores } from "@workspace/db";
import { AdminActorError, assertAdminActor, writeAdminAudit } from "./guard.server";

/**
 * Admin › App requests (ROADMAP.md F-62). Enabling only records the decision and
 * shows it on the seller's card: SMS sending comes with F-38 (F-62c).
 */

export type AppRequestView = "open" | "reviewed";

export type AdminAppRequestRow = {
  id: string;
  appKey: string;
  status: "requested" | "enabled" | "declined";
  createdAt: string;
  reviewedAt: string | null;
  storeId: string;
  storeName: string | null;
  subdomain: string | null;
  sellerId: string;
  sellerName: string | null;
};

export async function listAppRequestsForAdmin(view: AppRequestView): Promise<AdminAppRequestRow[]> {
  const rows = await db
    .select({
      id: storeAppRequests.id,
      appKey: storeAppRequests.appKey,
      status: storeAppRequests.status,
      createdAt: storeAppRequests.createdAt,
      reviewedAt: storeAppRequests.reviewedAt,
      storeId: storeAppRequests.storeId,
      storeName: stores.name,
      subdomain: stores.subdomain,
      sellerId: storeAppRequests.sellerId,
      sellerName: sql<string | null>`coalesce(nullif(${sellers.displayName}, ''), ${sellers.businessName})`,
    })
    .from(storeAppRequests)
    .innerJoin(stores, eq(stores.id, storeAppRequests.storeId))
    .innerJoin(sellers, eq(sellers.id, storeAppRequests.sellerId))
    .where(view === "open" ? eq(storeAppRequests.status, "requested") : ne(storeAppRequests.status, "requested"))
    .orderBy(desc(storeAppRequests.createdAt))
    .limit(100);
  return rows as AdminAppRequestRow[];
}

export type ReviewAppRequestResult =
  | { success: true; status: "enabled" | "declined" }
  | { success: false; error: "not_admin" | "not_found" | "already_reviewed" };

class ReviewError extends Error {
  constructor(readonly code: "not_found" | "already_reviewed") {
    super(code);
  }
}

export async function reviewAppRequest(
  actorId: string,
  input: { requestId: string; decision: "enable" | "decline" },
): Promise<ReviewAppRequestResult> {
  const status = input.decision === "enable" ? "enabled" : "declined";
  try {
    await db.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [request] = await tx
        .select()
        .from(storeAppRequests)
        .where(eq(storeAppRequests.id, input.requestId))
        .for("update");
      if (!request) throw new ReviewError("not_found");
      if (request.status === status) throw new ReviewError("already_reviewed");
      await tx
        .update(storeAppRequests)
        .set({ status, reviewedBy: actorId, reviewedAt: sql`now()`, updatedAt: sql`now()` })
        .where(and(eq(storeAppRequests.id, request.id), eq(storeAppRequests.status, request.status)));
      await writeAdminAudit(tx, {
        actorId,
        sellerId: request.sellerId,
        storeId: request.storeId,
        action: input.decision === "enable" ? "enable_app_request" : "decline_app_request",
        before: { status: request.status, appKey: request.appKey },
        after: { status, appKey: request.appKey, requestId: request.id },
        reason: input.decision === "enable" ? "App request enabled" : "App request declined",
      });
    });
    return { success: true, status };
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    if (error instanceof ReviewError) return { success: false, error: error.code };
    throw error;
  }
}
