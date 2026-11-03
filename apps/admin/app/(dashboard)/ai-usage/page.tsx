import { Suspense } from "react";
import { RefreshCw } from "lucide-react";
import { UrlTabs, pickTab } from "../_components/url-tabs";
import { getBillingState } from "@workspace/lib/billing/server";
import { AiCostEstimateNote, AiFeaturesCard, AiSellersCard, AiUsageKpis } from "./ai-usage.chunks";
import { AI_USAGE_RANGES, AI_USAGE_RANGE_LABELS, type AiUsageRange } from "./ai-usage.lib";
import { getAiUsageOverview } from "./ai-usage.server";

export const dynamic = "force-dynamic";

interface AiUsagePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Seller AI usage: calls, tokens and cost from ai_usage_logs (0110), plus AI-made products (0112). */
export default async function AiUsagePage({ searchParams }: AiUsagePageProps) {
  const range = pickTab((await searchParams).range, AI_USAGE_RANGES);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AI usage</h1>
        <p className="text-sm text-muted-foreground">
          Every AI call sellers make in the dashboard, with tokens and cost. Blocked calls hit the daily cap and cost nothing.
        </p>
      </div>
      <UrlTabs
        baseHref="/ai-usage"
        param="range"
        active={range}
        tabs={AI_USAGE_RANGES.map((key) => ({ key, label: AI_USAGE_RANGE_LABELS[key] }))}
      />
      <Suspense
        key={range}
        fallback={
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <AiUsageData range={range} />
      </Suspense>
    </div>
  );
}

async function AiUsageData({ range }: { range: AiUsageRange }) {
  const overview = await getAiUsageOverview(range);
  if (!overview) return <p className="text-sm text-muted-foreground">AI usage could not be loaded. Try again.</p>;
  // With no rate the costs show USD only, so a failed read never hides the page.
  const marketRate = await getBillingState().then((state) => state.marketRate, () => null);
  return (
    <div className="space-y-6">
      <AiCostEstimateNote marketRate={marketRate} />
      <AiUsageKpis totals={overview.totals} products={overview.products} marketRate={marketRate} />
      <AiSellersCard sellers={overview.sellers} marketRate={marketRate} />
      <AiFeaturesCard features={overview.features} marketRate={marketRate} />
    </div>
  );
}
