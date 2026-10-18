import type { FormInput, SubmissionStatus } from "@workspace/lib/store-forms";

/** Error keys under `storeForms.errors.*`. */
export type FormsErrorKey = "invalidInput" | "readOnly" | "notFound" | "limitReached" | "rateLimited" | "generic";

export type FormsActionResult<T = undefined> = { success: true; data: T } | { success: false; error: FormsErrorKey };

export type FormEditorValue = FormInput;

/** The inbox statuses the seller can set (spam exists in the table but has no UI yet). */
export const INBOX_STATUSES = ["new", "read", "archived"] as const satisfies readonly SubmissionStatus[];
export type InboxStatus = (typeof INBOX_STATUSES)[number];

export type InboxFilter = { formId: string | null; status: InboxStatus | "all" };
