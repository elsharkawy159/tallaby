import { getSellerCouponsPage } from "@/actions/coupons";
import { ProductStoreProvider } from "@/app/(main)/stores/[storeId]/products/_components/product-store.client";
import { CouponsView } from "./coupons.client";

export async function CouponsData() {
  const page = await getSellerCouponsPage();
  // /coupons has no store in its URL: the product picker and product targets use the selected store (F-87c).
  return (
    <ProductStoreProvider storeId={page.productStoreId ?? ""}>
      <CouponsView {...page} />
    </ProductStoreProvider>
  );
}
