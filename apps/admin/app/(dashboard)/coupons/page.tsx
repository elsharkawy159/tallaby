import { CouponsData } from "./coupons.data";
import type { CouponsPageProps } from "./coupons.types";

export const dynamic = "force-dynamic";

export default function CouponsPage({ searchParams }: CouponsPageProps) {
  return <CouponsData searchParams={searchParams} />;
}
