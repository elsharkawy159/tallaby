"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ClipboardList, LoaderCircle } from "lucide-react";

import { PACKAGE_VOLUMES } from "@workspace/lib/shipping";
import { wassalhaSettingsSchema } from "@workspace/lib/integrations";
import type { WassalhaOverview } from "@workspace/lib/integrations/server";
import { Button } from "@workspace/ui/components/button";
import { ChoiceCard, ChoiceGroup } from "@workspace/ui/components/choice-card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { BUTTON_CLASS, FIELD_CLASS, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
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
    <div className="flex flex-col gap-6">
      <AppPageHeader
        storeId={storeId}
        app="wassalha"
        backLabel={t("back")}
        title={t("title")}
        subtitle={t("subtitle", { store: storeName })}
      />

      {readOnly && <p className="rounded-xl bg-muted p-3.5 text-[13px] text-muted-foreground">{t("readOnly")}</p>}

      <ol className="flex flex-col gap-2 rounded-2xl border bg-card p-4 text-[13px] text-muted-foreground sm:p-5">
        {(["account", "export", "upload", "status"] as const).map((step, i) => (
          <li key={step} className="flex gap-2.5">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border bg-muted/40 text-[11px] font-bold text-primary-ink">
              {i + 1}
            </span>
            {t(`steps.${step}`)}
          </li>
        ))}
      </ol>

      <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-2xl border bg-card p-4 sm:p-6">
        <div>
          <h2 className="text-base font-bold">{t("accountTitle")}</h2>
          <p className="text-[13px] text-muted-foreground">{t("accountHelp")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {TEXT_FIELDS.map((name) => {
            const error = submitted && invalid.has(name);
            return (
              <div key={name} className="grid gap-1.5">
                <Label htmlFor={`ws-${name}`}>{t(`fields.${name}`)}</Label>
                <Input
                  id={`ws-${name}`}
                  dir={name === "postId" ? "ltr" : "auto"}
                  className={cn(FIELD_CLASS, name === "postId" && "text-start font-mono", error && "border-destructive")}
                  value={form[name]}
                  disabled={readOnly}
                  aria-invalid={error}
                  onChange={(ev) => set(name, ev.target.value)}
                />
                <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
                  {error ? t(`errors.${name}`) : t(`help.${name}`)}
                </p>
              </div>
            );
          })}
        </div>

        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">{t("fields.volume")}</legend>
          <ChoiceGroup value={form.volume} onValueChange={(v) => set("volume", v)} columns={3} disabled={readOnly}>
            {PACKAGE_VOLUMES.map((v) => (
              <ChoiceCard key={v} value={v} indicator title={t(`volumes.${v.toLowerCase()}`)} />
            ))}
          </ChoiceGroup>
          <p className="text-xs text-muted-foreground">{t("help.volume")}</p>
        </fieldset>

        <div className="flex items-start justify-between gap-4 rounded-xl border p-3.5">
          <div>
            <Label htmlFor="ws-pod">{t("fields.hasPod")}</Label>
            <p className="text-xs text-muted-foreground">{t("help.hasPod")}</p>
          </div>
          <Switch id="ws-pod" checked={form.hasPod} disabled={readOnly} onCheckedChange={(v) => set("hasPod", v)} />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="ws-note" className="justify-between">
            {t("fields.note")}
            <span className="text-xs font-normal text-faint">{t("optional")}</span>
          </Label>
          <Input
            id="ws-note"
            dir="auto"
            maxLength={200}
            className={FIELD_CLASS}
            placeholder={t("notePlaceholder")}
            value={form.note}
            disabled={readOnly}
            onChange={(ev) => set("note", ev.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t("help.note")}</p>
        </div>

        <p className="rounded-xl bg-muted/50 px-3.5 py-3 text-xs text-muted-foreground">{t("weightNote")}</p>

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Button type="submit" variant="accent" className={BUTTON_CLASS} disabled={readOnly || pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : <Check />}
            {connected ? t("save") : t("connect")}
          </Button>
          {connected && (
            <>
              <Button asChild variant="outline" className={SMALL_BUTTON_CLASS}>
                <Link href="/orders">
                  <ClipboardList className="size-4" aria-hidden />
                  {t("goToOrders")}
                </Link>
              </Button>
              <DisconnectAppButton className={cn(SMALL_BUTTON_CLASS, "ms-auto")} disabled={readOnly} pending={pending} onConfirm={remove} />
            </>
          )}
        </div>
      </form>
    </div>
  );
}
