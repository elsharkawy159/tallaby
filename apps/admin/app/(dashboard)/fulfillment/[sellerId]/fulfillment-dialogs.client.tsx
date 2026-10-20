"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
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
} from "@workspace/lib/fulfillment";
import type { SellerFulfillmentOverview } from "@workspace/lib/fulfillment/server";
import {
  activateService,
  saveAgreement,
  updateReview,
  updateServiceStatus,
} from "../fulfillment.server";
import {
  AGREEMENT_STATUS_LABELS,
  DEFAULT_RATE_PERIOD,
  FEE_TYPE_LABELS,
  RATE_PERIODS,
  RATE_PERIOD_LABELS,
  rateLabel,
  REVIEW_LABELS,
  SERVICE_LABELS,
  describeChoice,
} from "../fulfillment.lib";

/*
 * Admin fulfillment dialogs (docs/admin-saas.md §3.1). Moved unchanged from
 * sellers/[id]/seller-fulfillment.client.tsx; AgreementDialog also takes a
 * preset service for new agreements opened from a service tab.
 */

export type ServiceRow = SellerFulfillmentOverview["services"][number];
export type AgreementRow = SellerFulfillmentOverview["agreements"][number];

export function ReviewControl({
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

export function ServiceActionDialog({
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

export function AgreementDialog({
  sellerId,
  agreement,
  plans,
  defaultServiceType = "storage",
  onClose,
}: {
  sellerId: string;
  agreement: AgreementRow | null;
  plans: FulfillmentPlanView[];
  defaultServiceType?: FulfillmentServiceType;
  onClose: () => void;
}) {
  const router = useRouter();
  const [serviceType, setServiceType] = useState<FulfillmentServiceType>(
    agreement?.serviceType ?? defaultServiceType
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
