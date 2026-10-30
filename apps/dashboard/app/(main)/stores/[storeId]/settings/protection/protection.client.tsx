"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, LoaderCircle, ShieldCheck } from "lucide-react";

import { BLOCKED_PHONE_REASON_MAX, normalizeBlockedPhone } from "@workspace/lib/stores/blocked-phones";
import type { StoreBlockedPhone } from "@workspace/lib/stores/blocked-phones/server";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { BUTTON_CLASS, FIELD_CLASS, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { formatDateTime } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
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
    <div className="space-y-5">
      {readOnly && <p className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}

      <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <form
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            add();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="blocked-phone">{t("phone")}</Label>
            <Input
              id="blocked-phone"
              inputMode="tel"
              dir="ltr"
              autoComplete="off"
              placeholder="01XXXXXXXXX"
              value={phone}
              disabled={readOnly}
              aria-invalid={phoneInvalid || undefined}
              onChange={(event) => setPhone(event.target.value)}
              className={cn(FIELD_CLASS, phoneInvalid && "border-destructive")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="blocked-reason">{t("reason")}</Label>
            <Input
              id="blocked-reason"
              placeholder={t("reasonPlaceholder")}
              maxLength={BLOCKED_PHONE_REASON_MAX}
              value={reason}
              disabled={readOnly}
              onChange={(event) => setReason(event.target.value)}
              className={FIELD_CLASS}
            />
          </div>
          <Button type="submit" className={BUTTON_CLASS} disabled={readOnly || isPending || !phone.trim()}>
            {isPending && !busyId ? <LoaderCircle className="size-4 animate-spin" /> : <Ban className="size-4" />}
            {t("block")}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </section>

      <section className="rounded-xl border bg-card">
        <h3 className="border-b px-4 py-3 text-sm font-semibold sm:px-5">{t("listTitle", { count: rows.length })}</h3>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
            <ShieldCheck className="size-8 opacity-60" />
            {t("empty")}
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium tabular-nums" dir="ltr">
                    {row.phone}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.reason ? `${row.reason} · ` : ""}
                    {formatDateTime(row.createdAt, locale)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className={SMALL_BUTTON_CLASS}
                  disabled={readOnly || isPending}
                  onClick={() => remove(row.id)}
                >
                  {busyId === row.id && <LoaderCircle className="size-3.5 animate-spin" />}
                  {t("unblock")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
