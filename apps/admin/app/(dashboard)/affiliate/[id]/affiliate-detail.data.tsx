import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getAffiliateDetail,
  getAffiliateLedger,
  getAffiliateOrderHistory,
} from "@/actions/affiliates";
import { AffiliateDetailContent } from "./affiliate-detail.client";
import { AffiliateDetailSkeleton } from "./affiliate-detail.skeleton";

interface AffiliateDetailDataProps {
  affiliateId: string;
}

async function AffiliateDetailDataContent({
  affiliateId,
}: AffiliateDetailDataProps) {
  const detailResult = await getAffiliateDetail(affiliateId);

  if (!detailResult.success) {
    notFound();
  }

  const [ordersResult, ledgerResult] = await Promise.all([
    getAffiliateOrderHistory(affiliateId),
    getAffiliateLedger(affiliateId),
  ]);

  return (
    <AffiliateDetailContent
      detail={detailResult.data}
      initialOrders={ordersResult.success ? ordersResult.data.rows : []}
      initialOrdersTotal={ordersResult.success ? ordersResult.data.total : 0}
      initialLedger={ledgerResult.success ? ledgerResult.data.rows : []}
      initialLedgerTotal={ledgerResult.success ? ledgerResult.data.total : 0}
    />
  );
}

export function AffiliateDetailData({ affiliateId }: AffiliateDetailDataProps) {
  return (
    <Suspense fallback={<AffiliateDetailSkeleton />}>
      <AffiliateDetailDataContent affiliateId={affiliateId} />
    </Suspense>
  );
}
