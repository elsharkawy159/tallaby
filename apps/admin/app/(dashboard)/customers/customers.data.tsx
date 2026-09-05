import { Suspense } from "react";
import { getAllCustomers, getCustomerStats } from "@/actions/customers";
import type {
  Customer,
  CustomerStats,
  CustomersPageProps
} from "./customers.types";
import { CustomersContent } from "./customers.client";
import { CustomersSkeleton } from "./customers.skeleton";

type CustomersDataProps = CustomersPageProps;

async function CustomersDataContent({ searchParams }: CustomersDataProps) {
  // Awaited here, inside the Suspense boundary, rather than in the page — so
  // the skeleton still shows immediately instead of the route blocking on it.
  const params = await searchParams;

  const limit = params?.limit ? parseInt(params.limit) : 1000;
  const offset = params?.page ? (parseInt(params.page) - 1) * limit : 0;

  const [customersResult, statsResult] = await Promise.all([
    getAllCustomers({
      role: params?.role,
      isVerified:
        params?.isVerified !== undefined
          ? params.isVerified === "true"
          : undefined,
      isSuspended:
        params?.isSuspended !== undefined
          ? params.isSuspended === "true"
          : undefined,
      search: params?.search,
      limit,
      offset,
    }),
    getCustomerStats(),
  ]);

  if (!customersResult.success || !statsResult.success) {
    throw new Error(
      customersResult.error || statsResult.error || "Failed to fetch customers"
    );
  }

  const customers = (customersResult.data || []) as Customer[];
  const stats = statsResult.data;

  // Calculate additional stats from customers data
  const now = new Date();
  const newCustomersThisMonth = customers.filter((c) => {
    if (!c.createdAt) return false;
    const createdDate = new Date(c.createdAt);
    return (
      createdDate.getMonth() === now.getMonth() &&
      createdDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const totalRevenue = customers.reduce(
    (sum, customer) => sum + (Number(customer.totalSpent) || 0),
    0
  );
  const totalOrders = customers.reduce(
    (sum, customer) => sum + (Number(customer.totalOrders) || 0),
    0
  );

  const customerStats: CustomerStats = {
    totalCustomers: stats?.verification?.total || customers.length,
    verifiedCustomers: stats?.verification?.verified || 0,
    newCustomersThisMonth,
    totalRevenue,
    averageSpendPerCustomer:
      customers.length > 0 ? totalRevenue / customers.length : 0,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
  };

  return <CustomersContent customers={customers} stats={customerStats} />;
}

export function CustomersData({ searchParams }: CustomersDataProps) {
  return (
    <Suspense fallback={<CustomersSkeleton />}>
      <CustomersDataContent searchParams={searchParams} />
    </Suspense>
  );
}
