// Deliberately NOT "use server": nothing here is invoked from the client.
// That directive turns every export into a callable Server Action endpoint and
// forces each call through the Action serialization path; this module is read
// only by the Server Component in sidebar.data.tsx, so a plain async function
// is both cheaper and a smaller surface.

import { cache } from "react";
import { db } from "@workspace/db";
import {
  users,
  orders,
  products,
  sellers,
  carts,
  cartItems,
  sellerWalletTopUps,
  sellerFulfillmentServices,
  adCampaignRequests,
  storeIntegrations,
  sellerCustomDomains,
} from "@workspace/db";
import { sql } from "drizzle-orm";
import { getAdminUser } from "@/actions/auth";
import {
  EMPTY_SIDEBAR_COUNTS,
  type SidebarCounts,
} from "./sidebar.types";

/**
 * Admin work-queue counts, shared by the sidebar badges and the home action
 * centre. React `cache()` makes both read one result per request.
 */
export const getSidebarCounts = cache(async function getSidebarCounts(): Promise<SidebarCounts> {
  try {
    await getAdminUser();

    // One round-trip instead of parallel counts (avoids pooler stampede).
    // "Today" is the Cairo calendar day, not the server's UTC day.
    const result = await db.execute(sql`
      SELECT
        (SELECT count(*)::int FROM ${users}
          WHERE ${users.isGuest} = false
            AND ${users.createdAt} >= (date_trunc('day', now() AT TIME ZONE 'Africa/Cairo') AT TIME ZONE 'Africa/Cairo')
        ) AS new_customers,
        (SELECT count(*)::int FROM ${carts}
          WHERE ${carts.status} = 'active'
            AND ${carts.reminderSentAt} IS NULL
            AND EXISTS (
              SELECT 1 FROM ${cartItems}
              WHERE ${cartItems.cartId} = ${carts.id} AND ${cartItems.quantity} > 0
            )
        ) AS unreminded_carts,
        (SELECT count(*)::int FROM ${orders} WHERE ${orders.status} = 'pending') AS pending_orders,
        (SELECT count(*)::int FROM ${products} WHERE ${products.status} = 'pending') AS pending_products,
        (SELECT count(*)::int FROM ${sellers} WHERE ${sellers.status} = 'pending') AS pending_sellers,
        (SELECT count(*)::int FROM ${sellerWalletTopUps}
          WHERE ${sellerWalletTopUps.status} = 'pending'
            AND ${sellerWalletTopUps.provider} IN ('vodafone_cash', 'instapay')
        ) AS pending_store_top_ups,
        (SELECT count(DISTINCT ${sellerFulfillmentServices.sellerId})::int FROM ${sellerFulfillmentServices}
          WHERE ${sellerFulfillmentServices.status} IN ('requested', 'under_review', 'awaiting_agreement')
        ) AS fulfillment_open_sellers,
        (SELECT count(*)::int FROM ${adCampaignRequests} WHERE ${adCampaignRequests.status} = 'pending') AS pending_ad_requests,
        (SELECT count(*)::int FROM ${storeIntegrations} WHERE ${storeIntegrations.status} = 'error') AS integration_errors,
        (SELECT count(*)::int FROM ${sellerCustomDomains} WHERE ${sellerCustomDomains.status} = 'failed') AS failing_domains
    `);

    const rows = Array.isArray(result)
      ? result
      : ((result as { rows?: Array<Record<string, unknown>> }).rows ?? []);
    const row = (rows[0] ?? {}) as Record<string, unknown>;

    return {
      newCustomers: Number(row.new_customers ?? 0),
      unremindedCarts: Number(row.unreminded_carts ?? 0),
      pendingOrders: Number(row.pending_orders ?? 0),
      pendingProducts: Number(row.pending_products ?? 0),
      pendingSellers: Number(row.pending_sellers ?? 0),
      pendingStoreTopUps: Number(row.pending_store_top_ups ?? 0),
      fulfillmentOpenSellers: Number(row.fulfillment_open_sellers ?? 0),
      pendingAdRequests: Number(row.pending_ad_requests ?? 0),
      integrationErrors: Number(row.integration_errors ?? 0),
      failingDomains: Number(row.failing_domains ?? 0),
    };
  } catch (error) {
    console.error("Error fetching sidebar counts:", error);
    return EMPTY_SIDEBAR_COUNTS;
  }
});
