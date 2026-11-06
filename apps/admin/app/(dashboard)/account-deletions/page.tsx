import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { listAccountDeletionsForAdmin } from "@workspace/lib/admin/server";
import { ACCOUNT_DELETION_DAYS } from "@workspace/lib/account-deletion";
import { validateAdminAccess } from "@/lib/auth/admin-auth";
import { FILTER_LABELS, FILTERS, formatWhen, parseFilter, STATUS_LABELS } from "./account-deletions.lib";

export const dynamic = "force-dynamic";

/**
 * Sellers who deleted their account from Settings (ROADMAP.md F-82, 0157).
 * The account closed at once; the daily cron purges it after the date shown.
 */
export default async function AccountDeletionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await validateAdminAccess("canManageUsers");
  const filter = parseFilter((await searchParams).status);
  const rows = await listAccountDeletionsForAdmin(filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Account deletions</h1>
        <p className="text-sm text-muted-foreground">
          Sellers who deleted their account from Settings. The account closed right away (signed out, stores offline, wallet
          balance forfeited). The data is purged automatically {ACCOUNT_DELETION_DAYS} days later. Until then you can restore
          it if the seller emails support.
        </p>
      </div>
      <nav className="flex flex-wrap gap-1.5" aria-label="Filter by status">
        {FILTERS.map((key) => (
          <Link
            key={key}
            href={key === "scheduled" ? "/account-deletions" : `/account-deletions?status=${key}`}
            aria-current={filter === key ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm",
              filter === key ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {FILTER_LABELS[key]}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">No accounts here.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Link key={row.id} href={`/account-deletions/${row.id}`} className="block">
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      <span className="truncate" dir="auto">{row.displayName ?? row.email ?? "Unknown seller"}</span>
                      <Badge variant={row.status === "scheduled" ? "default" : "outline"}>{STATUS_LABELS[row.status]}</Badge>
                    </p>
                    {row.email && <p className="text-sm" dir="ltr">{row.email}</p>}
                    <p className="text-xs text-muted-foreground">
                      Closed {formatWhen(row.createdAt)}
                      {row.status === "scheduled" ? ` · purged after ${formatWhen(row.purgeAfter)}` : ""}
                      {row.status !== "scheduled" && row.handledAt ? ` · ${STATUS_LABELS[row.status].toLowerCase()} ${formatWhen(row.handledAt)}` : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
