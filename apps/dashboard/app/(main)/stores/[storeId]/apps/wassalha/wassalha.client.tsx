"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ClipboardList, LoaderCircle, Mailbox } from "lucide-react";

import { PACKAGE_VOLUMES } from "@workspace/lib/shipping";
import { wassalhaSettingsSchema } from "@workspace/lib/integrations";
import type { WassalhaOverview } from "@workspace/lib/integrations/server";
import { Field, FieldRow, Note, OptionCard, OptionCards, SectionCard, SellerButton, SellerCard, TextInput, Toggle } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { AppPageHeader } from "../app-page-header";
import { disconnectStoreApp } from "../apps.server";
import { DisconnectAppButton } from "../disconnect-button.client";
import { saveWassalha, type WassalhaForm } from "./wassalha.server";

const TEXT_FIELDS = ["postId", "merchantName", "warehouseName", "senderName"] as const;

/**
 * Store › Apps › Wassalha (Egypt Post, F-12c). Wassalha has no API: the seller
 * saves the account details printed on every row here, then exports orders
 * from the Orders page and uploads the file on the Wassalha dashboard.
 */
export function WassalhaApp({
  storeId,
  storeName,
  initial,
  readOnly,
}: {
  storeId: string;
  storeName: string;
  initial: WassalhaOverview | null;
  readOnly: boolean;
}) {
  const t = useTranslations("storeApps.wassalha");
  const tErr = useTranslations("storeApps.errors");
  const router = useRouter();
  const saved = initial?.settings;
  const [form, setForm] = useState<WassalhaForm>({
    postId: saved?.postId ?? "",
    merchantName: saved?.merchantName ?? "",
    warehouseName: saved?.warehouseName ?? "",
    senderName: saved?.senderName ?? storeName,
    hasPod: saved?.hasPod ?? false,
    volume: saved?.volume ?? "Small",
    note: saved?.note ?? "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();
  const connected = Boolean(saved);

  // Same schema as the server, so the form and the save agree.
  const check = wassalhaSettingsSchema.safeParse({ ...form, note: form.note.trim() || undefined });
  const invalid = new Set(check.success ? [] : check.error.issues.map((i) => String(i.path[0])));

  const set = <K extends keyof WassalhaForm>(key: K, value: WassalhaForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!check.success) return;
    startTransition(async () => {
      const result = await saveWassalha(storeId, form);
      if (result.success) {
        toast.success(t(connected ? "saved" : "connected"));
        router.refresh();
      } else {
        toast.error(tErr(result.error));
      }
    });
  };

  const remove = () =>
    startTransition(async () => {
      const result = await disconnectStoreApp(storeId, "wassalha");
      if (result.success) {
        toast.success(t("disconnected"));
        router.push(`/stores/${storeId}/apps`);
      } else {
        toast.error(tErr(result.error));
      }
    });

  return (
    <>
      <AppPageHeader
        storeId={storeId}
        app="wassalha"
        backLabel={t("back")}
        title={t("title")}
        subtitle={t("subtitle", { store: storeName })}
      />

      {readOnly && <Note tone="amber">{t("readOnly")}</Note>}

      <SellerCard>
      <ol className="flex flex-col gap-2.5 p-[18px] text-[13px] text-(--s-muted)">
        {(["account", "export", "upload", "status"] as const).map((step, i) => (
          <li key={step} className="flex gap-2.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft font-montserrat text-[11.5px] font-bold text-primary-ink">{i + 1}</span>
            <span className="min-w-0 pt-0.5">{t(`steps.${step}`)}</span>
          </li>
        ))}
      </ol>
      </SellerCard>

      <form onSubmit={submit} noValidate>
      <SectionCard icon={Mailbox} title={t("accountTitle")} description={t("accountHelp")}>
        <FieldRow>
          {TEXT_FIELDS.map((name) => {
            const error = submitted && invalid.has(name);
            return (
              <Field
                key={name}
                label={t(`fields.${name}`)}
                htmlFor={`ws-${name}`}
                note={t(`help.${name}`)}
                error={error ? t(`errors.${name}`) : undefined}
              >
                <TextInput
                  id={`ws-${name}`}
                  dir={name === "postId" ? "ltr" : "auto"}
                  className={cn(name === "postId" && "text-start font-montserrat")}
                  value={form[name]}
                  disabled={readOnly}
                  aria-invalid={error}
                  onChange={(ev) => set(name, ev.target.value)}
                />
              </Field>
            );
          })}
        </FieldRow>

        <Field label={t("fields.volume")} note={t("help.volume")}>
          <OptionCards className="grid-cols-[repeat(auto-fit,minmax(min(100%,120px),1fr))]">
            {PACKAGE_VOLUMES.map((v) => (
              <OptionCard
                key={v}
                name="wassalha-volume"
                title={t(`volumes.${v.toLowerCase()}`)}
                checked={form.volume === v}
                disabled={readOnly}
                onChange={() => set("volume", v)}
              />
            ))}
          </OptionCards>
        </Field>

        <div className="flex items-start justify-between gap-4 rounded-2xl border border-(--s-line) p-3.5">
          <div className="min-w-0">
            <b className="block text-[13.5px] font-bold text-(--s-text)">{t("fields.hasPod")}</b>
            <small className="block text-xs text-(--s-subtle)">{t("help.hasPod")}</small>
          </div>
          <Toggle className="max-[600px]:min-h-10" id="ws-pod" aria-label={t("fields.hasPod")} checked={form.hasPod} disabled={readOnly} onCheckedChange={(v) => set("hasPod", v)} />
        </div>

        <Field label={t("fields.note")} hint={t("optional")} htmlFor="ws-note" note={t("help.note")}>
          <TextInput
            id="ws-note"
            dir="auto"
            maxLength={200}
            placeholder={t("notePlaceholder")}
            value={form.note}
            disabled={readOnly}
            onChange={(ev) => set("note", ev.target.value)}
          />
        </Field>

        <Note>{t("weightNote")}</Note>

        <div className="flex flex-wrap items-center gap-2 border-t border-(--s-line-soft) pt-4">
          <SellerButton type="submit" disabled={readOnly || pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : <Check />}
            {connected ? t("save") : t("connect")}
          </SellerButton>
          {connected && (
            <>
              <SellerButton asChild variant="mini">
                <Link href="/orders">
                  <ClipboardList className="size-4" aria-hidden />
                  {t("goToOrders")}
                </Link>
              </SellerButton>
              <DisconnectAppButton className="ms-auto" disabled={readOnly} pending={pending} onConfirm={remove} />
            </>
          )}
        </div>
      </SectionCard>
      </form>
    </>
  );
}
