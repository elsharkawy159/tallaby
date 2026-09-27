import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSellerDetail } from "../sellers.server";
import { SellerDetailContent } from "./seller-detail.client";
import { SellerDetailSkeleton } from "./seller-detail.skeleton";
import { getSellerFulfillment } from "../../fulfillment/fulfillment.server";
import { SellerFulfillmentPanel } from "./seller-fulfillment.client";

export const dynamic = "force-dynamic";

interface SellerPageProps {
  params: Promise<{ id: string }>;
}

async function SellerDetailData({ sellerId }: { sellerId: string }) {
  const [result, fulfillment] = await Promise.all([
    getSellerDetail(sellerId),
    getSellerFulfillment(sellerId),
  ]);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SellerDetailContent detail={result.data} />
      {fulfillment ? (
        <SellerFulfillmentPanel sellerId={sellerId} overview={fulfillment} />
      ) : (
        <p className="text-sm text-muted-foreground">Fulfillment setup could not be loaded.</p>
      )}
    </div>
  );
}

export default async function SellerDetailPage({ params }: SellerPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<SellerDetailSkeleton />}>
      <SellerDetailData sellerId={id} />
    </Suspense>
  );
}
