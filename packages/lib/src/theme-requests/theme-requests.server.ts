import { and, count, db, desc, eq, inArray, sql, themeRequests } from "@workspace/db";
import {
  isOwnThemeRequestImagePath,
  MAX_OPEN_THEME_REQUESTS,
  OPEN_THEME_REQUEST_STATUSES,
  themeRequestInputSchema,
  type SellerThemeRequestView,
  type ThemeRequestStatus,
} from "./theme-requests.lib";

/**
 * "Request a theme" from Website › Templates (ROADMAP.md F-77, 0156).
 * Server-only. Callers pass the session's seller and a store already checked
 * to belong to that seller (never ids from the client). The 0156 trigger adds
 * the admin bell row.
 */

export type CreateThemeRequestError = "invalid_input" | "invalid_image" | "too_many_open";
export type CreateThemeRequestResult =
  | { success: true; id: string }
  | { success: false; error: CreateThemeRequestError; issues?: string[] };

class CreateError extends Error {
  constructor(readonly code: CreateThemeRequestError) {
    super(code);
  }
}

/** How many of the seller's requests are still open (new or in progress). */
export async function countOpenThemeRequests(sellerId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(themeRequests)
    .where(and(eq(themeRequests.sellerId, sellerId), inArray(themeRequests.status, [...OPEN_THEME_REQUEST_STATUSES])));
  return Number(row?.n ?? 0);
}

/**
 * Saves one request. The open-request limit is checked under a per-seller
 * advisory lock, so two quick submits can't both pass it. Image paths must be
 * in the seller's own folder (the bucket already enforced type and size when
 * the browser uploaded them through the signed URL).
 */
export async function createThemeRequest(params: {
  sellerId: string;
  storeId: string;
  actorId: string;
  input: unknown;
}): Promise<CreateThemeRequestResult> {
  const parsed = themeRequestInputSchema.safeParse({
    ...(typeof params.input === "object" && params.input !== null ? params.input : {}),
    storeId: params.storeId,
  });
  if (!parsed.success) {
    return { success: false, error: "invalid_input", issues: parsed.error.issues.map((issue) => issue.message) };
  }
  const value = parsed.data;
  if (!value.imagePaths.every((path) => isOwnThemeRequestImagePath(params.sellerId, path))) {
    return { success: false, error: "invalid_image" };
  }

  try {
    const id = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`theme-requests:${params.sellerId}`}, 0))`);
      const [open] = await tx
        .select({ n: count() })
        .from(themeRequests)
        .where(
          and(eq(themeRequests.sellerId, params.sellerId), inArray(themeRequests.status, [...OPEN_THEME_REQUEST_STATUSES])),
        );
      if (Number(open?.n ?? 0) >= MAX_OPEN_THEME_REQUESTS) throw new CreateError("too_many_open");

      const [row] = await tx
        .insert(themeRequests)
        .values({
          sellerId: params.sellerId,
          storeId: params.storeId,
          referenceUrl: value.referenceUrl,
          description: value.description,
          note: value.note,
          imagePaths: value.imagePaths,
          requestedBy: params.actorId,
        })
        .returning({ id: themeRequests.id });
      return row!.id;
    });
    return { success: true, id };
  } catch (error) {
    if (error instanceof CreateError) return { success: false, error: error.code };
    throw error;
  }
}

/** The seller's requests, newest first (every store of the account). */
export async function listSellerThemeRequests(sellerId: string, limit = 20): Promise<SellerThemeRequestView[]> {
  const rows = await db
    .select({
      id: themeRequests.id,
      status: themeRequests.status,
      referenceUrl: themeRequests.referenceUrl,
      description: themeRequests.description,
      note: themeRequests.note,
      imageCount: sql<number>`coalesce(cardinality(${themeRequests.imagePaths}), 0)::int`,
      adminReply: themeRequests.adminReply,
      createdAt: themeRequests.createdAt,
      updatedAt: themeRequests.updatedAt,
    })
    .from(themeRequests)
    .where(eq(themeRequests.sellerId, sellerId))
    .orderBy(desc(themeRequests.createdAt))
    .limit(Math.min(Math.max(limit, 1), 50));
  return rows.map((row) => ({ ...row, status: row.status as ThemeRequestStatus, imageCount: Number(row.imageCount) }));
}
