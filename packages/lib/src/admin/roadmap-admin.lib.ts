/**
 * Admin management of the public seller roadmap (0115,
 * dashboard.tallaby.com/roadmap). Pure: statuses, categories, input schemas
 * and the launch-date rule. The audited writes are in `./roadmap-admin.server`.
 */
import { z } from "zod";

/** The four fixed board columns, in order (feature_requests_status_check). */
export const ROADMAP_ADMIN_STATUSES = ["waiting", "planned", "in_progress", "launched"] as const;
export type RoadmapAdminStatus = (typeof ROADMAP_ADMIN_STATUSES)[number];

export const ROADMAP_ADMIN_CATEGORIES = [
  "orders",
  "payments",
  "shipping",
  "products",
  "marketing",
  "website",
  "reports",
  "other",
] as const;
export type RoadmapAdminCategory = (typeof ROADMAP_ADMIN_CATEGORIES)[number];

export const ROADMAP_STATUS_LABELS: Record<RoadmapAdminStatus, string> = {
  waiting: "Waiting",
  planned: "Planned",
  in_progress: "In progress",
  launched: "Launched",
};

export const ROADMAP_CATEGORY_LABELS: Record<RoadmapAdminCategory, string> = {
  orders: "Orders",
  payments: "Payments",
  shipping: "Shipping",
  products: "Products",
  marketing: "Marketing",
  website: "Website",
  reports: "Reports",
  other: "Other",
};

export type RoadmapAdminError = "not_admin" | "invalid_input" | "not_found" | "ref_taken" | "migration_required";

export const ROADMAP_ADMIN_ERROR_MESSAGES: Record<RoadmapAdminError | "generic", string> = {
  not_admin: "Only an active admin can do this.",
  invalid_input: "Check the form and try again.",
  not_found: "This card no longer exists. Refresh the page.",
  ref_taken: "Another card already uses that ROADMAP.md id.",
  migration_required: "Apply migration 0115 first (roadmap tables).",
  generic: "Something went wrong. Try again.",
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)));

/** Create (no `id`) or edit a card. Arabic text is required; English is optional. */
export const roadmapCardInputSchema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(ROADMAP_ADMIN_STATUSES),
  category: z.enum(ROADMAP_ADMIN_CATEGORIES),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).default(""),
  titleEn: optionalText(120),
  descriptionEn: optionalText(2000),
  roadmapRef: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  launchedAt: isoDate.optional().or(z.literal("")).transform((v) => (v ? v : null)),
});
export type RoadmapCardInput = z.input<typeof roadmapCardInputSchema>;

/** Move one card to another column. */
export const roadmapStatusInputSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(ROADMAP_ADMIN_STATUSES),
});

/** Take a card off the public page (spam, duplicates), or put it back. */
export const roadmapHiddenInputSchema = z.object({
  id: z.string().uuid(),
  hidden: z.boolean(),
});

/** Today's date in Cairo as YYYY-MM-DD. */
export function cairoToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * The launch date a card keeps after a change: a launched card keeps the
 * given (or current) date, else today; any other column has none.
 */
export function launchDateFor(
  status: RoadmapAdminStatus,
  requested: string | null,
  current: string | null,
  now = new Date(),
): string | null {
  if (status !== "launched") return null;
  return requested ?? current ?? cairoToday(now);
}
