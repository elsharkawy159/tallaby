"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, Trash2, Undo2 } from "lucide-react";

import {
  ACCOUNT_DELETION_DAYS,
  ACCOUNT_DELETION_PUBLIC_PATH,
  ACCOUNT_DELETION_REASON_MAX,
  accountDeletionDueDate,
  type SellerAccountDeletionView,
} from "@workspace/lib/account-deletion";
import { CheckRow, Field, Note, SectionCard, SellerButton, StatusBadge, TextArea } from "@/components/seller-ui";
import { cancelAccountDeletionAction, requestAccountDeletionAction } from "./account-deletion.server";

/**
 * Settings › Delete my account (ROADMAP.md F-82). Google Play asks every app
 * with sign-up for this. The seller asks; the team deletes within 30 days and
 * the seller can cancel until then.
 */
export function AccountDeletionSection({ initial }: { initial: SellerAccountDeletionView | null }) {
  const t = useTranslations("accountDeletion");
  const format = useFormatter();
  const [request, setRequest] = useState<SellerAccountDeletionView | null>(initial);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, startPending] = useTransition();

  const pendingRequest = request?.status === "pending" ? request : null;
  const declined = request?.status === "declined" ? request : null;

  const submit = () =>
    startPending(async () => {
      const result = await requestAccountDeletionAction({ reason, confirmed });
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setRequest(result.request);
      setOpen(false);
      setReason("");
      setConfirmed(false);
      toast.success(t("requested"));
    });

  const cancel = () =>
    startPending(async () => {
      const result = await cancelAccountDeletionAction();
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setRequest(result.request);
      toast.success(t("cancelled"));
    });

  return (
    <SectionCard
      id="delete-account"
      icon={Trash2}
      tone="danger"
      title={
        <>
          {t("title")}
          {pendingRequest && <StatusBadge tone="warning">{t("pendingBadge")}</StatusBadge>}
        </>
      }
      description={t("description", { days: ACCOUNT_DELETION_DAYS })}
    >
      {pendingRequest ? (
        <div className="flex flex-col gap-3">
          <Note tone="amber">
            {t("pendingNote", {
              date: format.dateTime(new Date(pendingRequest.createdAt), { dateStyle: "medium" }),
              due: format.dateTime(accountDeletionDueDate(pendingRequest.createdAt), { dateStyle: "medium" }),
            })}
          </Note>
          <div>
            <SellerButton type="button" variant="outline" onClick={cancel} disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Undo2 aria-hidden />}
              {t("cancel")}
            </SellerButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {declined && (
            <Note>
              {t("declinedNote")}
              {declined.adminNote && <span className="mt-1 block whitespace-pre-line">{declined.adminNote}</span>}
            </Note>
          )}
          <ul className="list-disc ps-5 text-[13.5px] leading-6 text-(--s-body)">
            <li>{t("whatGoes.stores")}</li>
            <li>{t("whatGoes.data")}</li>
            <li>{t("whatGoes.wallet")}</li>
            <li>{t("whatGoes.final")}</li>
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
              <CheckRow
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                label={t("confirmLabel")}
              />
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
      )}
    </SectionCard>
  );
}
