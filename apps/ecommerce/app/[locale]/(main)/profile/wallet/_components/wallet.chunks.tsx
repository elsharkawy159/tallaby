"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import posthog from "posthog-js";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CreditCard,
  Lock,
  Plus,
  Wallet as WalletIcon,
} from "lucide-react";

import { formatPrice, formatPricePlain } from "@workspace/lib";
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@workspace/ui/components/field";
import { Form, FormField } from "@workspace/ui/components/form";
import { CurrencyInput } from "@workspace/ui/components/inputs/currency-input";
import { SelectInput } from "@workspace/ui/components/inputs/select-input";
import { TextInput } from "@workspace/ui/components/inputs/text-input";
import { TextareaInput } from "@workspace/ui/components/inputs/textarea-input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";

import { Link } from "@/i18n/navigation";
import {
  MANUAL_PAYMENT_METHODS,
  getManualPaymentMethodConfig,
  type ManualPaymentMethod,
} from "@/lib/manual-payment-methods";
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
  WALLET_PAYMOB_TOP_UP_ENABLED,
  WALLET_PAYOUT_METHODS,
  WALLET_TOP_UP_PRESETS,
  payoutStatusBadgeVariant,
  splitSignedAmount,
} from "./wallet.lib";
import {
  cancelPayoutRequest,
  createPayoutRequest,
  createWalletTopUp,
  reportManualTopUpSent,
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

interface PendingTopUp {
  topUpId: string;
  amount: string;
  paymentMethod: ManualPaymentMethod;
}

export function TopUpDialog({ disabled }: { disabled?: boolean }) {
  const t = useTranslations("wallet");
  const tCheckout = useTranslations("checkout");
  const tToast = useTranslations("toast");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingTopUp, setPendingTopUp] = useState<PendingTopUp | null>(null);

  const form = useForm<TopUpFormData>({
    resolver: zodResolver(topUpFormSchema),
    defaultValues: topUpFormDefaults,
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setPendingTopUp(null);
      form.reset(topUpFormDefaults);
    }
  };

  const handleSubmit = (data: TopUpFormData) => {
    startTransition(async () => {
      const result = await createWalletTopUp(data);

      if (!result.success) {
        toast.error(result.error || tToast("somethingWentWrong"));
        return;
      }

      posthog.capture("wallet_top_up_started", {
        amount: data.amount,
        payment_method: data.paymentMethod,
      });
      setPendingTopUp(result.data);
    });
  };

  const handleConfirmSent = () => {
    if (!pendingTopUp) return;

    startTransition(async () => {
      const result = await reportManualTopUpSent(pendingTopUp.topUpId);
      if (!result.success) {
        toast.error(result.error || tToast("somethingWentWrong"));
        return;
      }

      toast.success(t("topUpSubmitted"));
      handleOpenChange(false);
    });
  };

  const methodConfig = pendingTopUp
    ? getManualPaymentMethodConfig(pendingTopUp.paymentMethod)
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("topUp")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {pendingTopUp ? t("topUpInstructionsTitle") : t("topUpTitle")}
          </DialogTitle>
          <DialogDescription>
            {pendingTopUp
              ? t("topUpInstructionsDescription")
              : t("topUpDescription")}
          </DialogDescription>
        </DialogHeader>

        {pendingTopUp && methodConfig ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image
                src={methodConfig.logo}
                alt={tCheckout(methodConfig.titleKey as "instapay")}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="font-semibold">
                {tCheckout(methodConfig.titleKey as "instapay")}
              </span>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">
                {tCheckout("amountToSend")}
              </p>
              <p
                className="text-xl font-bold text-primary"
                dangerouslySetInnerHTML={{
                  __html: formatPrice(Number(pendingTopUp.amount), locale, "lg"),
                }}
              />
            </div>

            {methodConfig.qrImage && (
              <div className="flex justify-center">
                <Image
                  src={methodConfig.qrImage}
                  alt={tCheckout(methodConfig.titleKey as "instapay")}
                  width={200}
                  height={200}
                  className="rounded-lg border"
                />
              </div>
            )}

            {methodConfig.isPlaceholder ? (
              <p className="text-sm text-muted-foreground">
                {tCheckout("eCashPlaceholder")}
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {methodConfig.accountLabel && (
                  <p>
                    <span className="font-medium text-muted-foreground">
                      {pendingTopUp.paymentMethod === "instapay"
                        ? tCheckout("instapayAccount")
                        : tCheckout("vodafoneCashNumber")}
                      :
                    </span>{" "}
                    <span className="font-mono">
                      {methodConfig.accountLabel}
                    </span>
                  </p>
                )}
                {methodConfig.paymentLink && (
                  <p>
                    <span className="font-medium text-muted-foreground">
                      {tCheckout("instapayLink")}:
                    </span>{" "}
                    <a
                      href={methodConfig.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline break-all"
                    >
                      {methodConfig.paymentLink}
                    </a>
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {tCheckout("paymentInstructionsHint")}
            </p>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmSent}
                disabled={isPending}
              >
                {isPending ? t("submitting") : t("iSentThePayment")}
              </Button>
            </div>
          </div>
        ) : (
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

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldSet>
                      <FieldTitle className="text-sm font-medium">
                        {t("paymentMethod")}
                      </FieldTitle>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid gap-2"
                      >
                        {MANUAL_PAYMENT_METHODS.map((method) => (
                          <FieldLabel
                            key={method.value}
                            htmlFor={`wallet-topup-${method.value}`}
                            className={cn(
                              "cursor-pointer rounded-lg border-2 p-3 transition-all",
                              field.value === method.value
                                ? "border-primary bg-primary/5 ring-2 ring-primary"
                                : "border-border hover:border-muted-foreground/40"
                            )}
                          >
                            <Field orientation="horizontal">
                              <RadioGroupItem
                                value={method.value}
                                id={`wallet-topup-${method.value}`}
                              />
                              <Image
                                src={method.logo}
                                alt={tCheckout(method.titleKey as "instapay")}
                                width={28}
                                height={28}
                                className="h-7 w-7 shrink-0 object-contain"
                              />
                              <FieldContent>
                                <FieldTitle className="text-sm">
                                  {tCheckout(method.titleKey as "instapay")}
                                </FieldTitle>
                                <FieldDescription className="text-xs">
                                  {tCheckout(
                                    method.descriptionKey as "instapayDescription"
                                  )}
                                </FieldDescription>
                              </FieldContent>
                            </Field>
                          </FieldLabel>
                        ))}

                        {!WALLET_PAYMOB_TOP_UP_ENABLED && (
                          <div
                            aria-disabled="true"
                            className="flex items-start gap-3 rounded-lg border-2 border-dashed border-border p-3 opacity-60"
                          >
                            <div className="mt-0.5 size-4 shrink-0 rounded-full border border-muted-foreground/40" />
                            <CreditCard className="h-7 w-7 shrink-0 text-muted-foreground" />
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium leading-none">
                                {tCheckout("payByCard")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {tCheckout("cardPaymentTemporarilyUnavailable")}
                              </p>
                            </div>
                          </div>
                        )}
                      </RadioGroup>
                    </FieldSet>
                  </FieldGroup>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? t("submitting") : t("continueToPayment")}
                </Button>
              </div>
            </form>
          </Form>
        )}
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
