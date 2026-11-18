"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowUpRight, Clock, Info, LoaderCircle, X } from "lucide-react";

import {
  asciiDigits,
  TALLABY_PAY_PAYOUT_METHODS,
  TALLABY_PAY_WALLET_PROVIDERS,
  tallabyPayDestinationSchema,
  type TallabyPayPayoutMethod,
  type TallabyPayWithdrawBlock,
} from "@workspace/lib/tallaby-pay";
import { useRouter } from "@/i18n/navigation";
import { Field, NativeSelect, Note, OptionCard, OptionCards, SectionCard, SellerButton, TextInput } from "@/components/seller-ui";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { cancelTallabyPayWithdrawal, requestTallabyPayWithdrawal } from "./earnings.server";

type OpenPayout = { id: string; amountText: string; method: TallabyPayPayoutMethod; destination: string; dateText: string };

type FieldName = "holderName" | "address" | "bankName" | "accountNumber" | "phone" | "amount";

/**
 * The withdraw form and the open request (ROADMAP.md F-100f; design §7, owner
 * answers §14: minimum EGP 500, KYC first). The server re-checks everything
 * under the wallet lock; this only guides the seller.
 */
export function WithdrawCard({
  storeId,
  readOnly,
  withdrawable,
  withdrawableText,
  minPayoutText,
  block,
  legalName,
  openPayout,
}: {
  storeId: string;
  readOnly: boolean;
  /** 2 dp text, the default amount. */
  withdrawable: string;
  withdrawableText: string;
  minPayoutText: string;
  block: TallabyPayWithdrawBlock | null;
  /** The verified legal name: the destination must be in it. */
  legalName: string | null;
  openPayout: OpenPayout | null;
}) {
  const t = useTranslations("tallabyPayEarnings");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [method, setMethod] = useState<TallabyPayPayoutMethod>("instapay");
  const [holderName, setHolderName] = useState(legalName ?? "");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [provider, setProvider] = useState<(typeof TALLABY_PAY_WALLET_PROVIDERS)[number]>("vodafone_cash");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(withdrawable);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const cancel = (payoutId: string) =>
    startTransition(async () => {
      const result = await cancelTallabyPayWithdrawal(storeId, payoutId);
      if (result.success) {
        setConfirmCancel(false);
        toast.success(t("withdraw.cancelled"));
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });

  if (openPayout) {
    return (
      <SectionCard id="withdraw" icon={Clock} tone="accent" title={t("withdraw.openTitle")} description={t("withdraw.openDescription")}>
        <div className="flex flex-col gap-1 rounded-2xl bg-(--s-tint) px-4 py-3">
          <bdi className="font-montserrat text-xl font-bold text-(--s-ink) tabular-nums">{openPayout.amountText}</bdi>
          <span className="text-[12.5px] text-(--s-muted)">
            {t(`methods.${openPayout.method}`)} · <bdi dir="ltr" data-clarity-mask="true">{openPayout.destination}</bdi>
          </span>
          <span className="text-xs text-(--s-subtle)">{t("withdraw.requestedOn", { date: openPayout.dateText })}</span>
        </div>
        <SellerButton
          variant="outline"
          size="sm"
          className="self-start text-destructive"
          disabled={readOnly || pending}
          onClick={() => setConfirmCancel(true)}
        >
          <X aria-hidden />
          {t("withdraw.cancel")}
        </SellerButton>
        <ConfirmActionDialog
          open={confirmCancel}
          onOpenChange={setConfirmCancel}
          title={t("withdraw.cancelConfirmTitle")}
          description={t("withdraw.cancelConfirmDescription")}
          confirmLabel={t("withdraw.cancel")}
          destructive
          pending={pending}
          onConfirm={() => cancel(openPayout.id)}
        />
      </SectionCard>
    );
  }

  const disabled = readOnly || block !== null;
  const destination =
    method === "instapay"
      ? { method, holderName, address }
      : method === "bank"
        ? { method, holderName, bankName, accountNumber }
        : { method, holderName, provider, phone };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = tallabyPayDestinationSchema.safeParse(destination);
    const next: Partial<Record<FieldName, string>> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as FieldName | undefined;
        if (field && !next[field]) next[field] = t(`withdraw.fieldErrors.${field}`);
      }
    }
    const cleanAmount = asciiDigits(amount).trim().replace(/,/g, "");
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(cleanAmount)) next.amount = t("withdraw.fieldErrors.amount");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    startTransition(async () => {
      const result = await requestTallabyPayWithdrawal(storeId, { amount: cleanAmount, destination });
      if (result.success) {
        toast.success(t("withdraw.requested"));
        router.refresh();
      } else if (result.error === "name_mismatch") {
        setErrors({ holderName: t("errors.name_mismatch") });
      } else if (result.error === "below_minimum" || result.error === "above_withdrawable") {
        setErrors({ amount: t(`errors.${result.error}`, { minimum: minPayoutText, max: withdrawableText }) });
      } else {
        setFormError(t(`errors.${result.error}`, { minimum: minPayoutText, max: withdrawableText }));
      }
    });
  };

  const input = (name: FieldName, value: string, set: (v: string) => void, props: React.ComponentProps<"input"> = {}) => (
    <Field label={t(`withdraw.fields.${name}`)} htmlFor={`withdraw-${name}`} error={errors[name]} required>
      <TextInput
        id={`withdraw-${name}`}
        value={value}
        onChange={(e) => set(e.target.value)}
        aria-invalid={errors[name] ? true : undefined}
        data-clarity-mask="true"
        {...props}
      />
    </Field>
  );

  return (
    <SectionCard id="withdraw" icon={ArrowUpRight} tone="primary" title={t("withdraw.title")} description={t("withdraw.description", { minimum: minPayoutText })}>
      {block && (
        <Note tone={block === "frozen" || block === "kyc_rejected" ? "danger" : "amber"} icon={Info}>
          {t(`blocks.${block}`, { minimum: minPayoutText })}
        </Note>
      )}
      <form onSubmit={submit} noValidate>
        <fieldset disabled={disabled || pending} className="flex flex-col gap-4 disabled:opacity-60">
          <legend className="sr-only">{t("withdraw.title")}</legend>
          <OptionCards role="radiogroup" aria-label={t("withdraw.fields.method")} className="grid-cols-1">
            {TALLABY_PAY_PAYOUT_METHODS.map((m) => (
              <OptionCard
                key={m}
                name="withdraw-method"
                value={m}
                checked={method === m}
                onChange={() => {
                  setMethod(m);
                  setErrors({});
                }}
                title={t(`methods.${m}`)}
                description={t(`withdraw.methodHints.${m}`)}
              />
            ))}
          </OptionCards>

          {input("holderName", holderName, setHolderName, { autoComplete: "name", maxLength: 200 })}
          {method === "instapay" && input("address", address, setAddress, { dir: "ltr", inputMode: "email", maxLength: 80, placeholder: "name@instapay" })}
          {method === "bank" && (
            <>
              {input("bankName", bankName, setBankName, { maxLength: 100 })}
              {input("accountNumber", accountNumber, setAccountNumber, { dir: "ltr", maxLength: 60, placeholder: "EG…" })}
            </>
          )}
          {method === "mobile_wallet" && (
            <>
              <Field label={t("withdraw.fields.provider")} htmlFor="withdraw-provider" required>
                <NativeSelect
                  id="withdraw-provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as typeof provider)}
                >
                  {TALLABY_PAY_WALLET_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {t(`walletProviders.${p}`)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              {input("phone", phone, setPhone, { dir: "ltr", type: "tel", inputMode: "tel", autoComplete: "tel", maxLength: 40, placeholder: "01XXXXXXXXX" })}
            </>
          )}

          <Field
            label={t("withdraw.fields.amount")}
            htmlFor="withdraw-amount"
            hint={t("withdraw.amountHint", { max: withdrawableText })}
            note={t("withdraw.amountNote", { minimum: minPayoutText })}
            error={errors.amount}
            required
          >
            <TextInput
              id="withdraw-amount"
              dir="ltr"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={errors.amount ? true : undefined}
              className="font-montserrat tabular-nums"
            />
          </Field>

          {formError && (
            <Note tone="danger" icon={Info}>
              <span role="alert">{formError}</span>
            </Note>
          )}

          <SellerButton type="submit" disabled={disabled || pending}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <ArrowUpRight aria-hidden />}
            {t("withdraw.submit")}
          </SellerButton>
          <p className="text-pretty text-xs leading-[1.7] text-(--s-subtle)">{t("withdraw.manualNote")}</p>
        </fieldset>
      </form>
    </SectionCard>
  );
}
