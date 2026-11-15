"use server";

import { and, db, eq, featureRequestVotes, featureRequests, isNull, sql, stores } from "@workspace/db";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { suggestFeatureSchema, voteFeatureSchema } from "./roadmap.dto";
import { countRecentSuggestions } from "./roadmap.data";
import { canVote } from "./roadmap.lib";
import type { RoadmapActionResult, RoadmapItem, RoadmapStatus } from "./roadmap.types";

/**
 * Public roadmap actions (0115). Anyone can read /roadmap; voting and
 * suggesting need an active seller, taken from the session only.
 */

const DAILY_SUGGESTION_LIMIT = 5;

function fail(error: unknown, scope: string): { success: false; error: "unauthorized" | "generic" } {
  if (isAccessError(error)) return { success: false, error: "unauthorized" };
  console.error(`[roadmap] ${scope} failed`);
  return { success: false, error: "generic" };
}

/** Adds or removes the seller's vote. Idempotent on both sides (primary key + ON CONFLICT). */
export async function toggleFeatureVote(
  input: unknown,
): Promise<RoadmapActionResult<{ voted: boolean; votes: number }>> {
  const parsed = voteFeatureSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalidInput" };
  try {
    const seller = await requireSeller();
    const requestId = parsed.data.id;
    const [request] = await db
      .select({ status: featureRequests.status })
      .from(featureRequests)
      .where(and(eq(featureRequests.id, requestId), isNull(featureRequests.hiddenAt)))
      .limit(1);
    if (!request || !canVote(request.status as RoadmapStatus)) return { success: false, error: "notVotable" };

    const removed = await db
      .delete(featureRequestVotes)
      .where(and(eq(featureRequestVotes.requestId, requestId), eq(featureRequestVotes.sellerId, seller.sellerId)))
      .returning({ requestId: featureRequestVotes.requestId });
    if (!removed.length) {
      await db
        .insert(featureRequestVotes)
        .values({ requestId, sellerId: seller.sellerId })
        .onConflictDoNothing();
    }

    const [count] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(featureRequestVotes)
      .where(eq(featureRequestVotes.requestId, requestId));
    return { success: true, data: { voted: !removed.length, votes: Number(count?.n ?? 0) } };
  } catch (error) {
    return fail(error, "vote");
  }
}

/** Creates a 'waiting' card from a seller's idea and casts their vote on it. */
export async function suggestFeature(input: unknown): Promise<RoadmapActionResult<RoadmapItem>> {
  const parsed = suggestFeatureSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalidInput" };
  try {
    const seller = await requireSeller();
    if ((await countRecentSuggestions(seller.sellerId)) >= DAILY_SUGGESTION_LIMIT) {
      return { success: false, error: "rateLimited" };
    }

    const [created] = await db
      .insert(featureRequests)
      .values({
        status: "waiting",
        category: parsed.data.category,
        title: parsed.data.title,
        description: parsed.data.description,
        sellerId: seller.sellerId,
      })
      .returning({ id: featureRequests.id, createdAt: featureRequests.createdAt });
    if (!created) return { success: false, error: "generic" };

    await db
      .insert(featureRequestVotes)
      .values({ requestId: created.id, sellerId: seller.sellerId })
      .onConflictDoNothing();

    const [store] = await db
      .select({ name: stores.name })
      .from(stores)
      .where(and(eq(stores.sellerId, seller.sellerId), isNull(stores.deletedAt)))
      .orderBy(sql`${stores.isPrimary} DESC`, stores.createdAt)
      .limit(1);

    return {
      success: true,
      data: {
        id: created.id,
        status: "waiting",
        category: parsed.data.category,
        title: parsed.data.title,
        description: parsed.data.description,
        author: store?.name ?? "",
        createdAt: created.createdAt,
        launchedAt: null,
        votes: 1,
        voted: true,
        mine: true,
      },
    };
  } catch (error) {
    return fail(error, "suggest");
  }
}
