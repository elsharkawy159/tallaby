"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Mail,
  Percent,
  RefreshCcw,
  Repeat,
  Wallet as WalletIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";

import { setAffiliateStatus } from "@/actions/affiliates";
import { CommissionLedger } from "./_components/commission-ledger";
import { OrderHistoryTable } from "./_components/order-history-table";
import type {
  AffiliateDetail,
  AffiliateLedgerRow,
  AffiliateOrderRow,
} from "./affiliate-detail.types";
import { affiliateStatusVariant, formatDate, money } from "../affiliate.lib";

function initialsFor(detail: AffiliateDetail): string {
  const source = detail.fullName || detail.email || "A";
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source[0]?.toUpperCase() || "A";
}

export function AffiliateDetailContent({
  detail,
  initialOrders,
  initialOrdersTotal,
  initialLedger,
  initialLedgerTotal,
}: {
  detail: AffiliateDetail;
  initialOrders: AffiliateOrderRow[];
  initialOrdersTotal: number;
  initialLedger: AffiliateLedgerRow[];
  initialLedgerTotal: number;
}) {
  const [status, setStatus] = useState(detail.status);
  const [copied, setCopied] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"activate" | "disable" | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(detail.code);
      setCopied(true);
      toast.success("Affiliate code copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy the code");
    }
  };

  const handleToggleStatus = () => {
    if (!confirmAction) return;
    const nextStatus = confirmAction === "activate" ? "active" : "inactive";

    startTransition(async () => {
      const result = await setAffiliateStatus({
        affiliateId: detail.affiliateId,
        status: nextStatus,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setStatus(nextStatus);
      setConfirmAction(null);
      toast.success(
        nextStatus === "active"
          ? "Affiliate enabled — their code can be used again."
          : "Affiliate disabled — their code can no longer be used."
      );
    });
  };

  const summaryCards = [
    { label: "Total Referred Orders", value: String(detail.totalOrders) },
    { label: "Delivered Orders", value: String(detail.deliveredOrders) },
    { label: "Pending Orders", value: String(detail.pendingOrders) },
    { label: "Pending Profit", value: money(detail.pendingProfit) },
    { label: "Total Profit", value: money(detail.totalProfit) },
    { label: "Wallet Balance", value: money(detail.wallet?.balance ?? 0) },
    { label: "Customer Savings", value: money(detail.customerSavings) },
    {
      label: "Conversion Rate",
      value:
        detail.conversionRate === null
          ? "—"
          : `${detail.conversionRate.toFixed(1)}%`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/affiliate">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Affiliates
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                {detail.avatarUrl && (
                  <AvatarImage src={detail.avatarUrl} alt={detail.fullName ?? ""} />
                )}
                <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                  {initialsFor(detail)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-semibold">
                    {detail.fullName || "—"}
                  </h1>
                  <Badge variant={affiliateStatusVariant(status)} className="capitalize">
                    {status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {detail.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created {formatDate(detail.createdAt)}
                  </span>
                </div>
                <code className="inline-block rounded bg-muted px-3 py-1 font-mono text-sm font-semibold tracking-wide">
                  {detail.code}
                </code>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Copy code
              </Button>
              {status === "active" ? (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setConfirmAction("disable")}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Disable Affiliate
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => setConfirmAction("activate")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Enable Affiliate
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Affiliate Promo Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Code</span>
              <code className="font-mono font-semibold">{detail.code}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Percent className="h-3.5 w-3.5" /> Discount
              </span>
              <span className="font-medium">{detail.discountPercent}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Affiliate Commission</span>
              <span className="font-medium">
                {(detail.commissionRate * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Repeat className="h-3.5 w-3.5" /> Reusable
              </span>
              <span className="font-medium">
                {detail.isOneTimeUse ? "No" : "Yes"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">One-time use</span>
              <span className="font-medium">
                {detail.isOneTimeUse ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{formatDate(detail.couponCreatedAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={detail.couponActive ? "default" : "outline"}>
                {detail.couponActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="h-4 w-4" /> Wallet Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Wallet Balance</span>
              <span className="font-semibold">{money(detail.wallet?.balance ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Earned</span>
              <span className="font-medium">{money(detail.totalProfit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Withdrawn / Paid Out</span>
              <span className="font-medium">
                {money(detail.wallet?.totalWithdrawn ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-medium">{money(detail.pendingProfit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reversed</span>
              <span className="font-medium text-destructive">
                {money(detail.reversedProfit)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="orders">
            <TabsList>
              <TabsTrigger value="orders">Order History</TabsTrigger>
              <TabsTrigger value="ledger">Commission Ledger</TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="mt-4">
              <OrderHistoryTable
                affiliateId={detail.affiliateId}
                initialRows={initialOrders}
                initialTotal={initialOrdersTotal}
              />
            </TabsContent>
            <TabsContent value="ledger" className="mt-4">
              <CommissionLedger
                affiliateId={detail.affiliateId}
                initialRows={initialLedger}
                initialTotal={initialLedgerTotal}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "activate" ? "Enable affiliate" : "Disable affiliate"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "activate"
                ? "This reactivates the affiliate's promo code — new orders can use it again and earn commission. Historical data is unaffected."
                : "This deactivates the affiliate's promo code — no new order can use it. All historical orders and commissions remain intact."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === "disable" ? "destructive" : "default"}
              disabled={isPending}
              onClick={handleToggleStatus}
            >
              {isPending && <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />}
              {confirmAction === "activate" ? "Enable Affiliate" : "Disable Affiliate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
