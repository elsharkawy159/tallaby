"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  createStoreForm,
  deleteFormSubmissions,
  deleteStoreForm,
  exportFormSubmissionsCsv,
  setSubmissionStatus,
  updateStoreForm,
} from "@workspace/lib/store-forms/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { INBOX_STATUSES, type FormsActionResult, type FormsErrorKey, type InboxFilter } from "./forms.dto";

/**
 * Website › Forms (PLAN.md §8.4, P4-10). Every action takes the explicit
 * storeId and re-checks it with requireStore; form and submission ids are
 * then matched against that store by @workspace/lib/store-forms/server, so a
 * foreign id is "not found". Never trusts a seller id from the client.
 */

const writeLimiter = createRateLimiter({ limit: 120, windowMs: 10 * 60_000 });
const exportLimiter = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });

const ERRORS: Record<string, FormsErrorKey> = {
  not_found: "notFound",
  store_read_only: "readOnly",
  invalid_input: "invalidInput",
  limit_reached: "limitReached",
};

function accessError(error: unknown): FormsErrorKey | null {
  if (!isAccessError(error)) return null;
  return error.code === "store_read_only" ? "readOnly" : "notFound";
}

const formsPath = (storeId: string) => `/stores/${storeId}/website/forms`;

export async function createForm(storeId: string, input: unknown): Promise<FormsActionResult<{ id: string }>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!writeLimiter.check(seller.sellerId)) return { success: false, error: "rateLimited" };
    const result = await createStoreForm(seller.sellerId, store.id, input as never);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    revalidatePath(formsPath(store.id));
    return { success: true, data: result.data };
  } catch (error) {
    const key = accessError(error);
    if (key) return { success: false, error: key };
    console.error("[store-forms] create failed", error);
    return { success: false, error: "generic" };
  }
}

export async function saveForm(storeId: string, formId: string, input: unknown): Promise<FormsActionResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!writeLimiter.check(seller.sellerId)) return { success: false, error: "rateLimited" };
    const result = await updateStoreForm(seller.sellerId, store.id, String(formId), input as never);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    revalidatePath(formsPath(store.id));
    return { success: true, data: undefined };
  } catch (error) {
    const key = accessError(error);
    if (key) return { success: false, error: key };
    console.error("[store-forms] save failed", error);
    return { success: false, error: "generic" };
  }
}

export async function deleteForm(storeId: string, formId: string): Promise<FormsActionResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    const result = await deleteStoreForm(seller.sellerId, store.id, String(formId));
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    revalidatePath(formsPath(store.id));
    return { success: true, data: undefined };
  } catch (error) {
    const key = accessError(error);
    if (key) return { success: false, error: key };
    console.error("[store-forms] delete failed", error);
    return { success: false, error: "generic" };
  }
}

/** Inbox actions work on archived stores too (the owner can still read and erase PII). */
export async function updateSubmissionsStatus(storeId: string, ids: unknown, status: unknown): Promise<FormsActionResult<{ updated: number }>> {
  try {
    const { seller, store } = await requireStore(String(storeId));
    if (!Array.isArray(ids) || !INBOX_STATUSES.includes(status as never)) return { success: false, error: "invalidInput" };
    const result = await setSubmissionStatus(seller.sellerId, store.id, ids.map(String), status as (typeof INBOX_STATUSES)[number]);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    revalidatePath(formsPath(store.id), "layout");
    return { success: true, data: result.data };
  } catch (error) {
    const key = accessError(error);
    if (key) return { success: false, error: key };
    console.error("[store-forms] status update failed", error);
    return { success: false, error: "generic" };
  }
}

export async function deleteSubmissions(storeId: string, ids: unknown): Promise<FormsActionResult<{ deleted: number }>> {
  try {
    const { seller, store } = await requireStore(String(storeId));
    if (!Array.isArray(ids)) return { success: false, error: "invalidInput" };
    const result = await deleteFormSubmissions(seller.sellerId, store.id, ids.map(String));
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    revalidatePath(formsPath(store.id), "layout");
    return { success: true, data: result.data };
  } catch (error) {
    const key = accessError(error);
    if (key) return { success: false, error: key };
    console.error("[store-forms] delete submissions failed", error);
    return { success: false, error: "generic" };
  }
}

/** CSV of the filtered submissions (cells escaped against formula injection in the lib). */
export async function exportSubmissions(storeId: string, filter: InboxFilter): Promise<FormsActionResult<{ csv: string }>> {
  try {
    const { seller, store } = await requireStore(String(storeId));
    if (!exportLimiter.check(seller.sellerId)) return { success: false, error: "rateLimited" };
    const t = await getTranslations("storeForms.inbox");
    const status = INBOX_STATUSES.includes(filter?.status as never) ? (filter.status as (typeof INBOX_STATUSES)[number]) : "all";
    const csv = await exportFormSubmissionsCsv(
      seller.sellerId,
      store.id,
      { formId: typeof filter?.formId === "string" ? filter.formId : null, status },
      { date: t("csvDate"), form: t("csvForm"), status: t("csvStatus") },
    );
    if (csv === null) return { success: false, error: "notFound" };
    return { success: true, data: { csv } };
  } catch (error) {
    const key = accessError(error);
    if (key) return { success: false, error: key };
    console.error("[store-forms] export failed", error);
    return { success: false, error: "generic" };
  }
}
