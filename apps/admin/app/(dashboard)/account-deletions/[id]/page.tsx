import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { isUuid } from "@workspace/lib/admin";
import { getAccountDeletionForAdmin } from "@workspace/lib/admin/server";
import { validateAdminAccess } from "@/lib/auth/admin-auth";
import { formatWhen, STATUS_LABELS } from "../account-deletions.lib";
import { RestoreAccountForm } from "./restore-account-form.client";

export const dynamic = "force-dynamic";

/** One closed account (ROADMAP.md F-82): who, when it is purged, what it held, and Restore. */
export default async function AccountDeletionRequestPage({ params }: { params: Promise<{ id: string }> }) {
  await validateAdminAccess("canManageUsers");
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const request = await getAccountDeletionForAdmin(id);
  if (!request) notFound();

  return (
    <div className="space-y-5">
      <Link href="/account-deletions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Account deletions
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">Closed account</h1>
        <Badge variant="outline">{STATUS_LABELS[request.status]}</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Who</CardTitle>
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
                  <dt className="text-xs text-muted-foreground">Closed</dt>
                  <dd>{formatWhen(request.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{request.status === "completed" ? "Purged" : "Purge after"}</dt>
                  <dd>{formatWhen(request.status === "completed" && request.handledAt ? request.handledAt : request.purgeAfter)}</dd>
                </div>
                {request.status === "restored" && request.handledAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Restored</dt>
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
              {request.adminNote && (
                <section className="space-y-1">
                  <h2 className="text-xs font-medium text-muted-foreground">Admin note</h2>
                  <p className="whitespace-pre-line" dir="auto">{request.adminNote}</p>
                </section>
              )}
            </CardContent>
          </Card>

          {request.account && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What the account holds</CardTitle>
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
                    <dt className="text-xs text-muted-foreground">Store wallet (forfeited)</dt>
                    <dd className="text-lg font-semibold" dir="ltr">
                      {request.account.walletBalance ?? "0.00"} {request.account.walletCurrency ?? ""}
                    </dd>
                  </div>
                </dl>
                <p className="text-muted-foreground">
                  Everything here is deleted by the daily purge (the auth user is deleted, and migration 0134 cascades to
                  stores, products, orders and the wallet ledger). Files in storage stay until cleaned up.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Restore</CardTitle>
          </CardHeader>
          <CardContent>
            <RestoreAccountForm requestId={request.id} status={request.status} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
