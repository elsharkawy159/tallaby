"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Landmark, LoaderCircle, Pencil, Save, Store, Wallet } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { EGYPT_GOVERNORATES, getGovernorateLabel } from "@workspace/lib/shipping";
import {
  BUSINESS_TYPES,
  MOBILE_WALLET_PROVIDERS,
  type MaskedPayoutDetails,
  type PayoutMethod,
} from "@workspace/lib/sellers";
import type { SellerAccountView } from "@workspace/lib/sellers/server";
import { BUTTON_CLASS, FIELD_CLASS, FieldError, FieldHint, SectionCard, SectionIcon } from "./settings-ui";
import { saveLegalDetails, savePayoutDetails } from "./account.server";

const SELECT_CLASS = `${FIELD_CLASS} w-full appearance-none bg-background`;

/** Points sellers to where the store fields moved (Store settings). */
export function StoreDetailsMovedCard({ storeId }: { storeId: string | null }) {
  const t = useTranslations("settings.account");
  if (!storeId) return null;
  return (
    <Card className="gap-0 rounded-2xl p-0 dark:shadow-none">
      <Link
        href={`/stores/${storeId}/settings`}
        className="group flex items-center gap-3.5 rounded-2xl p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 sm:px-6 sm:py-5"
      >
        <SectionIcon icon={Store} />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold">{t("moved.title")}</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t("moved.description")}</p>
        </div>
        <ArrowLeft className="size-[18px] shrink-0 text-faint transition-transform ltr:rotate-180" />
      </Link>
    </Card>
  );
}

type LegalValues = {
  businessType: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
};

export function LegalDetailsSection({ account }: { account: SellerAccountView }) {
  const t = useTranslations("settings.account");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LegalValues>({
    defaultValues: {
      businessType: account.businessType ?? "individual",
      street: account.legalAddress.street ?? "",
      city: account.legalAddress.city ?? "",
      state: account.legalAddress.state ?? "",
      postalCode: account.legalAddress.postalCode ?? "",
    },
  });

  const onSubmit = (v: LegalValues) =>
    startTransition(async () => {
      setError(null);
      const result = await saveLegalDetails({
        businessType: v.businessType,
        legalAddress: {
          street: v.street,
          city: v.city,
          state: v.state,
          ...(v.postalCode.trim() && { postalCode: v.postalCode }),
          country: "EG",
        },
      });
      if (result.success) {
        toast.success(t("saved"));
        form.reset(v);
        router.refresh();
      } else {
        setError(t(`errors.${result.error}`));
      }
    });

  return (
    <SectionCard id="legal" icon={Landmark} title={t("legal.title")} description={t("legal.description")}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="businessType" className="text-[13px] font-semibold">{t("legal.businessType")}</Label>
            <select id="businessType" className={SELECT_CLASS} disabled={isPending} {...form.register("businessType")}>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`businessTypes.${type}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="state" className="text-[13px] font-semibold">{t("legal.governorate")}</Label>
            <select id="state" className={SELECT_CLASS} disabled={isPending} {...form.register("state", { required: true })}>
              <option value="" disabled>
                {t("legal.governoratePlaceholder")}
              </option>
              {EGYPT_GOVERNORATES.map((code) => (
                <option key={code} value={code}>
                  {getGovernorateLabel(code, locale)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city" className="text-[13px] font-semibold">{t("legal.city")}</Label>
            <Input id="city" className={FIELD_CLASS} disabled={isPending} {...form.register("city", { required: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="postalCode" className="text-[13px] font-semibold">{t("legal.postalCode")}</Label>
            <Input id="postalCode" dir="ltr" className={FIELD_CLASS} disabled={isPending} {...form.register("postalCode")} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="street" className="text-[13px] font-semibold">{t("legal.street")}</Label>
          <Input id="street" className={FIELD_CLASS} disabled={isPending} placeholder={t("legal.streetPlaceholder")} {...form.register("street", { required: true })} />
        </div>
        <FieldHint>{t("legal.hint")}</FieldHint>
        <FieldError>{error}</FieldError>
        <div className="flex justify-end">
          <Button type="submit" className={BUTTON_CLASS} disabled={isPending || !form.formState.isDirty}>
            {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
            {t("save")}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

type PayoutValues = {
  method: PayoutMethod;
  accountHolder: string;
  bankName: string;
  iban: string;
  provider: string;
  phone: string;
  address: string;
};

/**
 * Preferred payout account. Saved details are only ever shown masked (last 4);
 * changing them means entering the full details again.
 */
export function PayoutDetailsSection({ payout }: { payout: MaskedPayoutDetails | null }) {
  const t = useTranslations("settings.account");
  const router = useRouter();
  const [editing, setEditing] = useState(payout === null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<PayoutValues>({
    defaultValues: {
      method: payout?.method ?? "instapay",
      accountHolder: payout?.accountHolder ?? "",
      bankName: "",
      iban: "",
      provider: "vodafone_cash",
      phone: "",
      address: "",
    },
  });
  const method = form.watch("method");

  const onSubmit = (v: PayoutValues) =>
    startTransition(async () => {
      setError(null);
      const details =
        v.method === "bank_transfer"
          ? { method: v.method, accountHolder: v.accountHolder, bankName: v.bankName, iban: v.iban }
          : v.method === "mobile_wallet"
            ? { method: v.method, accountHolder: v.accountHolder, provider: v.provider, phone: v.phone }
            : { method: v.method, accountHolder: v.accountHolder, address: v.address };
      const result = await savePayoutDetails(details);
      if (result.success) {
        toast.success(t("saved"));
        setEditing(false);
        router.refresh();
      } else {
        setError(t(`errors.${result.error}`));
      }
    });

  return (
    <SectionCard id="payout" icon={Wallet} title={t("payout.title")} description={t("payout.description")}>
      {!editing && payout ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t(`payout.methods.${payout.method}`)}</p>
            <p className="text-[13px] text-muted-foreground">
              {payout.accountHolder}
              {" · "}
              {payout.method === "bank_transfer" && payout.bankName + " · "}
              {payout.method === "mobile_wallet" && t(`payout.providers.${payout.provider}`) + " · "}
              <span dir="ltr" className="font-mono">•••• {payout.last4}</span>
            </p>
          </div>
          <Button type="button" variant="neutral" onClick={() => setEditing(true)}>
            <Pencil />
            {t("payout.change")}
          </Button>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payoutMethod" className="text-[13px] font-semibold">{t("payout.method")}</Label>
              <select id="payoutMethod" className={SELECT_CLASS} disabled={isPending} {...form.register("method")}>
                {(["instapay", "mobile_wallet", "bank_transfer"] as const).map((m) => (
                  <option key={m} value={m}>
                    {t(`payout.methods.${m}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="accountHolder" className="text-[13px] font-semibold">{t("payout.accountHolder")}</Label>
              <Input id="accountHolder" className={FIELD_CLASS} disabled={isPending} {...form.register("accountHolder", { required: true })} />
            </div>
            {method === "bank_transfer" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bankName" className="text-[13px] font-semibold">{t("payout.bankName")}</Label>
                  <Input id="bankName" className={FIELD_CLASS} disabled={isPending} {...form.register("bankName")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="iban" className="text-[13px] font-semibold">{t("payout.iban")}</Label>
                  <Input id="iban" dir="ltr" autoComplete="off" placeholder="EG00 0000 0000 0000 0000 0000 0000 0" className={FIELD_CLASS} disabled={isPending} {...form.register("iban")} />
                </div>
              </>
            )}
            {method === "mobile_wallet" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="provider" className="text-[13px] font-semibold">{t("payout.provider")}</Label>
                  <select id="provider" className={SELECT_CLASS} disabled={isPending} {...form.register("provider")}>
                    {MOBILE_WALLET_PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {t(`payout.providers.${p}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="walletPhone" className="text-[13px] font-semibold">{t("payout.phone")}</Label>
                  <Input id="walletPhone" type="tel" dir="ltr" autoComplete="off" placeholder="01xxxxxxxxx" className={FIELD_CLASS} disabled={isPending} {...form.register("phone")} />
                </div>
              </>
            )}
            {method === "instapay" && (
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="instapay" className="text-[13px] font-semibold">{t("payout.address")}</Label>
                <Input id="instapay" dir="ltr" autoComplete="off" placeholder="name@instapay" className={FIELD_CLASS} disabled={isPending} {...form.register("address")} />
              </div>
            )}
          </div>
          <FieldHint>{t("payout.hint")}</FieldHint>
          <FieldError>{error}</FieldError>
          <div className="flex justify-end gap-2">
            {payout && (
              <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={isPending}>
                {t("cancel")}
              </Button>
            )}
            <Button type="submit" className={BUTTON_CLASS} disabled={isPending}>
              {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
              {t("save")}
            </Button>
          </div>
        </form>
      )}
    </SectionCard>
  );
}
