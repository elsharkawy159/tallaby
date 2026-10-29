import { and, db, desc, eq, featureRequests, isNull, sql } from "@workspace/db";
import { getSellerAccess } from "@/lib/auth/seller-access";
import { createClient } from "@/supabase/server";
import type { RoadmapCategory, RoadmapItem, RoadmapStatus, RoadmapViewer } from "./roadmap.types";

/** The page is public: a missing session is a guest, not an error. */
export async function getRoadmapViewer(): Promise<{ viewer: RoadmapViewer; sellerId: string | null }> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return { viewer: { kind: "guest" }, sellerId: null };
    const access = await getSellerAccess(data.user.id);
    return access.allowed
      ? { viewer: { kind: "seller" }, sellerId: data.user.id }
      : { viewer: { kind: "user" }, sellerId: null };
  } catch {
    return { viewer: { kind: "guest" }, sellerId: null };
  }
}

/** Visible roadmap cards with vote counts, in the viewer's language. Never cached: votes change. */
export async function getRoadmapItems(sellerId: string | null, locale: string): Promise<RoadmapItem[]> {
  const viewerId = sellerId ?? "00000000-0000-0000-0000-000000000000";
  const rows = await db
    .select({
      id: featureRequests.id,
      status: featureRequests.status,
      category: featureRequests.category,
      title: featureRequests.title,
      description: featureRequests.description,
      titleEn: featureRequests.titleEn,
      descriptionEn: featureRequests.descriptionEn,
      sellerId: featureRequests.sellerId,
      createdAt: featureRequests.createdAt,
      launchedAt: featureRequests.launchedAt,
      // Only the suggester's store name is public, never their account details.
      author: sql<string | null>`(
        SELECT s.name FROM stores s
        WHERE s.seller_id = ${featureRequests.sellerId} AND s.deleted_at IS NULL
        ORDER BY s.is_primary DESC, s.created_at ASC
        LIMIT 1
      )`,
      votes: sql<number>`(
        SELECT count(*)::int FROM feature_request_votes v WHERE v.request_id = ${featureRequests.id}
      )`,
      voted: sql<boolean>`EXISTS (
        SELECT 1 FROM feature_request_votes v
        WHERE v.request_id = ${featureRequests.id} AND v.seller_id = ${viewerId}
      )`,
    })
    .from(featureRequests)
    .where(isNull(featureRequests.hiddenAt))
    .orderBy(desc(featureRequests.createdAt));

  const en = locale === "en";
  return rows.map((row) => ({
    id: row.id,
    status: row.status as RoadmapStatus,
    category: row.category as RoadmapCategory,
    title: (en && row.titleEn) || row.title,
    description: (en && row.descriptionEn) || row.description,
    author: row.sellerId ? (row.author ?? "") : null,
    createdAt: row.createdAt,
    launchedAt: row.launchedAt,
    votes: Number(row.votes),
    voted: Boolean(row.voted),
    mine: sellerId != null && row.sellerId === sellerId,
  }));
}

/** Number of ideas a seller suggested in the last 24 hours (suggestion rate limit). */
export async function countRecentSuggestions(sellerId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(featureRequests)
    .where(
      and(
        eq(featureRequests.sellerId, sellerId),
        sql`${featureRequests.createdAt} > now() - interval '24 hours'`,
      ),
    );
  return Number(row?.n ?? 0);
}
