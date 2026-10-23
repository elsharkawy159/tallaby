import Link from "next/link";
import { AdminTable, type AdminTableColumn } from "../_components/admin-table/admin-table";
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
  const columns: AdminTableColumn[] = [
    { id: "provider", header: "Provider", sortable: true },
    ...(showStore ? [{ id: "store", header: "Store", sortable: true }] : []),
    { id: "status", header: "Status", sortable: true },
    { id: "details", header: "Public details" },
    { id: "lastSyncedAt", header: "Last sync", sortable: true, descFirst: true },
    { id: "actions", header: "Actions", align: "end" },
  ];
  return (
    <AdminTable
      columns={columns}
      emptyMessage="No integrations."
      rows={rows.map((row) => ({
        id: row.id,
        className: "align-top",
        sortValues: {
          provider: PROVIDER_LABELS[row.provider] ?? row.provider,
          store: row.storeName,
          status: row.status,
          lastSyncedAt: row.lastSyncedAt,
        },
        cells: {
          provider: <span className="font-medium">{PROVIDER_LABELS[row.provider] ?? row.provider}</span>,
          store: (
            <div className="text-sm">
              {row.storeId ? (
                <Link href={`/stores/${row.storeId}#integrations`} className="hover:underline">
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
            </div>
          ),
          status: (
            <>
              <IntegrationStatusBadge status={row.status} />
              {row.lastError && (
                <p className="mt-1 max-w-72 break-words text-xs text-destructive" title={row.lastError}>
                  {row.lastError.length > 160 ? `${row.lastError.slice(0, 160)}…` : row.lastError}
                </p>
              )}
            </>
          ),
          details: (
            <dl className="space-y-0.5 text-xs">
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
          ),
          lastSyncedAt: (
            <div className="whitespace-nowrap text-xs text-muted-foreground">
              {formatAdminDate(row.lastSyncedAt)}
              <div>changed {formatAdminDate(row.updatedAt)}</div>
            </div>
          ),
          actions: (
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
          ),
        },
      }))}
    />
  );
}
