import { Suspense } from "react";
import { getAllCustomers, getCustomerStats } from "@/actions/customers";
import type { Customer, CustomerStats } from "./customers.types";
import { CustomersContent } from "./customers.client";
import { CustomersSkeleton } from "./customers.skeleton";

interface CustomersDataProps {
  searchParams?: {
    role?: string;
    isVerified?: string;
    isSuspended?: string;
    search?: string;
    page?: string;
    limit?: string;
  };
}

async function CustomersDataContent({ searchParams }: CustomersDataProps) {
  const limit = searchParams?.limit ? parseInt(searchParams.limit) : 1000;
  const offset = searchParams?.page
    ? (parseInt(searchParams.page) - 1) * limit
    : 0;

  const [customersResult, statsResult] = await Promise.all([
    getAllCustomers({
      role: searchParams?.role,
      isVerified:
        searchParams?.isVerified !== undefined
          ? searchParams.isVerified === "true"
          : undefined,
      isSuspended:
        searchParams?.isSuspended !== undefined
          ? searchParams.isSuspended === "true"
          : undefined,
      search: searchParams?.search,
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
