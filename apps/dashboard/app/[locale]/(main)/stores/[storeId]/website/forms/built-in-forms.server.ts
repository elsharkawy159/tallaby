"use server";

import { and, db, eq, isNull, sql, stores } from "@workspace/db";
import { createStoreForm, listStoreFormDefinitions } from "@workspace/lib/store-forms/server";
import { starterFormInput } from "@workspace/lib/store-forms/starter";
import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { isBuiltInFormKind, parseBuiltInFormPointers, resolveBuiltInForms } from "./built-in-forms.lib";
import type { FormsActionResult, FormsErrorKey } from "./forms.dto";

/**
 * Website › Forms hub: opens a built-in storefront form (newsletter, contact)
 * in the form editor. storeId is explicit and re-checked with requireStore;
 * the form is the one the hub already shows (saved pointer, starter name or
 * starter shape), or, when the store has none, a new one made from the
 * starter copy in the store's language. The id is then kept in
 * `stores.settings.builtInForms` (other keys kept), so renaming the form or
 * changing its fields never loses it. The storefront never reads that key, so
 * no storefront cache changes.
 */

const openLimiter = createRateLimiter({ limit: 60, windowMs: 10 * 60_000 });

const ERRORS: Record<string, FormsErrorKey> = {
  not_found: "notFound",
  store_read_only: "readOnly",
  invalid_input: "invalidInput",
  limit_reached: "limitReached",
};

export async function openBuiltInForm(storeId: string, kind: unknown): Promise<FormsActionResult<{ id: string }>> {
  if (!isBuiltInFormKind(kind)) return { success: false, error: "invalidInput" };
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!openLimiter.check(`built-in-form:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const ownStore = and(eq(stores.id, store.id), eq(stores.sellerId, seller.sellerId), isNull(stores.deletedAt));
    const [[row], forms] = await Promise.all([
      db.select({ settings: stores.settings, defaultLocale: stores.defaultLocale }).from(stores).where(ownStore).limit(1),
      listStoreFormDefinitions(seller.sellerId, store.id),
    ]);
    if (!row) return { success: false, error: "notFound" };
    const pointers = parseBuiltInFormPointers(row.settings);

    let id = resolveBuiltInForms(pointers, forms)[kind]?.id;
    if (!id) {
      const input = starterFormInput(kind, row.defaultLocale === "en" ? "en" : "ar");
      if (!input) return { success: false, error: "generic" };
      const created = await createStoreForm(seller.sellerId, store.id, input);
      if (!created.success) return { success: false, error: ERRORS[created.error] ?? "generic" };
      id = created.data.id;
    }

    if (pointers[kind] !== id) {
      await db
        .update(stores)
        .set({
          settings: sql`coalesce(${stores.settings}, '{}'::jsonb) || jsonb_build_object('builtInForms', (CASE WHEN jsonb_typeof(${stores.settings} -> 'builtInForms') = 'object' THEN ${stores.settings} -> 'builtInForms' ELSE '{}'::jsonb END) || jsonb_build_object(${kind}::text, ${id}::text))`,
        })
        .where(ownStore);
    }

    revalidateDashboardPath(`/stores/${store.id}/website/forms`);
    return { success: true, data: { id } };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    console.error("[store-forms] open built-in form failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
