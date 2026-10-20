import Link from "next/link";
import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { formatCurrency } from "@workspace/lib";
import { logServerError } from "@workspace/db/log";
import { getSaasKpis } from "@workspace/lib/admin/server";
import { getSidebarCounts } from "./_components/layout/sidebar.server";

/**
 * Admin home: work queues first, then SaaS numbers (docs/admin-saas.md §3.9).
 * The queue counts are the sidebar's query (React cache: one read per request).
 */
export async function ActionCentreSection() {
  const counts = await getSidebarCounts();
  const queues = [
    { label: "Sellers to approve", value: counts.pendingSellers, href: "/sellers?status=pending" },
    { label: "Store top-ups to review", value: counts.pendingStoreTopUps, href: "/store-top-ups" },
    { label: "Sellers with fulfillment requests", value: counts.fulfillmentOpenSellers, href: "/fulfillment" },
    { label: "Ad requests to review", value: counts.pendingAdRequests, href: "/ad-requests?status=pending" },
    { label: "Integrations in error", value: counts.integrationErrors, href: "/integrations?tab=errors" },
    { label: "Failing domains", value: counts.failingDomains, href: "/domains?status=failed" },
    { label: "Products to approve", value: counts.pendingProducts, href: "/products?status=pending" },
    { label: "Pending orders", value: counts.pendingOrders, href: "/orders?status=pending" },
  ];
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase">Needs attention</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {queues.map((queue) => (
          <Link key={queue.href} href={queue.href}>
            <Card className={cn("transition-colors hover:bg-muted/50", queue.value > 0 && "border-amber-300")}>
              <CardContent className="py-4">
                <p className={cn("text-2xl font-semibold tabular-nums", queue.value === 0 && "text-muted-foreground")}>
                  {queue.value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{queue.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function SaasKpiSection() {
  let kpis: Awaited<ReturnType<typeof getSaasKpis>>;
  try {
    kpis = await getSaasKpis();
  } catch (error) {
    logServerError("admin", "saas kpis failed", {}, error);
    return null;
  }
  const tiles = [
    { label: "Stores", value: kpis.storesTotal.toLocaleString(), hint: `+${kpis.stores7d} this week · +${kpis.stores30d} in 30 days`, href: "/stores" },
    { label: "Published sites", value: kpis.publishedSites.toLocaleString(), hint: `${kpis.activeSellers} sellers with an active store`, href: "/stores?site=published" },
    { label: "Fee trial", value: kpis.sellersInTrial.toLocaleString(), hint: `${kpis.sellersPastTrial} past the 7-day trial`, href: "/sellers" },
    { label: "Platform fees (30 days)", value: formatCurrency(Number(kpis.feeRevenue30d)), hint: "EGP 5 per delivered order", href: "/wallets?tab=ledger" },
    {
      label: "Negative wallets",
      value: kpis.negativeWallets.toLocaleString(),
      hint: `Total ${formatCurrency(Number(kpis.negativeTotal))}`,
      href: "/wallets?balance=negative",
      warn: kpis.negativeWallets > 0,
    },
  ];
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase">Stores and sellers</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">{tile.label}</p>
                <p className={cn("text-2xl font-semibold tabular-nums", tile.warn && "text-destructive")}>{tile.value}</p>
                <p className="text-xs text-muted-foreground">{tile.hint}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
