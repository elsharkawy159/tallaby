import Link from "next/link";
import { Activity, CircleDollarSign, Coins, Package, Sparkles, TriangleAlert } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { AdminTable, type AdminTableColumn, type AdminTableRow } from "../_components/admin-table/admin-table";
import { KpiCard } from "../_components/cards/kpi-card";
import { aiFeatureLabel, errorRate, formatMicroUsd, formatTokens } from "./ai-usage.lib";
import type {
  AiProductCounts,
  AiUsageCallRow,
  AiUsageFeatureRow,
  AiUsageSellerRow,
  AiUsageTotals,
} from "./ai-usage.types";

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });

function formatDate(value: string | null): string {
  return value ? dateTime.format(new Date(value)) : "—";
}

/** Calls, cost, tokens, errors and AI-made products for the range. */
export function AiUsageKpis({
  totals,
  products,
  today,
}: {
  totals: AiUsageTotals;
  products: AiProductCounts;
  /** Seller page only: successful calls since Cairo midnight. */
  today?: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="AI calls"
        value={totals.ok}
        icon={<Activity />}
        today={today}
        hint={`${totals.blocked.toLocaleString("en-US")} blocked by the daily cap`}
      />
      <KpiCard
        label="Cost"
        value={formatMicroUsd(totals.costMicroUsd)}
        icon={<CircleDollarSign />}
        hint={totals.ok > 0 ? `${formatMicroUsd(Math.round(totals.costMicroUsd / totals.ok))} per call` : "No calls yet"}
      />
      <KpiCard
        label="Tokens"
        value={formatTokens(totals.inputTokens + totals.outputTokens)}
        icon={<Coins />}
        hint={`${formatTokens(totals.inputTokens)} in (${formatTokens(totals.cachedInputTokens)} cached) · ${formatTokens(totals.outputTokens)} out`}
      />
      <KpiCard
        label="Errors"
        value={totals.errors}
        icon={<TriangleAlert />}
        hint={`${errorRate(totals.ok, totals.errors)} of calls${totals.avgLatencyMs != null ? ` · ${(totals.avgLatencyMs / 1000).toFixed(1)} s average` : ""}`}
      />
      <KpiCard
        label="Products made with AI"
        value={products.added + products.edited}
        icon={<Package />}
        hint={`${products.added.toLocaleString("en-US")} added · ${products.edited.toLocaleString("en-US")} edited (all time)`}
        className="sm:col-span-2 xl:col-span-1"
      />
      {totals.sellers > 0 && (
        <KpiCard label="Sellers using AI" value={totals.sellers} icon={<Sparkles />} hint="With at least one call in this range" />
      )}
    </div>
  );
}

const FEATURE_COLUMNS: AdminTableColumn[] = [
  { id: "feature", header: "Feature", sortable: true },
  { id: "model", header: "Model", sortable: true },
  { id: "ok", header: "Calls", sortable: true, descFirst: true, align: "end" },
  { id: "errors", header: "Errors", sortable: true, descFirst: true, align: "end" },
  { id: "blocked", header: "Blocked", sortable: true, descFirst: true, align: "end" },
  { id: "tokens", header: "Tokens", sortable: true, descFirst: true, align: "end" },
  { id: "cost", header: "Cost", sortable: true, descFirst: true, align: "end" },
];

export function AiFeaturesCard({ features }: { features: AiUsageFeatureRow[] }) {
  const rows: AdminTableRow[] = features.map((row) => ({
    id: `${row.feature}:${row.model}`,
    cells: {
      feature: aiFeatureLabel(row.feature),
      model: <span className="font-mono text-xs">{row.model}</span>,
      ok: row.ok,
      errors: row.errors,
      blocked: row.blocked,
      tokens: formatTokens(row.tokens),
      cost: formatMicroUsd(row.costMicroUsd),
    },
    sortValues: { model: row.model, tokens: row.tokens, cost: row.costMicroUsd },
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">By feature and model</CardTitle>
      </CardHeader>
      <CardContent>
        <AdminTable columns={FEATURE_COLUMNS} rows={rows} emptyMessage="No AI calls in this range." />
      </CardContent>
    </Card>
  );
}

const SELLER_COLUMNS: AdminTableColumn[] = [
  { id: "seller", header: "Seller", sortable: true },
  { id: "ok", header: "Calls", sortable: true, descFirst: true, align: "end" },
  { id: "today", header: "Today", sortable: true, descFirst: true, align: "end" },
  { id: "errors", header: "Errors", sortable: true, descFirst: true, align: "end" },
  { id: "blocked", header: "Blocked", sortable: true, descFirst: true, align: "end" },
  { id: "tokens", header: "Tokens", sortable: true, descFirst: true, align: "end" },
  { id: "cost", header: "Cost", sortable: true, descFirst: true, align: "end" },
  { id: "products", header: "AI products", sortable: true, descFirst: true, align: "end" },
  { id: "last", header: "Last used", sortable: true, descFirst: true },
];

export function AiSellersCard({ sellers }: { sellers: AiUsageSellerRow[] }) {
  const rows: AdminTableRow[] = sellers.map((row) => ({
    id: row.sellerId,
    cells: {
      seller: (
        <Link href={`/sellers/${row.sellerId}?tab=ai`} className="block max-w-56 truncate font-medium hover:underline" title={row.name}>
          {row.name}
        </Link>
      ),
      ok: row.ok,
      today: row.okToday,
      errors: row.errors,
      blocked: row.blocked,
      tokens: formatTokens(row.tokens),
      cost: formatMicroUsd(row.costMicroUsd),
      products:
        row.aiProducts > 0 ? (
          <Link href={`/products?seller=${row.sellerId}&ai=ai`} className="hover:underline">
            {row.aiProducts}
          </Link>
        ) : (
          0
        ),
      last: <span className="whitespace-nowrap">{formatDate(row.lastUsedAt)}</span>,
    },
    sortValues: {
      seller: row.name,
      tokens: row.tokens,
      cost: row.costMicroUsd,
      products: row.aiProducts,
      last: row.lastUsedAt ?? "",
    },
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">By seller</CardTitle>
      </CardHeader>
      <CardContent>
        <AdminTable columns={SELLER_COLUMNS} rows={rows} emptyMessage="No seller used AI in this range." />
      </CardContent>
    </Card>
  );
}

const STATUS_STYLES: Record<AiUsageCallRow["status"], string> = {
  ok: "border-green-200 bg-green-50 text-green-700",
  error: "border-red-200 bg-red-50 text-red-700",
  blocked: "border-amber-200 bg-amber-50 text-amber-700",
};

const CALL_COLUMNS: AdminTableColumn[] = [
  { id: "when", header: "When" },
  { id: "feature", header: "Feature" },
  { id: "status", header: "Status" },
  { id: "tokens", header: "Tokens in / out", align: "end" },
  { id: "cost", header: "Cost", align: "end" },
  { id: "latency", header: "Time", align: "end" },
];

/** The seller's latest calls (newest first). No prompt text is ever stored. */
export function AiRecentCallsCard({ calls }: { calls: AiUsageCallRow[] }) {
  const rows: AdminTableRow[] = calls.map((call) => ({
    id: call.id,
    cells: {
      when: <span className="whitespace-nowrap">{formatDate(call.createdAt)}</span>,
      feature: (
        <span>
          {aiFeatureLabel(call.feature)} <span className="font-mono text-xs text-muted-foreground">{call.model}</span>
        </span>
      ),
      status: (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={`capitalize ${STATUS_STYLES[call.status] ?? ""}`}>
            {call.status}
          </Badge>
          {call.errorCode && <span className="font-mono text-xs text-muted-foreground">{call.errorCode}</span>}
        </span>
      ),
      tokens:
        call.inputTokens == null && call.outputTokens == null
          ? "—"
          : `${formatTokens(call.inputTokens ?? 0)} / ${formatTokens(call.outputTokens ?? 0)}`,
      cost: formatMicroUsd(call.costMicroUsd),
      latency: call.latencyMs == null ? "—" : `${(call.latencyMs / 1000).toFixed(1)} s`,
    },
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Latest calls</CardTitle>
      </CardHeader>
      <CardContent>
        <AdminTable columns={CALL_COLUMNS} rows={rows} emptyMessage="No AI calls in this range." />
      </CardContent>
    </Card>
  );
}
