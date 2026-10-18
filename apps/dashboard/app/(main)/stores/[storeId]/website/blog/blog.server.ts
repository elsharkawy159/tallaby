"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStoreCms } from "@workspace/cache";
import {
  deleteCmsItem,
  getCmsItem,
  listCmsItemRevisions,
  restoreCmsItemRevision,
  saveBlogPost,
} from "@workspace/lib/cms/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { BLOG_ERRORS, type BlogPostState, type BlogResult, type BlogRevision } from "./blog.dto";

/**
 * Website › Blog actions (PLAN.md §8.9, P4-16). The store id comes from the
 * page URL and is re-checked with requireStore on every call; post ids are
 * only ever looked up inside that store (@workspace/lib/cms). Publishing is
 * per post and purges only this store's public content tag.
 */

const saveLimiter = createRateLimiter({ limit: 120, windowMs: 10 * 60_000 });

type Access = Awaited<ReturnType<typeof requireStore>>;

async function withStore<T>(storeId: string, forWrite: boolean, run: (access: Access) => Promise<BlogResult<T>>): Promise<BlogResult<T>> {
  try {
    const access = await requireStore(String(storeId), { forWrite });
    return await run(access);
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    console.error("[store-blog] action failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}

async function purge(access: Access) {
  await applyInvalidation(invalidateStoreCms(access.seller.sellerId, access.store.id), { from: "dashboard", mode: "action" });
  revalidatePath(`/stores/${access.store.id}/website/blog`);
}

/** The post must be in this store's blog (not another collection). */
async function ownPost(access: Access, postId: string) {
  const found = await getCmsItem(access.seller.sellerId, access.store.id, String(postId));
  return found && found.collection.kind === "blog" ? found : null;
}

export async function savePost(
  storeId: string,
  postId: string | null,
  input: unknown,
): Promise<BlogResult<{ id: string; slug: string; state: BlogPostState; publishedAt: string | null }>> {
  return withStore(storeId, true, async (access) => {
    if (!saveLimiter.check(`blog:${access.seller.sellerId}`)) return { success: false, error: "rateLimited" };
    if (postId !== null && !(await ownPost(access, postId))) return { success: false, error: "notFound" };
    const result = await saveBlogPost(access.seller.sellerId, access.store.id, postId === null ? null : String(postId), input, access.seller.userId);
    if (!result.success) {
      return { success: false, error: BLOG_ERRORS[result.error] ?? "generic", fields: result.issues?.map((i) => i.key) };
    }
    await purge(access);
    return { success: true, data: result.data };
  });
}

export async function deletePost(storeId: string, postId: string): Promise<BlogResult<null>> {
  return withStore(storeId, true, async (access) => {
    if (!(await ownPost(access, postId))) return { success: false, error: "notFound" };
    const result = await deleteCmsItem(access.seller.sellerId, access.store.id, String(postId));
    if (!result.success) return { success: false, error: BLOG_ERRORS[result.error] ?? "generic" };
    await purge(access);
    return { success: true, data: null };
  });
}

export async function listPostRevisions(storeId: string, postId: string): Promise<BlogResult<BlogRevision[]>> {
  return withStore(storeId, false, async (access) => {
    if (!(await ownPost(access, postId))) return { success: false, error: "notFound" };
    const rows = await listCmsItemRevisions(access.seller.sellerId, access.store.id, String(postId));
    if (!rows) return { success: false, error: "notFound" };
    return { success: true, data: rows.map(({ id, reason, createdAt, title, status }) => ({ id, reason, createdAt, title, status })) };
  });
}

export async function restorePostRevision(storeId: string, postId: string, revisionId: string): Promise<BlogResult<null>> {
  return withStore(storeId, true, async (access) => {
    if (!saveLimiter.check(`blog:${access.seller.sellerId}`)) return { success: false, error: "rateLimited" };
    if (!(await ownPost(access, postId))) return { success: false, error: "notFound" };
    const result = await restoreCmsItemRevision(access.seller.sellerId, access.store.id, String(postId), String(revisionId), access.seller.userId);
    if (!result.success) return { success: false, error: BLOG_ERRORS[result.error] ?? "generic" };
    await purge(access);
    return { success: true, data: null };
  });
}
