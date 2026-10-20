import type { FormInput, SubmissionStatus } from "@workspace/lib/store-forms";

export type { FormsActionResult, FormsErrorKey } from "@workspace/store-editor/editor.dto";

export type FormEditorValue = FormInput;

/** The inbox statuses the seller can set (spam exists in the table but has no UI yet). */
export const INBOX_STATUSES = ["new", "read", "archived"] as const satisfies readonly SubmissionStatus[];
export type InboxStatus = (typeof INBOX_STATUSES)[number];

export type InboxFilter = { formId: string | null; status: InboxStatus | "all" };
