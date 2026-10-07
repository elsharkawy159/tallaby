import type { getAdminCoupons, CouponState } from "@/actions/coupons";
import type { RawSearchParams } from "../_components/data-table/search-params";

export type { CouponState };

export type AdminCoupon = Extract<
  Awaited<ReturnType<typeof getAdminCoupons>>,
  { success: true }
>["data"][number];

export type CouponStats = Extract<
  Awaited<ReturnType<typeof getAdminCoupons>>,
  { success: true }
>["stats"];

export interface CouponsPageProps {
  searchParams: Promise<RawSearchParams>;
}
