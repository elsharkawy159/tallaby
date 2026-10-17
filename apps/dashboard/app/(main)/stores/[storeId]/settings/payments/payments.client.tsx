"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Banknote, Clock, Info, LoaderCircle, Pencil, Save, TriangleAlert, Wallet } from "lucide-react";

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
import { BUTTON_CLASS, FIELD_CLASS, LabelNote, SectionCard, TEXTAREA_CLASS } from "@/components/form/form-ui";
import { PaymentMethodLogo } from "@/components/payments/payment-method-logo";
import { cn } from "@/lib/utils";
import { saveStorePaymentMethod } from "./payments.server";
import { toDetails, type PaymentDetailsFormValues } from "./payments.dto";

type LiveKey = "cod" | "vodafone_cash" | "e_cash" | "we_pay" | "orange_cash" | "instapay";
type Entry = { enabled: boolean; details?: Record<string, string>; fee?: number; note?: string };

const LIVE = STORE_PAYMENT_METHODS.filter((m) => m.status === "live");
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

export function StorePaymentsSettings({
  storeId,
  storeName,
  initial,
  readOnly,
}: {
  storeId: string;
  storeName: string;
  initial: StorePayments;
  readOnly: boolean;
}) {
  const t = useTranslations("storePayments");
  const router = useRouter();
  const [payments, setPayments] = useState<StorePayments>(initial);
  const [editing, setEditing] = useState<LiveKey | null>(null);
  const [isPending, startTransition] = useTransition();
  const entry = (key: LiveKey) => payments[key] as Entry | undefined;

  const save = (key: LiveKey, change: { enabled: boolean; details?: unknown; fee?: number; note?: string }, onDone?: () => void) =>
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
    if (on && key !== "cod" && !entry(key)?.details) {
      setEditing(key);
      return;
    }
    save(key, { enabled: on });
  };

  return (
    <div className="space-y-5">
      {readOnly && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}
      <p className="flex gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>{t("checkoutNotice")}</span>
      </p>

      <SectionCard id="payments-live" icon={Wallet} title={t("liveTitle")} description={t("liveDescription")}>
        <ul className="divide-y">
          {LIVE.map((m) => {
            const key = m.key as LiveKey;
            const e = entry(key);
            const label = t(`methods.${key}.name`);
            return (
              <li key={key} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                <PaymentMethodLogo method={key} label={label} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{t(`methods.${key}.description`)}</p>
                  <DetailsSummary methodKey={key} entry={e} />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-[34px] rounded-[10px] rtl:flex-row"
                    disabled={readOnly || isPending}
                    onClick={() => setEditing(key)}
                  >
                    <Pencil />
                    {key === "cod" || e?.details ? t("edit") : t("setUp")}
                  </Button>
                  <Switch
                    checked={!!e?.enabled}
                    disabled={readOnly || isPending}
                    onCheckedChange={(on) => toggle(key, on)}
                    aria-label={t("toggle", { method: label })}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard id="payments-soon" icon={Clock} title={t("soonTitle")} description={t("soonDescription")}>
        <ul className="grid gap-3 sm:grid-cols-2">
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
      </SectionCard>

      {editing && (
        <MethodSheet
          key={editing}
          methodKey={editing}
          entry={entry(editing)}
          storeName={storeName}
          pending={isPending}
          onClose={() => setEditing(null)}
          onSave={(change) => save(editing, change, () => setEditing(null))}
        />
      )}
    </div>
  );
}

function DetailsSummary({ methodKey, entry }: { methodKey: LiveKey; entry?: Entry }) {
  const t = useTranslations("storePayments");
  if (methodKey === "cod") {
    return entry?.fee ? <LabelNote>{t("codFeeSummary", { fee: entry.fee })}</LabelNote> : null;
  }
  const d = entry?.details;
  if (!d) return <LabelNote>{t("notSetUp")}</LabelNote>;
  const id = d.ipa ?? d.phone ?? (d.iban ? `•••${d.iban.slice(-4)}` : "");
  return (
    <LabelNote>
      {d.holderName} · <span dir="ltr">{id}</span>
    </LabelNote>
  );
}

function MethodSheet({
  methodKey,
  entry,
  storeName,
  pending,
  onClose,
  onSave,
}: {
  methodKey: LiveKey;
  entry?: Entry;
  storeName: string;
  pending: boolean;
  onClose: () => void;
  onSave: (change: { enabled: boolean; details?: unknown; fee?: number; note?: string }) => void;
}) {
  const t = useTranslations("storePayments");
  const locale = useLocale();
  const label = t(`methods.${methodKey}.name`);
  const kind = methodKey === "cod" ? "cod" : methodKey === "instapay" ? "instapay" : "wallet";
  const [values, setValues] = useState<PaymentDetailsFormValues>({ ...EMPTY, ...(entry?.details ?? {}) });
  const [fee, setFee] = useState(String(entry?.fee ?? 0));
  const [note, setNote] = useState(entry?.note ?? "");
  const [submitted, setSubmitted] = useState(false);

  const errors = kind === "cod" ? {} : fieldErrors(kind, values);
  const codValid = codSettingsSchema.safeParse({ enabled: true, fee: Number(fee), ...(note.trim() && { note: note.trim() }) }).success;
  const hint = kind !== "cod" && values.phone ? operatorHint(values.phone) : null;
  const hintMismatch = kind === "wallet" && hint && hint !== methodKey;
  // Saving details turns the method on; it can be switched off from the list.
  const enabled = methodKey === "cod" ? (entry?.enabled ?? true) : true;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (kind === "cod") {
      if (codValid) onSave({ enabled, fee: Number(fee), note: note.trim() });
      return;
    }
    if (Object.keys(errors).length === 0) onSave({ enabled, details: toDetails(kind, values) });
  };

  const field = (name: keyof PaymentDetailsFormValues, opts: { ltr?: boolean; placeholder?: string; inputMode?: "tel" | "email" | "url" } = {}) => {
    const error = submitted ? errors[name] : undefined;
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={`pm-${name}`}>{t(`fields.${name}`)}</Label>
        <Input
          id={`pm-${name}`}
          className={cn(FIELD_CLASS, opts.ltr && "text-start", error && "border-destructive")}
          dir={opts.ltr ? "ltr" : undefined}
          inputMode={opts.inputMode}
          placeholder={opts.placeholder}
          value={values[name]}
          aria-invalid={!!error}
          onChange={(ev) => setValues((v) => ({ ...v, [name]: ev.target.value }))}
        />
        {error && <p className="text-sm text-destructive">{t(`fieldErrors.${error}`)}</p>}
      </div>
    );
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={locale.startsWith("ar") ? "left" : "right"} className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <PaymentMethodLogo method={methodKey} label={label} className="size-9" />
            <SheetTitle>{label}</SheetTitle>
          </div>
          <SheetDescription>{t(`methods.${methodKey}.setupHelp`)}</SheetDescription>
        </SheetHeader>

        <form id="pm-form" onSubmit={submit} noValidate className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {kind === "cod" ? (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="pm-fee">{t("fields.codFee")}</Label>
                <Input
                  id="pm-fee"
                  type="number"
                  min={0}
                  max={500}
                  step={1}
                  dir="ltr"
                  className={cn(FIELD_CLASS, submitted && !codValid && "border-destructive")}
                  value={fee}
                  onChange={(ev) => setFee(ev.target.value)}
                />
                <LabelNote>{t("fields.codFeeHelp")}</LabelNote>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pm-note">{t("fields.note")}</Label>
                <Textarea id="pm-note" className={TEXTAREA_CLASS} maxLength={300} value={note} onChange={(ev) => setNote(ev.target.value)} />
              </div>
              {submitted && !codValid && <p className="text-sm text-destructive">{t("fieldErrors.codInvalid")}</p>}
            </>
          ) : (
            <>
              {field("holderName")}
              {kind === "wallet" && field("phone", { ltr: true, inputMode: "tel", placeholder: "01XXXXXXXXX" })}
              {kind === "instapay" && (
                <>
                  <p className="text-sm text-muted-foreground">{t("instapayIdentifiers")}</p>
                  {field("ipa", { ltr: true, inputMode: "email", placeholder: "name@instapay" })}
                  {field("phone", { ltr: true, inputMode: "tel", placeholder: "01XXXXXXXXX" })}
                  {field("iban", { ltr: true, placeholder: "EG00 0000 0000 0000 0000 0000 0000 0" })}
                  {field("paymentLink", { ltr: true, inputMode: "url", placeholder: "https://ipn.eg/…" })}
                </>
              )}
              {hintMismatch && (
                <p className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
                  {t("operatorHint", { operator: t(`methods.${hint}.name`), method: label })}
                </p>
              )}
              <Preview label={label} storeName={storeName} values={values} kind={kind} />
            </>
          )}
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" className={BUTTON_CLASS} onClick={onClose} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="pm-form" className={BUTTON_CLASS} disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
            {kind === "cod" || entry?.enabled ? t("save") : t("saveAndEnable")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** What the customer will be shown at checkout (once store checkout uses it). */
function Preview({
  label,
  storeName,
  values,
  kind,
}: {
  label: string;
  storeName: string;
  values: PaymentDetailsFormValues;
  kind: "wallet" | "instapay";
}) {
  const t = useTranslations("storePayments");
  const rows = (kind === "wallet" ? (["phone"] as const) : (["ipa", "phone", "iban"] as const)).filter((k) => values[k].trim());
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Banknote className="size-3.5" aria-hidden />
        {t("previewTitle")}
      </p>
      <p className="text-sm">{t("previewBody", { method: label, store: storeName })}</p>
      <dl className="mt-2 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted-foreground">{t("fields.holderName")}:</dt>
          <dd className="font-medium">{values.holderName.trim() || "—"}</dd>
        </div>
        {rows.map((k) => (
          <div key={k} className="flex gap-2">
            <dt className="text-muted-foreground">{t(`fields.${k}`)}:</dt>
            <dd dir="ltr" className="font-medium">
              {values[k].trim()}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
