import { getSellerOrders } from "@/actions/orders";
import { VendorOrdersTable, type VendorOrderRow } from "./orders-chunks";

export async function VendorOrdersData() {
  const res = await getSellerOrders({ limit: 100, offset: 0 });

  const rows: VendorOrderRow[] = (res?.success ? (res.data ?? []) : []).map(
    (item: any) => {
      const productImage = item.product?.images?.[0] ?? null;
      const customerName =
        item.order?.user?.fullName ||
        [item.order?.user?.firstName, item.order?.user?.lastName]
          .filter(Boolean)
          .join(" ") ||
        item.order?.user?.email ||
        "Customer";

      return {
        id: item.id,
        orderId: item.orderId,
        createdAt: item.createdAt,
        customerName,
        productTitle: item.product?.title ?? "",
        productImage,
        variant: item.productVariant?.name ?? null,
        quantity: item.quantity ?? 1,
        total: item.total ?? "0",
        status: item.status,
      } as VendorOrderRow;
    }
  );

  return <VendorOrdersTable rows={rows} />;
}
