import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import type { SellerAdminPanel } from "./seller-admin.data";
import { formatDateTime } from "../sellers.lib";
import { auditActionLabel, describeChange } from "./seller-admin.lib";

const INTEGRATION_STATUS_CLASSES: Record<string, string> = {
  connected: "bg-green-100 text-green-800 hover:bg-green-100",
  error: "bg-red-100 text-red-800 hover:bg-red-100",
  disconnected: "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

const INTEGRATION_NAMES: Record<string, string> = {
  meta_pixel: "Meta Pixel",
  meta_capi: "Meta Conversions API",
  google_analytics: "Google Analytics 4",
  google_tag_manager: "Google Tag Manager",
  tiktok_pixel: "TikTok Pixel",
  snapchat_pixel: "Snapchat Pixel",
  google_sheets: "Google Sheets",
  shopify_import: "Shopify import",
};

export const integrationName = (provider: string) => INTEGRATION_NAMES[provider] ?? provider;

export function IntegrationStatusBadge({ status }: { status: string }) {
  return <Badge className={INTEGRATION_STATUS_CLASSES[status] ?? ""}>{status}</Badge>;
}

/** Provider, store, status and last error per integration. Never secrets or config (P9-01). */
export function SellerIntegrationsCard({ integrations }: { integrations: SellerAdminPanel["integrations"] }) {
  return (
    <Card id="integrations">
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {integrations.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No integrations connected.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">App</th>
                <th className="py-2 pr-3 font-medium">Store</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Last error</th>
                <th className="py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {integrations.map((row) => (
                <tr key={row.id} className="border-b align-top">
                  <td className="py-2 pr-3 font-medium">{integrationName(row.provider)}</td>
                  <td className="py-2 pr-3">{row.storeName}</td>
                  <td className="py-2 pr-3">
                    <IntegrationStatusBadge status={row.status} />
                  </td>
                  <td className="max-w-xs py-2 pr-3 break-words text-xs text-red-700">{row.lastError?.slice(0, 500) ?? "—"}</td>
                  <td className="py-2 whitespace-nowrap">{formatDateTime(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

/** Every admin override on this seller, newest first (P9-02). */
export function SellerAuditCard({ audit }: { audit: SellerAdminPanel["audit"] }) {
  return (
    <Card id="audit">
      <CardHeader>
        <CardTitle>Admin audit trail</CardTitle>
      </CardHeader>
      <CardContent>
        {audit.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No admin changes recorded.</p>
        ) : (
          <ul className="divide-y">
            {audit.map((row) => (
              <li key={row.id} className="space-y-1 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {auditActionLabel(row.action)}
                    {row.storeName && <span className="font-normal text-muted-foreground"> · {row.storeName}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(row.createdAt)} · {row.actorName ?? "deleted admin"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {describeChange(row.before)} → {describeChange(row.after)}
                </div>
                <div className="text-xs">Reason: {row.reason}</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
