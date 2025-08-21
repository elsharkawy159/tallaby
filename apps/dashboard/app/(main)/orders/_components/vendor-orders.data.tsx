import { getUser } from "@/actions/auth";
import { getVendorOrders } from "@/actions/vendor";
import { VendorOrdersTable } from "./vendor-orders.table";

export async function VendorOrdersData() {
  const { user } = await getUser();

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">
          Please log in to view your orders
        </h2>
      </div>
    );
  }

  const { orders, total } = await getVendorOrders(user.id, 1, 20);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <VendorOrdersTable orders={orders} total={total} />
    </div>
  );
}
