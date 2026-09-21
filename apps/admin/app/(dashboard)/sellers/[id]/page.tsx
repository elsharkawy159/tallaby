import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSellerDetail } from "../sellers.server";
import { SellerDetailContent } from "./seller-detail.client";
import { SellerDetailSkeleton } from "./seller-detail.skeleton";

export const dynamic = "force-dynamic";

interface SellerPageProps {
  params: Promise<{ id: string }>;
}

async function SellerDetailData({ sellerId }: { sellerId: string }) {
  const result = await getSellerDetail(sellerId);

  if (!result.success || !result.data) {
    notFound();
  }

  return <SellerDetailContent detail={result.data} />;
}

export default async function SellerDetailPage({ params }: SellerPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<SellerDetailSkeleton />}>
      <SellerDetailData sellerId={id} />
    </Suspense>
  );
}
