"use server";

import { cache } from "react";
import { getUser } from "@/actions/auth";
import { loadOrderLock } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { countSidebarItems } from "./sidebar-counts.server";
import {
  EMPTY_SIDEBAR_COUNTS,
  type SidebarCounts,
} from "./sidebar.types";

// Once per request (React cache()); a "use server" file may only export async functions, so the memo stays inside.
const loadSidebarCounts = cache(async (): Promise<SidebarCounts> => {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      return EMPTY_SIDEBAR_COUNTS;
    }

    const sellerId = session.user.id;
    // The lock, the selected store and the catalog switch don't depend on each other.
    const [lock, { selected }, catalogSplit] = await Promise.all([
      loadOrderLock(sellerId),
      getSellerStores(),
      isSwitchOn("stores_catalog_split"),
    ]);
    return await countSidebarItems(sellerId, {
      // A seller who isn't activated gets no count that follows from orders (ROADMAP.md F-68).
      ordersLocked: lock.ordersLocked,
      storeId: selected?.id ?? null,
      catalogSplit,
    });
  } catch (error) {
    console.error("Error fetching sidebar counts:", error);
    return EMPTY_SIDEBAR_COUNTS;
  }
});

export async function getSidebarCounts(): Promise<SidebarCounts> {
  return loadSidebarCounts();
}
