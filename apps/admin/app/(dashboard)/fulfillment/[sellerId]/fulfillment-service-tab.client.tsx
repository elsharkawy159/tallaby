"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import type { AgreementRate, FulfillmentPlanView, FulfillmentServiceType } from "@workspace/lib/fulfillment";
import {
  AGREEMENT_STATUS_LABELS,
  SERVICE_LABELS,
  STATUS_CLASSES,
  STATUS_LABELS,
  describeChoice,
  formatDateTime,
  formatRatePeriod,
  rateLabel,
} from "../fulfillment.lib";
import { configSummary } from "./fulfillment-detail.lib";
import {
  AgreementDialog,
  ServiceActionDialog,
  type AgreementRow,
  type ServiceRow,
} from "./fulfillment-dialogs.client";

/** One service of one seller: requested vs active, status actions and its agreements. */
export function FulfillmentServiceTab({
  sellerId,
  serviceType,
  row,
  agreements,
  plans,
}: {
  sellerId: string;
  serviceType: FulfillmentServiceType;
  row: ServiceRow | null;
  agreements: AgreementRow[];
  plans: FulfillmentPlanView[];
}) {
  const plansById = new Map(plans.map((plan) => [plan.id, plan]));
  const [actionOpen, setActionOpen] = useState(false);
  const [agreementDraft, setAgreementDraft] = useState<AgreementRow | "new" | null>(null);
  const requestedConfig = row ? configSummary(row.requestedConfig) : null;
  const activeConfig = row ? configSummary(row.activeConfig) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              {SERVICE_LABELS[serviceType]}
              {row && (
                <Badge variant="outline" className={STATUS_CLASSES[row.status]}>
                  {STATUS_LABELS[row.status]}
                </Badge>
              )}
            </CardTitle>
            {row && (
              <p className="text-sm text-muted-foreground">
                Requested {formatDateTime(row.requestedAt)}
                {row.activatedAt && ` · activated ${formatDateTime(row.activatedAt)}`}
              </p>
            )}
          </div>
          {row && <Button onClick={() => setActionOpen(true)}>Update service</Button>}
        </CardHeader>
        <CardContent>
          {!row ? (
            <p className="text-sm text-muted-foreground">
              Not requested. Orders use the default for this service.
            </p>
          ) : (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <dt className="text-xs font-medium text-muted-foreground uppercase">Requested by the seller</dt>
                <dd className="mt-1 font-medium">{describeChoice(row.requestedProvider, row.requestedPlanId, plansById)}</dd>
                {requestedConfig && <dd className="text-xs text-muted-foreground">{requestedConfig}</dd>}
              </div>
              <div className="rounded-md border p-3">
                <dt className="text-xs font-medium text-muted-foreground uppercase">Active (orders run under this)</dt>
                <dd className="mt-1 font-medium">{describeChoice(row.activeProvider, row.activePlanId, plansById)}</dd>
                {activeConfig && <dd className="text-xs text-muted-foreground">{activeConfig}</dd>}
              </div>
              {row.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{row.notes}</dd>
                </div>
              )}
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{SERVICE_LABELS[serviceType]} agreements</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAgreementDraft("new")}>
            <Plus className="mr-1 h-4 w-4" />
            New agreement
          </Button>
        </CardHeader>
        <CardContent>
          {agreements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No agreements for this service. Record the agreed terms after contacting the seller.
            </p>
          ) : (
            <ul className="divide-y">
              {agreements.map((agreement) => (
                <li key={agreement.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="space-y-0.5 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      {agreement.planId && <span className="font-medium">{plansById.get(agreement.planId)?.nameEn}</span>}
                      <Badge variant="secondary">{AGREEMENT_STATUS_LABELS[agreement.status]}</Badge>
                      {row?.agreementId === agreement.id && <Badge variant="outline">Linked to service</Badge>}
                    </div>
                    <p className="text-muted-foreground">
                      {((agreement.rates ?? []) as AgreementRate[])
                        .map((r) => `${rateLabel(r)}: ${r.amount} EGP${formatRatePeriod(r.unit)}`)
                        .join(" · ") || "No rates"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {agreement.effectiveFrom ?? "—"} → {agreement.effectiveTo ?? "open-ended"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setAgreementDraft(agreement)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {actionOpen && row && (
        <ServiceActionDialog
          sellerId={sellerId}
          row={row}
          plansById={plansById}
          agreements={agreements}
          onClose={() => setActionOpen(false)}
        />
      )}
      {agreementDraft && (
        <AgreementDialog
          sellerId={sellerId}
          agreement={agreementDraft === "new" ? null : agreementDraft}
          plans={plans}
          defaultServiceType={serviceType}
          onClose={() => setAgreementDraft(null)}
        />
      )}
    </div>
  );
}
