import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ReasonActionButton } from "../_components/dialogs/reason-action.client";
import { IntegrationStatusBadge, PROVIDER_LABELS, formatAdminDate } from "../stores/stores.lib";
import { integrationAdminAction } from "./integrations.server";

export interface IntegrationTableRow {
  id: string;
  provider: string;
  status: string;
  publicConfig: Record<string, string>;
  scopes: string[];
  externalAccountId: string | null;
  hasCredentials: boolean;
  lastError: string | null;
  lastSyncedAt: string | null;
  updatedAt: string;
  storeId?: string;
  storeName?: string;
  sellerId?: string;
  sellerName?: string | null;
}

/**
 * Store integrations with their public identifiers only (docs/admin-saas.md
 * §3.5). Credentials are shown as "stored" / "none", never their value.
 */
export function IntegrationsTable({ rows, showStore = false }: { rows: IntegrationTableRow[]; showStore?: boolean }) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No integrations.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Provider</TableHead>
          {showStore && <TableHead>Store</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead>Public details</TableHead>
          <TableHead>Last sync</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} className="align-top">
            <TableCell className="font-medium">{PROVIDER_LABELS[row.provider] ?? row.provider}</TableCell>
            {showStore && (
              <TableCell className="text-sm">
                {row.storeId ? (
                  <Link href={`/stores/${row.storeId}?tab=integrations`} className="hover:underline">
                    {row.storeName}
                  </Link>
                ) : (
                  row.storeName
                )}
                {row.sellerId && (
                  <div>
                    <Link href={`/sellers/${row.sellerId}`} className="text-xs text-muted-foreground hover:underline">
                      {row.sellerName ?? "Seller"}
                    </Link>
                  </div>
                )}
              </TableCell>
            )}
            <TableCell>
              <IntegrationStatusBadge status={row.status} />
              {row.lastError && (
                <p className="mt-1 max-w-72 break-words text-xs text-destructive" title={row.lastError}>
                  {row.lastError.length > 160 ? `${row.lastError.slice(0, 160)}…` : row.lastError}
                </p>
              )}
            </TableCell>
            <TableCell className="text-xs">
              <dl className="space-y-0.5">
                {Object.entries(row.publicConfig).map(([key, value]) => (
                  <div key={key} className="flex gap-1">
                    <dt className="text-muted-foreground">{key}:</dt>
                    <dd className="font-mono" dir="ltr">
                      {value}
                    </dd>
                  </div>
                ))}
                {row.externalAccountId && (
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground">account:</dt>
                    <dd className="font-mono" dir="ltr">
                      {row.externalAccountId}
                    </dd>
                  </div>
                )}
                <div className="flex gap-1">
                  <dt className="text-muted-foreground">credentials:</dt>
                  <dd>{row.hasCredentials ? "stored (encrypted)" : "none"}</dd>
                </div>
                {row.scopes.length > 0 && (
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground">scopes:</dt>
                    <dd>{row.scopes.join(", ")}</dd>
                  </div>
                )}
              </dl>
            </TableCell>
            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
              {formatAdminDate(row.lastSyncedAt)}
              <div>changed {formatAdminDate(row.updatedAt)}</div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {row.status === "error" && (
                  <ReasonActionButton
                    label="Clear error"
                    title="Clear this error?"
                    description="The integration goes back to connected (when it still has credentials or an id), so the next sync retries."
                    confirmLabel="Clear error"
                    payload={{ action: "clear_integration_error", integrationId: row.id }}
                    action={integrationAdminAction}
                  />
                )}
                {(row.status !== "disconnected" || row.hasCredentials) && (
                  <ReasonActionButton
                    label="Disconnect"
                    title={`Disconnect ${PROVIDER_LABELS[row.provider] ?? row.provider}?`}
                    description="Removes the stored credentials and stops its storefront script and syncs. The seller must connect it again."
                    confirmLabel="Disconnect"
                    destructive
                    payload={{ action: "disconnect_integration", integrationId: row.id }}
                    action={integrationAdminAction}
                  />
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
