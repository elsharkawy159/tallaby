import { db, sql } from "@workspace/db";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { getSetupPromptRow } from "./home.queries";
import {
  applySetupPromptEvent,
  decideSetupPrompt,
  parseSetupPromptState,
  recordCompletedSteps,
  type SetupPromptEvent,
  type SetupPromptSync,
} from "./setup-prompts.lib";

/**
 * One read and, only when something changed, one write. The seller comes from
 * the session; the store is one of theirs (getSellerStores ignores foreign ids).
 */
export async function syncSetupPrompts(
  sellerId: string,
  event: SetupPromptEvent | null,
  guideDismissedHere: boolean,
): Promise<SetupPromptSync> {
  const { selected } = await getSellerStores();
  const storeId = selected?.id ?? null;
  const row = await getSetupPromptRow(sellerId, storeId);
  if (!row) return { prompt: null, finished: false };

  const saved = parseSetupPromptState(row.state);
  let state = recordCompletedSteps(saved, row.flags, storeId);
  if (event) state = applySetupPromptEvent(state, event);
  // The guide's hide button sets a cookie on one device; saving it here covers the others.
  if (guideDismissedHere && !state.guideDismissed) state = { ...state, guideDismissed: true };

  if (JSON.stringify(state) !== JSON.stringify(saved)) {
    await db.execute(sql`
      UPDATE sellers
         SET seller_metrics = coalesce(seller_metrics, '{}'::jsonb) || jsonb_build_object('setupPrompts', ${JSON.stringify(state)}::jsonb)
       WHERE id = ${sellerId}
    `);
  }
  return decideSetupPrompt(row.flags, storeId, state);
}
