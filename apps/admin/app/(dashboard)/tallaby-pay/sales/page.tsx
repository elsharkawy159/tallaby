import Link from "next/link";
import {
  TALLABY_PAY_SALE_FILTERS,
  parseAdminPage,
  parseAdminSearch,
  parseDateRange,
  parseSaleFilter,
  type TallabyPaySaleFilter,
} from "@workspace/lib/tallaby-pay";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { loadTallabyPaySales } from "../tallaby-pay.data";
import { bpsPercent, cairoTime, egpAmount, filterHref, saleStatusLabel } from "../tallaby-pay.lib";
import { EmptyState, FilterForm, LoadError, Pager, Tone } from "../tallaby-pay.ui";

export const dynamic = "force-dynamic";

const FILTER_LABEL: Record<TallabyPaySaleFilter, string> = {
  all: "All",
  pending: "Pending",
  available: "Available",
  refunded: "Refunded",
  refund_requested: "Refund requested",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Search = { q?: string; status?: string; from?: string; to?: string; page?: string; store?: string };

/** Every Tallaby Pay payment: store, order, gross, fee, net and where the money is now. */
export default async function TallabyPaySalesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const range = parseDateRange(sp);
  const filter = parseSaleFilter(sp.status);
  const search = parseAdminSearch(sp.q);
  const storeId = typeof sp.store === "string" && UUID_RE.test(sp.store) ? sp.store : null;
  const page = parseAdminPage(sp.page);
  const result = await loadTallabyPaySales({ range, filter, search, storeId, page });
  if (!result.data) return <LoadError error={result.error} />;
  const { rows, total, pageSize } = result.data;
  const params = { q: search, status: filter === "all" ? null : filter, from: range.from, to: range.to, store: storeId };

  return (
    <div className="space-y-4">
      <FilterForm
        action="/tallaby-pay/sales"
        from={range.from}
        to={range.to}
        search={search}
        searchPlaceholder="Store, order number or EasyKash reference"
      >
        <div className="grid gap-1.5">
          <label htmlFor="tp-status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="tp-status"
            name="status"
            defaultValue={filter}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            {TALLABY_PAY_SALE_FILTERS.map((f) => (
              <option key={f} value={f}>
                {FILTER_LABEL[f]}
              </option>
            ))}
          </select>
        </div>
        {storeId && <input type="hidden" name="store" value={storeId} />}
      </FilterForm>
      {storeId && (
        <p className="text-sm text-muted-foreground">
          One store only.{" "}
          <Link href={filterHref("/tallaby-pay/sales", { ...params, store: null })} className="underline">
            Show every store
          </Link>
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState>No Tallaby Pay payments match these filters.</EmptyState>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paid</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-end">Gross</TableHead>
                  <TableHead className="text-end">Fee</TableHead>
                  <TableHead className="text-end">Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>EasyKash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const status = saleStatusLabel(r);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-sm">{cairoTime(r.paidAt)}</TableCell>
                      <TableCell>
                        <Link href={`/stores/${r.storeId}`} className="font-medium hover:underline">
                          {r.storeName}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {r.orderId ? (
                          <Link href={`/orders/${r.orderId}`} className="hover:underline">
                            #{r.orderNumber ?? r.orderId.slice(0, 8)}
                          </Link>
                        ) : (
                          "—"
                        )}
                        {r.purpose === "deposit" && <span className="ms-1 text-xs text-muted-foreground">deposit</span>}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">{egpAmount(r.gross)}</TableCell>
                      <TableCell className="text-end tabular-nums">
                        {egpAmount(r.fee)}
                        <span className="block text-xs text-muted-foreground">{bpsPercent(r.feeBps)}</span>
                      </TableCell>
                      <TableCell className="text-end tabular-nums">{egpAmount(r.net)}</TableCell>
                      <TableCell>
                        <Tone tone={status.tone}>{status.label}</Tone>
                      </TableCell>
                      <TableCell className="max-w-40 truncate font-mono text-xs" title={r.easykashRef}>
                        {r.easykashRef}
                        {r.paymentMethod && <span className="block font-sans text-muted-foreground">{r.paymentMethod}</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Pager page={page} pageSize={pageSize} total={total} href={(p) => filterHref("/tallaby-pay/sales", { ...params, page: p })} />
    </div>
  );
}
