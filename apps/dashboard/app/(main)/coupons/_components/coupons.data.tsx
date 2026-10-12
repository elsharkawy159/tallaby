import { getSellerCouponsPage } from "@/actions/coupons";
import { CouponsView } from "./coupons.client";

export async function CouponsData() {
  const page = await getSellerCouponsPage();
  return <CouponsView {...page} />;
}
