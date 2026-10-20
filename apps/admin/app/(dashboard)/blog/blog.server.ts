"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateMarketingBlog } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { deletePlatformBlogPost, savePlatformBlogPost } from "@workspace/lib/admin/server";
import { adminActorId, type AdminActionResult } from "../_lib/saas-admin.server";
import { BLOG_ERROR_MESSAGES, type BlogActionResult } from "./blog.dto";

const fail = (code: string) => ({ success: false as const, error: BLOG_ERROR_MESSAGES[code] ?? "Something went wrong. Try again." });

async function refresh() {
  await applyInvalidation(invalidateMarketingBlog(), { from: "admin", mode: "action" });
  revalidatePath("/blog");
}

/** Creates or updates a tallaby.com blog post (0073). Audited. */
export async function saveBlogPostAction(input: unknown): Promise<BlogActionResult> {
  const actorId = await adminActorId("canManageProducts");
  if (!actorId) return fail("not_admin");
  try {
    const result = await savePlatformBlogPost(actorId, input);
    if (!result.success) return fail(result.error);
    await refresh();
    return { success: true, message: "Post saved", id: result.data.id };
  } catch (error) {
    logServerError("admin", "blog post save failed", {}, error);
    return fail("generic");
  }
}

/** Deletes a post for good. The reason is saved in the audit log. */
export async function deleteBlogPostAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageProducts");
  if (!actorId) return fail("not_admin");
  try {
    const result = await deletePlatformBlogPost(actorId, input);
    if (!result.success) return fail(result.error);
    await refresh();
    return { success: true, message: "Post deleted and logged" };
  } catch (error) {
    logServerError("admin", "blog post delete failed", {}, error);
    return fail("generic");
  }
}
