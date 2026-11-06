"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, Trash2 } from "lucide-react";

import {
  ACCOUNT_DELETION_DAYS,
  ACCOUNT_DELETION_PUBLIC_PATH,
  ACCOUNT_DELETION_REASON_MAX,
  ACCOUNT_DELETION_SUPPORT_EMAIL,
} from "@workspace/lib/account-deletion";
import { CheckRow, Field, Note, SectionCard, SellerButton, TextArea } from "@/components/seller-ui";
import { closeAccountAction } from "./account-deletion.server";

/**
 * Settings › Delete my account (ROADMAP.md F-82). Google Play asks every app
 * with sign-up for this. The account closes at once and the seller is signed
 * out; the data is kept 30 days (restore by email), then deleted. The wallet
 * balance is lost.
 */
export function AccountDeletionSection() {
  const t = useTranslations("accountDeletion");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, startPending] = useTransition();

  const submit = () =>
    startPending(async () => {
      // On success the action redirects to the public page and never returns.
      const result = await closeAccountAction({ reason, confirmed });
      if (result && !result.success) toast.error(t(`errors.${result.error}`));
    });

  return (
    <SectionCard
      id="delete-account"
      icon={Trash2}
      tone="danger"
      title={t("title")}
      description={t("description", { days: ACCOUNT_DELETION_DAYS })}
    >
      <div className="flex flex-col gap-4">
        <ul className="list-disc ps-5 text-[13.5px] leading-6 text-(--s-body)">
          <li>{t("whatGoes.now")}</li>
          <li>{t("whatGoes.stores")}</li>
          <li>{t("whatGoes.wallet")}</li>
          <li>{t("whatGoes.restore", { days: ACCOUNT_DELETION_DAYS, email: ACCOUNT_DELETION_SUPPORT_EMAIL })}</li>
        </ul>
        {open ? (
          <div className="flex flex-col gap-3.5">
            <Field label={t("reasonLabel")} hint={t("reasonHint")}>
              <TextArea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={ACCOUNT_DELETION_REASON_MAX}
                rows={3}
                placeholder={t("reasonPlaceholder")}
              />
            </Field>
            <Note tone="danger">{t("finalNote", { days: ACCOUNT_DELETION_DAYS })}</Note>
            <CheckRow checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} label={t("confirmLabel")} />
            <div className="flex flex-wrap gap-2">
              <SellerButton type="button" variant="danger" onClick={submit} disabled={!confirmed || pending}>
                {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
                {t("submit")}
              </SellerButton>
              <SellerButton type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                {t("keep")}
              </SellerButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <SellerButton type="button" variant="danger" onClick={() => setOpen(true)}>
              <Trash2 aria-hidden />
              {t("start")}
            </SellerButton>
            <Link href={ACCOUNT_DELETION_PUBLIC_PATH} className="text-[13px] text-(--s-subtle) underline underline-offset-2">
              {t("learnMore")}
            </Link>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
