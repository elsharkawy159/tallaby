import { CustomersData } from "./customers.data";
import type { CustomersPageProps } from "./customers.types";

export const dynamic = 'force-dynamic';

export default function CustomersPage({ searchParams }: CustomersPageProps) {
  return <CustomersData searchParams={searchParams} />;
}
