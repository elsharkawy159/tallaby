import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { isUuid } from "@workspace/lib/admin";
import { getAccountDeletionForAdmin } from "@workspace/lib/admin/server";
import { accountDeletionDueDate } from "@workspace/lib/account-deletion";
import { validateAdminAccess } from "@/lib/auth/admin-auth";
import { formatWhen, STATUS_LABELS } from "../account-deletions.lib";
import { AccountDeletionForm } from "./account-deletion-form.client";

export const dynamic = "force-dynamic";

/** One account deletion request (ROADMAP.md F-82): the checks before deleting, how to delete, and the status form. */
export default async function AccountDeletionRequestPage({ params }: { params: Promise<{ id: string }> }) {
  await validateAdminAccess("canManageUsers");
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const request = await getAccountDeletionForAdmin(id);
  if (!request) notFound();

  const balance = request.account?.walletBalance ? Number(request.account.walletBalance) : 0;
  const blockers = [
    request.account && request.account.openOrders > 0 && `${request.account.openOrders} order(s) still open (not delivered or cancelled).`,
    request.account && balance !== 0 && `Store wallet balance is ${request.account.walletBalance} ${request.account.walletCurrency ?? ""}.`.trim(),
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      <Link href="/account-deletions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Account deletions
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">Account deletion request</h1>
        <Badge variant="outline">{STATUS_LABELS[request.status]}</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Who asked</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Seller</dt>
                  <dd>
                    {request.userId ? (
                      <Link className="underline underline-offset-2" href={`/sellers/${request.userId}`}>
                        {request.displayName ?? "Seller"}
                      </Link>
                    ) : (
                      <span>{request.displayName ?? "Seller"} (deleted)</span>
                    )}
                    {request.email ? <span className="block text-xs text-muted-foreground" dir="ltr">{request.email}</span> : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">User id</dt>
                  <dd className="font-mono text-xs break-all">{request.userId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Asked</dt>
                  <dd>{formatWhen(request.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Due by</dt>
                  <dd>{formatWhen(accountDeletionDueDate(request.createdAt).toISOString())}</dd>
                </div>
                {request.cancelledAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Cancelled by the seller</dt>
                    <dd>{formatWhen(request.cancelledAt)}</dd>
                  </div>
                )}
                {request.handledAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Last update</dt>
                    <dd>
                      {formatWhen(request.handledAt)}
                      {request.handledByEmail ? ` · ${request.handledByEmail}` : ""}
                    </dd>
                  </div>
                )}
              </dl>
              <section className="space-y-1">
                <h2 className="text-xs font-medium text-muted-foreground">Reason</h2>
                <p className="whitespace-pre-line" dir="auto">
                  {request.reason || <span className="text-muted-foreground">None given</span>}
                </p>
              </section>
            </CardContent>
          </Card>

          {request.account && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Before you delete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Stores</dt>
                    <dd className="text-lg font-semibold">{request.account.stores}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Open orders</dt>
                    <dd className="text-lg font-semibold">{request.account.openOrders}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Store wallet</dt>
                    <dd className="text-lg font-semibold" dir="ltr">
                      {request.account.walletBalance ?? "0.00"} {request.account.walletCurrency ?? ""}
                    </dd>
                  </div>
                </dl>
                {blockers.length > 0 ? (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    <p className="font-medium">Sort these out with the seller first:</p>
                    <ul className="mt-1 list-disc ps-5">
                      {blockers.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No open orders and an empty wallet.</p>
                )}
                <ol className="list-decimal space-y-1 ps-5">
                  <li>Supabase → Authentication → Users → search the email above → Delete user.</li>
                  <li>
                    That deletes the account and everything it owns (stores, products, orders, wallet ledger, files records;
                    migration 0134). Storage files under the seller&apos;s folders stay until cleaned up.
                  </li>
                  <li>Come back here and mark the request completed.</li>
                </ol>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountDeletionForm requestId={request.id} status={request.status} note={request.adminNote} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
