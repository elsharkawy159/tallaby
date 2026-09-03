"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import posthog from "posthog-js";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Lock,
  Plus,
  Wallet as WalletIcon,
} from "lucide-react";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Form } from "@workspace/ui/components/form";
import { CurrencyInput } from "@workspace/ui/components/inputs/currency-input";
import { SelectInput } from "@workspace/ui/components/inputs/select-input";
import { TextInput } from "@workspace/ui/components/inputs/text-input";
import { TextareaInput } from "@workspace/ui/components/inputs/textarea-input";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import {
  payoutFormDefaults,
  payoutFormSchema,
  topUpFormDefaults,
  topUpFormSchema,
  type PayoutFormData,
  type TopUpFormData,
} from "./wallet.dto";
import {
  WALLET_PAYOUT_METHODS,
  WALLET_TOP_UP_PRESETS,
  payoutStatusBadgeVariant,
  splitSignedAmount,
} from "./wallet.lib";
import {
  cancelPayoutRequest,
  createPayoutRequest,
  createWalletTopUp,
} from "./wallet.server";
import type {
  WalletBalance,
  WalletPayoutRequestView,
  WalletTransactionView,
} from "./wallet.types";

function useMoney() {
  const locale = useLocale();
  return (value: string | number) => formatPricePlain(Number(value), locale);
}

/* -------------------------------------------------------------------------- */
/* Balance                                                                    */
/* -------------------------------------------------------------------------- */

export function WalletBalanceCard({
  wallet,
  canRequestPayout,
  hasOpenPayoutRequest,
}: {
  wallet: WalletBalance;
  canRequestPayout: boolean;
  hasOpenPayoutRequest: boolean;
}) {
  const t = useTranslations("wallet");
  const money = useMoney();
  const hasReserved = Number(wallet.reservedBalance) > 0;
  const isActive = wallet.status === "active";

  return (
    <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 via-primary/10 to-primary/5">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <WalletIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">
                {t("availableBalance")}
              </h3>
              <p className="text-4xl font-bold text-primary">
                {money(wallet.availableBalance)}
              </p>
              {hasReserved && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("reservedNotice", {
                    amount: money(wallet.reservedBalance),
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            {!isActive && (
              <Badge variant="destructive" className="gap-1">
                <Lock className="h-3 w-3" />
                {t(`walletStatus.${wallet.status}`)}
              </Badge>
            )}
            <div className="flex flex-wrap gap-2">
              <TopUpDialog disabled={!isActive} />
              {canRequestPayout && (
                <PayoutRequestDialog
                  disabled={!isActive || hasOpenPayoutRequest}
                  availableBalance={wallet.availableBalance}
                  hasOpenPayoutRequest={hasOpenPayoutRequest}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact variant for the /profile index. Links through to the wallet page
 * rather than duplicating any actions.
 */
export function WalletSummaryCard({
  availableBalance,
}: {
  availableBalance: string;
}) {
  const t = useTranslations("wallet");
  const money = useMoney();

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <WalletIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">
              {t("availableBalance")}
            </h3>
            <p className="text-2xl font-bold text-primary">
              {money(availableBalance)}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/profile/wallet">{t("openWallet")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Top up                                                                     */
/* -------------------------------------------------------------------------- */

export function TopUpDialog({ disabled }: { disabled?: boolean }) {
  const t = useTranslations("wallet");
  const tToast = useTranslations("toast");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<TopUpFormData>({
    resolver: zodResolver(topUpFormSchema),
    defaultValues: topUpFormDefaults,
  });

  const handleSubmit = (data: TopUpFormData) => {
    startTransition(async () => {
      const result = await createWalletTopUp(data);

      if (!result.success) {
        toast.error(result.error || tToast("somethingWentWrong"));
        return;
      }

      posthog.capture("wallet_top_up_started", { amount: data.amount });
      // Hand off to the provider. The wallet is credited by the webhook, not
      // by anything that happens after this navigation.
      window.location.href = result.data.checkoutUrl;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("topUp")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("topUpTitle")}</DialogTitle>
          <DialogDescription>{t("topUpDescription")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="flex flex-wrap gap-2">
              {WALLET_TOP_UP_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    form.setValue("amount", preset, { shouldValidate: true })
                  }
                >
                  {preset}
                </Button>
              ))}
            </div>

            <CurrencyInput name="amount" label={t("amount")} required />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("redirecting") : t("continueToPayment")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Payout                                                                     */
/* -------------------------------------------------------------------------- */

export function PayoutRequestDialog({
  disabled,
  availableBalance,
  hasOpenPayoutRequest,
}: {
  disabled?: boolean;
  availableBalance: string;
  hasOpenPayoutRequest: boolean;
}) {
  const t = useTranslations("wallet");
  const tToast = useTranslations("toast");
  const money = useMoney();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<PayoutFormData>({
    resolver: zodResolver(payoutFormSchema),
    defaultValues: payoutFormDefaults,
  });

  const handleSubmit = (data: PayoutFormData) => {
    startTransition(async () => {
      const result = await createPayoutRequest(data);

      if (!result.success) {
        toast.error(result.error || tToast("somethingWentWrong"));
        return;
      }

      posthog.capture("wallet_payout_requested", { amount: data.amount });
      toast.success(t("payoutRequested"));
      form.reset(payoutFormDefaults);
      setIsOpen(false);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled} className="gap-2">
          <Banknote className="h-4 w-4" />
          {t("requestPayout")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("payoutTitle")}</DialogTitle>
          <DialogDescription>
            {hasOpenPayoutRequest
              ? t("payoutAlreadyOpen")
              : t("payoutDescription", { amount: money(availableBalance) })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <CurrencyInput name="amount" label={t("amount")} required />

            <SelectInput
              name="method"
              label={t("payoutMethod")}
              required
              options={WALLET_PAYOUT_METHODS.map((method) => ({
                value: method,
                label: t(`payoutMethods.${method}`),
              }))}
            />

            <TextInput
              form={form}
              name="accountName"
              label={t("accountName")}
              required
            />
            <TextInput
              form={form}
              name="accountNumber"
              label={t("accountNumber")}
              required
            />
            <TextareaInput form={form} name="notes" label={t("notes")} rows={3} />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("submitting") : t("submitRequest")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function PayoutRequestList({
  requests,
}: {
  requests: WalletPayoutRequestView[];
}) {
  const t = useTranslations("wallet");
  const tToast = useTranslations("toast");
  const money = useMoney();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleCancel = (id: string) => {
    startTransition(async () => {
      const result = await cancelPayoutRequest(id);
      if (!result.success) {
        toast.error(result.error || tToast("somethingWentWrong"));
        return;
      }
      toast.success(t("payoutCancelled"));
    });
  };

  if (requests.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("payoutRequests")}</CardTitle>
        <CardDescription>{t("payoutRequestsDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{money(request.amount)}</span>
                <Badge variant={payoutStatusBadgeVariant(request.status)}>
                  {t(`payoutStatus.${request.status}`)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {t(`payoutMethods.${request.method}`)}
                {" · "}
                {new Date(request.createdAt).toLocaleDateString(locale)}
              </p>
              {request.rejectionReason && (
                <p className="text-xs text-destructive">
                  {request.rejectionReason}
                </p>
              )}
            </div>

            {request.status === "pending" && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => handleCancel(request.id)}
              >
                {t("cancelRequest")}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* History                                                                    */
/* -------------------------------------------------------------------------- */

export function WalletTransactionRow({
  transaction,
}: {
  transaction: WalletTransactionView;
}) {
  const t = useTranslations("wallet");
  const money = useMoney();
  const locale = useLocale();
  const { isNegative, magnitude } = splitSignedAmount(transaction.amount);

  return (
    <div className="flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "rounded-full p-2",
            isNegative
              ? "bg-destructive/10 text-destructive"
              : "bg-emerald-500/10 text-emerald-600"
          )}
        >
          {isNegative ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownLeft className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">
            {t(`transactionType.${transaction.type}`)}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(transaction.createdAt).toLocaleString(locale)}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p
          className={cn(
            "text-sm font-semibold",
            isNegative ? "text-destructive" : "text-emerald-600"
          )}
        >
          {isNegative ? "−" : "+"}
          {money(magnitude)}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("balanceAfter", { amount: money(transaction.balanceAfter) })}
        </p>
      </div>
    </div>
  );
}

export function WalletTransactionList({
  transactions,
  onLoadMore,
  isLoadingMore,
  hasMore,
}: {
  transactions: WalletTransactionView[];
  onLoadMore: () => void;
  isLoadingMore: boolean;
  hasMore: boolean;
}) {
  const t = useTranslations("wallet");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("transactionHistory")}</CardTitle>
        <CardDescription>{t("transactionHistoryDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("noTransactions")}
          </p>
        ) : (
          <>
            <div>
              {transactions.map((transaction) => (
                <WalletTransactionRow
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
            {hasMore && (
              <div className="pt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? t("loading") : t("loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Shown when the wallet could not be loaded for a reason other than being
 * signed out — a database or provider problem, not something the viewer can fix
 * by signing in.
 */
export function WalletUnavailable() {
  const t = useTranslations("wallet");

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <WalletIcon className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{t("unavailableTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("unavailableDescription")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Shown when the viewer has no account that can hold a wallet. */
export function WalletSignInPrompt() {
  const t = useTranslations("wallet");

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <WalletIcon className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{t("signInTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("signInDescription")}
          </p>
        </div>
        <Button asChild>
          <Link href="/auth">{t("signIn")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
