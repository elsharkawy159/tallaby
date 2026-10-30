/**
 * Product Trash (0123, ROADMAP.md F-35): a deleted product waits here for 30
 * days, hidden everywhere (status 'draft'), then a daily job deletes it.
 */

export const TRASH_RETENTION_DAYS = 30;
/** Most products one Trash action takes (bulk delete, restore, delete forever). */
export const TRASH_MAX_IDS = 100;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ProductStatusValue = "draft" | "pending" | "active" | "rejected";

/** Whole days until the job deletes it: 30 on the day it was trashed, 0 on its last day. */
export function trashDaysLeft(deletedAt: string | Date, now: Date = new Date()): number {
  const deleted = new Date(deletedAt).getTime();
  if (!Number.isFinite(deleted)) return 0;
  const left = Math.ceil((deleted + TRASH_RETENTION_DAYS * DAY_MS - now.getTime()) / DAY_MS);
  return Math.min(TRASH_RETENTION_DAYS, Math.max(0, left));
}

/** The moment before which a trashed product is due for deletion. */
export function trashPurgeCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - TRASH_RETENTION_DAYS * DAY_MS);
}

/**
 * The status Restore puts back: the one it had, except that it comes back as
 * a draft when it can't go live right now (no photo, or the seller may not
 * publish), like the Publish switch.
 */
export function restoredStatus(
  trashedStatus: ProductStatusValue | null | undefined,
  { canPublish, hasImage }: { canPublish: boolean; hasImage: boolean },
): ProductStatusValue {
  const status = trashedStatus ?? "draft";
  if (status === "active" && !(canPublish && hasImage)) return "draft";
  return status;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Unique, valid ids, at most TRASH_MAX_IDS; anything else is dropped. */
export function trashIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const valid = ids.filter((id): id is string => typeof id === "string" && UUID_RE.test(id)).map((id) => id.toLowerCase());
  return [...new Set(valid)].slice(0, TRASH_MAX_IDS);
}
