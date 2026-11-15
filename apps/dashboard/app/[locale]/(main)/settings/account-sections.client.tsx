"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Landmark, LoaderCircle, Pencil, Save, Store, Wallet } from "lucide-react";

import { EGYPT_GOVERNORATES, getGovernorateLabel } from "@workspace/lib/shipping";
import {
  BUSINESS_TYPES,
  MOBILE_WALLET_PROVIDERS,
  type MaskedPayoutDetails,
  type PayoutMethod,
} from "@workspace/lib/sellers";
import type { SellerAccountView } from "@workspace/lib/sellers/server";
import { Field, IconTile, NativeSelect, Note, SectionCard, SellerButton, SellerCard, TextInput } from "@/components/seller-ui";
import { saveLegalDetails, savePayoutDetails } from "./account.server";

const LTR_INPUT = "font-montserrat rtl:text-end";

/** Points sellers to where the store fields moved (Store settings). */
export function StoreDetailsMovedCard({ storeId }: { storeId: string | null }) {
  const t = useTranslations("settings.account");
  if (!storeId) return null;
  return (
    <SellerCard>
      <Link href={`/stores/${storeId}/settings`} className="group flex items-center gap-3.5 rounded-[inherit] px-6 py-[18px] max-[720px]:gap-2.5 max-[720px]:px-4">
        <IconTile icon={Store} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15.5px] font-bold text-(--s-ink)">{t("moved.title")}</h2>
          <p className="mt-0.5 text-[13px] text-(--s-subtle)">{t("moved.description")}</p>
        </div>
        <ArrowLeft className="size-[18px] shrink-0 text-(--s-faint) transition-transform ltr:rotate-180" aria-hidden />
      </Link>
    </SellerCard>
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
        <div className="grid grid-cols-2 gap-3 max-[720px]:grid-cols-1">
          <Field label={t("legal.businessType")} htmlFor="businessType">
            <NativeSelect id="businessType" disabled={isPending} {...form.register("businessType")}>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`businessTypes.${type}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("legal.governorate")} htmlFor="state">
            <NativeSelect id="state" disabled={isPending} {...form.register("state", { required: true })}>
              <option value="" disabled>
                {t("legal.governoratePlaceholder")}
              </option>
              {EGYPT_GOVERNORATES.map((code) => (
                <option key={code} value={code}>
                  {getGovernorateLabel(code, locale)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("legal.city")} htmlFor="city">
            <TextInput id="city" disabled={isPending} {...form.register("city", { required: true })} />
          </Field>
          <Field label={t("legal.postalCode")} htmlFor="postalCode">
            <TextInput id="postalCode" dir="ltr" className={LTR_INPUT} disabled={isPending} {...form.register("postalCode")} />
          </Field>
        </div>
        <Field label={t("legal.street")} htmlFor="street" note={t("legal.hint")} error={error}>
          <TextInput id="street" disabled={isPending} placeholder={t("legal.streetPlaceholder")} {...form.register("street", { required: true })} />
        </Field>
        <div className="flex justify-end">
          <SellerButton type="submit" variant="solid" disabled={isPending || !form.formState.isDirty}>
            {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            {t("save")}
          </SellerButton>
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--s-line) bg-(--s-tint) px-3.5 py-3">
          <div className="min-w-0">
            <b className="block text-sm font-bold text-(--s-text)">{t(`payout.methods.${payout.method}`)}</b>
            <small className="block text-xs text-(--s-subtle)">
              {payout.accountHolder}
              {" · "}
              {payout.method === "bank_transfer" && payout.bankName + " · "}
              {payout.method === "mobile_wallet" && t(`payout.providers.${payout.provider}`) + " · "}
              <bdi dir="ltr" className="font-montserrat">
                •••• {payout.last4}
              </bdi>
            </small>
          </div>
          <SellerButton variant="mini" size="xs" onClick={() => setEditing(true)}>
            <Pencil aria-hidden />
            {t("payout.change")}
          </SellerButton>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-2 gap-3 max-[720px]:grid-cols-1">
            <Field label={t("payout.method")} htmlFor="payoutMethod">
              <NativeSelect id="payoutMethod" disabled={isPending} {...form.register("method")}>
                {(["instapay", "mobile_wallet", "bank_transfer"] as const).map((m) => (
                  <option key={m} value={m}>
                    {t(`payout.methods.${m}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("payout.accountHolder")} htmlFor="accountHolder">
              <TextInput id="accountHolder" disabled={isPending} {...form.register("accountHolder", { required: true })} />
            </Field>
            {method === "bank_transfer" && (
              <>
                <Field label={t("payout.bankName")} htmlFor="bankName">
                  <TextInput id="bankName" disabled={isPending} {...form.register("bankName")} />
                </Field>
                <Field label={t("payout.iban")} htmlFor="iban">
                  <TextInput id="iban" dir="ltr" autoComplete="off" placeholder="EG00 0000 0000 0000 0000 0000 0000 0" className={LTR_INPUT} disabled={isPending} {...form.register("iban")} />
                </Field>
              </>
            )}
            {method === "mobile_wallet" && (
              <>
                <Field label={t("payout.provider")} htmlFor="provider">
                  <NativeSelect id="provider" disabled={isPending} {...form.register("provider")}>
                    {MOBILE_WALLET_PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {t(`payout.providers.${p}`)}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label={t("payout.phone")} htmlFor="walletPhone">
                  <TextInput id="walletPhone" type="tel" dir="ltr" autoComplete="off" placeholder="01xxxxxxxxx" className={LTR_INPUT} disabled={isPending} {...form.register("phone")} />
                </Field>
              </>
            )}
            {method === "instapay" && (
              <Field label={t("payout.address")} htmlFor="instapay" className="col-span-full">
                <TextInput id="instapay" dir="ltr" autoComplete="off" placeholder="name@instapay" className={LTR_INPUT} disabled={isPending} {...form.register("address")} />
              </Field>
            )}
          </div>
          <p className="text-pretty text-xs text-(--s-faint)">{t("payout.hint")}</p>
          {error && (
            <Note tone="danger">
              <span role="alert">{error}</span>
            </Note>
          )}
          <div className="flex justify-end gap-2">
            {payout && (
              <SellerButton variant="outline" onClick={() => setEditing(false)} disabled={isPending}>
                {t("cancel")}
              </SellerButton>
            )}
            <SellerButton type="submit" variant="solid" disabled={isPending}>
              {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Save aria-hidden />}
              {t("save")}
            </SellerButton>
          </div>
        </form>
      )}
    </SectionCard>
  );
}
