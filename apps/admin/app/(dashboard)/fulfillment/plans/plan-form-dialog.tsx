"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
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
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  FULFILLMENT_SERVICE_TYPES,
  type FulfillmentPlanView,
  type FulfillmentServiceType,
} from "@workspace/lib/fulfillment";
import { EGYPT_GOVERNORATES, getGovernorateLabel } from "@workspace/lib/shipping";
import { savePlan } from "../fulfillment.server";
import { SERVICE_LABELS } from "../fulfillment.lib";
import type { PlanFormInput } from "../fulfillment.dto";

const PRICING_MODELS = ["fixed", "per_unit", "per_order", "monthly", "custom"] as const;
const SPEEDS = ["standard", "expedited", "priority", "one_day", "same_day"] as const;
const NONE = "__none__";

function initialState(plan: FulfillmentPlanView | null): PlanFormInput {
  return {
    code: plan?.code ?? "",
    serviceType: plan?.serviceType ?? "storage",
    nameEn: plan?.nameEn ?? "",
    nameAr: plan?.nameAr ?? "",
    descriptionEn: plan?.descriptionEn ?? "",
    descriptionAr: plan?.descriptionAr ?? "",
    features: plan?.features ?? [],
    limits: plan?.limits ? JSON.stringify(plan.limits, null, 2) : "",
    pricingAmount:
      typeof plan?.pricing?.amount === "number" ? String(plan.pricing.amount) : "",
    pricingModel: plan?.pricing?.model ?? null,
    pricingUnit: plan?.pricing?.unit ?? "",
    pricingNoteEn: plan?.pricing?.noteEn ?? "",
    pricingNoteAr: plan?.pricing?.noteAr ?? "",
    shippingSpeed: (plan?.shippingSpeed as PlanFormInput["shippingSpeed"]) ?? null,
    availabilityGovernorates: plan?.availability?.governorates ?? [],
    isActive: plan?.isActive ?? true,
    sortOrder: plan?.sortOrder ?? 0,
  };
}

export function PlanFormDialog({
  plan,
  open,
  onOpenChange,
  onSaved,
}: {
  plan: FulfillmentPlanView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PlanFormInput>(() => initialState(plan));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(plan);

  const set = <K extends keyof PlanFormInput>(key: K, value: PlanFormInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const features = form.features ?? [];
  const governorates = form.availabilityGovernorates ?? [];

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await savePlan(form, plan?.id);
      if (result.success) {
        toast.success(result.message);
        onSaved();
      } else {
        setError(result.error);
      }
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${plan!.nameEn}` : "New fulfillment plan"}</DialogTitle>
          <DialogDescription>
            Code and service can&apos;t change after creation: seller requests reference them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code">
              <Input
                value={form.code}
                disabled={isEdit}
                placeholder="storage_growth"
                onChange={(e) => set("code", e.target.value)}
              />
            </Field>
            <Field label="Service">
              <Select
                value={form.serviceType}
                disabled={isEdit}
                onValueChange={(v) => set("serviceType", v as FulfillmentServiceType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FULFILLMENT_SERVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {SERVICE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Name (English)">
              <Input value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
            </Field>
            <Field label="Name (Arabic)">
              <Input dir="rtl" value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
            </Field>
            <Field label="Description (English)">
              <Textarea
                rows={2}
                value={form.descriptionEn ?? ""}
                onChange={(e) => set("descriptionEn", e.target.value)}
              />
            </Field>
            <Field label="Description (Arabic)">
              <Textarea
                dir="rtl"
                rows={2}
                value={form.descriptionAr ?? ""}
                onChange={(e) => set("descriptionAr", e.target.value)}
              />
            </Field>
          </div>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Features</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set("features", [...features, { en: "", ar: "" }])}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add feature
              </Button>
            </div>
            {features.map((feature, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="English"
                  value={feature.en}
                  onChange={(e) =>
                    set(
                      "features",
                      features.map((f, i) => (i === index ? { ...f, en: e.target.value } : f))
                    )
                  }
                />
                <Input
                  dir="rtl"
                  placeholder="العربية"
                  value={feature.ar}
                  onChange={(e) =>
                    set(
                      "features",
                      features.map((f, i) => (i === index ? { ...f, ar: e.target.value } : f))
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove feature"
                  onClick={() => set("features", features.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </section>

          <section className="space-y-3 rounded-lg border p-3">
            <div>
              <Label>Pricing (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Leave amount and notes empty to show &quot;Pricing will be discussed with our
                team&quot;. An amount of 0 is shown as entered.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Model">
                <Select
                  value={form.pricingModel ?? NONE}
                  onValueChange={(v) =>
                    set("pricingModel", v === NONE ? null : (v as PlanFormInput["pricingModel"]))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not set</SelectItem>
                    {PRICING_MODELS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Amount (EGP)">
                <Input
                  inputMode="decimal"
                  value={form.pricingAmount}
                  onChange={(e) => set("pricingAmount", e.target.value)}
                />
              </Field>
              <Field label="Unit">
                <Input
                  placeholder="order, unit, month…"
                  value={form.pricingUnit ?? ""}
                  onChange={(e) => set("pricingUnit", e.target.value)}
                />
              </Field>
              <Field label="Note (English)" className="sm:col-span-3">
                <Input
                  value={form.pricingNoteEn ?? ""}
                  onChange={(e) => set("pricingNoteEn", e.target.value)}
                />
              </Field>
              <Field label="Note (Arabic)" className="sm:col-span-3">
                <Input
                  dir="rtl"
                  value={form.pricingNoteAr ?? ""}
                  onChange={(e) => set("pricingNoteAr", e.target.value)}
                />
              </Field>
            </div>
          </section>

          <Field label="Limits (JSON, optional)">
            <Textarea
              rows={3}
              className="font-mono text-xs"
              placeholder={'{ "skus": 500, "units": 2000 }'}
              value={form.limits}
              onChange={(e) => set("limits", e.target.value)}
            />
          </Field>

          {form.serviceType === "delivery" && (
            <section className="space-y-3 rounded-lg border p-3">
              <Field label="Delivery speed">
                <Select
                  value={form.shippingSpeed ?? NONE}
                  onValueChange={(v) =>
                    set("shippingSpeed", v === NONE ? null : (v as PlanFormInput["shippingSpeed"]))
                  }
                >
                  <SelectTrigger className="w-full sm:w-60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not set</SelectItem>
                    {SPEEDS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div>
                <Label>Available governorates</Label>
                <p className="text-xs text-muted-foreground">
                  None selected = availability confirmed with each seller.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {EGYPT_GOVERNORATES.map((g) => (
                    <label key={g} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={governorates.includes(g)}
                        onCheckedChange={(checked) =>
                          set(
                            "availabilityGovernorates",
                            checked === true
                              ? [...governorates, g]
                              : governorates.filter((x) => x !== g)
                          )
                        }
                      />
                      {getGovernorateLabel(g, "en")}
                    </label>
                  ))}
                </div>
              </div>
            </section>
          )}

          <div className="flex flex-wrap items-end gap-6">
            <Field label="Sort order">
              <Input
                type="number"
                min={0}
                className="w-28"
                value={String(form.sortOrder ?? 0)}
                onChange={(e) => set("sortOrder", e.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
              Active (visible to sellers)
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saving…" : "Save plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
