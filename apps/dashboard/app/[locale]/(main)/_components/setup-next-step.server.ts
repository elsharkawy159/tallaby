import { cache } from "react";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { getSetupPromptRow } from "./home.queries";
import { pickSetupNextStep, type SetupNextStep } from "./setup-next-step.lib";

/**
 * The header's next setup step for the store selected in the sidebar: one
 * light read (the setup flags). The seller comes from the caller's session; the
 * store is always one of theirs (getSellerStores ignores foreign ids). Once per
 * request (React cache()).
 */
export const loadSetupNextStep = cache(async (sellerId: string): Promise<SetupNextStep | null> => {
  // The catalog switch (per-request memo) is read alongside the stores, not after them: getSetupPromptRow needs it.
  const [{ selected }] = await Promise.all([getSellerStores(), isSwitchOn("stores_catalog_split")]);
  const storeId = selected?.id ?? null;
  const row = await getSetupPromptRow(sellerId, storeId);
  return row ? pickSetupNextStep(row.flags, storeId) : null;
});
