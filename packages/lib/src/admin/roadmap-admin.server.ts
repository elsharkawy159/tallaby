/**
 * Admin writes for the public seller roadmap (0115). Every change runs in one
 * transaction with the actor re-checked and a platform audit row (seller_id
 * NULL, target_type 'feature_request'). The dashboard page is never cached,
 * so a change shows there on the next load.
 */
import { db, desc, eq, featureRequests, sellers, sql } from "@workspace/db";
import {
  launchDateFor,
  roadmapCardInputSchema,
  roadmapHiddenInputSchema,
  roadmapStatusInputSchema,
  type RoadmapAdminCategory,
  type RoadmapAdminError,
  type RoadmapAdminStatus,
} from "./roadmap-admin.lib";
import { assertAdminActor, AdminActorError, writeAdminAudit, type Queryable } from "./guard.server";

/** Every card (hidden ones too) with its vote count and who suggested it. */
export async function listRoadmapCardsForAdmin(q: Queryable = db) {
  const rows = await q
    .select({
      id: featureRequests.id,
      status: featureRequests.status,
      category: featureRequests.category,
      title: featureRequests.title,
      description: featureRequests.description,
      titleEn: featureRequests.titleEn,
      descriptionEn: featureRequests.descriptionEn,
      roadmapRef: featureRequests.roadmapRef,
      launchedAt: featureRequests.launchedAt,
      hiddenAt: featureRequests.hiddenAt,
      createdAt: featureRequests.createdAt,
      updatedAt: featureRequests.updatedAt,
      sellerId: featureRequests.sellerId,
      sellerName: sellers.displayName,
      storeName: sql<string | null>`(
        SELECT s.name FROM stores s
        WHERE s.seller_id = ${featureRequests.sellerId} AND s.deleted_at IS NULL
        ORDER BY s.is_primary DESC, s.created_at ASC
        LIMIT 1
      )`,
      votes: sql<number>`(
        SELECT count(*)::int FROM feature_request_votes v WHERE v.request_id = ${featureRequests.id}
      )`,
    })
    .from(featureRequests)
    .leftJoin(sellers, eq(sellers.id, featureRequests.sellerId))
    .orderBy(desc(featureRequests.createdAt))
    .limit(2000);
  return rows.map((row) => ({
    ...row,
    status: row.status as RoadmapAdminStatus,
    category: row.category as RoadmapAdminCategory,
    votes: Number(row.votes),
  }));
}

export type AdminRoadmapCard = Awaited<ReturnType<typeof listRoadmapCardsForAdmin>>[number];

type Result<T> = { success: true; data: T } | { success: false; error: RoadmapAdminError };

function fail<T>(error: unknown): Result<T> {
  if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
  const e = error as { code?: string; cause?: { code?: string } };
  const code = e?.cause?.code ?? e?.code;
  if (code === "23505") return { success: false, error: "ref_taken" };
  if (code === "42P01" || code === "42703") return { success: false, error: "migration_required" };
  throw error;
}

type CardRow = typeof featureRequests.$inferSelect;

/** What the audit row keeps: the fields an admin changes, not vote data. */
function auditView(row: Pick<CardRow, "status" | "category" | "title" | "titleEn" | "roadmapRef" | "launchedAt" | "hiddenAt">) {
  return {
    status: row.status,
    category: row.category,
    title: row.title,
    titleEn: row.titleEn,
    roadmapRef: row.roadmapRef,
    launchedAt: row.launchedAt,
    hiddenAt: row.hiddenAt,
  };
}

/** Creates (no `id`, a team card) or edits a card. Returns its id. */
export async function saveRoadmapCard(actorId: string, input: unknown, q: Queryable = db): Promise<Result<{ id: string }>> {
  const parsed = roadmapCardInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { id, launchedAt, ...v } = parsed.data;
  try {
    return await q.transaction(async (tx): Promise<Result<{ id: string }>> => {
      await assertAdminActor(tx, actorId);
      if (!id) {
        const values = { ...v, launchedAt: launchDateFor(v.status, launchedAt, null) };
        const [row] = await tx.insert(featureRequests).values(values).returning();
        await writeAdminAudit(tx, {
          actorId,
          sellerId: null,
          targetType: "feature_request",
          targetId: row!.id,
          action: "create_feature_request",
          before: {},
          after: auditView(row!),
          reason: "Roadmap card added",
        });
        return { success: true, data: { id: row!.id } };
      }
      const [current] = await tx.select().from(featureRequests).where(eq(featureRequests.id, id)).for("update");
      if (!current) return { success: false, error: "not_found" };
      const [row] = await tx
        .update(featureRequests)
        .set({ ...v, launchedAt: launchDateFor(v.status, launchedAt, current.launchedAt), updatedAt: sql`now()` })
        .where(eq(featureRequests.id, id))
        .returning();
      await writeAdminAudit(tx, {
        actorId,
        sellerId: null,
        targetType: "feature_request",
        targetId: id,
        action: "update_feature_request",
        before: auditView(current),
        after: auditView(row!),
        reason: "Roadmap card edited",
      });
      return { success: true, data: { id } };
    });
  } catch (error) {
    return fail(error);
  }
}

/** Moves a card to another column; launching sets today's launch date. */
export async function setRoadmapCardStatus(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<Result<{ status: RoadmapAdminStatus }>> {
  const parsed = roadmapStatusInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { id, status } = parsed.data;
  try {
    return await q.transaction(async (tx): Promise<Result<{ status: RoadmapAdminStatus }>> => {
      await assertAdminActor(tx, actorId);
      const [current] = await tx.select().from(featureRequests).where(eq(featureRequests.id, id)).for("update");
      if (!current) return { success: false, error: "not_found" };
      if (current.status === status) return { success: true, data: { status } };
      const [row] = await tx
        .update(featureRequests)
        .set({ status, launchedAt: launchDateFor(status, null, current.launchedAt), updatedAt: sql`now()` })
        .where(eq(featureRequests.id, id))
        .returning();
      await writeAdminAudit(tx, {
        actorId,
        sellerId: null,
        targetType: "feature_request",
        targetId: id,
        action: "set_feature_request_status",
        before: auditView(current),
        after: auditView(row!),
        reason: `Roadmap card moved to ${status}`,
      });
      return { success: true, data: { status } };
    });
  } catch (error) {
    return fail(error);
  }
}

/** Hides a card from the public page, or shows it again. Votes are kept. */
export async function setRoadmapCardHidden(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<Result<{ hidden: boolean }>> {
  const parsed = roadmapHiddenInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { id, hidden } = parsed.data;
  try {
    return await q.transaction(async (tx): Promise<Result<{ hidden: boolean }>> => {
      await assertAdminActor(tx, actorId);
      const [current] = await tx.select().from(featureRequests).where(eq(featureRequests.id, id)).for("update");
      if (!current) return { success: false, error: "not_found" };
      if ((current.hiddenAt != null) === hidden) return { success: true, data: { hidden } };
      const [row] = await tx
        .update(featureRequests)
        .set({ hiddenAt: hidden ? sql`now()` : null, updatedAt: sql`now()` })
        .where(eq(featureRequests.id, id))
        .returning();
      await writeAdminAudit(tx, {
        actorId,
        sellerId: null,
        targetType: "feature_request",
        targetId: id,
        action: hidden ? "hide_feature_request" : "unhide_feature_request",
        before: auditView(current),
        after: auditView(row!),
        reason: hidden ? "Roadmap card hidden" : "Roadmap card shown again",
      });
      return { success: true, data: { hidden } };
    });
  } catch (error) {
    return fail(error);
  }
}
