import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import type { SetupReminderHistoryRow } from "@workspace/lib/sellers/setup-reminders/server";
import { formatDateTime } from "../sellers.lib";

const KIND_LABELS: Record<SetupReminderHistoryRow["kind"], string> = {
  day1: "Day 1",
  day7: "Day 7",
  opt_out: "Opted out",
};

/** Store setup reminder emails (F-94, 0170): what went out and when. Read-only. */
export function SellerSetupRemindersCard({ rows }: { rows: SetupReminderHistoryRow[] | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Setup reminder emails</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {rows === null ? (
          <p className="text-muted-foreground">Setup reminders could not be loaded.</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">None sent.</p>
        ) : (
          <ul className="space-y-1">
            {rows.map((row) => (
              <li key={row.kind}>
                <span className="font-medium">{KIND_LABELS[row.kind]}</span>
                {" · "}
                {row.kind === "opt_out"
                  ? formatDateTime(row.sentAt ?? row.claimedAt)
                  : row.status === "sent"
                    ? `sent ${formatDateTime(row.sentAt ?? row.claimedAt)}`
                    : `${row.status} (${row.attempts} ${row.attempts === 1 ? "try" : "tries"}, ${formatDateTime(row.claimedAt)})`}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
