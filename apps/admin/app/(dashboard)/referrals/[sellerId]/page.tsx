import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCurrency } from "@workspace/lib";
import { getReferrerDetailForAdmin } from "@workspace/lib/admin/server";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { RelockButton, ReverseButton } from "../referrals-admin.client";

export const dynamic = "force-dynamic";

const day = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeZone: "Africa/Cairo" }).format(new Date(iso)) : "—";

/** One referrer: who they brought, what each topped up, and fraud tools (F-37). */
export default async function ReferrerPage({ params }: { params: Promise<{ sellerId: string }> }) {
  await getCurrentAdminUser();
  const { sellerId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(sellerId)) notFound();
  const detail = await getReferrerDetailForAdmin(sellerId);
  if (!detail) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/referrals?view=referrers" className="text-sm text-muted-foreground hover:underline">
            ← Referrers
          </Link>
          <h1 className="text-2xl font-semibold">
            <Link href={`/sellers/${detail.sellerId}`} className="hover:underline">
              {detail.name}
            </Link>
          </h1>
          <p className="text-sm text-muted-foreground">
            Code <span className="font-mono">{detail.code ?? "—"}</span> · phone{" "}
            <span className="font-mono">{detail.phone ?? "—"}</span> · {detail.counts.successfulReferrals}/10 referrals ·{" "}
            {detail.counts.stores}/10 stores
          </p>
        </div>
        <div className="flex items-center gap-2">
          {detail.unlockedAt ? <Badge>Unlocked {day(detail.unlockedAt)}</Badge> : <Badge variant="secondary">Locked</Badge>}
          {detail.unlockedAt && <RelockButton sellerId={detail.sellerId} />}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Referred sellers</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Signed up</TableHead>
                <TableHead className="text-end">Stores</TableHead>
                <TableHead className="text-end">Topped up</TableHead>
                <TableHead className="text-end">Commission</TableHead>
                <TableHead className="text-end">Reversed</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.referred.map((r) => (
                <TableRow key={r.sellerId}>
                  <TableCell>
                    <Link href={`/sellers/${r.sellerId}`} className="font-medium hover:underline">
                      {r.name}
                    </Link>
                    <div className="mt-1 space-x-1">
                      {r.samePhone && <Badge variant="destructive">Same phone</Badge>}
                      {r.excludedAt && <Badge variant="secondary">Excluded {day(r.excludedAt)}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.phone ?? "—"}</TableCell>
                  <TableCell>{day(r.signedUpAt)}</TableCell>
                  <TableCell className="text-end tabular-nums">{r.stores}</TableCell>
                  <TableCell className="text-end tabular-nums">{formatCurrency(Number(r.toppedUp))}</TableCell>
                  <TableCell className="text-end tabular-nums">{formatCurrency(Number(r.commission))}</TableCell>
                  <TableCell className="text-end tabular-nums">{formatCurrency(Number(r.reversed))}</TableCell>
                  <TableCell className="text-end">
                    {!r.excludedAt && <ReverseButton referredSellerId={r.sellerId} name={r.name} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
