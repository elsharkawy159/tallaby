import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSellerDetail } from "../sellers.server";
import { SellerDetailContent } from "./seller-detail.client";
import { SellerDetailSkeleton } from "./seller-detail.skeleton";
import { getSellerFulfillment } from "../../fulfillment/fulfillment.server";
import { SellerFulfillmentPanel } from "./seller-fulfillment.client";
import { getSellerAdminPanel } from "./seller-admin.data";
import { SellerAccountPanel } from "./seller-account.client";
import { SellerStoresPanel } from "./seller-stores.client";
import { SellerWalletPanel } from "./seller-wallet.client";
import { SellerAuditCard, SellerIntegrationsCard } from "./seller-admin.chunks";

export const dynamic = "force-dynamic";

interface SellerPageProps {
  params: Promise<{ id: string }>;
}

async function SellerDetailData({ sellerId }: { sellerId: string }) {
  const [result, fulfillment, panel] = await Promise.all([
    getSellerDetail(sellerId),
    getSellerFulfillment(sellerId),
    getSellerAdminPanel(sellerId),
  ]);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SellerDetailContent detail={result.data} />
      {panel ? (
        <>
          <SellerAccountPanel sellerId={sellerId} account={panel.account} />
          <SellerStoresPanel sellerId={sellerId} stores={panel.stores} />
          <SellerWalletPanel
            sellerId={sellerId}
            wallet={panel.account.wallet}
            entries={panel.walletEntries}
            topUps={panel.topUps}
            stores={panel.stores.map((store) => ({ id: store.id, name: store.name }))}
          />
          <SellerIntegrationsCard integrations={panel.integrations} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Account, stores and wallet could not be loaded.</p>
      )}
      {fulfillment ? (
        <SellerFulfillmentPanel sellerId={sellerId} overview={fulfillment} />
      ) : (
        <p className="text-sm text-muted-foreground">Fulfillment setup could not be loaded.</p>
      )}
      {panel && <SellerAuditCard audit={panel.audit} />}
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
