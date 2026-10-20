/**
 * Admin writes for the tallaby.com blog (0073). Every change runs in one
 * transaction with the actor re-checked and an audit row on the platform
 * (seller_id NULL, target_type 'blog_post'). Bodies are sanitized on save and
 * again on render.
 */
import { db, desc, eq, platformBlogPosts, sql } from "@workspace/db";
import { sanitizeArticleHtml } from "@workspace/store-sections/config";
import {
  platformBlogDeleteSchema,
  platformBlogPostInputSchema,
  type PlatformBlogAdminError,
  type PlatformBlogSeo,
} from "../platform-blog/platform-blog.lib";
import { assertAdminActor, AdminActorError, writeAdminAudit, type Queryable } from "./guard.server";

/** Every post (drafts too) for the admin list, newest change first. No bodies. */
export async function listPlatformBlogPostsForAdmin(q: Queryable = db) {
  return q
    .select({
      id: platformBlogPosts.id,
      slug: platformBlogPosts.slug,
      category: platformBlogPosts.category,
      titleAr: platformBlogPosts.titleAr,
      titleEn: platformBlogPosts.titleEn,
      coverImage: platformBlogPosts.coverImage,
      status: platformBlogPosts.status,
      publishedAt: platformBlogPosts.publishedAt,
      updatedAt: platformBlogPosts.updatedAt,
    })
    .from(platformBlogPosts)
    .orderBy(desc(platformBlogPosts.updatedAt))
    .limit(500);
}

export type AdminPlatformBlogRow = Awaited<ReturnType<typeof listPlatformBlogPostsForAdmin>>[number];

/** One post with everything the editor needs, or null. */
export async function getPlatformBlogPostForAdmin(id: string, q: Queryable = db) {
  const [row] = await q.select().from(platformBlogPosts).where(eq(platformBlogPosts.id, id)).limit(1);
  if (!row) return null;
  return { ...row, seo: (row.seo ?? {}) as Partial<PlatformBlogSeo> };
}

export type AdminPlatformBlogPost = NonNullable<Awaited<ReturnType<typeof getPlatformBlogPostForAdmin>>>;

type Result<T> = { success: true; data: T } | { success: false; error: PlatformBlogAdminError };

function pgErrorCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.cause?.code ?? e?.code;
}

function fail<T>(error: unknown): Result<T> {
  if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
  const code = pgErrorCode(error);
  if (code === "23505") return { success: false, error: "slug_taken" };
  // undefined_table / undefined_column before 0073, or a null seller_id before 0069.
  if (code === "42P01" || code === "42703" || code === "23502") return { success: false, error: "migration_required" };
  throw error;
}

/** What the audit row keeps: metadata, not bodies. */
function auditView(row: { slug: string; category: string; titleAr: string; titleEn: string; status: string; publishedAt: string | null }) {
  return { slug: row.slug, category: row.category, titleAr: row.titleAr, titleEn: row.titleEn, status: row.status, publishedAt: row.publishedAt };
}

/** Creates (no `id`) or updates a post. Returns its id and slug. */
export async function savePlatformBlogPost(actorId: string, input: unknown, q: Queryable = db): Promise<Result<{ id: string; slug: string }>> {
  const parsed = platformBlogPostInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { id, ...v } = parsed.data;
  const values = {
    slug: v.slug,
    category: v.category,
    titleAr: v.titleAr,
    titleEn: v.titleEn,
    excerptAr: v.excerptAr,
    excerptEn: v.excerptEn,
    bodyAr: sanitizeArticleHtml(v.bodyAr),
    bodyEn: sanitizeArticleHtml(v.bodyEn),
    coverImage: v.coverImage || null,
    authorName: v.authorName || null,
    tags: [...new Set(v.tags)],
    readingMinutes: v.readingMinutes,
    seo: v.seo,
    status: v.status,
    publishedAt: v.publishedAt,
  };
  try {
    const outcome = await q.transaction(async (tx): Promise<Result<{ id: string; slug: string }>> => {
      await assertAdminActor(tx, actorId);
      if (!id) {
        const [row] = await tx
          .insert(platformBlogPosts)
          .values({ ...values, createdBy: actorId })
          .returning({ id: platformBlogPosts.id, slug: platformBlogPosts.slug });
        await writeAdminAudit(tx, {
          actorId,
          sellerId: null,
          targetType: "blog_post",
          targetId: row!.id,
          action: "create_blog_post",
          before: {},
          after: auditView(values),
          reason: "Blog post created",
        });
        return { success: true, data: row! };
      }
      const [current] = await tx.select().from(platformBlogPosts).where(eq(platformBlogPosts.id, id)).for("update");
      if (!current) return { success: false, error: "not_found" };
      await tx.update(platformBlogPosts).set({ ...values, updatedAt: sql`now()` }).where(eq(platformBlogPosts.id, id));
      await writeAdminAudit(tx, {
        actorId,
        sellerId: null,
        targetType: "blog_post",
        targetId: id,
        action: "update_blog_post",
        before: auditView(current),
        after: auditView(values),
        reason: "Blog post edited",
      });
      return { success: true, data: { id, slug: values.slug } };
    });
    return outcome;
  } catch (error) {
    return fail(error);
  }
}

/** Deletes a post for good. The reason goes to the audit log. */
export async function deletePlatformBlogPost(actorId: string, input: unknown, q: Queryable = db): Promise<Result<{ slug: string }>> {
  const parsed = platformBlogDeleteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { id, reason } = parsed.data;
  try {
    return await q.transaction(async (tx): Promise<Result<{ slug: string }>> => {
      await assertAdminActor(tx, actorId);
      const [current] = await tx.delete(platformBlogPosts).where(eq(platformBlogPosts.id, id)).returning();
      if (!current) return { success: false, error: "not_found" };
      await writeAdminAudit(tx, {
        actorId,
        sellerId: null,
        targetType: "blog_post",
        targetId: id,
        action: "delete_blog_post",
        before: auditView(current),
        after: {},
        reason,
      });
      return { success: true, data: { slug: current.slug } };
    });
  } catch (error) {
    return fail(error);
  }
}
