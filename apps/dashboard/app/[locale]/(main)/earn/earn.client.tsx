"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDownToLine, Copy, Facebook, Link2, LoaderCircle, MessageCircle } from "lucide-react";
import { Field, Modal, OptionCard, OptionCards, SectionCard, SellerButton, TextInput } from "@/components/seller-ui";
import { formatMoney } from "@/lib/i18n/format";
import { requestWithdrawal } from "./earn.server";

/** Copies text, with the text itself in the toast when the browser refuses. */
function useCopy() {
  return async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error(value);
    }
  };
}

/** "Copy your link" on the empty referrals list. */
export function CopyLinkButton({ url }: { url: string }) {
  const t = useTranslations("earn.link");
  const copy = useCopy();
  return (
    <SellerButton variant="solid" size="sm" onClick={() => void copy(url, t("copied"))}>
      <Copy aria-hidden />
      {t("copy")}
    </SellerButton>
  );
}

/** The share link with Copy, WhatsApp and Facebook (F-37). */
export function ReferralLinkCard({ url, code }: { url: string; code: string }) {
  const t = useTranslations("earn.link");
  const tSetup = useTranslations("storeSetup");
  const shareText = t("shareText", { url });
  const copy = useCopy();

  return (
    <SectionCard icon={Link2} title={t("title")} description={t("hint")}>
      <div className="flex flex-wrap items-center gap-2">
        <TextInput
          readOnly
          value={url}
          dir="ltr"
          aria-label={t("title")}
          className="min-w-[220px] flex-1 font-montserrat text-sm font-semibold"
          onFocus={(e) => e.currentTarget.select()}
        />
        <SellerButton size="sm" className="max-[600px]:w-full" onClick={() => void copy(url, t("copied"))}>
          <Copy aria-hidden />
          {t("copy")}
        </SellerButton>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-(--s-faint)">{tSetup("shareOn")}</span>
        <SellerButton variant="mini" size="xs" asChild>
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">
            <MessageCircle aria-hidden />
            {t("whatsapp")}
          </a>
        </SellerButton>
        <SellerButton variant="mini" size="xs" asChild>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">
            <Facebook aria-hidden />
            {t("facebook")}
          </a>
        </SellerButton>
        <span className="ms-auto text-xs text-(--s-faint)">{t("code", { code })}</span>
        <SellerButton variant="mini" size="xs" onClick={() => void copy(code, tSetup("codeCopied"))}>
          <Copy aria-hidden />
          {tSetup("copyCode")}
        </SellerButton>
      </div>
    </SectionCard>
  );
}

type Method = "vodafone_cash" | "bank";

/** "Request withdrawal": the whole available balance, to a bank account or Vodafone Cash. */
export function WithdrawButton({ disabled, amountLabel }: { disabled: boolean; amountLabel: string }) {
  const t = useTranslations("earn.withdraw");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<Method>("vodafone_cash");
  const [form, setForm] = useState({ holderName: "", bankName: "", accountNumber: "", phone: "" });
  const [pending, startTransition] = useTransition();

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input =
      method === "bank"
        ? { method, holderName: form.holderName, bankName: form.bankName, accountNumber: form.accountNumber }
        : { method, holderName: form.holderName, phone: form.phone };
    startTransition(async () => {
      const result = await requestWithdrawal(input);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("success", { amount: formatMoney(result.amount, locale) }));
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <SellerButton size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        <ArrowDownToLine aria-hidden />
        {t("button")}
      </SellerButton>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={t("dialogTitle")}
        description={t("dialogDescription", { amount: amountLabel })}
        footer={
          <>
            <SellerButton variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              {t("cancel")}
            </SellerButton>
            <SellerButton type="submit" form="withdraw-form" disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" aria-hidden />}
              {t("submit")}
            </SellerButton>
          </>
        }
      >
        <form id="withdraw-form" onSubmit={submit} className="flex flex-col gap-3.5">
          <Field label={t("method")}>
            <OptionCards className="grid-cols-2">
              {(["vodafone_cash", "bank"] as const).map((m) => (
                <OptionCard key={m} name="withdraw-method" title={t(m)} checked={method === m} onChange={() => setMethod(m)} />
              ))}
            </OptionCards>
          </Field>
          <Field label={t("holderName")} htmlFor="holderName">
            <TextInput id="holderName" required minLength={2} maxLength={100} value={form.holderName} onChange={set("holderName")} />
          </Field>
          {method === "bank" ? (
            <>
              <Field label={t("bankName")} htmlFor="bankName">
                <TextInput id="bankName" required minLength={2} maxLength={100} value={form.bankName} onChange={set("bankName")} />
              </Field>
              <Field label={t("accountNumber")} htmlFor="accountNumber">
                <TextInput id="accountNumber" required dir="ltr" maxLength={40} className="font-montserrat" value={form.accountNumber} onChange={set("accountNumber")} />
              </Field>
            </>
          ) : (
            <Field label={t("phone")} htmlFor="phone">
              <TextInput id="phone" required dir="ltr" inputMode="tel" maxLength={20} className="font-montserrat" value={form.phone} onChange={set("phone")} />
            </Field>
          )}
        </form>
      </Modal>
    </>
  );
}
