import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { listAccountDeletionsForAdmin } from "@workspace/lib/admin/server";
import { ACCOUNT_DELETION_DAYS, accountDeletionDueDate } from "@workspace/lib/account-deletion";
import { validateAdminAccess } from "@/lib/auth/admin-auth";
import { FILTER_LABELS, FILTERS, formatWhen, parseFilter, STATUS_LABELS } from "./account-deletions.lib";

export const dynamic = "force-dynamic";

/**
 * Sellers who asked for their account to be deleted (ROADMAP.md F-82, 0157).
 * Google Play requires this; we promise deletion within 30 days.
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
          Sellers who asked to delete their account from Settings. Delete each one within {ACCOUNT_DELETION_DAYS} days
          (our promise on the public page and on Google Play), then mark it completed.
        </p>
      </div>
      <nav className="flex flex-wrap gap-1.5" aria-label="Filter by status">
        {FILTERS.map((key) => (
          <Link
            key={key}
            href={key === "pending" ? "/account-deletions" : `/account-deletions?status=${key}`}
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
          <CardContent className="py-10 text-center text-sm text-muted-foreground">No requests here.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const due = accountDeletionDueDate(row.createdAt);
            return (
              <Link key={row.id} href={`/account-deletions/${row.id}`} className="block">
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        <span className="truncate" dir="auto">{row.displayName ?? row.email ?? "Unknown seller"}</span>
                        <Badge variant={row.status === "pending" ? "default" : "outline"}>{STATUS_LABELS[row.status]}</Badge>
                        {row.overdue && <Badge variant="destructive">Overdue</Badge>}
                      </p>
                      {row.email && <p className="text-sm" dir="ltr">{row.email}</p>}
                      <p className="text-xs text-muted-foreground">
                        Asked {formatWhen(row.createdAt)}
                        {row.status === "pending" ? ` · due ${formatWhen(due.toISOString())}` : ""}
                        {row.userId ? "" : " · user already deleted"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
