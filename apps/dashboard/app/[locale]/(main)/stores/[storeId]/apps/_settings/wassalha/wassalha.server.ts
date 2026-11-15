"use server";

import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { logServerError } from "@workspace/db/log";
import { saveWassalhaSettings as save, type WassalhaOverview } from "@workspace/lib/integrations/server";
import { requireStore } from "@/lib/auth/require-seller.server";
import { afterAppChange, appsAccessError, appsSaveLimiter } from "../../apps-action.lib";
import type { StoreAppsErrorKey, StoreAppsResult } from "../../apps.dto";

/** Store › Apps › Wassalha (F-12c): public account details only, validated in @workspace/lib. */

const ERRORS: Record<string, StoreAppsErrorKey> = {
  invalid_settings: "invalidSettings",
  not_available: "notAvailable",
  store_read_only: "readOnly",
  not_found: "notFound",
};

export type WassalhaForm = {
  postId: string;
  merchantName: string;
  warehouseName: string;
  senderName: string;
  hasPod: boolean;
  volume: string;
  note: string;
};

export async function saveWassalha(storeId: string, input: WassalhaForm): Promise<StoreAppsResult<WassalhaOverview>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const note = typeof input?.note === "string" ? input.note.trim() : "";
    const result = await save(seller.sellerId, seller.userId, store.id, {
      postId: input?.postId,
      merchantName: input?.merchantName,
      warehouseName: input?.warehouseName,
      senderName: input?.senderName,
      hasPod: input?.hasPod === true,
      volume: input?.volume,
      ...(note && { note }),
    });
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };

    await afterAppChange(seller.sellerId, store.id);
    revalidateDashboardPath(`/stores/${store.id}/apps/wassalha`);
    revalidateDashboardPath(`/stores/${store.id}/apps/wassalha/settings`);
    revalidateDashboardPath(`/stores/${store.id}/shipping`);
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    logServerError("integration", "wassalha save failed", { storeId: String(storeId) }, error);
    return { success: false, error: "generic" };
  }
}
