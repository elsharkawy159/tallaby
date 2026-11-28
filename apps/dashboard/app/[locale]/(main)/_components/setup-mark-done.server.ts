"use server";

import { z } from "zod";
import { db, sql } from "@workspace/db";
import { setupMarkScope, STORE_SETUP_STEP_KEYS, type StoreSetupStepKey } from "@workspace/lib/sellers";
import { AccessError, requireSeller, requireStore } from "@/lib/auth/require-seller.server";
import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";

const markSchema = z.object({
  step: z.enum(STORE_SETUP_STEP_KEYS as [StoreSetupStepKey, ...StoreSetupStepKey[]]),
  storeId: z.string().uuid().nullable(),
  done: z.boolean(),
});

/**
 * "Mark as done" (and its undo) on a home setup step (owner, 2026-11-28). The
 * mark lives in `sellers.seller_metrics.setupMarkedDone`: the wallet under
 * "account", a store step under its store's id, which must be one of the
 * session seller's stores (rule 5). One atomic jsonb update; marking twice is
 * a no-op.
 */
export async function setSetupStepMarkedDone(input: {
  step: StoreSetupStepKey;
  storeId: string | null;
  done: boolean;
}): Promise<{ success: boolean }> {
  const parsed = markSchema.safeParse(input);
  if (!parsed.success) return { success: false };
  const { step, storeId, done } = parsed.data;

  try {
    const sellerId =
      step === "wallet"
        ? (await requireSeller()).sellerId
        : storeId
          ? (await requireStore(storeId)).seller.sellerId
          : null;
    const scope = setupMarkScope(step, storeId);
    if (!sellerId || !scope) return { success: false };

    const current = sql`(CASE WHEN jsonb_typeof(seller_metrics -> 'setupMarkedDone' -> ${scope}::text) = 'array'
      THEN seller_metrics -> 'setupMarkedDone' -> ${scope}::text ELSE '[]'::jsonb END)`;
    const without = sql`(SELECT coalesce(jsonb_agg(e), '[]'::jsonb) FROM jsonb_array_elements_text(${current}) e WHERE e <> ${step}::text)`;
    const next = done ? sql`(${without} || jsonb_build_array(${step}::text))` : without;

    await db.execute(sql`
      UPDATE sellers
         SET seller_metrics = jsonb_set(
               coalesce(seller_metrics, '{}'::jsonb)
                 || CASE WHEN jsonb_typeof(seller_metrics -> 'setupMarkedDone') = 'object'
                      THEN '{}'::jsonb ELSE '{"setupMarkedDone": {}}'::jsonb END,
               ARRAY['setupMarkedDone', ${scope}::text],
               ${next})
       WHERE id = ${sellerId}
    `);
  } catch (error) {
    if (error instanceof AccessError) return { success: false };
    throw error;
  }

  revalidateDashboardPath("/");
  return { success: true };
}
