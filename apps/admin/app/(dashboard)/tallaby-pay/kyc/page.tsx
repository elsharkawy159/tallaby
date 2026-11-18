import Link from "next/link";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { loadTallabyPayKyc } from "../tallaby-pay.data";
import { KYC_STATUS_LABEL, cairoTime } from "../tallaby-pay.lib";
import { EmptyState, LoadError, Tone, ViewLinks } from "../tallaby-pay.ui";
import { KycActions } from "./kyc.client";

export const dynamic = "force-dynamic";

const VIEWS = { submitted: "To review", reviewed: "Reviewed (latest 100)" } as const;

/**
 * Identity checks before the first withdrawal (owner Q6): the account's legal
 * name and national ID or commercial register. Every payout destination must
 * be in this name.
 */
export default async function TallabyPayKycPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const view = (await searchParams).view === "reviewed" ? "reviewed" : "submitted";
  const result = await loadTallabyPayKyc(view);
  if (!result.data) return <LoadError error={result.error} />;
  const rows = result.data;

  return (
    <div className="space-y-4">
      <ViewLinks
        views={VIEWS}
        current={view}
        label="Identity views"
        href={(v) => (v === "submitted" ? "/tallaby-pay/kyc" : "/tallaby-pay/kyc?view=reviewed")}
      />
      {rows.length === 0 ? (
        <EmptyState>{view === "submitted" ? "No identity is waiting for review." : "No identity was reviewed yet."}</EmptyState>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Legal name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.sellerId}>
                    <TableCell>
                      <Link href={`/sellers/${r.sellerId}`} className="font-medium hover:underline">
                        {r.sellerName}
                      </Link>
                      {r.sellerEmail && <span className="block text-xs text-muted-foreground">{r.sellerEmail}</span>}
                      {r.openPayouts > 0 && (
                        <Link href="/tallaby-pay/payouts" className="block text-xs text-primary hover:underline">
                          {r.openPayouts} withdrawal waiting
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{r.legalName}</TableCell>
                    <TableCell>
                      <span className="block text-xs text-muted-foreground">
                        {r.idType === "national_id" ? "National ID" : "Commercial register"}
                      </span>
                      <span className="font-mono text-sm" dir="ltr">
                        {r.idNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Tone tone={r.status === "verified" ? "success" : r.status === "rejected" ? "danger" : "warning"}>
                        {KYC_STATUS_LABEL[r.status]}
                      </Tone>
                      {r.rejectionReason && <span className="mt-1 block max-w-56 text-xs text-muted-foreground">{r.rejectionReason}</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{cairoTime(r.submittedAt)}</TableCell>
                    <TableCell>
                      {r.status !== "rejected" && (
                        <KycActions sellerId={r.sellerId} legalName={r.legalName} canVerify={r.status === "submitted"} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
