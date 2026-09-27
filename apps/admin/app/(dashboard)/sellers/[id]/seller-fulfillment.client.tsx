"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  FULFILLMENT_AGREEMENT_STATUSES,
  FULFILLMENT_REVIEW_STATUSES,
  FULFILLMENT_SERVICE_TYPES,
  SERVICE_FEE_TYPE,
  feeTypesForService,
  type AgreementRate,
  type FulfillmentAgreementStatus,
  type FulfillmentFeeType,
  type FulfillmentPlanView,
  type FulfillmentReviewStatus,
  type FulfillmentServiceType,
  type ServiceConfig,
} from "@workspace/lib/fulfillment";
import type { SellerFulfillmentOverview } from "@workspace/lib/fulfillment/server";
import { getGovernorateLabel } from "@workspace/lib/shipping";
import {
  activateService,
  saveAgreement,
  updateReview,
  updateServiceStatus,
} from "../../fulfillment/fulfillment.server";
import {
  AGREEMENT_STATUS_LABELS,
  DEFAULT_RATE_PERIOD,
  FEE_TYPE_LABELS,
  RATE_PERIODS,
  RATE_PERIOD_LABELS,
  formatRatePeriod,
  rateLabel,
  MODEL_LABELS,
  REVIEW_LABELS,
  SERVICE_LABELS,
  STATUS_CLASSES,
  STATUS_LABELS,
  describeChoice,
  formatDateTime,
} from "../../fulfillment/fulfillment.lib";

type ServiceRow = SellerFulfillmentOverview["services"][number];
type AgreementRow = SellerFulfillmentOverview["agreements"][number];

const DETAIL_LABELS: Record<string, string> = {
  estimatedSkus: "Estimated SKUs",
  estimatedDailyOrders: "Daily orders",
  sizeCategory: "Product size",
  hasFragileProducts: "Fragile products",
  estimatedInventoryUnits: "Inventory units",
  specialPackagingNotes: "Packaging notes",
  coverageGovernorates: "Customer areas",
};

function formatDetail(key: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map((g) => getGovernorateLabel(String(g), "en")).join(", ");
  if (key.startsWith("estimated")) return String(value).replace("_plus", "+").replace("_", "–");
  return String(value ?? "—");
}

function configSummary(config: unknown): string | null {
  const c = (config ?? {}) as ServiceConfig;
  const parts: string[] = [];
  if (c.mode) parts.push(c.mode === "own_riders" ? "Own riders" : "External courier");
  if (c.courierName) parts.push(c.courierName);
  if (c.legacy) parts.push("pre-fulfillment baseline");
  if (c.sellerRidersAllowed) parts.push("seller riders allowed");
  return parts.length ? parts.join(" · ") : null;
}

export function SellerFulfillmentPanel({
  sellerId,
  overview,
}: {
  sellerId: string;
  overview: SellerFulfillmentOverview;
}) {
  const { profile, services, agreements, plans } = overview;
  const plansById = new Map(plans.map((plan) => [plan.id, plan]));
  const [actionFor, setActionFor] = useState<ServiceRow | null>(null);
  const [agreementDraft, setAgreementDraft] = useState<AgreementRow | "new" | null>(null);

  if (!profile) {
    return (
      <Card id="fulfillment">
        <CardHeader>
          <CardTitle>Fulfillment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No fulfillment setup recorded for this seller. Apply migration 0041 to backfill
            existing sellers.
          </p>
        </CardContent>
      </Card>
    );
  }

  const details = (profile.operationalDetails ?? {}) as Record<string, unknown>;
  const pickup = profile.pickupAddress as Record<string, string> | null;
  // Tallaby storage: the seller brings inventory to the warehouse themselves.
  const dropsOffInventory = services.some(
    (row) => row.serviceType === "storage" && row.requestedProvider === "tallaby"
  );

  return (
    <div id="fulfillment" className="scroll-mt-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Fulfillment</CardTitle>
            <p className="text-sm text-muted-foreground">
              {MODEL_LABELS[profile.model]} · submitted {formatDateTime(profile.submittedAt)}
              {profile.termsAcceptedAt &&
                ` · terms ${profile.termsVersion ?? ""} accepted ${formatDateTime(profile.termsAcceptedAt)}`}
            </p>
          </div>
          <ReviewControl
            sellerId={sellerId}
            status={profile.reviewStatus}
            notes={profile.adminNotes}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-3 font-medium">Service</th>
                  <th className="py-2 pr-3 font-medium">Requested</th>
                  <th className="py-2 pr-3 font-medium">Active (orders run under this)</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {services.map((row) => {
                  const requestedConfig = configSummary(row.requestedConfig);
                  const activeConfig = configSummary(row.activeConfig);
                  return (
                    <tr key={row.id} className="border-b align-top last:border-0">
                      <td className="py-3 pr-3 font-medium">{SERVICE_LABELS[row.serviceType]}</td>
                      <td className="py-3 pr-3">
                        {describeChoice(row.requestedProvider, row.requestedPlanId, plansById)}
                        {requestedConfig && (
                          <div className="text-xs text-muted-foreground">{requestedConfig}</div>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {describeChoice(row.activeProvider, row.activePlanId, plansById)}
                        {activeConfig && <div className="text-xs">{activeConfig}</div>}
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant="outline" className={STATUS_CLASSES[row.status]}>
                          {STATUS_LABELS[row.status]}
                        </Badge>
                        {row.notes && (
                          <div className="mt-1 max-w-56 text-xs text-muted-foreground">{row.notes}</div>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => setActionFor(row)}>
                          Update
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
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
              <h3 className="mb-2 text-sm font-semibold">
                {dropsOffInventory ? "Inventory drop-off" : "Pickup location"}
              </h3>
              {dropsOffInventory ? (
                <p className="text-sm text-muted-foreground">
                  The seller delivers their inventory to the Tallaby warehouse. Share the
                  warehouse address and book a drop-off time when contacting them.
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Commercial agreements</CardTitle>
          <Button size="sm" onClick={() => setAgreementDraft("new")}>
            <Plus className="mr-1 h-4 w-4" />
            New agreement
          </Button>
        </CardHeader>
        <CardContent>
          {agreements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No agreements recorded. Record the agreed terms here after contacting the seller.
            </p>
          ) : (
            <ul className="divide-y">
              {agreements.map((agreement) => (
                <li key={agreement.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="space-y-0.5 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{SERVICE_LABELS[agreement.serviceType]}</span>
                      {agreement.planId && (
                        <span className="text-muted-foreground">
                          {plansById.get(agreement.planId)?.nameEn}
                        </span>
                      )}
                      <Badge variant="secondary">{AGREEMENT_STATUS_LABELS[agreement.status]}</Badge>
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

      {actionFor && (
        <ServiceActionDialog
          sellerId={sellerId}
          row={actionFor}
          plansById={plansById}
          agreements={agreements.filter((a) => a.serviceType === actionFor.serviceType)}
          onClose={() => setActionFor(null)}
        />
      )}
      {agreementDraft && (
        <AgreementDialog
          sellerId={sellerId}
          agreement={agreementDraft === "new" ? null : agreementDraft}
          plans={plans}
          onClose={() => setAgreementDraft(null)}
        />
      )}
    </div>
  );
}

function ReviewControl({
  sellerId,
  status,
  notes,
}: {
  sellerId: string;
  status: FulfillmentReviewStatus;
  notes: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState(status);
  const [text, setText] = useState(notes ?? "");
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = await updateReview({ sellerId, reviewStatus: next, adminNotes: text });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge variant="outline">{REVIEW_LABELS[status]}</Badge>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Contact & notes
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seller contact</DialogTitle>
            <DialogDescription>Track outreach and keep internal notes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={next} onValueChange={(v) => setNext(v as FulfillmentReviewStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FULFILLMENT_REVIEW_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {REVIEW_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={pending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const ACTIONS = [
  { value: "activate", label: "Activate requested configuration" },
  { value: "under_review", label: "Mark under review" },
  { value: "awaiting_agreement", label: "Mark awaiting agreement" },
  { value: "paused", label: "Pause (orders fall back to the default)" },
  { value: "rejected", label: "Reject request (active stays as is)" },
] as const;
type ActionValue = (typeof ACTIONS)[number]["value"];

function ServiceActionDialog({
  sellerId,
  row,
  plansById,
  agreements,
  onClose,
}: {
  sellerId: string;
  row: ServiceRow;
  plansById: Map<string, FulfillmentPlanView>;
  agreements: AgreementRow[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [action, setAction] = useState<ActionValue>(
    row.status === "active" ? "paused" : "activate"
  );
  const [notes, setNotes] = useState(row.notes ?? "");
  const [agreementId, setAgreementId] = useState<string>(row.agreementId ?? "none");
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      const base = { sellerId, serviceType: row.serviceType, notes };
      const result =
        action === "activate"
          ? await activateService({ ...base, agreementId: agreementId === "none" ? null : agreementId })
          : await updateServiceStatus({ ...base, status: action });
      if (result.success) {
        toast.success(result.message);
        onClose();
        router.refresh();
      } else toast.error(result.error);
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{SERVICE_LABELS[row.serviceType]}</DialogTitle>
          <DialogDescription>
            Requested: {describeChoice(row.requestedProvider, row.requestedPlanId, plansById)} ·
            Active: {describeChoice(row.activeProvider, row.activePlanId, plansById)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={action} onValueChange={(v) => setAction(v as ActionValue)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {action === "activate" && (
            <>
              <p className="text-xs text-muted-foreground">
                Copies the requested configuration into the active one. This is the only step
                that changes how this seller&apos;s orders are handled.
              </p>
              <div className="space-y-1.5">
                <Label>Linked agreement (optional)</Label>
                <Select value={agreementId} onValueChange={setAgreementId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {agreements.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {AGREEMENT_STATUS_LABELS[a.status]} · {a.effectiveFrom ?? "no start date"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RateDraft {
  feeType: FulfillmentFeeType;
  /** Name of the fee when feeType is "other". */
  label: string;
  amount: string;
  unit: string;
  note: string;
}

function AgreementDialog({
  sellerId,
  agreement,
  plans,
  onClose,
}: {
  sellerId: string;
  agreement: AgreementRow | null;
  plans: FulfillmentPlanView[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [serviceType, setServiceType] = useState<FulfillmentServiceType>(
    agreement?.serviceType ?? "storage"
  );
  const [planId, setPlanId] = useState<string>(agreement?.planId ?? "none");
  const [status, setStatus] = useState<FulfillmentAgreementStatus>(agreement?.status ?? "draft");
  const [effectiveFrom, setEffectiveFrom] = useState(agreement?.effectiveFrom ?? "");
  const [effectiveTo, setEffectiveTo] = useState(agreement?.effectiveTo ?? "");
  const [notes, setNotes] = useState(agreement?.notes ?? "");
  const [rates, setRates] = useState<RateDraft[]>(
    ((agreement?.rates ?? []) as AgreementRate[]).map((r) => {
      // A fee type this service can't carry (older data) is kept as a named "other".
      const allowed = feeTypesForService(agreement!.serviceType).includes(r.feeType);
      return {
        feeType: allowed ? r.feeType : "other",
        label: allowed ? (r.label ?? "") : (r.label || rateLabel(r)),
        amount: String(r.amount),
      // Anything outside the dropdown (e.g. free text from an older build) falls back to monthly.
      unit: (RATE_PERIODS as readonly string[]).includes(r.unit ?? "") ? r.unit! : DEFAULT_RATE_PERIOD,
        note: r.note ?? "",
      };
    })
  );
  const [pending, startTransition] = useTransition();
  const servicePlans = plans.filter((p) => p.serviceType === serviceType);

  const submit = () =>
    startTransition(async () => {
      const result = await saveAgreement({
        id: agreement?.id,
        sellerId,
        serviceType,
        planId: planId === "none" ? null : planId,
        rates,
        effectiveFrom: effectiveFrom || null,
        effectiveTo: effectiveTo || null,
        status,
        notes,
      });
      if (result.success) {
        toast.success(result.message);
        onClose();
        router.refresh();
      } else toast.error(result.error);
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{agreement ? "Edit agreement" : "New agreement"}</DialogTitle>
          <DialogDescription>
            The commercial terms agreed with the seller. Recording an agreement does not charge
            anything or change orders by itself.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Service</Label>
              <Select
                value={serviceType}
                disabled={Boolean(agreement)}
                onValueChange={(v) => {
                  const next = v as FulfillmentServiceType;
                  // Rates billed as the old service's fee follow the new service.
                  setRates(
                    rates.map((r) =>
                      r.feeType === SERVICE_FEE_TYPE[serviceType]
                        ? { ...r, feeType: SERVICE_FEE_TYPE[next] }
                        : r
                    )
                  );
                  setServiceType(next);
                  setPlanId("none");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FULFILLMENT_SERVICE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {SERVICE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {servicePlans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as FulfillmentAgreementStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FULFILLMENT_AGREEMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {AGREEMENT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Effective from</Label>
              <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Effective to</Label>
              <Input type="date" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} />
            </div>
          </div>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rates (EGP)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setRates([
                    ...rates,
                    {
                      feeType: SERVICE_FEE_TYPE[serviceType],
                      label: "",
                      amount: "",
                      unit: DEFAULT_RATE_PERIOD,
                      note: "",
                    },
                  ])
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add rate
              </Button>
            </div>
            {rates.map((rate, index) => {
              const update = (patch: Partial<RateDraft>) =>
                setRates(rates.map((r, i) => (i === index ? { ...r, ...patch } : r)));
              return (
                <div key={index} className="grid grid-cols-[1fr_6rem_8rem_auto] gap-2">
                  <Select
                    value={rate.feeType}
                    onValueChange={(v) => update({ feeType: v as FulfillmentFeeType })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {feeTypesForService(serviceType).map((f) => (
                        <SelectItem key={f} value={f}>
                          {FEE_TYPE_LABELS[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    inputMode="decimal"
                    placeholder="Amount"
                    value={rate.amount}
                    onChange={(e) => update({ amount: e.target.value })}
                  />
                  <Select value={rate.unit} onValueChange={(v) => update({ unit: v })}>
                    <SelectTrigger className="w-full" aria-label="Per">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RATE_PERIODS.map((period) => (
                        <SelectItem key={period} value={period}>
                          per {RATE_PERIOD_LABELS[period].toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove rate"
                    onClick={() => setRates(rates.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {rate.feeType === "other" && (
                    <Input
                      className="col-span-3"
                      placeholder="What is this fee for? (e.g. Photography)"
                      maxLength={100}
                      value={rate.label}
                      onChange={(e) => update({ label: e.target.value })}
                    />
                  )}
                </div>
              );
            })}
          </section>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            Save agreement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
