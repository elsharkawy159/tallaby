import Link from "next/link";
import { logServerError } from "@workspace/db/log";
import { formatCurrency } from "@workspace/lib";
import {
  listReferralPayoutsForAdmin,
  listReferrersForAdmin,
  type AdminPayoutRow,
  type AdminReferrerRow,
} from "@workspace/lib/admin/server";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { PayoutList } from "./referrals-admin.client";

export const dynamic = "force-dynamic";

const VIEWS = { requests: "Withdrawal requests", done: "Paid & rejected", referrers: "Referrers" } as const;
type View = keyof typeof VIEWS;

/**
 * Tallaby affiliate program (F-37, 0117): pay or reject withdrawal requests
 * and review referrers. Never cached: money data.
 */
export default async function ReferralsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await getCurrentAdminUser();
  const raw = (await searchParams).view;
  const view: View = raw === "done" || raw === "referrers" ? raw : "requests";

  let payouts: AdminPayoutRow[] = [];
  let referrers: AdminReferrerRow[] = [];
  try {
    if (view === "referrers") referrers = await listReferrersForAdmin();
    else payouts = await listReferralPayoutsForAdmin(view === "requests" ? "open" : "done");
  } catch (error) {
    logServerError("admin", "referrals list failed", {}, error);
    return <p className="text-sm text-destructive">Referrals could not be loaded. Is migration 0117 applied?</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Referrals</h1>
        <p className="text-sm text-muted-foreground">
          Sellers earn 20% of every succeeded store top-up by the sellers they refer, paid in cash. They can ask for
          a withdrawal (whole balance, at least EGP 500) after 10 successful referrals and 10 stores. Send the money,
          then mark the request paid with the transfer reference.
        </p>
      </div>
      <nav className="flex flex-wrap gap-1.5" aria-label="Referral views">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <Link
            key={v}
            href={v === "requests" ? "/referrals" : `/referrals?view=${v}`}
            aria-current={view === v ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm",
              view === v ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {VIEWS[v]}
          </Link>
        ))}
      </nav>
      {view === "referrers" ? <ReferrersTable rows={referrers} /> : <PayoutList rows={payouts} open={view === "requests"} />}
    </div>
  );
}

function ReferrersTable({ rows }: { rows: AdminReferrerRow[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">No seller has referred anyone yet.</CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referrer</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-end">Referred</TableHead>
              <TableHead className="text-end">Successful</TableHead>
              <TableHead className="text-end">Stores</TableHead>
              <TableHead className="text-end">Earned</TableHead>
              <TableHead className="text-end">Paid</TableHead>
              <TableHead className="text-end">Balance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.sellerId}>
                <TableCell>
                  <Link href={`/referrals/${r.sellerId}`} className="font-medium hover:underline">
                    {r.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs">{r.code ?? "—"}</TableCell>
                <TableCell className="text-end tabular-nums">{r.referred}</TableCell>
                <TableCell className="text-end tabular-nums">{r.successfulReferrals}</TableCell>
                <TableCell className="text-end tabular-nums">{r.stores}</TableCell>
                <TableCell className="text-end tabular-nums">{formatCurrency(Number(r.earned))}</TableCell>
                <TableCell className="text-end tabular-nums">{formatCurrency(Number(r.paid))}</TableCell>
                <TableCell className="text-end tabular-nums">{formatCurrency(Number(r.balance))}</TableCell>
                <TableCell className="space-x-1">
                  {r.unlockedAt ? <Badge>Unlocked</Badge> : <Badge variant="secondary">Locked</Badge>}
                  {r.status !== "approved" && <Badge variant="destructive">{r.status ?? "pending"}</Badge>}
                  {r.suspicious > 0 && <Badge variant="destructive">{r.suspicious} same phone</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
