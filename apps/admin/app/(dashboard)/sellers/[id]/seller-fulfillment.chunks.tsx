import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { serviceChips } from "@workspace/lib/fulfillment";
import type { SellerFulfillmentOverview } from "@workspace/lib/fulfillment/server";
import {
  MODEL_LABELS,
  REVIEW_LABELS,
  SERVICE_LABELS,
  STATUS_CLASSES,
  STATUS_LABELS,
} from "../../fulfillment/fulfillment.lib";

/**
 * Summary of the seller's fulfillment services. Reviewing, activating and
 * agreements live on /fulfillment/[sellerId] (docs/admin-saas.md §3.1).
 */
export function SellerFulfillmentSummary({
  sellerId,
  overview,
}: {
  sellerId: string;
  overview: SellerFulfillmentOverview;
}) {
  const { profile, services } = overview;
  const chips = serviceChips(
    services.map((row) => ({
      serviceType: row.serviceType,
      status: row.status,
      requestedProvider: row.requestedProvider,
      activeProvider: row.activeProvider,
      requestedAt: row.requestedAt,
    }))
  );

  return (
    <Card id="fulfillment" className="scroll-mt-4">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Fulfillment</CardTitle>
          <p className="text-sm text-muted-foreground">
            {profile
              ? `${MODEL_LABELS[profile.model]} · ${REVIEW_LABELS[profile.reviewStatus]}`
              : services.length
                ? "Requested from the dashboard"
                : "No services requested"}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/fulfillment/${sellerId}`}>Open fulfillment</Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {chips.map(({ serviceType, service }) => (
          <Badge
            key={serviceType}
            asChild
            variant="outline"
            className={cn("font-normal", service ? STATUS_CLASSES[service.status] : "border-dashed text-muted-foreground")}
          >
            <Link href={`/fulfillment/${sellerId}?tab=${serviceType}`}>
              {SERVICE_LABELS[serviceType]}: {service ? STATUS_LABELS[service.status] : "not requested"}
            </Link>
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}
