"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { billingSettingsSchema } from "@workspace/lib/admin";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { updateBillingSettingsAction } from "./billing.server";

export function BillingSettingsForm({
  rateOverride,
  taxEnabled,
  taxRatePercent,
}: {
  rateOverride: number | null;
  taxEnabled: boolean;
  taxRatePercent: number;
}) {
  const router = useRouter();
  const [rate, setRate] = useState(rateOverride === null ? "" : String(rateOverride));
  const [tax, setTax] = useState(taxEnabled);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const input = {
      rateOverride: rate.trim() === "" ? null : Number(rate),
      taxEnabled: tax,
    };
    const parsed = billingSettingsSchema.safeParse(input);
    if (!parsed.success) {
      toast.error("Check the fixed rate (10 to 500).");
      return;
    }
    startTransition(async () => {
      const result = await updateBillingSettingsAction(parsed.data);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="billing-rate">Fixed rate, EGP per $1 (optional)</Label>
        <Input
          id="billing-rate"
          inputMode="decimal"
          placeholder="Empty = use the latest fetched rate"
          value={rate}
          onChange={(event) => setRate(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Replaces the fetched rate until you clear it. New top-up quotes use it right away.</p>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div>
          <Label htmlFor="billing-tax">Tax ({taxRatePercent}%)</Label>
          <p className="text-xs text-muted-foreground">Added once, to the EGP paid at top-up. Check with the accountant before turning it on.</p>
        </div>
        <Switch id="billing-tax" checked={tax} onCheckedChange={setTax} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
