import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { logServerError } from "@workspace/db/log";
import { formatCurrency } from "@workspace/lib";
import { getShippingOverviewForAdmin, type AdminShippingOverview } from "@workspace/lib/admin/server";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { AdminTable, type AdminTableColumn } from "../_components/admin-table/admin-table";
import { MetricCard } from "../_components/cards/metric-card";
import { getStatusLabel } from "../orders/orders.lib";
import { formatAdminDate } from "../stores/stores.lib";

export const dynamic = "force-dynamic";

const STATUS_CARDS: { title: string; statuses: string[] }[] = [
  { title: "Waiting to ship", statuses: ["pending", "assigned"] },
  { title: "Out for delivery", statuses: ["out_for_delivery"] },
  { title: "Delivered", statuses: ["delivered"] },
  { title: "Failed or returned", statuses: ["failed", "returned", "cancelled"] },
];

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  assigned: "bg-blue-100 text-blue-900 border-blue-200",
  out_for_delivery: "bg-blue-100 text-blue-900 border-blue-200",
  delivered: "bg-green-100 text-green-900 border-green-200",
  failed: "bg-red-100 text-red-900 border-red-200",
  returned: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

const PROVIDER_COLUMNS: AdminTableColumn[] = [
  { id: "name", header: "Provider", sortable: true },
  { id: "status", header: "Status", sortable: true },
  { id: "contact", header: "Contact" },
  { id: "shipments", header: "Shipments", sortable: true, descFirst: true, align: "end" },
  { id: "delivered", header: "Delivered", sortable: true, descFirst: true, align: "end" },
];

const SHIPMENT_COLUMNS: AdminTableColumn[] = [
  { id: "createdAt", header: "Created", sortable: true, descFirst: true },
  { id: "order", header: "Order", sortable: true },
  { id: "provider", header: "Provider", sortable: true },
  { id: "tracking", header: "Tracking" },
  { id: "status", header: "Status", sortable: true },
  { id: "deliveredAt", header: "Delivered", sortable: true, descFirst: true },
  { id: "cost", header: "Cost", sortable: true, descFirst: true, align: "end" },
];

/**
 * Delivery from the database: the shipping providers, the shipping app's
 * automation switches and the latest shipments. Read-only here; providers,
 * riders and assignment are managed in the shipping app.
 */
export default async function ShippingPage() {
  await getCurrentAdminUser();
  let data: AdminShippingOverview;
  try {
    data = await getShippingOverviewForAdmin();
  } catch (error) {
    logServerError("admin", "shipping overview failed", {}, error);
    return <p className="text-sm text-destructive">Shipping could not be loaded. Try again.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Shipping</h1>
        <p className="text-sm text-muted-foreground">
          Delivery providers, automation and shipments. Providers, riders and assignment are managed in the shipping
          app; sellers set their own shipping zones per store.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATUS_CARDS.map(({ title, statuses }) => {
          const count = statuses.reduce((sum, status) => sum + (data.byStatus[status] ?? 0), 0);
          return <MetricCard key={title} title={title} value={count.toLocaleString()} helpText="shipments" />;
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Automation</CardTitle>
            <CardDescription>Set in the shipping app.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.automation ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Confirm new orders automatically</dt>
                <dd>
                  <OnOff on={data.automation.autoConfirm} />
                </dd>
                <dt className="text-muted-foreground">Assign a provider automatically</dt>
                <dd>
                  <OnOff on={data.automation.autoAssign} />
                  {data.automation.autoAssign && (
                    <span className="ml-2 text-muted-foreground">{data.automation.providerName ?? "No provider chosen"}</span>
                  )}
                </dd>
                <dt className="text-muted-foreground">Last changed</dt>
                <dd>{formatAdminDate(data.automation.updatedAt)}</dd>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Automation has not been set up.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Store shipping zones</CardTitle>
            <CardDescription>Zones sellers set for their own storefront checkout.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              <span className="text-2xl font-semibold tabular-nums">{data.zones.zones.toLocaleString()}</span>{" "}
              {data.zones.zones === 1 ? "zone" : "zones"} across{" "}
              <span className="font-semibold tabular-nums">{data.zones.stores.toLocaleString()}</span>{" "}
              {data.zones.stores === 1 ? "store" : "stores"}.
            </p>
            <p className="mt-2 text-muted-foreground">
              A store&apos;s zones are listed on its page under{" "}
              <Link href="/stores" className="underline">
                Stores
              </Link>{" "}
              → Payments &amp; shipping.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminTable
            columns={PROVIDER_COLUMNS}
            defaultSort={{ id: "name", desc: false }}
            emptyMessage="No shipping providers."
            rows={data.providers.map((provider) => ({
              id: provider.id,
              sortValues: {
                name: provider.name,
                status: provider.isActive,
                shipments: provider.shipments,
                delivered: provider.delivered,
              },
              cells: {
                name: (
                  <div>
                    <div className="font-medium">{provider.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{provider.code}</div>
                  </div>
                ),
                status: (
                  <Badge variant={provider.isActive ? "outline" : "secondary"} className="font-normal">
                    {provider.isActive ? "Active" : "Inactive"}
                  </Badge>
                ),
                contact: (
                  <div className="text-xs text-muted-foreground">
                    {[provider.contactName, provider.contactPhone].filter(Boolean).join(" · ") || "—"}
                    {provider.website && (
                      <a href={provider.website} target="_blank" rel="noopener noreferrer" className="block hover:underline" dir="ltr">
                        {provider.website}
                      </a>
                    )}
                  </div>
                ),
                shipments: <span className="tabular-nums">{provider.shipments.toLocaleString()}</span>,
                delivered: <span className="tabular-nums">{provider.delivered.toLocaleString()}</span>,
              },
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Latest shipments</CardTitle>
          <CardDescription>The 100 most recent.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTable
            columns={SHIPMENT_COLUMNS}
            defaultSort={{ id: "createdAt", desc: true }}
            emptyMessage="No shipments yet."
            rows={data.shipments.map((shipment) => ({
              id: shipment.id,
              className: "align-top",
              sortValues: {
                createdAt: shipment.createdAt,
                order: shipment.orderNumber,
                provider: shipment.providerName ?? shipment.carrier,
                status: shipment.status,
                deliveredAt: shipment.deliveredAt,
                cost: shipment.cost,
              },
              cells: {
                createdAt: <span className="whitespace-nowrap text-xs text-muted-foreground">{formatAdminDate(shipment.createdAt)}</span>,
                order: (
                  <Link href={`/orders/${shipment.orderId}`} className="font-medium hover:underline">
                    #{shipment.orderNumber}
                  </Link>
                ),
                provider: <span className="text-sm">{shipment.providerName ?? shipment.carrier ?? "—"}</span>,
                tracking: (
                  <span className="font-mono text-xs" dir="ltr">
                    {shipment.trackingNumber ?? "—"}
                  </span>
                ),
                status: (
                  <>
                    <Badge variant="outline" className={`font-normal ${STATUS_CLASSES[shipment.status] ?? ""}`}>
                      {getStatusLabel(shipment.status)}
                    </Badge>
                    {shipment.failureReason && <p className="mt-1 max-w-56 text-xs text-destructive">{shipment.failureReason}</p>}
                  </>
                ),
                deliveredAt: <span className="whitespace-nowrap text-xs text-muted-foreground">{formatAdminDate(shipment.deliveredAt)}</span>,
                cost: <span className="tabular-nums">{formatCurrency(shipment.cost)}</span>,
              },
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function OnOff({ on }: { on: boolean }) {
  return (
    <Badge variant="outline" className={on ? "bg-green-100 font-normal text-green-900" : "font-normal"}>
      {on ? "On" : "Off"}
    </Badge>
  );
}
