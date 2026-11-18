"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { updateTallabyPaySettingsAction } from "../tallaby-pay.server";

export type TallabyPaySettingsForm = { feeBps: number; holdDays: number; minPayout: string; live: boolean };

/** Fee, hold days, minimum withdrawal and the launch switch, saved together with one logged reason. */
export function TallabyPaySettingsEditor({ initial }: { initial: TallabyPaySettingsForm }) {
  const router = useRouter();
  const [feeBps, setFeeBps] = useState(String(initial.feeBps));
  const [holdDays, setHoldDays] = useState(String(initial.holdDays));
  const [minPayout, setMinPayout] = useState(initial.minPayout);
  const [live, setLive] = useState(initial.live);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const fee = feeBps.trim() === "" ? NaN : Number(feeBps);
  const changedLive = live !== initial.live;

  const save = () =>
    startTransition(async () => {
      const result = await updateTallabyPaySettingsAction({
        feeBps: feeBps.trim(),
        holdDays: holdDays.trim(),
        minPayout: minPayout.trim(),
        live,
        reason: reason.trim(),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setReason("");
      router.refresh();
    });

  return (
    <div className="max-w-xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="tp-fee">Fee (basis points)</Label>
          <Input id="tp-fee" inputMode="numeric" value={feeBps} onChange={(e) => setFeeBps(e.target.value)} />
          <p className="text-xs text-muted-foreground tabular-nums">
            {Number.isInteger(fee) && fee >= 0 && fee <= 2000 ? `${Number((fee / 100).toFixed(2))}% of each payment` : "0 to 2000"}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tp-hold">Hold after delivery (days)</Label>
          <Input id="tp-hold" inputMode="numeric" value={holdDays} onChange={(e) => setHoldDays(e.target.value)} />
          <p className="text-xs text-muted-foreground">0 to 60. Owner: 0.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tp-min">Minimum withdrawal (EGP)</Label>
          <Input id="tp-min" inputMode="decimal" value={minPayout} onChange={(e) => setMinPayout(e.target.value)} />
          <p className="text-xs text-muted-foreground">Owner: 500.</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Each order keeps the fee and hold it was placed with, so a change here applies to new orders only.
      </p>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="space-y-1">
          <Label htmlFor="tp-live">Tallaby Pay is live</Label>
          <p className="text-sm text-muted-foreground">
            Off: no store can turn the app on and checkout doesn&apos;t offer it. Turn it on only after the owner&apos;s go-ahead.
          </p>
        </div>
        <Switch id="tp-live" checked={live} onCheckedChange={setLive} />
      </div>
      {changedLive && (
        <p className="text-sm font-medium text-destructive">
          {live ? "Saving turns Tallaby Pay on for every store that has the app." : "Saving turns Tallaby Pay off at checkout."}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="tp-reason">Reason for the change</Label>
        <Textarea
          id="tp-reason"
          rows={2}
          maxLength={500}
          value={reason}
          placeholder="For example: owner approved the launch on 2026-11-20"
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <Button onClick={save} disabled={pending || reason.trim().length < 3}>
        {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        Save settings
      </Button>
    </div>
  );
}
