// Deliberately NOT "use server": nothing here is invoked from the client.
// That directive turns every export into a callable Server Action endpoint and
// forces each call through the Action serialization path; this module is read
// only by the Server Component in sidebar.data.tsx, so a plain async function
// is both cheaper and a smaller surface.

import { db } from "@workspace/db";
import {
  users,
  orders,
  products,
  categories,
  brands,
  sellers,
} from "@workspace/db";
import { sql } from "drizzle-orm";
import { getAdminUser } from "@/actions/auth";
import {
  EMPTY_SIDEBAR_COUNTS,
  type SidebarCounts,
} from "./sidebar.types";

export async function getSidebarCounts(): Promise<SidebarCounts> {
  try {
    await getAdminUser();

    // One round-trip instead of 6 parallel counts (avoids pooler stampede).
    const result = await db.execute(sql`
      SELECT
        (SELECT count(*)::int FROM ${users}) AS customers,
        (SELECT count(*)::int FROM ${orders}) AS orders,
        (SELECT count(*)::int FROM ${products}) AS products,
        (SELECT count(*)::int FROM ${categories}) AS categories,
        (SELECT count(*)::int FROM ${brands}) AS brands,
        (SELECT count(*)::int FROM ${sellers}) AS sellers
    `);

    const rows = Array.isArray(result)
      ? result
      : ((result as { rows?: Array<Record<string, unknown>> }).rows ?? []);
    const row = (rows[0] ?? {}) as Record<string, unknown>;

    const orderCount = Number(row.orders ?? 0);

    return {
      dashboard: orderCount,
      customers: Number(row.customers ?? 0),
      orders: orderCount,
      products: Number(row.products ?? 0),
      categories: Number(row.categories ?? 0),
      brands: Number(row.brands ?? 0),
      sellers: Number(row.sellers ?? 0),
    };
  } catch (error) {
    console.error("Error fetching sidebar counts:", error);
    return EMPTY_SIDEBAR_COUNTS;
  }
}
