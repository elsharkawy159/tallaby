import { AffiliateDetailData } from "./affiliate-detail.data";
import type { AffiliateDetailPageProps } from "./affiliate-detail.types";

export const dynamic = "force-dynamic";

export default async function AffiliateDetailPage({
  params,
}: AffiliateDetailPageProps) {
  const { id } = await params;

  return <AffiliateDetailData affiliateId={id} />;
}
