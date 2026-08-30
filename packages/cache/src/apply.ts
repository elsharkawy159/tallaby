import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { broadcastInvalidation, type AppId } from "./broadcast";
import type { CacheInvalidation } from "./invalidate";

export interface ApplyInvalidationContext {
  /** Which deployment is applying this invalidation. */
  from: AppId;
  /**
   * "action": called from inside a Server Action. Uses updateTag() locally
   *   for read-your-own-writes — the mutating user sees their change on the
   *   very next render, not a stale cached one.
   * "route": called from a Route Handler (the /api/revalidate webhook
   *   receiver, or any other route-context invalidation). updateTag() can
   *   only be called from a Server Action, so this path uses
   *   revalidateTag(tag, "max") — Next 16's stale-while-revalidate purge.
   */
  mode: "action" | "route";
}

/**
 * The single entry point for turning a CacheInvalidation descriptor into
 * real cache purges: revalidates locally, then fans the same invalidation
 * out to the other two deployments (three separate Next.js caches — see
 * docs/caching-and-data-fetching.md for why a webhook and not a shared
 * cache store).
 *
 * This never throws — a local revalidateTag/updateTag call cannot fail in
 * a way that should abort an already-committed mutation, and a dropped
 * cross-app broadcast is bounded by each cached query's TTL.
 */
export async function applyInvalidation(
  inv: CacheInvalidation,
  ctx: ApplyInvalidationContext
): Promise<void> {
  for (const tag of inv.tags) {
    if (ctx.mode === "action") {
      updateTag(tag);
    } else {
      revalidateTag(tag, "max");
    }
  }
  for (const { path, type } of inv.paths) {
    revalidatePath(path, type);
  }

  await broadcastInvalidation(inv, ctx.from);
}
