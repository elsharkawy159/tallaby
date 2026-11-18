import { getSellerStores } from "@/lib/stores/current-store.server";
import { getSetupPromptRow } from "./home.queries";
import { pickSetupNextStep, type SetupNextStep } from "./setup-next-step.lib";

/**
 * The header's next setup step for the store selected in the sidebar: one
 * light read (the setup flags). The seller comes from the caller's session; the
 * store is always one of theirs (getSellerStores ignores foreign ids).
 */
export async function loadSetupNextStep(sellerId: string): Promise<SetupNextStep | null> {
  const { selected } = await getSellerStores();
  const storeId = selected?.id ?? null;
  const row = await getSetupPromptRow(sellerId, storeId);
  return row ? pickSetupNextStep(row.flags, storeId) : null;
}
