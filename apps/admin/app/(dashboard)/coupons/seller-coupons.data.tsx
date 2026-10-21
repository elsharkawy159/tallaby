import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { logServerError } from "@workspace/db/log";
import { COUPON_STATES, isUuid, pageCount, type AdminCouponState } from "@workspace/lib/admin";
import {
  listCouponsForAdmin,
  listSellerCouponGroupsForAdmin,
  SELLER_COUPON_GROUPS_PAGE_SIZE,
  type AdminCouponRow,
  type AdminCouponScope,
  type SellerCouponGroup,
} from "@workspace/lib/admin/server";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { AdminTable, type AdminTableColumn, type AdminTableRow } from "../_components/admin-table/admin-table";
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

export const SELLER_COUPON_VIEWS = ["sellers", "list"] as const;
export type SellerCouponView = (typeof SELLER_COUPON_VIEWS)[number];

interface Props {
  scope: AdminCouponScope;
  q: string | null;
  state: AdminCouponState | null;
  sellerId: string | null;
  page: number;
  /** Seller tab only: grouped by seller (default) or one flat list. */
  view?: SellerCouponView | null;
}

type LinkParams = Record<string, string | number | null>;
type CouponFields = Pick<
  AdminCouponRow,
  | "id"
  | "code"
  | "name"
  | "discountType"
  | "discountValue"
  | "maximumDiscount"
  | "minimumPurchase"
  | "usageCount"
  | "usageLimit"
  | "isActive"
  | "startsAt"
  | "expiresAt"
  | "discountGiven"
>;

/**
 * Seller or affiliate coupons: read-only except the seller on/off switch (docs/admin-saas.md §3.2).
 * Seller coupons open grouped by seller; one seller (`?seller=`) or `?view=list` shows the flat list.
 */
export async function ScopedCouponsData({ scope, q, state, sellerId, page, view }: Props) {
  await getCurrentAdminUser();
  const seller = isUuid(sellerId) ? sellerId : null;
  const grouped = scope === "seller" && !seller && view !== "list";
  const tab = scope === "seller" ? "sellers" : "affiliates";
  const link = (next: LinkParams) =>
    buildHref("/coupons", { tab, view: grouped ? null : view === "list" ? "list" : null, q, state, seller, ...next });

  if (grouped) return <SellerGroups q={q} state={state} page={page} link={link} />;

  let data: Awaited<ReturnType<typeof listCouponsForAdmin>>;
  try {
    data = await listCouponsForAdmin({ scope, q, state, sellerId: seller, page });
  } catch (error) {
    logServerError("admin", "coupon list failed", { scope }, error);
    return <LoadError />;
  }
  const { rows, total, stats } = data;

  return (
    <div className="space-y-4">
      <StatsRow scope={scope} stats={stats} />
      <Toolbar scope={scope} view={scope === "seller" ? "list" : null} q={q} state={state} seller={seller} link={link} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {total.toLocaleString()} {total === 1 ? "coupon" : "coupons"}
            {seller && (
              <Link
                href={link({ seller: null, view: null, page: null })}
                className="ml-2 text-sm font-normal text-muted-foreground hover:underline"
              >
                (one seller, back to all sellers)
              </Link>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminTable
            columns={couponColumns(scope, true)}
            emptyMessage="No coupons match these filters."
            rows={rows.map((row) => {
              const base = couponRow(row, scope);
              return {
                ...base,
                sortValues: {
                  ...base.sortValues,
                  owner: scope === "seller" ? row.sellerName : row.affiliateEmail,
                },
                cells: {
                  ...base.cells,
                  owner:
                    scope === "seller" && row.sellerId ? (
                      <div className="flex flex-col">
                        <Link href={`/sellers/${row.sellerId}`} className="hover:underline">
                          {row.sellerName ?? "Seller"}
                        </Link>
                        <Link
                          href={link({ seller: row.sellerId, page: null })}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          Only this seller
                        </Link>
                      </div>
                    ) : row.affiliateId ? (
                      <Link href={`/affiliate/${row.affiliateId}`} className="hover:underline">
                        {row.affiliateEmail ?? "Affiliate"}
                      </Link>
                    ) : (
                      "—"
                    ),
                },
              };
            })}
          />
          <AdminPager page={page} pages={pageCount(total)} href={(p) => link({ page: p })} />
        </CardContent>
      </Card>
    </div>
  );
}

/** One card per seller with that seller's stores, totals and coupons. */
async function SellerGroups({
  q,
  state,
  page,
  link,
}: {
  q: string | null;
  state: AdminCouponState | null;
  page: number;
  link: (next: LinkParams) => string;
}) {
  let data: Awaited<ReturnType<typeof listSellerCouponGroupsForAdmin>>;
  try {
    data = await listSellerCouponGroupsForAdmin({ q, state, page });
  } catch (error) {
    logServerError("admin", "seller coupon groups failed", {}, error);
    return <LoadError />;
  }
  const { groups, totalSellers, stats } = data;

  return (
    <div className="space-y-4">
      <StatsRow scope="seller" stats={stats} />
      <Toolbar scope="seller" view="sellers" q={q} state={state} seller={null} link={link} />

      <p className="text-sm text-muted-foreground">
        {totalSellers.toLocaleString()} {totalSellers === 1 ? "seller" : "sellers"}
        {q || state ? " match these filters" : " with coupons"}. Sellers with the most active coupons come first.
        Seller coupons work in all of that seller&apos;s stores.
      </p>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No coupons match these filters.
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => <SellerGroupCard key={group.sellerId} group={group} link={link} />)
      )}

      <AdminPager
        page={page}
        pages={pageCount(totalSellers, SELLER_COUPON_GROUPS_PAGE_SIZE)}
        href={(p) => link({ page: p })}
      />
    </div>
  );
}

function SellerGroupCard({ group, link }: { group: SellerCouponGroup; link: (next: LinkParams) => string }) {
  return (
    <Card>
      <CardHeader className="gap-3 border-b sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">
            <Link href={`/sellers/${group.sellerId}`} className="hover:underline">
              {group.sellerName ?? "Seller"}
            </Link>
          </CardTitle>
          {group.sellerEmail && <p className="text-xs text-muted-foreground">{group.sellerEmail}</p>}
          <div className="flex flex-wrap gap-1 pt-1">
            {group.stores.length === 0 ? (
              <span className="text-xs text-muted-foreground">No stores</span>
            ) : (
              group.stores.map((store) => (
                <Link key={store.id} href={`/stores/${store.id}`}>
                  <Badge variant="outline" className="font-normal hover:bg-muted">
                    {store.name}
                    {store.isPrimary && <span className="text-muted-foreground"> · primary</span>}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <GroupFigure label="Coupons" value={group.couponCount.toLocaleString()} />
            <GroupFigure label="Active" value={group.activeCount.toLocaleString()} />
            <GroupFigure label="Uses" value={group.redemptions.toLocaleString()} />
            <GroupFigure label="Discount given" value={formatEgp(group.discountGiven) ?? "—"} />
          </dl>
          <Link
            href={link({ seller: group.sellerId, view: "list", page: null })}
            className="text-xs text-muted-foreground hover:underline"
          >
            Open as a list
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <AdminTable
          columns={couponColumns("seller", false)}
          emptyMessage="No coupons match these filters."
          rows={group.coupons.map((coupon) => couponRow(coupon, "seller"))}
        />
      </CardContent>
    </Card>
  );
}

function couponColumns(scope: AdminCouponScope, withOwner: boolean): AdminTableColumn[] {
  return [
    { id: "code", header: "Code", sortable: true },
    ...(withOwner
      ? [{ id: "owner", header: scope === "seller" ? "Seller (all stores)" : "Affiliate", sortable: true }]
      : []),
    { id: "discount", header: "Discount" },
    { id: "used", header: "Used", sortable: true, descFirst: true, align: "end" },
    { id: "discountGiven", header: "Discount given", sortable: true, descFirst: true, align: "end" },
    { id: "state", header: "State", sortable: true },
    { id: "expiresAt", header: "Dates", sortable: true },
    ...(scope === "seller" ? [{ id: "actions", header: "", align: "end" as const }] : []),
  ];
}

/** Cells shared by the flat list and the per-seller tables (no owner column). */
function couponRow(row: CouponFields, scope: AdminCouponScope): AdminTableRow {
  const couponState = getCouponState({
    isActive: row.isActive ?? false,
    startsAt: row.startsAt,
    expiresAt: row.expiresAt,
  });
  return {
    id: row.id,
    sortValues: {
      code: row.code,
      used: row.usageCount ?? 0,
      discountGiven: Number(row.discountGiven ?? 0),
      state: COUPON_STATE_LABELS[couponState],
      expiresAt: row.expiresAt,
    },
    cells: {
      code: (
        <>
          <div className="font-mono font-medium">{row.code}</div>
          <div className="text-xs text-muted-foreground">{row.name}</div>
        </>
      ),
      discount: (
        <div className="text-sm">
          {formatCouponDiscount({
            discountType: row.discountType,
            discountValue: row.discountValue,
            maximumDiscount: row.maximumDiscount,
          })}
          {row.minimumPurchase && (
            <div className="text-xs text-muted-foreground">Min. {formatEgp(row.minimumPurchase)}</div>
          )}
        </div>
      ),
      used: (
        <span className="tabular-nums">
          {row.usageCount ?? 0}
          {row.usageLimit ? ` / ${row.usageLimit}` : ""}
        </span>
      ),
      discountGiven: <span className="tabular-nums">{formatEgp(row.discountGiven)}</span>,
      state: (
        <Badge variant={couponState === "active" ? "default" : "secondary"}>{COUPON_STATE_LABELS[couponState]}</Badge>
      ),
      expiresAt: (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatCouponDate(row.startsAt)} → {formatCouponDate(row.expiresAt)}
        </span>
      ),
      actions:
        scope !== "seller" ? null : row.isActive ? (
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
        ),
    },
  };
}

function Toolbar({
  scope,
  view,
  q,
  state,
  seller,
  link,
}: {
  scope: AdminCouponScope;
  view: SellerCouponView | null;
  q: string | null;
  state: AdminCouponState | null;
  seller: string | null;
  link: (next: LinkParams) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {view && (
        <div className="mr-2 flex gap-1 rounded-md border p-0.5">
          <Button asChild size="sm" variant={view === "sellers" ? "secondary" : "ghost"} className="h-7">
            <Link href={link({ view: null, seller: null, page: null })}>By seller</Link>
          </Button>
          <Button asChild size="sm" variant={view === "list" ? "secondary" : "ghost"} className="h-7">
            <Link href={link({ view: "list", page: null })}>All coupons</Link>
          </Button>
        </div>
      )}
      <Button asChild size="sm" variant={!state ? "default" : "outline"}>
        <Link href={link({ state: null, page: null })}>All states</Link>
      </Button>
      {COUPON_STATES.map((value) => (
        <Button key={value} asChild size="sm" variant={state === value ? "default" : "outline"}>
          <Link href={link({ state: value, page: null })}>{COUPON_STATE_LABELS[value]}</Link>
        </Button>
      ))}
      <form action="/coupons" className="ml-auto flex gap-2">
        <input type="hidden" name="tab" value={scope === "seller" ? "sellers" : "affiliates"} />
        {view === "list" && <input type="hidden" name="view" value="list" />}
        {state && <input type="hidden" name="state" value={state} />}
        {seller && <input type="hidden" name="seller" value={seller} />}
        <Input name="q" defaultValue={q ?? ""} placeholder="Code, name, seller or email" className="h-8 w-60" />
        <Button type="submit" size="sm" variant="outline">
          Search
        </Button>
      </form>
    </div>
  );
}

function StatsRow({
  scope,
  stats,
}: {
  scope: AdminCouponScope;
  stats: { total: number; active: number; sellers: number; redemptions: number };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <Stat label={scope === "seller" ? "Seller coupons" : "Affiliate coupons"} value={stats.total} />
      <Stat label="Active now" value={stats.active} />
      {scope === "seller" && <Stat label="Sellers with coupons" value={stats.sellers} />}
      <Stat label="Redemptions" value={stats.redemptions} />
    </div>
  );
}

function GroupFigure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function LoadError() {
  return <p className="py-10 text-center text-sm text-destructive">Coupons could not be loaded. Try again.</p>;
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
