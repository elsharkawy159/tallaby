"use server";

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

    const [
      customersResult,
      orderCountResult,
      productCountResult,
      categoryCountResult,
      brandCountResult,
      sellerCountResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(orders),
      db.select({ count: sql<number>`count(*)` }).from(products),
      db.select({ count: sql<number>`count(*)` }).from(categories),
      db.select({ count: sql<number>`count(*)` }).from(brands),
      db.select({ count: sql<number>`count(*)` }).from(sellers),
    ]);

    const orderCount = Number(orderCountResult[0]?.count ?? 0);

    return {
      dashboard: orderCount,
      customers: Number(customersResult[0]?.count ?? 0),
      orders: orderCount,
      products: Number(productCountResult[0]?.count ?? 0),
      categories: Number(categoryCountResult[0]?.count ?? 0),
      brands: Number(brandCountResult[0]?.count ?? 0),
      sellers: Number(sellerCountResult[0]?.count ?? 0),
    };
  } catch (error) {
    console.error("Error fetching sidebar counts:", error);
    return EMPTY_SIDEBAR_COUNTS;
  }
}
