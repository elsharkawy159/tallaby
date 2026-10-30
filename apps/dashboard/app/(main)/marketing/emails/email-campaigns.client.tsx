"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, Eye, LoaderCircle, Mail, Pencil, Plus, Send, SendHorizonal, Trash2, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import {
  CAMPAIGN_AUDIENCES,
  CAMPAIGN_BODY_MAX,
  CAMPAIGN_CTA_MAX,
  CAMPAIGN_PRODUCTS_MAX,
  CAMPAIGN_SUBJECT_MAX,
  INACTIVE_DAYS_DEFAULT,
  INACTIVE_DAYS_MAX,
  INACTIVE_DAYS_MIN,
  WINBACK_DAYS_MAX,
  WINBACK_DAYS_MIN,
  type CampaignAudience,
  type EmailCampaignLimits,
} from "@workspace/lib/email-campaigns";
import type {
  AudiencePreview,
  CampaignProductOption,
  StoreCampaign,
  WinbackOverview,
} from "@workspace/lib/email-campaigns/server";
import { formatDateTime, formatNumber } from "@/lib/i18n/format";
import {
  cancelCampaignAction,
  createCampaign,
  deleteCampaign,
  previewAudience,
  previewCampaignEmail,
  saveCampaign,
  saveWinback,
  sendCampaign,
  sendCampaignTest,
  sendWinbackTest,
} from "./email-campaigns.server";
import type { CampaignActionResult } from "./email-campaigns.types";

type Data = {
  campaigns: StoreCampaign[];
  winback: WinbackOverview | null;
  products: CampaignProductOption[];
  unsubscribed: number;
  queuedToday: number;
};

type Props = {
  stores: { id: string; name: string }[];
  storeId: string | null;
  storeLive: boolean;
  limits: EmailCampaignLimits;
  data: Data | null;
};

type Draft = {
  subject: string;
  body: string;
  ctaLabel: string;
  productIds: string[];
  audience: CampaignAudience;
  inactiveDays: number;
};

const chip = (active: boolean) =>
  cn(
    "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors",
    active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
  );

const toDraft = (c: StoreCampaign): Draft => ({
  subject: c.subject,
  body: c.body,
  ctaLabel: c.ctaLabel ?? "",
  productIds: c.productIds,
  audience: c.audience,
  inactiveDays: c.inactiveDays ?? INACTIVE_DAYS_DEFAULT,
});

const toContent = (d: Draft) => ({
  subject: d.subject,
  body: d.body,
  ctaLabel: d.ctaLabel.trim() || null,
  productIds: d.productIds,
  audience: d.audience,
  inactiveDays: d.audience === "inactive" ? d.inactiveDays : null,
});

/** Marketing › Email campaigns: store picker, stats, campaign list and composer, win-back card. */
export function EmailCampaignsView({ stores, storeId, storeLive, limits, data }: Props) {
  const t = useTranslations("emailCampaigns");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "delete" | "cancel"; id: string } | null>(null);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (!storeId || !data) {
    return <EmptyCard title={t("noStore.title")} body={t("noStore.body")} />;
  }

  const report = <T,>(res: CampaignActionResult<T>, ok?: string): res is { success: true; data: T } => {
    if (res.success) {
      if (ok) toast.success(ok);
      return true;
    }
    toast.error(t(`errors.${res.error}`));
    return false;
  };

  const editing = editingId ? data.campaigns.find((c) => c.id === editingId && c.status === "draft") ?? null : null;
  const sentTotal = data.campaigns.reduce((n, c) => n + c.sentCount, 0);

  const newCampaign = () =>
    startTransition(async () => {
      const res = await createCampaign({ storeId });
      if (report(res)) {
        setEditingId(res.data.id);
        router.refresh();
      }
    });

  const runConfirm = () =>
    startTransition(async () => {
      if (!confirm) return;
      const res =
        confirm.kind === "delete"
          ? await deleteCampaign({ storeId, campaignId: confirm.id })
          : await cancelCampaignAction({ storeId, campaignId: confirm.id });
      setConfirm(null);
      if (report(res, t(confirm.kind === "delete" ? "toasts.deleted" : "toasts.cancelled"))) router.refresh();
    });

  return (
    <div className="space-y-4">
      {stores.length > 1 && (
        <nav aria-label={t("store")} className="flex flex-wrap gap-1.5">
          {stores.map((s) => (
            <Link key={s.id} href={`${pathname}?store=${s.id}`} className={chip(storeId === s.id)} scroll={false}>
              {s.name}
            </Link>
          ))}
        </nav>
      )}

      {!storeLive && (
        <div role="status" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
          {t("offline")}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:max-w-2xl">
        <Stat label={t("stats.sent")} value={formatNumber(sentTotal, locale)} />
        <Stat label={t("stats.unsubscribed")} value={formatNumber(data.unsubscribed, locale)} />
        <Stat
          label={t("stats.today")}
          value={t("stats.todayValue", {
            used: formatNumber(Math.min(data.queuedToday, limits.campaignsPerDay), locale),
            max: formatNumber(limits.campaignsPerDay, locale),
          })}
        />
      </dl>

      {editing ? (
        <Composer
          key={editing.id}
          storeId={storeId}
          campaign={editing}
          products={data.products}
          limits={limits}
          canQueue={storeLive && data.queuedToday < limits.campaignsPerDay}
          onClose={() => setEditingId(null)}
          onPreview={setPreview}
        />
      ) : (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>{t("list.title")}</CardTitle>
              <CardDescription>
                {t("list.limits", { recipients: formatNumber(limits.maxRecipients, locale), perDay: formatNumber(limits.campaignsPerDay, locale) })}
              </CardDescription>
            </div>
            <Button type="button" size="sm" disabled={pending} onClick={newCampaign}>
              {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
              {t("list.new")}
            </Button>
          </CardHeader>
          <CardContent>
            {data.campaigns.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("list.empty")}</p>
            ) : (
              <ul className="divide-y">
                {data.campaigns.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{c.subject || t("list.untitled")}</span>
                        <StatusBadge status={c.status} label={t(`status.${c.status}`)} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {[
                          c.audience === "inactive"
                            ? t("audience.inactiveShort", { days: formatNumber(c.inactiveDays ?? INACTIVE_DAYS_DEFAULT, locale) })
                            : t(`audience.${c.audience}.label`),
                          c.status === "scheduled" && c.scheduledAt
                            ? t("list.scheduledFor", { date: formatDateTime(c.scheduledAt, locale) })
                            : c.completedAt
                              ? t("list.sentOn", { date: formatDateTime(c.completedAt, locale) })
                              : t("list.createdOn", { date: formatDateTime(c.createdAt, locale) }),
                        ].join(" · ")}
                      </p>
                      {c.status !== "draft" && (
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {t("list.counts", {
                            sent: formatNumber(c.sentCount, locale),
                            total: formatNumber(c.recipientCount, locale),
                            failed: formatNumber(c.failedCount, locale),
                            skipped: formatNumber(c.skippedCount, locale),
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {c.status === "draft" && (
                        <>
                          <Button type="button" size="sm" variant="neutral" onClick={() => setEditingId(c.id)}>
                            <Pencil aria-hidden />
                            {t("actions.edit")}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            aria-label={t("actions.delete")}
                            onClick={() => setConfirm({ kind: "delete", id: c.id })}
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        </>
                      )}
                      {(c.status === "scheduled" || c.status === "sending") && (
                        <Button type="button" size="sm" variant="neutral" onClick={() => setConfirm({ kind: "cancel", id: c.id })}>
                          <Ban aria-hidden />
                          {t("actions.cancel")}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {data.winback && <WinbackCard storeId={storeId} winback={data.winback} limits={limits} onPreview={setPreview} />}

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(confirm?.kind === "cancel" ? "cancelDialog.title" : "deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t(confirm?.kind === "cancel" ? "cancelDialog.body" : "deleteDialog.body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dialog.back")}</AlertDialogCancel>
            <AlertDialogAction onClick={runConfirm}>{t(confirm?.kind === "cancel" ? "cancelDialog.confirm" : "deleteDialog.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate">{preview?.subject}</DialogTitle>
          </DialogHeader>
          {preview && (
            // Rendered by the backend from escaped React text; sandboxed with no scripts.
            <iframe title={t("preview.title")} sandbox="" srcDoc={preview.html} className="h-[70vh] w-full rounded-lg border bg-white" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Composer({
  storeId,
  campaign,
  products,
  limits,
  canQueue,
  onClose,
  onPreview,
}: {
  storeId: string;
  campaign: StoreCampaign;
  products: CampaignProductOption[];
  limits: EmailCampaignLimits;
  canQueue: boolean;
  onClose: () => void;
  onPreview: (value: { subject: string; html: string }) => void;
}) {
  const t = useTranslations("emailCampaigns");
  const locale = useLocale();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => toDraft(campaign));
  const [productQuery, setProductQuery] = useState("");
  const [audience, setAudience] = useState<AudiencePreview | null>(null);
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [scheduleAt, setScheduleAt] = useState("");
  const [confirmSend, setConfirmSend] = useState(false);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<null | "save" | "test" | "preview" | "send">(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  // Recipient count for the chosen audience (debounced for the days input).
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      const res = await previewAudience({ storeId, audience: draft.audience, inactiveDays: draft.inactiveDays });
      if (alive) setAudience(res.success ? res.data : null);
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [storeId, draft.audience, draft.inactiveDays]);

  const shownProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    const list = q ? products.filter((p) => p.title.toLowerCase().includes(q)) : products;
    return list.slice(0, 40);
  }, [products, productQuery]);
  const selectedProducts = draft.productIds.map((id) => products.find((p) => p.id === id)).filter(Boolean) as CampaignProductOption[];

  const toggleProduct = (id: string) =>
    set(
      "productIds",
      draft.productIds.includes(id)
        ? draft.productIds.filter((x) => x !== id)
        : draft.productIds.length < CAMPAIGN_PRODUCTS_MAX
          ? [...draft.productIds, id]
          : draft.productIds,
    );

  const act = (kind: NonNullable<typeof busy>, fn: () => Promise<void>) =>
    startTransition(async () => {
      setBusy(kind);
      try {
        await fn();
      } finally {
        setBusy(null);
      }
    });

  const fail = (res: CampaignActionResult<unknown>) => {
    if (!res.success) toast.error(t(`errors.${res.error}`));
    return !res.success;
  };

  const save = () =>
    act("save", async () => {
      const res = await saveCampaign({ storeId, campaignId: campaign.id, content: toContent(draft) });
      if (fail(res)) return;
      toast.success(t("toasts.saved"));
      router.refresh();
    });

  const test = () =>
    act("test", async () => {
      const res = await sendCampaignTest({ storeId, campaignId: campaign.id, content: toContent(draft) });
      if (!fail(res)) toast.success(t("toasts.testSent"));
    });

  const showPreview = () =>
    act("preview", async () => {
      const res = await previewCampaignEmail({ storeId, kind: "campaign", content: toContent(draft) });
      if (!fail(res) && res.success) onPreview(res.data);
    });

  const send = () =>
    act("send", async () => {
      setConfirmSend(false);
      const scheduledAt = mode === "schedule" && scheduleAt ? new Date(scheduleAt).toISOString() : null;
      const res = await sendCampaign({ storeId, campaignId: campaign.id, content: toContent(draft), scheduledAt });
      if (fail(res) || !res.success) return;
      toast.success(
        res.data.scheduled
          ? t("toasts.scheduled", { count: res.data.recipients })
          : t("toasts.sending", { count: res.data.recipients }),
      );
      onClose();
      router.refresh();
    });

  const ready = draft.subject.trim() && draft.body.trim() && (mode === "now" || scheduleAt);
  const testsLeft = Math.max(0, limits.testSendsPerCampaign - campaign.testSendCount);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>{t("composer.title")}</CardTitle>
          <CardDescription>{t("composer.description")}</CardDescription>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          {t("composer.back")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="campaign-subject">{t("composer.subject")}</Label>
          <Input
            id="campaign-subject"
            value={draft.subject}
            maxLength={CAMPAIGN_SUBJECT_MAX}
            onChange={(e) => set("subject", e.target.value)}
            placeholder={t("composer.subjectPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaign-body">{t("composer.body")}</Label>
          <Textarea
            id="campaign-body"
            value={draft.body}
            maxLength={CAMPAIGN_BODY_MAX}
            rows={9}
            onChange={(e) => set("body", e.target.value)}
            placeholder={t("composer.bodyPlaceholder")}
          />
          <p className="text-xs text-muted-foreground">{t("composer.bodyHint")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaign-cta">{t("composer.cta")}</Label>
          <Input
            id="campaign-cta"
            value={draft.ctaLabel}
            maxLength={CAMPAIGN_CTA_MAX}
            onChange={(e) => set("ctaLabel", e.target.value)}
            placeholder={t("composer.ctaPlaceholder")}
            className="sm:max-w-xs"
          />
          <p className="text-xs text-muted-foreground">{t("composer.ctaHint")}</p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            {t("composer.products", { count: draft.productIds.length, max: CAMPAIGN_PRODUCTS_MAX })}
          </legend>
          {selectedProducts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedProducts.map((p) => (
                <button key={p.id} type="button" className={chip(true)} onClick={() => toggleProduct(p.id)}>
                  {p.title} ×
                </button>
              ))}
            </div>
          )}
          {products.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("composer.noProducts")}</p>
          ) : (
            <>
              <Input
                type="search"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder={t("composer.productSearch")}
                aria-label={t("composer.productSearch")}
                className="sm:max-w-xs"
              />
              <ul className="grid max-h-60 gap-1 overflow-y-auto rounded-lg border p-1 sm:grid-cols-2">
                {shownProducts.map((p) => {
                  const on = draft.productIds.includes(p.id);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => toggleProduct(p.id)}
                        aria-pressed={on}
                        disabled={!on && draft.productIds.length >= CAMPAIGN_PRODUCTS_MAX}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md p-1.5 text-start text-sm hover:bg-muted disabled:opacity-50",
                          on && "bg-primary/10",
                        )}
                      >
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="size-8 shrink-0 rounded object-cover" />
                        ) : (
                          <span className="size-8 shrink-0 rounded bg-muted" />
                        )}
                        <span className="truncate">{p.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("composer.audience")}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {CAMPAIGN_AUDIENCES.map((a) => (
              <label
                key={a}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition-colors",
                  draft.audience === a ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                )}
              >
                <input
                  type="radio"
                  name="campaign-audience"
                  value={a}
                  checked={draft.audience === a}
                  onChange={() => set("audience", a)}
                  className="mt-1 accent-[var(--primary)]"
                />
                <span>
                  <span className="block font-medium">{t(`audience.${a}.label`)}</span>
                  <span className="block text-xs text-muted-foreground">{t(`audience.${a}.body`)}</span>
                </span>
              </label>
            ))}
          </div>
          {draft.audience === "inactive" && (
            <div className="flex items-center gap-2 text-sm">
              <Label htmlFor="campaign-days">{t("composer.inactiveDays")}</Label>
              <Input
                id="campaign-days"
                type="number"
                min={INACTIVE_DAYS_MIN}
                max={INACTIVE_DAYS_MAX}
                value={draft.inactiveDays}
                onChange={(e) => set("inactiveDays", Number(e.target.value) || INACTIVE_DAYS_DEFAULT)}
                className="w-24"
              />
            </div>
          )}
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-live="polite">
            <Users className="size-4" aria-hidden />
            {audience
              ? t("composer.recipients", {
                  count: audience.recipients,
                  formatted: formatNumber(audience.recipients, locale),
                })
              : t("composer.counting")}
            {audience && audience.overCap > 0 && (
              <span className="text-xs">{t("composer.overCap", { max: formatNumber(audience.max, locale) })}</span>
            )}
          </p>
          {audience && (audience.unsubscribed > 0 || audience.noEmail > 0) && (
            <p className="text-xs text-muted-foreground">
              {t("composer.excluded", {
                unsubscribed: formatNumber(audience.unsubscribed, locale),
                noEmail: formatNumber(audience.noEmail, locale),
              })}
            </p>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("composer.when")}</legend>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={chip(mode === "now")} onClick={() => setMode("now")}>
              {t("composer.now")}
            </button>
            <button type="button" className={chip(mode === "schedule")} onClick={() => setMode("schedule")}>
              {t("composer.schedule")}
            </button>
          </div>
          {mode === "schedule" && (
            <div className="space-y-1">
              <Input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                aria-label={t("composer.scheduleAt")}
                className="sm:max-w-xs"
              />
              <p className="text-xs text-muted-foreground">{t("composer.scheduleHint")}</p>
            </div>
          )}
        </fieldset>

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Button type="button" variant="neutral" disabled={pending} onClick={save}>
            {busy === "save" && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("actions.save")}
          </Button>
          <Button type="button" variant="neutral" disabled={pending} onClick={showPreview}>
            {busy === "preview" ? <LoaderCircle className="animate-spin" aria-hidden /> : <Eye aria-hidden />}
            {t("actions.preview")}
          </Button>
          <Button type="button" variant="neutral" disabled={pending || testsLeft === 0} onClick={test}>
            {busy === "test" ? <LoaderCircle className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
            {t("actions.test", { count: testsLeft })}
          </Button>
          <Button
            type="button"
            className="ms-auto"
            disabled={pending || !ready || !canQueue || !audience?.recipients}
            onClick={() => setConfirmSend(true)}
          >
            {busy === "send" ? <LoaderCircle className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            {mode === "schedule" ? t("actions.schedule") : t("actions.sendNow")}
          </Button>
        </div>
        {!canQueue && <p className="text-xs text-muted-foreground">{t("composer.cannotQueue")}</p>}
      </CardContent>

      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sendDialog.title", { count: audience?.recipients ?? 0 })}</AlertDialogTitle>
            <AlertDialogDescription>{t("sendDialog.body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dialog.back")}</AlertDialogCancel>
            <AlertDialogAction onClick={send}>
              <SendHorizonal aria-hidden />
              {mode === "schedule" ? t("actions.schedule") : t("actions.sendNow")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function WinbackCard({
  storeId,
  winback,
  limits,
  onPreview,
}: {
  storeId: string;
  winback: WinbackOverview;
  limits: EmailCampaignLimits;
  onPreview: (value: { subject: string; html: string }) => void;
}) {
  const t = useTranslations("emailCampaigns");
  const locale = useLocale();
  const router = useRouter();
  const [value, setValue] = useState({ enabled: winback.enabled, days: winback.days, subject: winback.subject, body: winback.body });
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<null | "save" | "test" | "preview">(null);

  const act = (kind: NonNullable<typeof busy>, fn: () => Promise<void>) =>
    startTransition(async () => {
      setBusy(kind);
      try {
        await fn();
      } finally {
        setBusy(null);
      }
    });

  const fail = (res: CampaignActionResult<unknown>) => {
    if (!res.success) toast.error(t(`errors.${res.error}`));
    return !res.success;
  };

  const content = { subject: value.subject, body: value.body, ctaLabel: null, productIds: [], audience: "buyers" };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>{t("winback.title")}</CardTitle>
          <CardDescription>
            {t("winback.description", { perDay: formatNumber(limits.winbackPerStorePerDay, locale) })}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="winback-enabled" className="text-sm">
            {value.enabled ? t("winback.on") : t("winback.off")}
          </Label>
          <Switch id="winback-enabled" checked={value.enabled} onCheckedChange={(on) => setValue((v) => ({ ...v, enabled: on }))} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          {t("winback.stats", {
            sent: formatNumber(winback.sentLast30Days, locale),
            pending: formatNumber(winback.pending, locale),
          })}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <Label htmlFor="winback-days">{t("winback.days")}</Label>
          <Input
            id="winback-days"
            type="number"
            min={WINBACK_DAYS_MIN}
            max={WINBACK_DAYS_MAX}
            value={value.days}
            onChange={(e) => setValue((v) => ({ ...v, days: Number(e.target.value) || WINBACK_DAYS_MIN }))}
            className="w-24"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="winback-subject">{t("winback.subject")}</Label>
          <Input
            id="winback-subject"
            value={value.subject}
            maxLength={CAMPAIGN_SUBJECT_MAX}
            onChange={(e) => setValue((v) => ({ ...v, subject: e.target.value }))}
            placeholder={t("winback.subjectPlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="winback-body">{t("winback.body")}</Label>
          <Textarea
            id="winback-body"
            value={value.body}
            maxLength={CAMPAIGN_BODY_MAX}
            rows={5}
            onChange={(e) => setValue((v) => ({ ...v, body: e.target.value }))}
            placeholder={t("winback.bodyPlaceholder")}
          />
          <p className="text-xs text-muted-foreground">{t("winback.hint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              act("save", async () => {
                const res = await saveWinback({ storeId, settings: value });
                if (fail(res)) return;
                toast.success(t("toasts.winbackSaved"));
                router.refresh();
              })
            }
          >
            {busy === "save" && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("actions.save")}
          </Button>
          <Button
            type="button"
            variant="neutral"
            disabled={pending}
            onClick={() =>
              act("preview", async () => {
                const res = await previewCampaignEmail({ storeId, kind: "winback", content });
                if (!fail(res) && res.success) onPreview(res.data);
              })
            }
          >
            {busy === "preview" ? <LoaderCircle className="animate-spin" aria-hidden /> : <Eye aria-hidden />}
            {t("actions.preview")}
          </Button>
          <Button
            type="button"
            variant="neutral"
            disabled={pending}
            onClick={() =>
              act("test", async () => {
                const res = await sendWinbackTest({ storeId, settings: value });
                if (!fail(res)) toast.success(t("toasts.testSent"));
              })
            }
          >
            {busy === "test" ? <LoaderCircle className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
            {t("actions.testWinback")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, label }: { status: StoreCampaign["status"]; label: string }) {
  const tone =
    status === "sent"
      ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
      : status === "sending" || status === "scheduled"
        ? "border-sky-500/40 text-sky-700 dark:text-sky-400"
        : "text-muted-foreground";
  return (
    <Badge variant="outline" className={tone}>
      {label}
    </Badge>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Mail className="size-6" aria-hidden />
        </span>
        <p className="font-semibold">{title}</p>
        <p className="max-w-md text-pretty text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
