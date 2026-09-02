import { getSellerOrders } from "@/actions/orders";
import {
  getOrderDisplayNumber,
  pickProductSlug,
  resolveCustomerName,
  resolveVendorOrderStatus,
} from "./orders.lib";
import { VendorOrdersTable, type VendorOrderRow } from "./orders-chunks";

type SellerOrdersResult = Awaited<ReturnType<typeof getSellerOrders>>;
type SellerOrderItem = Extract<
  SellerOrdersResult,
  { data: unknown }
>["data"][number];

export async function VendorOrdersData() {
  const res = await getSellerOrders({ limit: 100, offset: 0 });

  const items: SellerOrderItem[] = res?.success ? (res.data ?? []) : [];

  const rows: VendorOrderRow[] = items.map((item) => ({
    id: item.id,
    orderId: item.orderId,
    orderNumber: getOrderDisplayNumber(item),
    createdAt: item.createdAt ?? new Date().toISOString(),
    customerName: resolveCustomerName(item.order),
    // order_items denormalizes the product name and variant at purchase time.
    productTitle: item.productName ?? "",
    productImage:
      (item.product?.images as string[] | null | undefined)?.[0] ?? null,
    productSlug: pickProductSlug(item.product?.productTranslations),
    variant: item.variantName ?? null,
    quantity: item.quantity ?? 1,
    total: item.total ?? "0",
    status: resolveVendorOrderStatus(item),
  }));

  return <VendorOrdersTable rows={rows} />;
}
