import Link from "next/link";
import {
  TALLABY_PAY_WALLET_FILTERS,
  parseAdminPage,
  parseAdminSearch,
  parseWalletFilter,
  type TallabyPayWalletFilter,
} from "@workspace/lib/tallaby-pay";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import { loadTallabyPayWallets } from "../tallaby-pay.data";
import { cairoTime, egpAmount, filterHref, isNegativeAmount } from "../tallaby-pay.lib";
import { EmptyState, FilterForm, LoadError, Pager, Tone, ViewLinks } from "../tallaby-pay.ui";
import { AdjustAction, FreezeAction } from "./wallets.client";

export const dynamic = "force-dynamic";

const FILTER_LABEL: Record<TallabyPayWalletFilter, string> = {
  all: "All",
  has_money: "With a balance",
  negative: "Negative",
  frozen: "Frozen",
};

/** Each store's Tallaby Pay earnings, with freeze and adjustments (chargeback fees). Frozen first, then the lowest. */
export default async function TallabyPayWalletsPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; page?: string }> }) {
  const sp = await searchParams;
  const filter = parseWalletFilter(sp.filter);
  const search = parseAdminSearch(sp.q);
  const page = parseAdminPage(sp.page);
  const result = await loadTallabyPayWallets({ filter, search, page });
  if (!result.data) return <LoadError error={result.error} />;
  const { rows, total, pageSize } = result.data;
  const params = { q: search, filter: filter === "all" ? null : filter };

  return (
    <div className="space-y-4">
      <ViewLinks
        views={Object.fromEntries(TALLABY_PAY_WALLET_FILTERS.map((f) => [f, FILTER_LABEL[f]])) as Record<TallabyPayWalletFilter, string>}
        current={filter}
        label="Wallet filters"
        href={(f) => filterHref("/tallaby-pay/wallets", { q: search, filter: f === "all" ? null : f })}
      />
      <FilterForm action="/tallaby-pay/wallets" search={search} searchPlaceholder="Store or seller name">
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
      </FilterForm>

      {rows.length === 0 ? (
        <EmptyState>No store wallet matches.</EmptyState>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-end">Pending</TableHead>
                  <TableHead className="text-end">Available</TableHead>
                  <TableHead className="text-end">Reserved</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((w) => (
                  <TableRow key={w.walletId}>
                    <TableCell>
                      <Link href={`/stores/${w.storeId}`} className="font-medium hover:underline">
                        {w.storeName}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        <Link href={`/sellers/${w.sellerId}`} className="hover:underline">
                          {w.sellerName}
                        </Link>
                        {" · "}
                        <Link href={`/tallaby-pay/sales?store=${w.storeId}`} className="hover:underline">
                          {w.sales} sales
                        </Link>
                      </span>
                    </TableCell>
                    <TableCell className="text-end tabular-nums">{egpAmount(w.pending)}</TableCell>
                    <TableCell className={cn("text-end font-medium tabular-nums", isNegativeAmount(w.available) && "text-destructive")}>
                      {egpAmount(w.available)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">{egpAmount(w.reserved)}</TableCell>
                    <TableCell className="max-w-56">
                      {w.status === "frozen" ? (
                        <>
                          <Tone tone="danger">Frozen</Tone>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {w.frozenReason} · {cairoTime(w.frozenAt)}
                          </span>
                        </>
                      ) : (
                        <Tone tone="neutral">Active</Tone>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <AdjustAction walletId={w.walletId} storeName={w.storeName} available={egpAmount(w.available)} />
                        <FreezeAction walletId={w.walletId} storeName={w.storeName} frozen={w.status === "frozen"} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Pager page={page} pageSize={pageSize} total={total} href={(p) => filterHref("/tallaby-pay/wallets", { ...params, page: p })} />
    </div>
  );
}
