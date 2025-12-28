"use server";

import { db } from "@workspace/db";
import { users, orders, userAddresses } from "@workspace/db";
import { eq, and, desc, sql, gte, lte, like, or } from "drizzle-orm";
import { getAdminUser } from "./auth";

export async function getAllCustomers(params?: {
  role?: string;
  isVerified?: boolean;
  isSuspended?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    await getAdminUser(); // Verify admin access

    const conditions = [];

    if (params?.role) {
      conditions.push(eq(users.role, params.role as any));
    }

    if (params?.isVerified !== undefined) {
      conditions.push(eq(users.isVerified, params.isVerified));
    }

    if (params?.isSuspended !== undefined) {
      conditions.push(eq(users.isSuspended, params.isSuspended));
    }

    if (params?.search) {
      conditions.push(
        or(
          like(users.firstName, `%${params.search}%`),
          like(users.lastName, `%${params.search}%`),
          like(users.email, `%${params.search}%`),
          like(users.phone, `%${params.search}%`)
        )
      );
    }

    const customersList = await db.query.users.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(users.createdAt)],
      limit: params?.limit || 50,
      offset: params?.offset || 0,
    });

    // Get order statistics and addresses for each customer
    const customersWithStats = await Promise.all(
      customersList.map(async (customer) => {
        const [orderStats, addresses] = await Promise.all([
          db
            .select({
              totalOrders: sql<number>`count(*)`,
              totalSpent: sql<number>`sum(${orders.totalAmount})`,
              lastOrderDate: sql<string>`max(${orders.createdAt})`,
            })
            .from(orders)
            .where(eq(orders.userId, customer.id)),
          db.query.userAddresses.findMany({
            where: eq(userAddresses.userId, customer.id),
            orderBy: [
              desc(userAddresses.isDefault),
              desc(userAddresses.createdAt),
            ],
          }),
        ]);

        return {
          ...customer,
          totalOrders: orderStats[0]?.totalOrders || 0,
          totalSpent: orderStats[0]?.totalSpent || 0,
          lastOrderDate: orderStats[0]?.lastOrderDate || null,
          addresses: addresses || [],
        };
      })
    );

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      success: true,
      data: customersWithStats,
      totalCount: Number(totalCount[0].count),
    };
  } catch (error) {
    console.error("Error fetching customers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getCustomerById(customerId: string) {
  try {
    await getAdminUser(); // Verify admin access

    const customer = await db.query.users.findFirst({
      where: eq(users.id, customerId),
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Get customer's addresses
    const addresses = await db.query.userAddresses.findMany({
      where: eq(userAddresses.userId, customerId),
      orderBy: [desc(userAddresses.isDefault), desc(userAddresses.createdAt)],
    });

    // Get customer's orders
    const customerOrders = await db.query.orders.findMany({
      where: eq(orders.userId, customerId),
      orderBy: [desc(orders.createdAt)],
    });

    // Get order statistics
    const orderStats = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        totalSpent: sql<number>`sum(${orders.totalAmount})`,
        averageOrderValue: sql<number>`avg(${orders.totalAmount})`,
      })
      .from(orders)
      .where(eq(orders.userId, customerId));

    return {
      success: true,
      data: {
        ...customer,
        addresses: addresses || [],
        orders: customerOrders,
        stats: orderStats[0],
      },
    };
  } catch (error) {
    console.error("Error fetching customer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateCustomerStatus(
  customerId: string,
  updates: {
    isVerified?: boolean;
    isSuspended?: boolean;
    role?: string;
  }
) {
  try {
    await getAdminUser(); // Verify admin access

    const updatedCustomer = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      } as any)
      .where(eq(users.id, customerId))
      .returning();

    if (!updatedCustomer.length) {
      throw new Error("Customer not found");
    }

    return { success: true, data: updatedCustomer[0] };
  } catch (error) {
    console.error("Error updating customer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteCustomers(customerIds: string[]) {
  try {
    await getAdminUser(); // Verify admin access

    const deletedCustomers = await db
      .delete(users)
      .where(sql`${users.id} = ANY(${customerIds})`)
      .returning();

    return { success: true, data: deletedCustomers };
  } catch (error) {
    console.error("Error deleting customers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getCustomerStats() {
  try {
    await getAdminUser(); // Verify admin access

    const stats = await db
      .select({
        role: users.role,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .groupBy(users.role);

    const verificationStats = await db
      .select({
        verified: sql<number>`count(*) filter (where ${users.isVerified} = true)`,
        unverified: sql<number>`count(*) filter (where ${users.isVerified} = false)`,
        suspended: sql<number>`count(*) filter (where ${users.isSuspended} = true)`,
        total: sql<number>`count(*)`,
      })
      .from(users);

    return {
      success: true,
      data: {
        byRole: stats,
        verification: verificationStats[0],
      },
    };
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
