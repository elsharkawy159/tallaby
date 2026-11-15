"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, LoaderCircle, ShieldCheck } from "lucide-react";

import { BLOCKED_PHONE_REASON_MAX, normalizeBlockedPhone } from "@workspace/lib/stores/blocked-phones";
import type { StoreBlockedPhone } from "@workspace/lib/stores/blocked-phones/server";
import { EmptyState, Field, Note, Row, Rows, SectionCard, SellerButton, TextInput } from "@/components/seller-ui";
import { formatDateTime } from "@/lib/i18n/format";
import { blockCustomerPhone, unblockCustomerPhone } from "./protection.server";

/**
 * Store settings › Blocked customers (ROADMAP.md F-02c): add a phone with an
 * optional private reason, see the list, unblock. The store's website checkout
 * refuses orders to a listed phone with a neutral message.
 */
export function BlockedCustomersSettings({
  storeId,
  initial,
  readOnly,
}: {
  storeId: string;
  initial: StoreBlockedPhone[];
  readOnly: boolean;
}) {
  const t = useTranslations("blockedCustomers");
  const locale = useLocale();
  const [rows, setRows] = useState(initial);
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const phoneInvalid = phone.trim() !== "" && !normalizeBlockedPhone(phone);

  const add = () => {
    if (!normalizeBlockedPhone(phone)) {
      toast.error(t("errors.phoneInvalid"));
      return;
    }
    startTransition(async () => {
      const result = await blockCustomerPhone(storeId, { phone, reason });
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setRows((prev) => [result.data, ...prev.filter((r) => r.id !== result.data.id)]);
      setPhone("");
      setReason("");
      toast.success(t("blocked"));
    });
  };

  const remove = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      const result = await unblockCustomerPhone(storeId, { id });
      setBusyId(null);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success(t("unblocked"));
    });
  };

  return (
    <SectionCard icon={Ban} tone="danger" title={t("title")} description={t("description")}>
      {readOnly && <Note tone="amber">{t("readOnly")}</Note>}
      <form
        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] items-end gap-2.5 max-[860px]:grid-cols-1"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <Field label={t("phone")} htmlFor="blocked-phone">
          <TextInput
            id="blocked-phone"
            inputMode="tel"
            dir="ltr"
            autoComplete="off"
            placeholder="01XXXXXXXXX"
            className="font-montserrat rtl:text-end"
            value={phone}
            disabled={readOnly}
            aria-invalid={phoneInvalid || undefined}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>
        <Field label={t("reason")} htmlFor="blocked-reason">
          <TextInput
            id="blocked-reason"
            placeholder={t("reasonPlaceholder")}
            maxLength={BLOCKED_PHONE_REASON_MAX}
            value={reason}
            disabled={readOnly}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <SellerButton type="submit" variant="solid" className="h-[46px]" disabled={readOnly || isPending || !phone.trim()}>
          {isPending && !busyId ? <LoaderCircle className="animate-spin" aria-hidden /> : <Ban aria-hidden />}
          {t("block")}
        </SellerButton>
      </form>
      <p className="text-pretty text-xs text-(--s-faint)">{t("hint")}</p>

      <div className="flex flex-col gap-2">
        <h3 className="text-[13.5px] font-bold text-(--s-text)">{t("listTitle", { count: rows.length })}</h3>
        <Rows>
          {rows.length === 0 ? (
            <EmptyState icon={ShieldCheck} title={t("empty")} />
          ) : (
            rows.map((row) => (
              <Row
                key={row.id}
                title={
                  <bdi dir="ltr" className="font-montserrat tabular-nums">
                    {row.phone}
                  </bdi>
                }
                description={
                  <span className="block truncate">
                    {row.reason ? `${row.reason} · ` : ""}
                    {formatDateTime(row.createdAt, locale)}
                  </span>
                }
                end={
                  <SellerButton variant="mini" size="xs" disabled={readOnly || isPending} onClick={() => remove(row.id)}>
                    {busyId === row.id && <LoaderCircle className="animate-spin" aria-hidden />}
                    {t("unblock")}
                  </SellerButton>
                }
              />
            ))
          )}
        </Rows>
      </div>
    </SectionCard>
  );
}
