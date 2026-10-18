"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { AtSign, Check, CircleDashed, Info, LoaderCircle, Pencil, Plus, Settings2, Smartphone, TriangleAlert } from "lucide-react";

import {
  STORE_PAYMENT_METHODS,
  codSettingsSchema,
  instapayDetailsSchema,
  operatorHint,
  walletDetailsSchema,
  type StorePayments,
} from "@workspace/lib/payments/store-methods";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { BUTTON_CLASS, FIELD_CLASS, SMALL_BUTTON_CLASS, TEXTAREA_CLASS } from "@/components/form/form-ui";
import { CURRENCY_CODE, CurrencyInput } from "@/components/form/currency-input";
import { PaymentMethodLogo } from "@/components/payments/payment-method-logo";
import { cn } from "@/lib/utils";
import { saveStorePaymentMethod } from "./payments.server";
import { toDetails, type PaymentDetailsFormValues } from "./payments.dto";

type LiveKey = "cod" | "vodafone_cash" | "e_cash" | "we_pay" | "orange_cash" | "instapay";
type Entry = { enabled: boolean; details?: Record<string, string>; fee?: number; maxOrder?: number; note?: string };
type Change = { enabled: boolean; details?: unknown; fee?: number; maxOrder?: number | null; note?: string };

const LIVE = STORE_PAYMENT_METHODS.filter((m) => m.status === "live");
const WALLETS = LIVE.filter((m) => m.key !== "cod").map((m) => m.key as LiveKey);
const SOON = STORE_PAYMENT_METHODS.filter((m) => m.status === "soon");
const EMPTY: PaymentDetailsFormValues = { holderName: "", phone: "", ipa: "", iban: "", paymentLink: "" };

/** Field errors from the shared detail schemas, keyed by field. */
function fieldErrors(kind: "wallet" | "instapay", v: PaymentDetailsFormValues) {
  const schema = kind === "wallet" ? walletDetailsSchema : instapayDetailsSchema;
  const parsed = schema.safeParse(toDetails(kind, v));
  if (parsed.success) return {};
  const out: Partial<Record<keyof PaymentDetailsFormValues, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = (issue.path[0] as keyof PaymentDetailsFormValues) ?? "holderName";
    out[field] ??= ["phone_invalid", "ipa_invalid", "iban_invalid", "iban_checksum", "link_invalid", "identifier_required"].includes(issue.message)
      ? issue.message
      : field === "holderName"
        ? "holder_invalid"
        : "invalid";
  }
  return out;
}

/** "010 •••• 5678": enough to recognise the number without showing it. */
const maskNumber = (n: string) => (n.length > 7 ? `${n.slice(0, 3)} •••• ${n.slice(-4)}` : n);

/**
 * Store settings › Payment methods (Claude design "Seller Payments"): a Cash
 * card and a Wallets & instant transfer card, then the methods coming soon.
 * COD is always set up; a wallet is "not set up" until it has details.
 */
export function StorePaymentsSettings({
  storeId,
  initial,
  readOnly,
}: {
  storeId: string;
  initial: StorePayments;
  readOnly: boolean;
}) {
  const t = useTranslations("storePayments");
  const router = useRouter();
  const [payments, setPayments] = useState<StorePayments>(initial);
  const [editing, setEditing] = useState<LiveKey | null>(null);
  const [isPending, startTransition] = useTransition();
  const entry = (key: LiveKey) => payments[key] as Entry | undefined;
  const isSetUp = (key: LiveKey) => key === "cod" || !!entry(key)?.details;
  const enabledCount = LIVE.filter((m) => entry(m.key as LiveKey)?.enabled).length;

  const save = (key: LiveKey, change: Change, onDone?: () => void) =>
    startTransition(async () => {
      const result = await saveStorePaymentMethod(storeId, key, change);
      if (result.success) {
        setPayments(result.data);
        toast.success(t("saved"));
        onDone?.();
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });

  const toggle = (key: LiveKey, on: boolean) => {
    // The last enabled method stays on; the server refuses it too.
    if (!on && enabledCount <= 1) {
      toast.error(t("errors.lastMethod"));
      return;
    }
    save(key, { enabled: on });
  };

  const row = (key: LiveKey) => {
    const e = entry(key);
    const setUp = isSetUp(key);
    const on = !!e?.enabled;
    const locked = on && enabledCount <= 1;
    const label = t(`methods.${key}.name`);
    return (
      <li key={key} className={cn("flex flex-wrap items-center gap-3.5 border-t px-4 py-4 first:border-t-0 sm:flex-nowrap sm:px-6", setUp && !on && "[&_.pm-logo]:opacity-90")}>
        <PaymentMethodLogo method={key} label={label} className="pm-logo" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
            {label}
            <StatusTag setUp={setUp} on={on} />
          </p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{t(`methods.${key}.description`)}</p>
          <DetailsLine methodKey={key} entry={e} />
        </div>
        <div className="flex w-full items-center justify-between gap-2.5 ps-[58px] sm:w-auto sm:justify-end sm:ps-0">
          {setUp ? (
            <>
              <Button
                type="button"
                variant="ghost"
                className={cn(SMALL_BUTTON_CLASS, "text-muted-foreground hover:bg-muted hover:text-foreground")}
                disabled={readOnly || isPending}
                onClick={() => setEditing(key)}
              >
                <Pencil />
                {t("edit")}
              </Button>
              <Switch
                checked={on}
                disabled={readOnly || isPending}
                aria-disabled={locked || undefined}
                className={cn(locked && "opacity-55")}
                title={locked ? t("lastMethodLocked") : undefined}
                onCheckedChange={(next) => toggle(key, next)}
                aria-label={t("toggle", { method: label })}
              />
            </>
          ) : (
            <Button
              type="button"
              variant="accent"
              className={SMALL_BUTTON_CLASS}
              disabled={readOnly || isPending}
              onClick={() => setEditing(key)}
            >
              <Plus />
              {t("setUp")}
            </Button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-5">
      {readOnly && <p className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}
      <p className="flex items-start gap-2.5 rounded-xl bg-primary-soft px-4 py-3 text-[13px] text-primary-ink">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{t("checkoutNotice")}</span>
      </p>

      <PaymentCard title={t("cashTitle")} description={t("cashDescription")}>
        <ul>{row("cod")}</ul>
      </PaymentCard>

      <PaymentCard
        title={t("walletsTitle")}
        description={t("walletsDescription")}
        count={t("walletsCount", {
          on: WALLETS.filter((k) => entry(k)?.enabled).length,
          total: WALLETS.length,
        })}
      >
        <ul>{WALLETS.map(row)}</ul>
      </PaymentCard>

      <PaymentCard title={t("soonTitle")} description={t("soonDescription")}>
        <ul className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
          {SOON.map((m) => {
            const label = t(`methods.${m.key}.name`);
            return (
              <li key={m.key} aria-disabled="true" className="flex items-center gap-3 rounded-xl border p-3 opacity-70">
                <PaymentMethodLogo method={m.key} label={label} className="size-9" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
                <Badge variant="outline" className="text-[10px] font-normal">
                  {t("soon")}
                </Badge>
              </li>
            );
          })}
        </ul>
      </PaymentCard>

      {editing && (
        <MethodSheet
          key={editing}
          methodKey={editing}
          entry={entry(editing)}
          pending={isPending}
          onClose={() => setEditing(null)}
          onSave={(change) => save(editing, change, () => setEditing(null))}
        />
      )}
    </div>
  );
}

function PaymentCard({
  title,
  description,
  count,
  children,
}: {
  title: string;
  description: string;
  count?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card shadow-[0_1px_2px_rgba(20,81,99,0.05),0_1px_3px_rgba(20,81,99,0.04)] dark:shadow-none">
      <div className="flex items-center gap-3 border-b px-4 py-[18px] sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold leading-normal">{title}</h2>
          <p className="text-[13px] text-muted-foreground">{description}</p>
        </div>
        {count && <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:inline">{count}</span>}
      </div>
      {children}
    </section>
  );
}

function StatusTag({ setUp, on }: { setUp: boolean; on: boolean }) {
  const t = useTranslations("storePayments");
  const base = "inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-medium";
  if (!setUp) {
    return (
      <span className={cn(base, "bg-accent-soft text-accent-ink")}>
        <CircleDashed className="size-3" aria-hidden />
        {t("status.notSetUp")}
      </span>
    );
  }
  if (on) {
    return (
      <span className={cn(base, "bg-success-soft text-success")}>
        <Check className="size-3" aria-hidden />
        {t("status.on")}
      </span>
    );
  }
  return <span className={cn(base, "border bg-muted text-muted-foreground")}>{t("status.off")}</span>;
}

function DetailsLine({ methodKey, entry }: { methodKey: LiveKey; entry?: Entry }) {
  const t = useTranslations("storePayments");
  const line = "mt-0.5 flex flex-wrap items-center gap-1.5 text-[12.5px]";
  const icon = "size-3.5 text-faint";
  if (methodKey === "cod") {
    const parts = [entry?.fee ? t("codFeeLine", { fee: entry.fee, currency: CURRENCY_CODE }) : t("codNoFee")];
    if (entry?.maxOrder) parts.push(t("codMaxSummary", { max: entry.maxOrder, currency: CURRENCY_CODE }));
    return (
      <p className={line}>
        <Settings2 className={icon} aria-hidden />
        {parts.join(" · ")}
      </p>
    );
  }
  const d = entry?.details;
  if (!d) return null;
  const id = d.ipa ?? (d.phone ? maskNumber(d.phone) : d.iban ? `•••• ${d.iban.slice(-4)}` : "");
  const Icon = d.ipa ? AtSign : Smartphone;
  return (
    <p className={line}>
      <Icon className={icon} aria-hidden />
      <bdi dir="ltr" className="font-mono">
        {id}
      </bdi>
      · {t("holderSummary", { name: d.holderName })}
    </p>
  );
}

function MethodSheet({
  methodKey,
  entry,
  pending,
  onClose,
  onSave,
}: {
  methodKey: LiveKey;
  entry?: Entry;
  pending: boolean;
  onClose: () => void;
  onSave: (change: Change) => void;
}) {
  const t = useTranslations("storePayments");
  const locale = useLocale();
  const label = t(`methods.${methodKey}.name`);
  const kind = methodKey === "cod" ? "cod" : methodKey === "instapay" ? "instapay" : "wallet";
  const setUp = kind === "cod" || !!entry?.details;
  const [values, setValues] = useState<PaymentDetailsFormValues>({ ...EMPTY, ...(entry?.details ?? {}) });
  const [fee, setFee] = useState(entry?.fee ? String(entry.fee) : "");
  const [maxOrder, setMaxOrder] = useState(entry?.maxOrder ? String(entry.maxOrder) : "");
  const [note, setNote] = useState(entry?.note ?? "");
  const [submitted, setSubmitted] = useState(false);

  const errors = kind === "cod" ? {} : fieldErrors(kind, values);
  const feeValue = fee ? Number(fee) : 0;
  const maxValue = maxOrder ? Number(maxOrder) : undefined;
  const feeValid = Number.isInteger(feeValue) && feeValue >= 0 && feeValue <= 500;
  const maxValid = codSettingsSchema.shape.maxOrder.safeParse(maxValue).success;
  const hint = kind !== "cod" && values.phone ? operatorHint(values.phone) : null;
  const hintMismatch = kind === "wallet" && hint && hint !== methodKey;
  // Saving details turns the method on; it can be switched off from the list.
  const enabled = methodKey === "cod" ? (entry?.enabled ?? true) : true;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (kind === "cod") {
      if (feeValid && maxValid) onSave({ enabled, fee: feeValue, maxOrder: maxValue ?? null, note: note.trim() });
      return;
    }
    if (Object.keys(errors).length === 0) onSave({ enabled, details: toDetails(kind, values) });
  };

  const field = (
    name: keyof PaymentDetailsFormValues,
    opts: { ltr?: boolean; placeholder?: string; inputMode?: "tel" | "email" | "url"; help?: string } = {},
  ) => {
    const error = submitted ? errors[name] : undefined;
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={`pm-${name}`}>{t(`fields.${name}`)}</Label>
        <Input
          id={`pm-${name}`}
          className={cn(FIELD_CLASS, opts.ltr && "text-start font-mono", error && "border-destructive")}
          dir={opts.ltr ? "ltr" : undefined}
          inputMode={opts.inputMode}
          placeholder={opts.placeholder}
          value={values[name]}
          aria-invalid={!!error}
          onChange={(ev) => setValues((v) => ({ ...v, [name]: ev.target.value }))}
        />
        {error ? (
          <p className="text-xs text-destructive">{t(`fieldErrors.${error}`)}</p>
        ) : (
          opts.help && <p className="text-xs leading-relaxed text-muted-foreground">{opts.help}</p>
        )}
      </div>
    );
  };

  const optional = <span className="text-xs font-normal text-faint">{t("optional")}</span>;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={locale.startsWith("ar") ? "left" : "right"} className="flex w-full flex-col gap-0 p-0 sm:max-w-[440px]">
        <SheetHeader className="border-b px-5 py-[18px]">
          <div className="flex items-center gap-3">
            <PaymentMethodLogo method={methodKey} label={label} />
            <div className="min-w-0">
              <SheetTitle className="text-base font-bold">{t(setUp ? "editTitle" : "setUpTitle", { method: label })}</SheetTitle>
              <SheetDescription className="text-xs">{t(`methods.${methodKey}.setupHelp`)}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form id="pm-form" onSubmit={submit} noValidate className="flex flex-1 flex-col gap-[18px] overflow-y-auto p-5">
          {kind === "cod" ? (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="pm-fee" className="justify-between">
                  {t("fields.codFeeLabel")}
                  {optional}
                </Label>
                <CurrencyInput id="pm-fee" placeholder="0" decimals={false} value={fee} onChange={setFee} invalid={submitted && !feeValid} />
                <p className={cn("text-xs leading-relaxed", submitted && !feeValid ? "text-destructive" : "text-muted-foreground")}>
                  {submitted && !feeValid ? t("fieldErrors.codInvalid") : t("fields.codFeeHelp")}
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pm-max" className="justify-between">
                  {t("fields.codMax")}
                  {optional}
                </Label>
                <CurrencyInput
                  id="pm-max"
                  placeholder={t("fields.codMaxPlaceholder")}
                  decimals={false}
                  value={maxOrder}
                  onChange={setMaxOrder}
                  invalid={submitted && !maxValid}
                />
                <p className={cn("text-xs leading-relaxed", submitted && !maxValid ? "text-destructive" : "text-muted-foreground")}>
                  {submitted && !maxValid ? t("fieldErrors.codMaxInvalid") : t("fields.codMaxHelp")}
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pm-note" className="justify-between">
                  {t("fields.noteLabel")}
                  {optional}
                </Label>
                <Textarea
                  id="pm-note"
                  className={TEXTAREA_CLASS}
                  maxLength={300}
                  placeholder={t("fields.notePlaceholder")}
                  value={note}
                  onChange={(ev) => setNote(ev.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              {kind === "wallet" && field("phone", { ltr: true, inputMode: "tel", placeholder: "01XXXXXXXXX", help: t("fields.phoneHelp") })}
              {kind === "instapay" && (
                <>
                  <p className="text-sm text-muted-foreground">{t("instapayIdentifiers")}</p>
                  {field("ipa", { ltr: true, inputMode: "email", placeholder: "name@instapay", help: t("fields.ipaHelp") })}
                  {field("phone", { ltr: true, inputMode: "tel", placeholder: "01XXXXXXXXX" })}
                  {field("iban", { ltr: true, placeholder: "EG00 0000 0000 0000 0000 0000 0000 0" })}
                  {field("paymentLink", { ltr: true, inputMode: "url", placeholder: "https://ipn.eg/…" })}
                </>
              )}
              {field("holderName", { help: t("fields.holderHelp") })}
              {hintMismatch && (
                <p className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
                  {t("operatorHint", { operator: t(`methods.${hint}.name`), method: label })}
                </p>
              )}
              <ol className="flex flex-col gap-1.5 rounded-xl border bg-muted/40 px-4 py-3.5 text-[13px] text-muted-foreground">
                {(["choose", "transfer", "confirm"] as const).map((step, i) => (
                  <li key={step} className="flex gap-2.5">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border bg-card text-[11px] font-bold text-primary-ink">
                      {i + 1}
                    </span>
                    {t(`howItWorks.${step}`, { method: label })}
                  </li>
                ))}
              </ol>
            </>
          )}
        </form>

        <SheetFooter className="flex-row items-center gap-2 border-t px-5 py-3.5">
          <Button type="submit" form="pm-form" variant="accent" className={BUTTON_CLASS} disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : <Check />}
            {setUp ? t("save") : t("saveAndEnable")}
          </Button>
          <Button type="button" variant="ghost" className={cn(BUTTON_CLASS, "text-muted-foreground")} onClick={onClose} disabled={pending}>
            {t("cancel")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
