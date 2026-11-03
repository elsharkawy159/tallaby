"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import type { AdminAppRequestRow } from "@workspace/lib/admin/server";
import { reviewAppRequestAction } from "./app-requests.server";

const APP_NAMES: Record<string, string> = { sms: "SMS" };

const STATUS_LABELS: Record<AdminAppRequestRow["status"], string> = {
  requested: "Requested",
  enabled: "Enabled",
  declined: "Declined",
};

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(
    new Date(iso),
  );

export function AppRequestsList({ rows }: { rows: AdminAppRequestRow[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">No requests here.</CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <AppRequestRow key={row.id} row={row} />
      ))}
    </div>
  );
}

function AppRequestRow({ row }: { row: AdminAppRequestRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const review = (decision: "enable" | "decline") =>
    startTransition(async () => {
      const result = await reviewAppRequestAction({ requestId: row.id, decision });
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0 space-y-1">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {APP_NAMES[row.appKey] ?? row.appKey}
            <Badge variant="outline">{STATUS_LABELS[row.status]}</Badge>
          </p>
          <p className="text-sm">
            {row.storeName ?? row.subdomain ?? "Store"}
            {row.sellerName ? ` · ${row.sellerName}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">Requested {when(row.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          {row.status !== "enabled" && (
            <Button size="sm" disabled={pending} onClick={() => review("enable")}>
              Enable
            </Button>
          )}
          {row.status !== "declined" && (
            <Button size="sm" variant="outline" disabled={pending} onClick={() => review("decline")}>
              Decline
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
