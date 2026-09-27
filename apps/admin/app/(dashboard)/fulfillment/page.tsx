import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  FULFILLMENT_SERVICE_STATUSES,
  FULFILLMENT_SERVICE_TYPES,
  type FulfillmentServiceStatus,
  type FulfillmentServiceType,
} from "@workspace/lib/fulfillment";
import { getFulfillmentRequests } from "./fulfillment.server";
import {
  SERVICE_LABELS,
  STATUS_CLASSES,
  STATUS_LABELS,
  describeChoice,
  formatDateTime,
} from "./fulfillment.lib";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ status?: string; service?: string }>;
}

const OPEN_STATUSES: FulfillmentServiceStatus[] = ["requested", "under_review", "awaiting_agreement"];

export default async function FulfillmentRequestsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = (FULFILLMENT_SERVICE_STATUSES as readonly string[]).includes(params.status ?? "")
    ? (params.status as FulfillmentServiceStatus)
    : undefined;
  const serviceType = (FULFILLMENT_SERVICE_TYPES as readonly string[]).includes(params.service ?? "")
    ? (params.service as FulfillmentServiceType)
    : undefined;

  const { rows, plans } = await getFulfillmentRequests({ status, serviceType });
  const plansById = new Map(plans.map((plan) => [plan.id, plan]));

  const href = (next: { status?: string; service?: string }) => {
    const query = new URLSearchParams();
    const s = "status" in next ? next.status : status;
    const svc = "service" in next ? next.service : serviceType;
    if (s) query.set("status", s);
    if (svc) query.set("service", svc);
    const qs = query.toString();
    return qs ? `/fulfillment?${qs}` : "/fulfillment";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Fulfillment requests</h1>
          <p className="text-sm text-muted-foreground">
            Services sellers asked Tallaby to handle. Nothing changes for their orders until a
            service is activated.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/fulfillment/plans">Manage plans</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip href={href({ status: undefined })} active={!status} label="All open" />
        {OPEN_STATUSES.map((s) => (
          <FilterChip key={s} href={href({ status: s })} active={status === s} label={STATUS_LABELS[s]} />
        ))}
        <span className="mx-1 w-px bg-border" />
        <FilterChip href={href({ service: undefined })} active={!serviceType} label="All services" />
        {FULFILLMENT_SERVICE_TYPES.map((type) => (
          <FilterChip
            key={type}
            href={href({ service: type })}
            active={serviceType === type}
            label={SERVICE_LABELS[type]}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {rows.length} {rows.length === 1 ? "request" : "requests"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No open requests.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Currently active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/sellers/${row.sellerId}#fulfillment`}
                        className="font-medium hover:underline"
                      >
                        {row.businessName}
                      </Link>
                      {row.supportPhone && (
                        <div className="text-xs text-muted-foreground" dir="ltr">
                          {row.supportPhone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{SERVICE_LABELS[row.serviceType]}</TableCell>
                    <TableCell>
                      {describeChoice(row.requestedProvider, row.requestedPlanId, plansById)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {describeChoice(row.activeProvider, row.activePlanId, plansById)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_CLASSES[row.status]}>
                        {STATUS_LABELS[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(row.requestedAt)}
                    </TableCell>
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

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Button asChild size="sm" variant={active ? "default" : "outline"}>
      <Link href={href}>{label}</Link>
    </Button>
  );
}
