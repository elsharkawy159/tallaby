"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Facebook, LoaderCircle, MessageCircle } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";
import { formatMoney } from "@/lib/i18n/format";
import { requestWithdrawal } from "./earn.server";

/** The share link with Copy, WhatsApp and Facebook (F-37). */
export function ReferralLinkCard({ url, code }: { url: string; code: string }) {
  const t = useTranslations("earn.link");
  const shareText = t("shareText", { url });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("copied"));
    } catch {
      toast.error(url);
    }
  };

  const shareClass = "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-muted";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={url} dir="ltr" className="font-mono text-sm" onFocus={(e) => e.currentTarget.select()} />
          <Button type="button" onClick={copy} className="shrink-0">
            <Copy className="size-4" aria-hidden />
            {t("copy")}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a className={shareClass} href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">
            <MessageCircle className="size-4" aria-hidden />
            {t("whatsapp")}
          </a>
          <a
            className={shareClass}
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Facebook className="size-4" aria-hidden />
            {t("facebook")}
          </a>
          <span className="text-sm text-muted-foreground" dir="auto">
            {t("code", { code })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </CardContent>
    </Card>
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
      <Button type="button" disabled={disabled} onClick={() => setOpen(true)}>
        {t("button")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
            <DialogDescription>{t("dialogDescription", { amount: amountLabel })}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t("method")}</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["vodafone_cash", "bank"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={method === m}
                    onClick={() => setMethod(m)}
                    className={cn(
                      "rounded-md border p-3 text-sm",
                      method === m ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted",
                    )}
                  >
                    {t(m)}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="space-y-1.5">
              <Label htmlFor="holderName">{t("holderName")}</Label>
              <Input id="holderName" required minLength={2} maxLength={100} value={form.holderName} onChange={set("holderName")} />
            </div>
            {method === "bank" ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="bankName">{t("bankName")}</Label>
                  <Input id="bankName" required minLength={2} maxLength={100} value={form.bankName} onChange={set("bankName")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="accountNumber">{t("accountNumber")}</Label>
                  <Input
                    id="accountNumber"
                    required
                    dir="ltr"
                    maxLength={40}
                    value={form.accountNumber}
                    onChange={set("accountNumber")}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input id="phone" required dir="ltr" inputMode="tel" maxLength={20} value={form.phone} onChange={set("phone")} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
                {t("submit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
