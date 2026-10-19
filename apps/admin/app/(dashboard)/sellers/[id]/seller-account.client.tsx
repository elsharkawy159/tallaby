"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { Textarea } from "@workspace/ui/components/textarea";
import { ADMIN_REASON_MAX, ADMIN_REASON_MIN, MAX_STORES_OVERRIDE_LIMIT, type SellerOverrideInput } from "@workspace/lib/admin";
import type { SellerAccountForAdmin } from "@workspace/lib/admin/server";
import { formatCurrency, formatDate, formatDateTime } from "../sellers.lib";
import { TRIAL_STATE_LABELS } from "./seller-admin.lib";
import { sellerOverrideAction } from "./seller-admin.server";

type OverrideKind =
  | "set_store_limit"
  | "extend_trial"
  | "grant_trial"
  | "revoke_trial"
  | "set_commission_exempt"
  | "set_negative_limit";

const DIALOG_TITLES: Record<OverrideKind, string> = {
  set_store_limit: "Store limit exception",
  extend_trial: "Extend the fee trial",
  grant_trial: "Grant trial eligibility",
  revoke_trial: "Revoke trial eligibility",
  set_commission_exempt: "Platform fee exemption",
  set_negative_limit: "Wallet negative limit",
};

/** A required reason field shared by every admin override dialog. */
export function ReasonField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="admin-reason">Reason (required, saved in the audit log)</Label>
      <Textarea
        id="admin-reason"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={ADMIN_REASON_MAX}
        rows={3}
        placeholder="Why is this change being made?"
      />
    </div>
  );
}

export const reasonIsValid = (reason: string) => reason.trim().length >= ADMIN_REASON_MIN;

function Row({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b py-3 last:border-0">
      <div className="min-w-0 space-y-0.5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-sm">{children}</div>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

/** Plan, store limit, fee plan, fee trial, exemption and wallet limit, with audited overrides (P9-01, P9-02). */
export function SellerAccountPanel({ sellerId, account }: { sellerId: string; account: SellerAccountForAdmin }) {
  const router = useRouter();
  const [open, setOpen] = useState<OverrideKind | null>(null);
  const [reason, setReason] = useState("");
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  const openDialog = (kind: OverrideKind, initial = "") => {
    setReason("");
    setValue(initial);
    setOpen(kind);
  };

  const buildInput = (kind: OverrideKind): SellerOverrideInput | null => {
    const base = { sellerId, reason };
    switch (kind) {
      case "set_store_limit": {
        if (value.trim() === "") return { action: kind, ...base, maxStoresOverride: null };
        const n = Number(value);
        return Number.isInteger(n) ? { action: kind, ...base, maxStoresOverride: n } : null;
      }
      case "extend_trial": {
        // The chosen day, until its end (UTC).
        const date = new Date(`${value}T23:59:59.000Z`);
        return Number.isNaN(date.getTime()) ? null : { action: kind, ...base, endsAt: date.toISOString() };
      }
      case "grant_trial":
      case "revoke_trial":
        return { action: kind, ...base };
      case "set_commission_exempt":
        return { action: kind, ...base, exempt: !account.isCommissionExempt };
      case "set_negative_limit":
        return { action: kind, ...base, negativeLimit: value.trim() === "" ? null : value.trim() };
    }
  };

  const submit = () => {
    if (!open) return;
    const input = buildInput(open);
    if (!input) {
      toast.error("Enter a valid value");
      return;
    }
    startTransition(async () => {
      const result = await sellerOverrideAction(input);
      if (result.success) {
        toast.success(result.message);
        setOpen(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const { trial, wallet } = account;
  const trialStarted = Boolean(account.feeTrialStartedAt);
  const overLimit = account.storeCount > account.maxStores;

  return (
    <Card id="account">
      <CardHeader>
        <CardTitle>Account, plan and fees</CardTitle>
      </CardHeader>
      <CardContent>
        <Row label="Subscription plan">
          <span className="font-medium capitalize">{account.plan}</span>
          <span className="text-muted-foreground"> · since {formatDate(account.planStartedAt)} · only Free exists today</span>
        </Row>

        <Row
          label="Stores"
          action={
            <Button size="sm" variant="outline" onClick={() => openDialog("set_store_limit", account.maxStoresOverride?.toString() ?? "")}>
              Change limit
            </Button>
          }
        >
          <span className={overLimit ? "font-medium text-red-600" : "font-medium"}>
            {account.storeCount} of {account.maxStores}
          </span>
          <span className="text-muted-foreground">
            {account.maxStoresOverride !== null
              ? ` · admin exception (plan limit ${account.planMaxStores})`
              : " · plan limit"}
          </span>
        </Row>

        <Row label="Fee plan">
          <span className="font-medium">{account.feePlan === "flat_5" ? "Flat EGP 5 per order" : account.feePlan}</span>
          {account.feePlanEffectiveAt && (
            <span className="text-muted-foreground"> · since {formatDate(account.feePlanEffectiveAt)} · the only fee plan today</span>
          )}
        </Row>

        <Row
          label="Fee trial"
          action={
            trialStarted ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openDialog("extend_trial", (account.feeTrialEndsAt ?? "").slice(0, 10))}
              >
                Extend
              </Button>
            ) : account.feeTrialEligible ? (
              <Button size="sm" variant="outline" onClick={() => openDialog("revoke_trial")}>
                Revoke eligibility
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => openDialog("grant_trial")}>
                Grant eligibility
              </Button>
            )
          }
        >
          <Badge variant="outline">{TRIAL_STATE_LABELS[trial.state] ?? trial.state}</Badge>
          {trial.state === "active" && <span className="text-muted-foreground"> · {trial.daysLeft} days left</span>}
          <div className="text-xs text-muted-foreground">
            Eligible: {account.feeTrialEligible ? "yes" : "no"}
            {account.feeTrialStartedAt && ` · started ${formatDateTime(account.feeTrialStartedAt)}`}
            {account.feeTrialStartTrigger && ` (${account.feeTrialStartTrigger.replace("_", " ")})`}
            {account.feeTrialEndsAt && ` · ends ${formatDateTime(account.feeTrialEndsAt)}`}
          </div>
        </Row>

        <Row
          label="Platform fee exemption"
          action={
            <Button size="sm" variant="outline" onClick={() => openDialog("set_commission_exempt")}>
              {account.isCommissionExempt ? "Remove exemption" : "Exempt"}
            </Button>
          }
        >
          {account.isCommissionExempt ? (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Exempt: no platform fee</Badge>
          ) : (
            "Charged"
          )}
        </Row>

        <Row
          label="Wallet negative limit (optional purchases)"
          action={
            <Button size="sm" variant="outline" onClick={() => openDialog("set_negative_limit", wallet?.negativeLimit ?? "")}>
              Change
            </Button>
          }
        >
          {wallet?.negativeLimit ? `${formatCurrency(wallet.negativeLimit)} below zero` : "None (no overdraft for ads or themes)"}
          <div className="text-xs text-muted-foreground">Fees always post, whatever this limit.</div>
        </Row>
      </CardContent>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{open ? DIALOG_TITLES[open] : ""}</DialogTitle>
            <DialogDescription>Every change is saved with your name and the reason in the audit trail.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {open === "set_store_limit" && (
              <div className="space-y-1.5">
                <Label htmlFor="store-limit">Maximum stores (0–{MAX_STORES_OVERRIDE_LIMIT}); leave empty for the plan limit ({account.planMaxStores})</Label>
                <Input id="store-limit" type="number" min={0} max={MAX_STORES_OVERRIDE_LIMIT} value={value} onChange={(e) => setValue(e.target.value)} />
                <p className="text-xs text-muted-foreground">A lower limit never removes stores; it only blocks new ones.</p>
              </div>
            )}
            {open === "extend_trial" && (
              <div className="space-y-1.5">
                <Label htmlFor="trial-end">New end date (must be later than the current end)</Label>
                <Input id="trial-end" type="date" value={value} onChange={(e) => setValue(e.target.value)} />
              </div>
            )}
            {open === "grant_trial" && (
              <p className="text-sm">The seller gets the 7-day no-fee trial, counted from their first store's creation date (it may already be over).</p>
            )}
            {open === "revoke_trial" && (
              <p className="text-sm">The trial will not start for this seller. Only possible before it starts.</p>
            )}
            {open === "set_commission_exempt" && (
              <p className="text-sm">
                {account.isCommissionExempt
                  ? "New orders will be charged the platform fee again."
                  : "New orders will carry no platform fee (fee 0)."}
              </p>
            )}
            {open === "set_negative_limit" && (
              <div className="space-y-1.5">
                <Label htmlFor="negative-limit">How far below zero optional purchases may go, in EGP (empty = none)</Label>
                <Input id="negative-limit" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 500" />
              </div>
            )}
            <ReasonField value={reason} onChange={setReason} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={pending || !reasonIsValid(reason)}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
