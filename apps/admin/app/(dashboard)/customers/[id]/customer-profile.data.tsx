import { Suspense } from "react";
import { getCustomerById } from "@/actions/customers";
import { CustomerProfileContent } from "./customer-profile.client";
import { CustomerProfileSkeleton } from "./customer-profile.skeleton";
import { notFound } from "next/navigation";

interface CustomerProfileDataProps {
  customerId: string;
}

async function CustomerProfileDataContent({
  customerId,
}: CustomerProfileDataProps) {
  const result = await getCustomerById(customerId);

  if (!result.success || !result.data) {
    notFound();
  }

  return <CustomerProfileContent customer={result.data} />;
}

export function CustomerProfileData({ customerId }: CustomerProfileDataProps) {
  return (
    <Suspense fallback={<CustomerProfileSkeleton />}>
      <CustomerProfileDataContent customerId={customerId} />
    </Suspense>
  );
}
