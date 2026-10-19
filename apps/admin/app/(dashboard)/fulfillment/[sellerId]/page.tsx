import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { db, eq, sellers, users } from "@workspace/db";
import {
  FULFILLMENT_SERVICE_TYPES,
  fulfillmentQueueQuery,
  parseFulfillmentQueueFilters,
  queueNeighbours,
} from "@workspace/lib/fulfillment";
import { getGovernorateLabel } from "@workspace/lib/shipping";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { UrlTabs, pickTab } from "../../_components/url-tabs";
import { getSellerFulfillment } from "../fulfillment.server";
import { getFulfillmentQueueIds } from "../fulfillment.data";
import { MODEL_LABELS, SERVICE_LABELS, formatDateTime } from "../fulfillment.lib";
import { DETAIL_LABELS, formatDetail } from "./fulfillment-detail.lib";
import { ReviewControl } from "./fulfillment-dialogs.client";
import { FulfillmentServiceTab } from "./fulfillment-service-tab.client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ sellerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** All five services of one seller in one place (docs/admin-saas.md §3.1). */
export default async function SellerFulfillmentPage({ params, searchParams }: PageProps) {
  const [{ sellerId }, raw] = await Promise.all([params, searchParams]);
  if (!UUID_RE.test(sellerId)) notFound();
  await getCurrentAdminUser();

  const filters = parseFulfillmentQueueFilters(raw);
  const [seller, overview, queueIds] = await Promise.all([
    db
      .select({ businessName: sellers.businessName, supportPhone: sellers.supportPhone, email: users.email })
      .from(sellers)
      .innerJoin(users, eq(users.id, sellers.id))
      .where(eq(sellers.id, sellerId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    getSellerFulfillment(sellerId),
    getFulfillmentQueueIds(filters),
  ]);
  if (!seller) notFound();

  const services = overview?.services ?? [];
  const byType = new Map(services.map((row) => [row.serviceType, row]));
  // Without an explicit tab, open the filtered service or the first one that needs action.
  const defaultService =
    filters.service ??
    services.find((row) => ["requested", "under_review", "awaiting_agreement"].includes(row.status))?.serviceType ??
    services[0]?.serviceType ??
    FULFILLMENT_SERVICE_TYPES[0];
  const tabKeys = [defaultService, ...FULFILLMENT_SERVICE_TYPES.filter((type) => type !== defaultService)];
  const active = pickTab(raw.tab, tabKeys);
  const queueQuery = fulfillmentQueueQuery({ ...filters, page: 1 });
  const { previous, next, position } = queueNeighbours(queueIds, sellerId);
  const profile = overview?.profile ?? null;
  const details = (profile?.operationalDetails ?? {}) as Record<string, unknown>;
  const pickup = profile?.pickupAddress as Record<string, string> | null | undefined;
  const dropsOffInventory = services.some((row) => row.serviceType === "storage" && row.requestedProvider === "tallaby");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/fulfillment${queueQuery}`} className="text-sm text-muted-foreground hover:underline">
            ← Fulfillment requests
          </Link>
          <h1 className="text-2xl font-semibold">{seller.businessName || "Unnamed seller"}</h1>
          <p className="text-sm text-muted-foreground">
            <span dir="ltr">{seller.supportPhone ?? ""}</span>
            {seller.supportPhone && seller.email ? " · " : ""}
            {seller.email}
            {" · "}
            <Link href={`/sellers/${sellerId}`} className="hover:underline">
              Seller account
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {position && (
            <span className="text-sm text-muted-foreground">
              {position} of {queueIds.length}
            </span>
          )}
          <Button asChild variant="outline" size="sm" disabled={!previous}>
            <Link aria-disabled={!previous} href={previous ? `/fulfillment/${previous}${queueQuery}` : "#"}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={!next}>
            <Link aria-disabled={!next} href={next ? `/fulfillment/${next}${queueQuery}` : "#"}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {!overview ? (
        <p className="text-sm text-destructive">Fulfillment setup could not be loaded.</p>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Setup</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {profile
                    ? `${MODEL_LABELS[profile.model]} · submitted ${formatDateTime(profile.submittedAt)}${
                        profile.termsAcceptedAt
                          ? ` · terms ${profile.termsVersion ?? ""} accepted ${formatDateTime(profile.termsAcceptedAt)}`
                          : ""
                      }`
                    : "No onboarding profile. The seller requested services from the dashboard."}
                </p>
              </div>
              {profile && <ReviewControl sellerId={sellerId} status={profile.reviewStatus} notes={profile.adminNotes} />}
            </CardHeader>
            {profile && (
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Operational details</h3>
                  {Object.keys(details).length === 0 ? (
                    <p className="text-sm text-muted-foreground">None provided.</p>
                  ) : (
                    <dl className="space-y-1 text-sm">
                      {Object.entries(details).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-2 gap-2">
                          <dt className="text-muted-foreground">{DETAIL_LABELS[key] ?? key}</dt>
                          <dd>{formatDetail(key, value)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">{dropsOffInventory ? "Inventory drop-off" : "Pickup location"}</h3>
                  {dropsOffInventory ? (
                    <p className="text-sm text-muted-foreground">
                      The seller delivers their inventory to the Tallaby warehouse. Share the warehouse address
                      and book a drop-off time when contacting them.
                    </p>
                  ) : pickup ? (
                    <div className="space-y-0.5 text-sm">
                      <p>{pickup.street}</p>
                      <p>
                        {pickup.city}, {getGovernorateLabel(pickup.governorate ?? "", "en")}
                      </p>
                      {pickup.landmark && <p className="text-muted-foreground">{pickup.landmark}</p>}
                      <p className="text-muted-foreground">
                        {pickup.contactName ? `${pickup.contactName} · ` : ""}
                        <span dir="ltr">{pickup.contactPhone}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not required for this setup.</p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          <UrlTabs
            baseHref={`/fulfillment/${sellerId}`}
            active={active}
            keep={{
              state: filters.state !== "open" ? filters.state : null,
              service: filters.service,
              review: filters.review,
              q: filters.q,
            }}
            tabs={tabKeys.map((type) => {
              const row = byType.get(type);
              return {
                key: type,
                label: `${SERVICE_LABELS[type]}${row ? "" : " (not requested)"}`,
                count: row && ["requested", "under_review", "awaiting_agreement"].includes(row.status) ? 1 : 0,
              };
            })}
          />

          <FulfillmentServiceTab
            key={active}
            sellerId={sellerId}
            serviceType={active}
            row={byType.get(active) ?? null}
            agreements={overview.agreements.filter((agreement) => agreement.serviceType === active)}
            plans={overview.plans}
          />
        </>
      )}
    </div>
  );
}
