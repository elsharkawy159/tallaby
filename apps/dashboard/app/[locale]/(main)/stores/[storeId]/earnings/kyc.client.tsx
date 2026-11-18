"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BadgeCheck, Clock, IdCard, Info, LoaderCircle, ShieldAlert } from "lucide-react";

import {
  TALLABY_PAY_KYC_ID_TYPES,
  tallabyPayKycSchema,
  type TallabyPayKycIdType,
  type TallabyPayKycStatus,
} from "@workspace/lib/tallaby-pay";
import { useRouter } from "@/i18n/navigation";
import { Field, Note, OptionCard, OptionCards, SectionCard, SellerButton, Tag, TextInput } from "@/components/seller-ui";
import { submitTallabyPayKycAction } from "./earnings.server";

type FieldName = "legalName" | "idNumber";

/**
 * The account's identity check before the first withdrawal (owner
 * 2026-11-18, design §14 Q6). It belongs to the seller account, so one check
 * covers every store. A Tallaby admin verifies or rejects it.
 */
export function KycCard({
  storeId,
  status,
  legalName,
  idType,
  rejectionReason,
}: {
  storeId: string;
  status: TallabyPayKycStatus | null;
  legalName: string | null;
  idType: TallabyPayKycIdType | null;
  rejectionReason: string | null;
}) {
  const t = useTranslations("tallabyPayEarnings.kyc");
  const tErrors = useTranslations("tallabyPayEarnings.errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(legalName ?? "");
  const [type, setType] = useState<TallabyPayKycIdType>(idType ?? "national_id");
  const [idNumber, setIdNumber] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (status === "verified") {
    return (
      <SectionCard
        icon={BadgeCheck}
        tone="success"
        title={
          <>
            {t("title")}
            <Tag tone="success">{t("status.verified")}</Tag>
          </>
        }
        description={t("verifiedDescription", { name: legalName ?? "" })}
      />
    );
  }

  if (status === "submitted") {
    return (
      <SectionCard
        icon={Clock}
        tone="accent"
        title={
          <>
            {t("title")}
            <Tag tone="warning">{t("status.submitted")}</Tag>
          </>
        }
        description={t("submittedDescription", { name: legalName ?? "" })}
      />
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const input = { legalName: name, idType: type, idNumber };
    const parsed = tallabyPayKycSchema.safeParse(input);
    if (!parsed.success) {
      const next: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "legalName") next.legalName = t("fieldErrors.legalName");
        else next.idNumber = t(type === "national_id" ? "fieldErrors.nationalId" : "fieldErrors.commercialRegister");
      }
      setErrors(next);
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await submitTallabyPayKycAction(storeId, input);
      if (result.success) {
        setIdNumber("");
        toast.success(t("submitted"));
        router.refresh();
      } else {
        setFormError(tErrors(result.error, { minimum: "", max: "" }));
      }
    });
  };

  return (
    <SectionCard
      id="kyc"
      icon={status === "rejected" ? ShieldAlert : IdCard}
      tone={status === "rejected" ? "danger" : "primary"}
      title={
        <>
          {t("title")}
          {status === "rejected" ? <Tag tone="danger">{t("status.rejected")}</Tag> : <Tag tone="muted">{t("status.required")}</Tag>}
        </>
      }
      description={t("description")}
    >
      {status === "rejected" && (
        <Note tone="danger" icon={Info}>
          {rejectionReason ? t("rejectedWithReason", { reason: rejectionReason }) : t("rejected")}
        </Note>
      )}
      <form onSubmit={submit} noValidate>
        <fieldset disabled={pending} className="flex flex-col gap-4">
          <legend className="sr-only">{t("title")}</legend>
          <Field label={t("fields.legalName")} htmlFor="kyc-legal-name" note={t("legalNameNote")} error={errors.legalName} required>
            <TextInput
              id="kyc-legal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={200}
              aria-invalid={errors.legalName ? true : undefined}
              data-clarity-mask="true"
            />
          </Field>
          <OptionCards role="radiogroup" aria-label={t("fields.idType")} className="grid-cols-1">
            {TALLABY_PAY_KYC_ID_TYPES.map((value) => (
              <OptionCard
                key={value}
                name="kyc-id-type"
                value={value}
                checked={type === value}
                onChange={() => {
                  setType(value);
                  setErrors({});
                }}
                title={t(`idTypes.${value}`)}
              />
            ))}
          </OptionCards>
          <Field
            label={t(type === "national_id" ? "fields.nationalId" : "fields.commercialRegister")}
            htmlFor="kyc-id-number"
            error={errors.idNumber}
            required
          >
            <TextInput
              id="kyc-id-number"
              dir="ltr"
              inputMode={type === "national_id" ? "numeric" : "text"}
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              maxLength={80}
              autoComplete="off"
              aria-invalid={errors.idNumber ? true : undefined}
              data-clarity-mask="true"
              className="font-montserrat tabular-nums"
            />
          </Field>
          {formError && (
            <Note tone="danger" icon={Info}>
              <span role="alert">{formError}</span>
            </Note>
          )}
          <SellerButton type="submit" variant="solid" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <IdCard aria-hidden />}
            {t("submit")}
          </SellerButton>
          <p className="text-pretty text-xs leading-[1.7] text-(--s-subtle)">{t("privacy")}</p>
        </fieldset>
      </form>
    </SectionCard>
  );
}
