import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { logServerError } from "@workspace/db/log";
import { COUPON_STATES, isUuid, pageCount, type AdminCouponState } from "@workspace/lib/admin";
import { listCouponsForAdmin, type AdminCouponScope } from "@workspace/lib/admin/server";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { ReasonActionButton } from "../_components/dialogs/reason-action.client";
import { AdminPager, buildHref } from "../_components/admin-pager";
import {
  COUPON_STATE_LABELS,
  formatCouponDate,
  formatCouponDiscount,
  formatEgp,
  getCouponState,
} from "./coupons.lib";
import { toggleSellerCouponAction } from "./seller-coupons.server";

interface Props {
  scope: AdminCouponScope;
  q: string | null;
  state: AdminCouponState | null;
  sellerId: string | null;
  page: number;
}

/** Seller or affiliate coupons: read-only except the seller on/off switch (docs/admin-saas.md §3.2). */
export async function ScopedCouponsData({ scope, q, state, sellerId, page }: Props) {
  await getCurrentAdminUser();
  const seller = isUuid(sellerId) ? sellerId : null;
  let data: Awaited<ReturnType<typeof listCouponsForAdmin>>;
  try {
    data = await listCouponsForAdmin({ scope, q, state, sellerId: seller, page });
  } catch (error) {
    logServerError("admin", "coupon list failed", { scope }, error);
    return <p className="py-10 text-center text-sm text-destructive">Coupons could not be loaded. Try again.</p>;
  }
  const { rows, total, stats } = data;
  const tab = scope === "seller" ? "sellers" : "affiliates";
  const link = (next: Record<string, string | number | null>) =>
    buildHref("/coupons", { tab, q, state, seller, ...next });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label={scope === "seller" ? "Seller coupons" : "Affiliate coupons"} value={stats.total} />
        <Stat label="Active now" value={stats.active} />
        {scope === "seller" && <Stat label="Sellers with coupons" value={stats.sellers} />}
        <Stat label="Redemptions" value={stats.redemptions} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant={!state ? "default" : "outline"}>
          <Link href={link({ state: null, page: null })}>All states</Link>
        </Button>
        {COUPON_STATES.map((value) => (
          <Button key={value} asChild size="sm" variant={state === value ? "default" : "outline"}>
            <Link href={link({ state: value, page: null })}>{COUPON_STATE_LABELS[value]}</Link>
          </Button>
        ))}
        <form action="/coupons" className="ml-auto flex gap-2">
          <input type="hidden" name="tab" value={tab} />
          {state && <input type="hidden" name="state" value={state} />}
          {seller && <input type="hidden" name="seller" value={seller} />}
          <Input name="q" defaultValue={q ?? ""} placeholder="Code, name, seller or email" className="h-8 w-60" />
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {total.toLocaleString()} {total === 1 ? "coupon" : "coupons"}
            {seller && (
              <Link href={link({ seller: null, page: null })} className="ml-2 text-sm font-normal text-muted-foreground hover:underline">
                (one seller, show all)
              </Link>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No coupons match these filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>{scope === "seller" ? "Seller (all stores)" : "Affiliate"}</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right">Discount given</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Dates</TableHead>
                  {scope === "seller" && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const couponState = getCouponState({
                    isActive: row.isActive ?? false,
                    startsAt: row.startsAt,
                    expiresAt: row.expiresAt,
                  });
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-mono font-medium">{row.code}</div>
                        <div className="text-xs text-muted-foreground">{row.name}</div>
                      </TableCell>
                      <TableCell>
                        {scope === "seller" && row.sellerId ? (
                          <div className="flex flex-col">
                            <Link href={`/sellers/${row.sellerId}`} className="hover:underline">
                              {row.sellerName ?? "Seller"}
                            </Link>
                            <Link href={link({ seller: row.sellerId, page: null })} className="text-xs text-muted-foreground hover:underline">
                              Only this seller
                            </Link>
                          </div>
                        ) : row.affiliateId ? (
                          <Link href={`/affiliate/${row.affiliateId}`} className="hover:underline">
                            {row.affiliateEmail ?? "Affiliate"}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatCouponDiscount({
                          discountType: row.discountType,
                          discountValue: row.discountValue,
                          maximumDiscount: row.maximumDiscount,
                        })}
                        {row.minimumPurchase && (
                          <div className="text-xs text-muted-foreground">Min. {formatEgp(row.minimumPurchase)}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.usageCount ?? 0}
                        {row.usageLimit ? ` / ${row.usageLimit}` : ""}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatEgp(row.discountGiven)}</TableCell>
                      <TableCell>
                        <Badge variant={couponState === "active" ? "default" : "secondary"}>
                          {COUPON_STATE_LABELS[couponState]}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatCouponDate(row.startsAt)} → {formatCouponDate(row.expiresAt)}
                      </TableCell>
                      {scope === "seller" && (
                        <TableCell className="text-right">
                          {row.isActive ? (
                            <ReasonActionButton
                              label="Deactivate"
                              title={`Deactivate ${row.code}?`}
                              description="Customers can no longer use this coupon in any of this seller's stores. The seller is not notified automatically."
                              confirmLabel="Deactivate"
                              destructive
                              payload={{ couponId: row.id, active: false }}
                              action={toggleSellerCouponAction}
                            />
                          ) : (
                            <ReasonActionButton
                              label="Reactivate"
                              title={`Reactivate ${row.code}?`}
                              confirmLabel="Reactivate"
                              payload={{ couponId: row.id, active: true }}
                              action={toggleSellerCouponAction}
                            />
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <AdminPager page={page} pages={pageCount(total)} href={(p) => link({ page: p })} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
