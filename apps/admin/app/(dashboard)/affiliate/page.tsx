import { AffiliateData } from "./affiliate.data";
import type { AffiliatesPageProps } from "./affiliate.types";

export const dynamic = "force-dynamic";

export default function AffiliatePage({ searchParams }: AffiliatesPageProps) {
  return <AffiliateData searchParams={searchParams} />;
}
