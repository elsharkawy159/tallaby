"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Plus } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Switch } from "@workspace/ui/components/switch";
import {
  FULFILLMENT_SERVICE_TYPES,
  getPlanPricingLabel,
  type FulfillmentPlanView,
} from "@workspace/lib/fulfillment";
import { togglePlanActive } from "../fulfillment.server";
import { SERVICE_LABELS } from "../fulfillment.lib";
import { PlanFormDialog } from "./plan-form-dialog";

export function PlansClient({ plans }: { plans: FulfillmentPlanView[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<FulfillmentPlanView | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggle = (plan: FulfillmentPlanView, isActive: boolean) =>
    startTransition(async () => {
      const result = await togglePlanActive(plan.id, isActive);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/fulfillment">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Fulfillment requests
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Fulfillment plans</h1>
          <p className="text-sm text-muted-foreground">
            The catalog sellers choose from during onboarding. Leave pricing empty until it has
            been agreed — sellers then see &quot;Pricing will be discussed with our team&quot;.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New plan
        </Button>
      </div>

      {FULFILLMENT_SERVICE_TYPES.map((type) => {
        const servicePlans = plans.filter((plan) => plan.serviceType === type);
        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="text-base">{SERVICE_LABELS[type]}</CardTitle>
            </CardHeader>
            <CardContent>
              {servicePlans.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No plans. Sellers can&apos;t choose Tallaby for this service until one is active.
                </p>
              ) : (
                <ul className="divide-y">
                  {servicePlans.map((plan) => (
                    <li key={plan.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{plan.nameEn}</span>
                          <span className="text-sm text-muted-foreground" dir="rtl">
                            {plan.nameAr}
                          </span>
                          <code className="text-xs text-muted-foreground">{plan.code}</code>
                          {!plan.isActive && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getPlanPricingLabel(plan.pricing, "en") ?? "No pricing configured"}
                          {" · "}
                          {plan.features.length} features
                          {plan.limits ? " · limits set" : ""}
                          {" · order "}
                          {plan.sortOrder}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={plan.isActive}
                          disabled={pending}
                          onCheckedChange={(checked) => toggle(plan, checked)}
                          aria-label={plan.isActive ? "Deactivate plan" : "Activate plan"}
                        />
                        <Button variant="ghost" size="sm" onClick={() => setEditing(plan)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}

      {(creating || editing) && (
        <PlanFormDialog
          plan={editing}
          open
          onOpenChange={(open) => {
            if (!open) {
              setCreating(false);
              setEditing(null);
            }
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
