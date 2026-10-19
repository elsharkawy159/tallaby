"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import posthog from "posthog-js";
import { Check, Copy, Share2, Wallet } from "lucide-react";

import { formatPricePlain } from "@workspace/lib";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

import type {
  AffiliateOrderView,
  AffiliateOverview,
} from "@workspace/db/affiliates";

function useMoney() {
  const locale = useLocale();
  return (value: string | number) => formatPricePlain(Number(value), locale);
}

const ORDER_STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  delivered: "default",
  out_for_delivery: "secondary",
  shipped: "secondary",
  shipping_soon: "secondary",
  confirmed: "secondary",
  payment_processing: "secondary",
  pending: "outline",
  cancelled: "destructive",
  refund_requested: "destructive",
  refunded: "destructive",
  returned: "destructive",
};

export function AffiliateClient({
  overview,
  initialOrders,
}: {
  overview: AffiliateOverview;
  initialOrders: AffiliateOrderView[];
}) {
  const t = useTranslations("affiliate");
  const money = useMoney();
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/affiliate?code=${overview.code}`
      : undefined;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(overview.code);
      setCopied(true);
      posthog.capture("affiliate_code_copied");
      toast.success(t("codeCopied"));
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const handleShare = async () => {
    const text = t("shareText", { code: overview.code });
    posthog.capture("affiliate_code_shared");
    if (navigator.share) {
      try {
        await navigator.share({ text, url: shareUrl });
      } catch {
        // Share sheet cancelled — not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${shareUrl ?? ""}`.trim());
      toast.success(t("shareCopied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const summaryCards: { label: string; value: string }[] = [
    { label: t("totalOrders"), value: String(overview.totals.totalOrders) },
    { label: t("deliveredOrders"), value: String(overview.totals.deliveredOrders) },
    { label: t("pendingProfit"), value: money(overview.totals.pendingProfit) },
    { label: t("totalProfit"), value: money(overview.totals.totalProfit) },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("yourCode")}</CardTitle>
          <CardDescription>{t("yourCodeDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <code className="rounded-lg bg-muted px-4 py-2 font-mono text-xl font-bold tracking-widest text-primary">
                {overview.code}
              </code>
              {overview.status === "inactive" && (
                <Badge variant="outline">{t("inactive")}</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check data-icon="inline-start" />
                ) : (
                  <Copy data-icon="inline-start" />
                )}
                {t("copyCode")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 data-icon="inline-start" />
                {t("share")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-xl font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {overview.wallet && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("walletBalance")}</p>
                <p className="text-2xl font-bold text-primary">
                  {money(overview.wallet.balance)}
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <a href="/profile/wallet">{t("viewWallet")}</a>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("referredOrders")}</CardTitle>
          <CardDescription>{t("referredOrdersDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {initialOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("noOrdersYet")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("orderReference")}</TableHead>
                    <TableHead>{t("orderStatus")}</TableHead>
                    <TableHead>{t("orderAmount")}</TableHead>
                    <TableHead className="text-end">{t("yourProfit")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialOrders.map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell className="font-medium">
                        {order.orderReference || order.orderId.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={ORDER_STATUS_BADGE[order.orderStatus] ?? "outline"}
                        >
                          {t.has(`orderStatuses.${order.orderStatus}`)
                            ? t(`orderStatuses.${order.orderStatus}` as never)
                            : order.orderStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{money(order.orderEligibleAmount)}</TableCell>
                      <TableCell className="text-end font-semibold">
                        {order.commissionStatus === "earned" && order.yourProfit
                          ? money(order.yourProfit)
                          : order.commissionStatus === "reversed"
                            ? t("reversed")
                            : t("pending")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
