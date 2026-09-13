import { notFound } from "next/navigation";
import { getOrderById } from "@/actions/orders";
import type { AddressData } from "@workspace/lib/address";
import type { PlacedExternalOrderResult } from "../../../external-orders/external-orders.types";
import type { OrderDetailWithRelations } from "../order-detail.types";
import { OrderInvoiceContent } from "./invoice.client";

export const dynamic = "force-dynamic";

interface OrderInvoicePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Reprints the customer-facing Arabic invoice for any order, so a price edit
 * can be handed to the customer without re-placing the order. The external
 * order desk rendered the same component inline right after checkout; this is
 * the route that reaches it again later.
 */
function toInvoiceData(
  order: OrderDetailWithRelations
): PlacedExternalOrderResult {
  const address = order.userAddress_shippingAddressId;

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      notes: order.notes,
    },
    orderItems: order.orderItems.map((item) => ({
      id: item.id,
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
    customer: {
      fullName:
        order.user?.fullName || address?.fullName || "Unknown customer",
      phone: order.user?.phone ?? address?.phone ?? null,
    },
    address: address
      ? ({
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 ?? undefined,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        } as AddressData)
      : null,
  };
}

export default async function OrderInvoicePage({
  params,
}: OrderInvoicePageProps) {
  const { id } = await params;
  const result = await getOrderById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const order = result.data as unknown as OrderDetailWithRelations;

  return <OrderInvoiceContent orderId={id} invoice={toInvoiceData(order)} />;
}
