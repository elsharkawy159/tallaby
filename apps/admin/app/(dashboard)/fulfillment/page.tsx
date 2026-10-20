import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import {
  FULFILLMENT_REVIEW_STATUSES,
  FULFILLMENT_SERVICE_TYPES,
  formatAge,
  fulfillmentQueueQuery,
  parseFulfillmentQueueFilters,
  serviceChips,
  type FulfillmentQueueFilters,
} from "@workspace/lib/fulfillment";
import { AdminPager } from "../_components/admin-pager";
import { AdminTable, type AdminTableColumn } from "../_components/admin-table/admin-table";
import { getFulfillmentSellerQueue } from "./fulfillment.data";
import {
  MODEL_LABELS,
  REVIEW_LABELS,
  SERVICE_LABELS,
  STATUS_CLASSES,
  STATUS_LABELS,
  formatDateTime,
} from "./fulfillment.lib";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const QUEUE_COLUMNS: AdminTableColumn[] = [
  { id: "seller", header: "Seller", sortable: true },
  { id: "setup", header: "Setup", sortable: true },
  { id: "services", header: "Services" },
  { id: "openCount", header: "Open", sortable: true, descFirst: true, align: "end" },
  // Oldest first: an earlier date is the longer wait.
  { id: "oldestOpenAt", header: "Oldest open", sortable: true },
  { id: "updatedAt", header: "Updated", sortable: true, descFirst: true },
];

const STATE_LABELS = { open: "Open requests", active: "Active services", all: "All sellers" } as const;

/** One row per seller (docs/admin-saas.md §3.1); the services open on the detail page. */
export default async function FulfillmentQueuePage({ searchParams }: PageProps) {
  const filters = parseFulfillmentQueueFilters(await searchParams);
  const href = (next: Partial<FulfillmentQueueFilters>) =>
    `/fulfillment${fulfillmentQueueQuery({ ...filters, page: 1, ...next })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Fulfillment requests</h1>
          <p className="text-sm text-muted-foreground">
            One row per seller. Open a seller to review storage, packaging, delivery, customer
            service and returns together. Nothing changes for their orders until a service is
            activated.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/fulfillment/plans">Manage plans</Link>
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATE_LABELS) as (keyof typeof STATE_LABELS)[]).map((state) => (
            <FilterChip key={state} href={href({ state })} active={filters.state === state} label={STATE_LABELS[state]} />
          ))}
          <span className="mx-1 w-px bg-border" />
          <FilterChip href={href({ service: null })} active={!filters.service} label="All services" />
          {FULFILLMENT_SERVICE_TYPES.map((type) => (
            <FilterChip
              key={type}
              href={href({ service: type })}
              active={filters.service === type}
              label={SERVICE_LABELS[type]}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip href={href({ review: null })} active={!filters.review} label="Any contact status" />
          {FULFILLMENT_REVIEW_STATUSES.map((review) => (
            <FilterChip key={review} href={href({ review })} active={filters.review === review} label={REVIEW_LABELS[review]} />
          ))}
          <form action="/fulfillment" className="ml-auto flex gap-2">
            {filters.state !== "open" && <input type="hidden" name="state" value={filters.state} />}
            {filters.service && <input type="hidden" name="service" value={filters.service} />}
            {filters.review && <input type="hidden" name="review" value={filters.review} />}
            <Input name="q" defaultValue={filters.q ?? ""} placeholder="Seller, phone or email" className="h-8 w-56" />
            <Button type="submit" size="sm" variant="outline">
              Search
            </Button>
          </form>
        </div>
      </div>

      <Suspense key={JSON.stringify(filters)} fallback={<QueueSkeleton />}>
        <QueueTable filters={filters} />
      </Suspense>
    </div>
  );
}

async function QueueTable({ filters }: { filters: FulfillmentQueueFilters }) {
  const { rows, total, pageSize, failed } = await getFulfillmentSellerQueue(filters);
  const detailQuery = fulfillmentQueueQuery({ ...filters, page: 1 });
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {total.toLocaleString()} {total === 1 ? "seller" : "sellers"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {failed ? (
          <p className="py-10 text-center text-sm text-destructive">The queue could not be loaded. Try again.</p>
        ) : (
          <AdminTable
            columns={QUEUE_COLUMNS}
            emptyMessage="No sellers match these filters."
            rows={rows.map((row) => ({
              id: row.sellerId,
              className: "relative",
              sortValues: {
                seller: row.businessName,
                setup: row.model ? MODEL_LABELS[row.model] : null,
                openCount: row.openCount,
                oldestOpenAt: row.oldestOpenAt,
                updatedAt: row.updatedAt,
              },
              cells: {
                seller: (
                  <>
                    <Link
                      href={`/fulfillment/${row.sellerId}${detailQuery}`}
                      className="font-medium after:absolute after:inset-0 hover:underline"
                    >
                      {row.businessName || "Unnamed seller"}
                    </Link>
                    <div className="text-xs text-muted-foreground" dir="ltr">
                      {row.supportPhone ?? row.email ?? ""}
                    </div>
                  </>
                ),
                setup: (
                  <div className="text-sm">
                    {row.model ? MODEL_LABELS[row.model] : <span className="text-muted-foreground">No profile</span>}
                    {row.reviewStatus && (
                      <div className="text-xs text-muted-foreground">{REVIEW_LABELS[row.reviewStatus]}</div>
                    )}
                  </div>
                ),
                services: (
                  <div className="flex flex-wrap gap-1">
                    {serviceChips(row.services).map(({ serviceType, service }) => (
                      <Badge
                        key={serviceType}
                        variant="outline"
                        title={service ? `${SERVICE_LABELS[serviceType]}: ${STATUS_LABELS[service.status]}` : `${SERVICE_LABELS[serviceType]}: not requested`}
                        className={cn(
                          "font-normal",
                          service ? STATUS_CLASSES[service.status] : "border-dashed text-muted-foreground",
                          filters.service === serviceType && "ring-2 ring-primary/40",
                        )}
                      >
                        {SERVICE_LABELS[serviceType]}
                      </Badge>
                    ))}
                  </div>
                ),
                openCount: <span className="tabular-nums">{row.openCount || "—"}</span>,
                oldestOpenAt: (
                  <span className="whitespace-nowrap text-sm">
                    {row.oldestOpenAt ? (
                      <span title={formatDateTime(row.oldestOpenAt)}>{formatAge(row.oldestOpenAt)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                ),
                updatedAt: <span className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(row.updatedAt)}</span>,
              },
            }))}
          />
        )}
        <AdminPager
          page={filters.page}
          pages={pages}
          href={(page) => `/fulfillment${fulfillmentQueueQuery({ ...filters, page })}`}
        />
      </CardContent>
    </Card>
  );
}

function QueueSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 py-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Button asChild size="sm" variant={active ? "default" : "outline"}>
      <Link href={href}>{label}</Link>
    </Button>
  );
}
