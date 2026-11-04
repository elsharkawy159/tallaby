"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { EMAIL_PACK_EMAILS, EMAIL_PACK_USD_CENTS } from "@workspace/lib/billing";
import type { EmailAllowance } from "@workspace/lib/email-campaigns/server";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { ArrowLeft, Ban, Eye, LoaderCircle, Mail, Pencil, Plus, Send, SendHorizonal, Trash2, Users } from "lucide-react";
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
  CAMPAIGN_SCHEDULE_MAX_DAYS,
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
  buyEmails, cancelCampaignAction,
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
import { EmailCampaignPreview, useWideLayout } from "./email-campaign-preview.client";
import {
  previewRequest,
  queueBlocker,
  readSchedule,
  sendBlocker,
  toLocalInputValue,
  withInertLinks,
  type QueueBlocker,
  type ScheduleState,
} from "./email-campaigns.lib";

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
  allowance: EmailAllowance;
  /** Automatic win-back emails don't go out (the email policy, after the USD switch). */
  winbackPaused: boolean;
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
export function EmailCampaignsView({ stores, storeId, storeLive, limits, allowance, winbackPaused, data }: Props) {
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

  // Not activated (F-68): nothing to compose or send. Drafts stay; they can be deleted.
  const locked = allowance.locked;
  const editing = !locked && editingId ? data.campaigns.find((c) => c.id === editingId && c.status === "draft") ?? null : null;
  const sentTotal = data.campaigns.reduce((n, c) => n + c.sentCount, 0);
  const hasHistory = data.campaigns.some((c) => c.status !== "draft") || data.unsubscribed > 0;
  const blocker = queueBlocker({ storeLive, queuedToday: data.queuedToday, campaignsPerDay: limits.campaignsPerDay, allowance });

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
      {stores.length > 1 && !editing && (
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
          {t("offline")}{" "}
          <Link href="/stores" className="font-semibold underline underline-offset-2">
            {t("offlineAction")}
          </Link>
        </div>
      )}

      {allowance.locked ? (
        <p className="rounded-xl border bg-accent-soft px-4 py-3 text-sm">
          {t(allowance.pendingReview ? "allowance.pending" : "allowance.locked")}{" "}
          {!allowance.pendingReview && (
            <Link href="/wallet" className="font-semibold underline underline-offset-2">
              {t("allowance.topUp")}
            </Link>
          )}
        </p>
      ) : (
        allowance.live && <EmailAllowanceLine allowance={allowance} />
      )}

      {!editing && hasHistory && (
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
      )}

      {editing ? (
        <Composer
          key={editing.id}
          storeId={storeId}
          storeName={stores.find((s) => s.id === storeId)?.name ?? ""}
          campaign={editing}
          products={data.products}
          limits={limits}
          blocker={blocker}
          onClose={() => setEditingId(null)}
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
            {data.campaigns.length > 0 && (
              <Button type="button" size="sm" disabled={pending || locked} onClick={newCampaign}>
                {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
                {t("list.new")}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {data.campaigns.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Mail className="size-6" aria-hidden />
                </span>
                <div className="space-y-1">
                  <p className="font-semibold">{t("list.emptyTitle")}</p>
                  <ol className="list-inside list-decimal text-pretty text-sm text-muted-foreground">
                    <li>{t("list.emptyStep1")}</li>
                    <li>{t("list.emptyStep2")}</li>
                    <li>{t("list.emptyStep3")}</li>
                  </ol>
                </div>
                <Button type="button" disabled={pending || locked} onClick={newCampaign}>
                  {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
                  {t("list.emptyAction")}
                </Button>
              </div>
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
                          {[
                            t("list.countsSent", { sent: formatNumber(c.sentCount, locale), total: formatNumber(c.recipientCount, locale) }),
                            c.failedCount > 0 && t("list.countsFailed", { count: formatNumber(c.failedCount, locale) }),
                            c.skippedCount > 0 && t("list.countsSkipped", { count: formatNumber(c.skippedCount, locale) }),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {c.status === "draft" && (
                        <>
                          <Button type="button" size="sm" variant="neutral" disabled={locked} onClick={() => setEditingId(c.id)}>
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

      {!editing && data.winback && (
        <WinbackCard storeId={storeId} winback={data.winback} limits={limits} paused={winbackPaused} locked={locked} onPreview={setPreview} />
      )}

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
            <iframe title={t("preview.title")} sandbox="" srcDoc={withInertLinks(preview.html)} className="h-[70vh] w-full rounded-lg border bg-white" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Composer({
  storeId,
  storeName,
  campaign,
  products,
  limits,
  blocker,
  onClose,
}: {
  storeId: string;
  storeName: string;
  campaign: StoreCampaign;
  products: CampaignProductOption[];
  limits: EmailCampaignLimits;
  blocker: QueueBlocker | null;
  onClose: () => void;
}) {
  const t = useTranslations("emailCampaigns");
  const locale = useLocale();
  const router = useRouter();
  const wide = useWideLayout();
  const [pane, setPane] = useState<"edit" | "preview">("edit");
  const [draft, setDraft] = useState<Draft>(() => toDraft(campaign));
  const [savedKey, setSavedKey] = useState(() => JSON.stringify(toContent(toDraft(campaign))));
  const [productQuery, setProductQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [audience, setAudience] = useState<AudiencePreview | null>(null);
  const [audienceFailed, setAudienceFailed] = useState(false);
  const [audienceAttempt, setAudienceAttempt] = useState(0);
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [scheduleAt, setScheduleAt] = useState("");
  const [schedule, setSchedule] = useState<ScheduleState>("missing");
  const [scheduleBounds, setScheduleBounds] = useState({ min: "", max: "" });
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<null | "save" | "test" | "send">(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  // Recipient count for the chosen audience (debounced for the days input).
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      const res = await previewAudience({ storeId, audience: draft.audience, inactiveDays: draft.inactiveDays }).catch(() => null);
      if (!alive) return;
      setAudience(res?.success ? res.data : null);
      setAudienceFailed(!res?.success);
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [storeId, draft.audience, draft.inactiveDays, audienceAttempt]);

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

  const content = toContent(draft);
  const currentKey = JSON.stringify(content);

  const save = (after?: () => void) =>
    act("save", async () => {
      const res = await saveCampaign({ storeId, campaignId: campaign.id, content });
      if (fail(res)) return;
      setSavedKey(currentKey);
      toast.success(t("toasts.saved"));
      after?.();
      router.refresh();
    });

  const leave = () => {
    if (currentKey === savedKey) onClose();
    else setConfirmLeave(true);
  };

  const pickMode = (next: "now" | "schedule") => {
    setMode(next);
    if (next === "schedule") {
      const now = Date.now();
      setScheduleBounds({
        min: toLocalInputValue(new Date(now + 6 * 60_000)),
        max: toLocalInputValue(new Date(now + CAMPAIGN_SCHEDULE_MAX_DAYS * 86_400_000)),
      });
      setSchedule(readSchedule(scheduleAt, new Date(now)));
    }
  };

  const pickSchedule = (value: string) => {
    setScheduleAt(value);
    setSchedule(readSchedule(value, new Date()));
  };

  const test = () =>
    act("test", async () => {
      const res = await sendCampaignTest({ storeId, campaignId: campaign.id, content });
      if (!fail(res)) toast.success(t("toasts.testSent"));
    });

  const send = () =>
    act("send", async () => {
      setConfirmSend(false);
      const scheduledAt = mode === "schedule" && typeof schedule === "object" ? schedule.iso : null;
      const res = await sendCampaign({ storeId, campaignId: campaign.id, content, scheduledAt });
      if (fail(res) || !res.success) return;
      toast.success(
        res.data.scheduled
          ? t("toasts.scheduled", { count: res.data.recipients })
          : t("toasts.sending", { count: res.data.recipients }),
      );
      onClose();
      router.refresh();
    });

  const testsLeft = Math.max(0, limits.testSendsPerCampaign - campaign.testSendCount);
  const request = previewRequest(content);
  const linkProblem = request.kind === "blocked" ? request.problem : null;
  const stop = sendBlocker({
    queue: blocker,
    content,
    schedule: mode === "schedule" ? schedule : null,
    recipients: audience?.recipients ?? null,
  });
  const audienceName =
    draft.audience === "inactive"
      ? t("audience.inactiveShort", { days: formatNumber(draft.inactiveDays, locale) })
      : t(`audience.${draft.audience}.label`);
  const scheduledDate = typeof schedule === "object" ? formatDateTime(schedule.iso, locale) : "";

  return (
    <div className="space-y-4">
      <Button type="button" size="sm" variant="ghost" onClick={leave}>
        <ArrowLeft className="rtl:rotate-180" aria-hidden />
        {t("composer.back")}
      </Button>

      <div className="flex gap-1.5 xl:hidden">
        <button type="button" className={chip(pane === "edit")} aria-pressed={pane === "edit"} onClick={() => setPane("edit")}>
          <Pencil className="me-1.5 size-3.5" aria-hidden />
          {t("composer.editTab")}
        </button>
        <button type="button" className={chip(pane === "preview")} aria-pressed={pane === "preview"} onClick={() => setPane("preview")}>
          <Eye className="me-1.5 size-3.5" aria-hidden />
          {t("composer.previewTab")}
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] xl:items-start">
        <Card className={cn(pane !== "edit" && "hidden xl:flex")}>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>{t("composer.title")}</CardTitle>
              <CardDescription>{t("composer.description")}</CardDescription>
            </div>
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
                aria-invalid={linkProblem === "subjectLink"}
                aria-describedby={linkProblem === "subjectLink" ? "campaign-subject-error" : undefined}
              />
              {linkProblem === "subjectLink" && (
                <p id="campaign-subject-error" className="text-xs text-destructive">
                  {t("errors.subjectLink")}
                </p>
              )}
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
                aria-invalid={linkProblem === "bodyLink"}
                aria-describedby={linkProblem === "bodyLink" ? "campaign-body-error" : undefined}
              />
              {linkProblem === "bodyLink" && (
                <p id="campaign-body-error" className="text-xs text-destructive">
                  {t("errors.bodyLink")}
                </p>
              )}
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
                aria-invalid={linkProblem === "ctaLink"}
                aria-describedby={linkProblem === "ctaLink" ? "campaign-cta-error" : undefined}
              />
              {linkProblem === "ctaLink" && (
                <p id="campaign-cta-error" className="text-xs text-destructive">
                  {t("errors.ctaLink")}
                </p>
              )}
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
              ) : !pickerOpen ? (
                <Button type="button" size="sm" variant="neutral" onClick={() => setPickerOpen(true)}>
                  <Plus aria-hidden />
                  {t("composer.addProducts")}
                </Button>
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
                  : audienceFailed
                    ? t("composer.countFailed")
                    : t("composer.counting")}
                {audienceFailed && (
                  <button
                    type="button"
                    className="font-semibold text-foreground underline underline-offset-2"
                    onClick={() => {
                      setAudienceFailed(false);
                      setAudienceAttempt((n) => n + 1);
                    }}
                  >
                    {t("preview.retry")}
                  </button>
                )}
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
                <button type="button" className={chip(mode === "now")} aria-pressed={mode === "now"} onClick={() => pickMode("now")}>
                  {t("composer.now")}
                </button>
                <button type="button" className={chip(mode === "schedule")} aria-pressed={mode === "schedule"} onClick={() => pickMode("schedule")}>
                  {t("composer.schedule")}
                </button>
              </div>
              {mode === "now" && <p className="text-xs text-muted-foreground">{t("composer.nowHint")}</p>}
              {mode === "schedule" && (
                <div className="space-y-1">
                  <Input
                    type="datetime-local"
                    value={scheduleAt}
                    min={scheduleBounds.min}
                    max={scheduleBounds.max}
                    onChange={(e) => pickSchedule(e.target.value)}
                    aria-label={t("composer.scheduleAt")}
                    aria-invalid={schedule === "invalid"}
                    className="sm:max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">{t("composer.scheduleHint")}</p>
                </div>
              )}
            </fieldset>

            <div className="space-y-2 border-t pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="neutral" disabled={pending} onClick={() => save()}>
                  {busy === "save" && <LoaderCircle className="animate-spin" aria-hidden />}
                  {t("actions.saveDraft")}
                </Button>
                <Button type="button" variant="neutral" disabled={pending || testsLeft === 0} onClick={test}>
                  {busy === "test" ? <LoaderCircle className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
                  {t("actions.test", { count: testsLeft })}
                </Button>
                <Button type="button" className="ms-auto" disabled={pending || stop !== null} onClick={() => setConfirmSend(true)}>
                  {busy === "send" ? <LoaderCircle className="animate-spin" aria-hidden /> : <Send aria-hidden />}
                  {mode === "schedule" ? t("actions.schedule") : t("actions.sendNow")}
                </Button>
              </div>
              {stop && stop !== "recipientsUnknown" && (
                <p className="text-xs text-muted-foreground" role="status">
                  {t(`errors.${stop}`)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className={cn("xl:sticky xl:top-20", pane !== "preview" && "hidden xl:block")}>
          <EmailCampaignPreview
            storeId={storeId}
            storeName={storeName}
            subject={draft.subject}
            content={content}
            enabled={wide || pane === "preview"}
          />
        </div>
      </div>

      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(mode === "schedule" ? "sendDialog.scheduleTitle" : "sendDialog.title", { count: audience?.recipients ?? 0 })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("sendDialog.audience", { audience: audienceName })}{" "}
              {mode === "schedule" ? t("sendDialog.scheduleBody", { date: scheduledDate }) : t("sendDialog.body")}
            </AlertDialogDescription>
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

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("leaveDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("leaveDialog.body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("leaveDialog.stay")}</AlertDialogCancel>
            <Button type="button" variant="neutral" onClick={onClose}>
              {t("leaveDialog.discard")}
            </Button>
            <AlertDialogAction onClick={() => save(onClose)}>{t("leaveDialog.save")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WinbackCard({
  storeId,
  winback,
  limits,
  paused,
  locked,
  onPreview,
}: {
  storeId: string;
  winback: WinbackOverview;
  limits: EmailCampaignLimits;
  paused: boolean;
  locked: boolean;
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

  // Paused by the email policy: nothing goes out, so the switch and form would promise what doesn't happen. The saved settings stay.
  if (paused) {
    return (
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{t("winback.title")}</CardTitle>
            <CardDescription>{t("winback.pausedBody")}</CardDescription>
          </div>
          <Badge variant="outline" className="text-muted-foreground">
            {t("winback.paused")}
          </Badge>
        </CardHeader>
      </Card>
    );
  }

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
          <Switch id="winback-enabled" checked={value.enabled} disabled={locked && !value.enabled} onCheckedChange={(on) => setValue((v) => ({ ...v, enabled: on }))} />
        </div>
      </CardHeader>
      {(value.enabled || winback.enabled) && (
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
              variant="neutral"
              disabled={pending || (locked && value.enabled)}
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
              disabled={pending || locked}
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
      )}
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

/** What's left this month, and buying more from the wallet (ROADMAP.md F-69). */
function EmailAllowanceLine({ allowance }: { allowance: EmailAllowance }) {
  const t = useTranslations("emailCampaigns.allowance");
  const tErrors = useTranslations("emailCampaigns.errors");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const values = {
    emails: new Intl.NumberFormat(locale).format(EMAIL_PACK_EMAILS),
    price: new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(EMAIL_PACK_USD_CENTS / 100),
  };
  const buy = () =>
    startTransition(async () => {
      const result = await buyEmails({ packs: 1 });
      if (!result.success) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(t("bought", { emails: values.emails }));
      setOpen(false);
      router.refresh();
    });
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <p>
        {t("left", {
          left: new Intl.NumberFormat(locale).format(allowance.remaining),
          monthly: new Intl.NumberFormat(locale).format(allowance.monthly),
        })}
      </p>
      <button type="button" className="font-semibold text-foreground underline underline-offset-2" onClick={() => setOpen(true)}>
        {t("buy", values)}
      </button>
      <ConfirmActionDialog
        open={open}
        onOpenChange={setOpen}
        title={t("buyTitle", values)}
        description={t("buyBody", values)}
        confirmLabel={t("buyConfirm", values)}
        pending={pending}
        onConfirm={buy}
      />
    </div>
  );
}
