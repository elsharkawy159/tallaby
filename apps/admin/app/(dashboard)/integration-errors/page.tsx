import Link from "next/link";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { formatDateTime } from "../sellers/sellers.lib";
import { IntegrationStatusBadge, integrationName } from "../sellers/[id]/seller-admin.chunks";
import { getIntegrationErrors } from "./integration-errors.data";

export const dynamic = "force-dynamic";

export default async function IntegrationErrorsPage() {
  const { rows, failed } = await getIntegrationErrors();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Integration errors</h1>
        <p className="text-sm text-muted-foreground">
          Store apps (pixels, analytics, imports) whose last sync or check failed. Credentials are never shown here.
        </p>
      </div>

      <Card>
        <CardContent>
          {failed ? (
            <p className="py-6 text-center text-sm text-red-600">Integration errors could not be loaded.</p>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No integration is in error.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>App</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last error</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link href={`/sellers/${row.sellerId}#integrations`} className="font-medium hover:underline">
                        {row.businessName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {row.storeName}
                      <div className="text-xs text-muted-foreground">{row.subdomain}</div>
                    </TableCell>
                    <TableCell>{integrationName(row.provider)}</TableCell>
                    <TableCell>
                      <IntegrationStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="max-w-md whitespace-normal break-words text-xs text-red-700">
                      {row.lastError?.slice(0, 500) ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateTime(row.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
