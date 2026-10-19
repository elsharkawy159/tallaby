// Plain server reads (not "use server": nothing here is called from the client).
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { logServerError } from "@workspace/db/log";
import type { FulfillmentQueueFilters } from "@workspace/lib/fulfillment";
import {
  listFulfillmentQueueSellerIds,
  listFulfillmentSellerQueue,
} from "@workspace/lib/fulfillment/server";

/** The per-seller queue page (docs/admin-saas.md §3.1). Never cached: it is a work queue. */
export async function getFulfillmentSellerQueue(filters: FulfillmentQueueFilters) {
  await getCurrentAdminUser();
  try {
    return { ...(await listFulfillmentSellerQueue(filters)), failed: false };
  } catch (error) {
    logServerError("admin", "fulfillment seller queue failed", {}, error);
    return { rows: [], total: 0, pageSize: 25, failed: true };
  }
}

/** Ordered seller ids of the current queue view, for previous/next on the detail page. */
export async function getFulfillmentQueueIds(filters: Omit<FulfillmentQueueFilters, "page">) {
  await getCurrentAdminUser();
  try {
    return await listFulfillmentQueueSellerIds(filters);
  } catch (error) {
    logServerError("admin", "fulfillment queue ids failed", {}, error);
    return [];
  }
}
