import { Suspense } from "react";
import {
  getAdminCustomers,
  getCustomerListStats,
} from "@/actions/customers-list";
import type { Customer, CustomersPageProps } from "./customers.types";
import { CustomersContent } from "./customers.client";
import { parseCustomersParams } from "./customers.params";
import { CustomersSkeleton } from "./customers.skeleton";

async function CustomersDataContent({ searchParams }: CustomersPageProps) {
  // Awaited here, inside the Suspense boundary, rather than in the page — so
  // the skeleton still shows immediately instead of the route blocking on it.
  const query = parseCustomersParams(await searchParams);

  // Sequential to stay within the serverless DB pool.
  const statsResult = await getCustomerListStats();
  const customersResult = await getAdminCustomers(query);

  if (!customersResult.success || !statsResult.success) {
    throw new Error(
      (!customersResult.success && customersResult.error) ||
        (!statsResult.success && statsResult.error) ||
        "Failed to fetch customers"
    );
  }

  return (
    <CustomersContent
      customers={customersResult.data as Customer[]}
      totalCount={customersResult.totalCount}
      stats={statsResult.data}
    />
  );
}

export function CustomersData({ searchParams }: CustomersPageProps) {
  return (
    <Suspense fallback={<CustomersSkeleton />}>
      <CustomersDataContent searchParams={searchParams} />
    </Suspense>
  );
}
