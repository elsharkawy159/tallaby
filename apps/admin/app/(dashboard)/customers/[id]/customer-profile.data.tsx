import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Badge } from "@workspace/ui/components/badge";
import { getCustomerById } from "@/actions/customers";
import { IdentityHeader } from "../../_components/entity/identity-header";
import { accountChips } from "../../_components/entity/relation-chips.lib";
import { getAccountRelations } from "../../_components/entity/relations.server";
import { RoleBadges } from "../../_components/entity/role-badges";
import { CustomerProfileContent } from "./customer-profile.client";
import { CustomerProfileSkeleton } from "./customer-profile.skeleton";
import { CustomerSellerAccount } from "./customer-seller-account";

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

  const customer = result.data;
  // getCustomerById has checked admin access; the relations only add links.
  const account = await getAccountRelations(customerId).catch(() => null);
  const name = customer.fullName || customer.email || "Customer";

  const header = account ? (
    <IdentityHeader
      back={{ href: "/customers", label: "Customers" }}
      title={name}
      avatar={{ kind: "person", name, src: customer.avatarUrl, seed: customer.id }}
      badges={
        <>
          <RoleBadges role={customer.role} isGuest={customer.isGuest} seller={account.seller} />
          {customer.isVerified ? (
            <Badge variant="outline" className="font-normal text-green-700 dark:text-green-300">
              Verified
            </Badge>
          ) : null}
          {customer.isSuspended ? <Badge variant="destructive">Suspended</Badge> : null}
        </>
      }
      subtitle={
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1" dir="ltr">
          {customer.email ? <span>{customer.email}</span> : null}
          {customer.phone ? <span>{customer.phone}</span> : null}
        </span>
      }
      relations={accountChips(account, { omit: ["person"] })}
    />
  ) : undefined;

  return (
    <CustomerProfileContent
      customer={customer}
      header={header}
      sellerAccount={account?.seller ? <CustomerSellerAccount account={account} /> : null}
    />
  );
}

export function CustomerProfileData({ customerId }: CustomerProfileDataProps) {
  return (
    <Suspense fallback={<CustomerProfileSkeleton />}>
      <CustomerProfileDataContent customerId={customerId} />
    </Suspense>
  );
}
