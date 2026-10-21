import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Receipt, ShoppingCart } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { getOrderById } from "@/actions/orders";
import type { EntityChipProps } from "../../_components/entity/entity-chip";
import { storeTone } from "../../_components/entity/entity-chip";
import { customerHref, sellerHref, storeHref } from "../../_components/entity/entity-href.lib";
import { IdentityHeader } from "../../_components/entity/identity-header";
import { PersonCard } from "../../_components/entity/person-card";
import { getAccountRelations } from "../../_components/entity/relations.server";
import { formatDate } from "../orders.lib";
import { OrderDetailContent } from "./order-detail.client";
import { OrderDetailSkeleton } from "./order-detail.skeleton";
import type { OrderDetailWithRelations } from "./order-detail.types";

interface OrderDetailDataProps {
  orderId: string;
}

async function OrderDetailDataContent({ orderId }: OrderDetailDataProps) {
  const result = await getOrderById(orderId);

  if (!result.success || !result.data) {
    notFound();
  }

  const order = result.data as unknown as OrderDetailWithRelations;
  // getOrderById has checked admin access; the buyer's relations only add links.
  const buyer = await getAccountRelations(order.userId).catch(() => null);

  const sellers = new Map<string, NonNullable<OrderDetailWithRelations["orderItems"][number]["seller"]>>();
  for (const item of order.orderItems ?? []) {
    if (item.seller) sellers.set(item.seller.id, item.seller);
  }

  const relations: EntityChipProps[] = [];
  if (order.user) {
    relations.push({
      href: customerHref(order.user.id),
      role: "Customer",
      name: order.user.fullName || order.user.email || "Customer",
      kind: "person",
      src: buyer?.user.avatarUrl,
      seed: order.user.id,
    });
  }
  if (order.store) {
    relations.push({
      href: storeHref(order.store.id),
      role: "Store",
      name: order.store.name,
      kind: "store",
      src: order.store.logoUrl,
      seed: order.store.id,
      tone: storeTone(order.store.siteStatus, order.store.status),
    });
  }
  for (const seller of sellers.values()) {
    relations.push({
      href: sellerHref(seller.id),
      role: "Seller",
      name: seller.displayName || seller.businessName,
      kind: "store",
      src: seller.logoUrl,
      seed: seller.id,
    });
  }

  const header = (
    <IdentityHeader
      back={{ href: "/orders", label: "Orders" }}
      title={`Order ${order.orderNumber}`}
      icon={ShoppingCart}
      subtitle={`Placed ${formatDate(order.createdAt)}`}
      relations={relations}
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link href={`/orders/${order.id}/invoice`}>
              <Receipt className="mr-2 h-4 w-4" />
              Invoice
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/orders/${order.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit prices
            </Link>
          </Button>
        </>
      }
    />
  );

  return (
    <OrderDetailContent
      order={order}
      header={header}
      customerCard={buyer ? <PersonCard title="Customer" account={buyer} /> : undefined}
    />
  );
}

export function OrderDetailData({ orderId }: OrderDetailDataProps) {
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderDetailDataContent orderId={orderId} />
    </Suspense>
  );
}
