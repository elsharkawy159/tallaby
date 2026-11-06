/**
 * Account deletion requests (ROADMAP.md F-82, migration 0157). Pure: statuses,
 * limits and input validation. Server functions are in `./server`.
 *
 * Google Play requires an app with sign-up to let people ask for their account
 * to be deleted, in the app and through a web link. A seller asks from
 * Settings; the team deletes the account within ACCOUNT_DELETION_DAYS and marks
 * the request completed in Admin.
 */
import { z } from "zod";

export const ACCOUNT_DELETION_STATUSES = ["pending", "completed", "cancelled", "declined"] as const;
export type AccountDeletionStatus = (typeof ACCOUNT_DELETION_STATUSES)[number];

export const ACCOUNT_DELETION_SOURCES = ["dashboard", "android_app"] as const;
export type AccountDeletionSource = (typeof ACCOUNT_DELETION_SOURCES)[number];

/** The promise on the public page and in the Play data-safety form. */
export const ACCOUNT_DELETION_DAYS = 30;
/** Where people without access to their account can ask (public page, Play listing). */
export const ACCOUNT_DELETION_SUPPORT_EMAIL = "omar@tallaby.com";
/** Public page (no login) linked from the Play listing. */
export const ACCOUNT_DELETION_PUBLIC_PATH = "/account-deletion";

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

/** Statuses an admin can set. `cancelled` is the seller's own action. */
export const ADMIN_ACCOUNT_DELETION_STATUSES = ["pending", "completed", "declined"] as const satisfies readonly AccountDeletionStatus[];

/** What an admin sends from the detail view. A decline needs a note: the seller sees it in Settings. */
export const accountDeletionUpdateSchema = z
  .object({
    requestId: z.string().regex(UUID_RE),
    status: z.enum(ADMIN_ACCOUNT_DELETION_STATUSES),
    note: optionalText(ACCOUNT_DELETION_NOTE_MAX),
  })
  .superRefine((value, ctx) => {
    if (value.status === "declined" && !value.note) {
      ctx.addIssue({ code: "custom", message: "note_required", path: ["note"] });
    }
  });
export type AccountDeletionUpdateInput = z.input<typeof accountDeletionUpdateSchema>;

/**
 * Whether an admin may move a request from `current` to `next`. A cancelled
 * request is the seller's decision and stays cancelled; a completed one means
 * the user is gone, so it can't be reopened.
 */
export function canAdminSetAccountDeletionStatus(current: string, next: AccountDeletionStatus): boolean {
  if (current === "cancelled" || current === "completed") return false;
  return (ADMIN_ACCOUNT_DELETION_STATUSES as readonly string[]).includes(next);
}

/** The seller's latest request, as Settings shows it (pending, or the last decline with its note). */
export type SellerAccountDeletionView = {
  id: string;
  status: AccountDeletionStatus;
  reason: string | null;
  adminNote: string | null;
  createdAt: string;
  handledAt: string | null;
};

/** The date by which a request made at `createdAt` is handled. */
export function accountDeletionDueDate(createdAt: string | Date): Date {
  const start = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return new Date(start.getTime() + ACCOUNT_DELETION_DAYS * 24 * 60 * 60 * 1000);
}
