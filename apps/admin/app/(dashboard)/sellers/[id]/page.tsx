import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@workspace/ui/components/card";
import { isUuid } from "@workspace/lib/admin";
import { listAdRequestsForAdmin, listIntegrationsForAdmin } from "@workspace/lib/admin/server";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { IdentityHeader } from "../../_components/entity/identity-header";
import { accountChips } from "../../_components/entity/relation-chips.lib";
import { getAccountRelations, type AccountRelations } from "../../_components/entity/relations.server";
import { RoleBadges } from "../../_components/entity/role-badges";
import { UrlTabs, pickTab } from "../../_components/url-tabs";
import { AdRequestsTable } from "../../ad-requests/ad-requests-table";
import { AiFeaturesCard, AiRecentCallsCard, AiUsageKpis } from "../../ai-usage/ai-usage.chunks";
import { AI_USAGE_RANGES, AI_USAGE_RANGE_LABELS } from "../../ai-usage/ai-usage.lib";
import { getSellerAiUsage } from "../../ai-usage/ai-usage.server";
import { ScopedCouponsData } from "../../coupons/seller-coupons.data";
import { getSellerFulfillment } from "../../fulfillment/fulfillment.server";
import { IntegrationsTable } from "../../integrations/integrations-table";
import { getSellerDetail } from "../sellers.server";
import { SellerAccountPanel } from "./seller-account.client";
import { SellerAuditCard } from "./seller-admin.chunks";
import { getSellerAccountTab, getSellerAuditTab, getSellerStoresTab, getSellerWalletTab } from "./seller-admin.data";
import { SellerDetailContent } from "./seller-detail.client";
import { SellerDetailSkeleton } from "./seller-detail.skeleton";
import { SellerFulfillmentSummary } from "./seller-fulfillment.chunks";
import { SendSellerNotification } from "./seller-notify.client";
import { SellerStoresPanel } from "./seller-stores.client";
import { SellerWalletPanel } from "./seller-wallet.client";

export const dynamic = "force-dynamic";

interface SellerPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const TABS = ["overview", "stores", "integrations", "coupons", "wallet", "fulfillment", "ads", "ai", "audit"] as const;
type SellerTab = (typeof TABS)[number];

const TAB_LABELS: Record<SellerTab, string> = {
  overview: "Overview",
  stores: "Stores",
  integrations: "Integrations",
  coupons: "Coupons",
  wallet: "Wallet",
  fulfillment: "Fulfillment",
  ads: "Ads",
  ai: "AI usage",
  audit: "Audit",
};

/**
 * One seller account (docs/admin-saas.md §3.4). The header is one small
 * query; only the open tab loads its data, so the page stays fast as more
 * seller data is added.
 */
export default async function SellerDetailPage({ params, searchParams }: SellerPageProps) {
  const [{ id }, raw] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  await getCurrentAdminUser();
  const account = await getAccountRelations(id);
  const seller = account?.seller;
  if (!account || !seller) notFound();
  const tab = pickTab(raw.tab, TABS);

  return (
    <div className="space-y-6">
      <IdentityHeader
        back={{ href: "/sellers", label: "Sellers" }}
        title={seller.businessName}
        avatar={{ kind: "store", name: seller.businessName, src: seller.logoUrl, seed: seller.id }}
        badges={<RoleBadges role={account.user.role} seller={seller} />}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            {seller.displayName && seller.displayName !== seller.businessName ? <span>{seller.displayName}</span> : null}
            <span dir="ltr">/{seller.slug}</span>
            <span className="capitalize">{seller.plan} plan</span>
            <span>
              {account.stores.length} store{account.stores.length === 1 ? "" : "s"}
            </span>
          </span>
        }
        relations={accountChips(account, { personRole: "Owner", omit: ["seller"], ordersFilter: "seller" })}
        actions={<SendSellerNotification sellerId={seller.id} sellerName={seller.businessName} />}
      />
      <UrlTabs baseHref={`/sellers/${id}`} active={tab} tabs={TABS.map((key) => ({ key, label: TAB_LABELS[key] }))} />
      <Suspense key={tab} fallback={<SellerDetailSkeleton />}>
        <SellerTabContent sellerId={id} tab={tab} raw={raw} relations={account} />
      </Suspense>
    </div>
  );
}

async function SellerTabContent({
  sellerId,
  tab,
  raw,
  relations,
}: {
  sellerId: string;
  tab: SellerTab;
  raw: Record<string, string | string[] | undefined>;
  relations: AccountRelations;
}) {
  switch (tab) {
    case "overview": {
      const [detail, account] = await Promise.all([getSellerDetail(sellerId), getSellerAccountTab(sellerId)]);
      if (!detail.success || !detail.data) notFound();
      return (
        <div className="space-y-6">
          {account ? (
            <SellerAccountPanel sellerId={sellerId} account={account} />
          ) : (
            <Unavailable what="Plan, trial and fee settings" />
          )}
          <SellerDetailContent detail={detail.data} account={relations} />
        </div>
      );
    }
    case "stores": {
      const stores = await getSellerStoresTab(sellerId);
      return stores ? <SellerStoresPanel sellerId={sellerId} stores={stores} /> : <Unavailable what="Stores" />;
    }
    case "integrations": {
      const data = await listIntegrationsForAdmin({ provider: null, status: null, q: null, sellerId, page: 1 }).catch(() => null);
      if (!data) return <Unavailable what="Integrations" />;
      return (
        <Card>
          <CardContent className="py-4">
            <IntegrationsTable rows={data.rows} showStore />
          </CardContent>
        </Card>
      );
    }
    case "coupons": {
      const page = Number.parseInt(String(Array.isArray(raw.page) ? raw.page[0] : (raw.page ?? "1")), 10) || 1;
      return <ScopedCouponsData scope="seller" q={null} state={null} sellerId={sellerId} page={page} />;
    }
    case "wallet": {
      const wallet = await getSellerWalletTab(sellerId);
      if (!wallet) return <Unavailable what="The store wallet" />;
      return (
        <SellerWalletPanel
          sellerId={sellerId}
          wallet={wallet.account.wallet}
          entries={wallet.entries}
          topUps={wallet.topUps}
          stores={wallet.stores.map((store) => ({ id: store.id, name: store.name }))}
        />
      );
    }
    case "fulfillment": {
      const fulfillment = await getSellerFulfillment(sellerId);
      return fulfillment ? (
        <SellerFulfillmentSummary sellerId={sellerId} overview={fulfillment} />
      ) : (
        <Unavailable what="Fulfillment setup" />
      );
    }
    case "ads": {
      const data = await listAdRequestsForAdmin({ status: null, sellerId, q: null, page: 1 }).catch(() => null);
      if (!data) return <Unavailable what="Ad requests" />;
      return (
        <Card>
          <CardContent className="py-4">
            <AdRequestsTable rows={data.rows} showSeller={false} />
            {data.total > data.rows.length && (
              <Link href={`/ad-requests?seller=${sellerId}`} className="mt-3 inline-block text-sm text-muted-foreground hover:underline">
                See all {data.total} requests
              </Link>
            )}
          </CardContent>
        </Card>
      );
    }
    case "ai": {
      const range = pickTab(raw.range, AI_USAGE_RANGES);
      const usage = await getSellerAiUsage(sellerId, range);
      return (
        <div className="space-y-6">
          <UrlTabs
            baseHref={`/sellers/${sellerId}`}
            param="range"
            keep={{ tab: "ai" }}
            active={range}
            tabs={AI_USAGE_RANGES.map((key) => ({ key, label: AI_USAGE_RANGE_LABELS[key] }))}
          />
          {usage ? (
            <>
              <AiUsageKpis totals={usage.totals} products={usage.products} today={usage.okToday} />
              {usage.products.added + usage.products.edited > 0 && (
                <Link href={`/products?seller=${sellerId}&ai=ai`} className="inline-block text-sm text-muted-foreground hover:underline">
                  See this seller&apos;s products made with AI
                </Link>
              )}
              <AiFeaturesCard features={usage.features} />
              <AiRecentCallsCard calls={usage.recent} />
            </>
          ) : (
            <Unavailable what="AI usage" />
          )}
        </div>
      );
    }
    case "audit": {
      const audit = await getSellerAuditTab(sellerId);
      return audit ? <SellerAuditCard audit={audit} /> : <Unavailable what="The audit log" />;
    }
  }
}

function Unavailable({ what }: { what: string }) {
  return <p className="text-sm text-muted-foreground">{what} could not be loaded. Try again.</p>;
}
