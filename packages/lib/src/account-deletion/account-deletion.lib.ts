/**
 * Account deletion (ROADMAP.md F-82, migration 0157). Pure: statuses, limits
 * and input validation. Server functions are in `./server`.
 *
 * Owner's rules (2026-11-06): the account is deleted from the seller's point
 * of view at once (closed: signed out, banned, storefronts offline) and the
 * data is kept ACCOUNT_DELETION_DAYS days, then purged by the dashboard's
 * account-deletions cron. The store wallet balance is lost (nothing is paid
 * out). Within those days the team can restore the account from Admin.
 */
import { z } from "zod";

export const ACCOUNT_DELETION_STATUSES = ["scheduled", "completed", "restored"] as const;
export type AccountDeletionStatus = (typeof ACCOUNT_DELETION_STATUSES)[number];

export const ACCOUNT_DELETION_SOURCES = ["dashboard", "android_app"] as const;
export type AccountDeletionSource = (typeof ACCOUNT_DELETION_SOURCES)[number];

/** Days the data is kept after the account is closed (public page, Play data-safety form, 0157 default). */
export const ACCOUNT_DELETION_DAYS = 30;
/** Where people ask for help or a restore (public page, Play listing). Owner, 2026-11-06. */
export const ACCOUNT_DELETION_SUPPORT_EMAIL = "omar@tallaby.com";
/** Public page (no login) linked from the Play listing. */
export const ACCOUNT_DELETION_PUBLIC_PATH = "/account-deletion";
/** The auth ban that keeps a closed account signed out until the purge (Supabase `ban_duration`). */
export const ACCOUNT_DELETION_BAN_DURATION = "876000h";

/** Same caps as the 0157 CHECK constraints. */
export const ACCOUNT_DELETION_REASON_MAX = 1000;
export const ACCOUNT_DELETION_NOTE_MAX = 1000;
export const ACCOUNT_DELETION_EMAIL_MAX = 320;
export const ACCOUNT_DELETION_NAME_MAX = 200;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isAccountDeletionStatus(value: unknown): value is AccountDeletionStatus {
  return typeof value === "string" && (ACCOUNT_DELETION_STATUSES as readonly string[]).includes(value);
}

/** Trims, drops empty strings and cuts to `max` characters (snapshots must fit the CHECKs). */
export function clipText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, max) : null;
}

const optionalText = (max: number) =>
  z
    .string()
    .max(max * 2)
    .optional()
    .nullable()
    .transform((value) => {
      const trimmed = (value ?? "").trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine((value) => value === null || value.length <= max, { message: "too_long" });

/** What the seller sends from Settings. `confirmed` must be true (the checkbox). */
export const accountDeletionRequestSchema = z.object({
  reason: optionalText(ACCOUNT_DELETION_REASON_MAX),
  confirmed: z.literal(true),
});
export type AccountDeletionRequestInput = z.input<typeof accountDeletionRequestSchema>;

/** What an admin sends to restore a closed account. */
export const accountRestoreSchema = z.object({
  requestId: z.string().regex(UUID_RE),
  note: optionalText(ACCOUNT_DELETION_NOTE_MAX),
});
export type AccountRestoreInput = z.input<typeof accountRestoreSchema>;

/**
 * The seller status to put back on restore. A closed account was suspended by
 * the close itself, so only a status the seller really had before counts;
 * anything unknown falls back to approved.
 */
export function restoredSellerStatus(previous: string | null | undefined): "pending" | "approved" | "suspended" | "restricted" {
  return previous === "pending" || previous === "approved" || previous === "suspended" || previous === "restricted"
    ? previous
    : "approved";
}

/** A restore is possible only while the data still exists (scheduled, before the purge ran). */
export function canRestoreAccountDeletion(status: string): boolean {
  return status === "scheduled";
}

/** The date the data is purged for a request made at `createdAt`. */
export function accountDeletionDueDate(createdAt: string | Date): Date {
  const start = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return new Date(start.getTime() + ACCOUNT_DELETION_DAYS * 24 * 60 * 60 * 1000);
}

/** Supabase auth errors that mean the user is already gone (the purge can mark the request completed). */
export function isAuthUserMissingError(error: { message?: string; status?: number; code?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.status === 404 || error.code === "user_not_found") return true;
  return /user not found/i.test(error.message ?? "");
}
