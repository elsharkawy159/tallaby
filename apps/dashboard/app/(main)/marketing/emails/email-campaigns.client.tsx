"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { EMAIL_PACK_EMAILS, EMAIL_PACK_USD_CENTS, TOP_UP_MIN_USD_CENTS } from "@workspace/lib/billing";
import { useEgpRate } from "@/components/egp-rate.client";
import type { EmailAllowance } from "@workspace/lib/email-campaigns/server";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { ArrowLeft, Ban, Eye, LoaderCircle, Mail, Pencil, Plus, Send, SendHorizonal, Trash2, Undo2, Users } from "lucide-react";
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
import { cn } from "@workspace/ui/lib/utils";
import {
  Chip,
  Chips,
  EmptyState,
  Field,
  IconButton,
  Modal,
  Note,
  OptionCard,
  OptionCards,
  Row,
  Rows,
  SectionCard,
  Segmented,
  SellerButton,
  SellerCard,
  StatusBadge,
  TextAction,
  TextArea,
  TextInput,
  Toggle,
  type BadgeTone,
} from "@/components/seller-ui";
import { ChipLink, MiniStats } from "../../orders/orders-ui";
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
import { formatDateTime, formatNumber, formatUsdPrice } from "@/lib/i18n/format";
import { useWholeNumberInput } from "@/components/form/whole-number.client";
import type { WholeNumberRange } from "@/components/form/whole-number.lib";
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
  const egpRate = useEgpRate();
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
    <>
      {stores.length > 1 && !editing && (
        <nav aria-label={t("store")} className="flex flex-wrap gap-1.5">
          {stores.map((s) => (
            <ChipLink key={s.id} href={`${pathname}?store=${s.id}`} active={storeId === s.id}>
              {s.name}
            </ChipLink>
          ))}
        </nav>
      )}

      {!storeLive && (
        <Note tone="amber">
          <span role="status">
            {t("offline")}{" "}
            <Link href="/stores" className="-my-2 inline-block py-2 underline underline-offset-2">
              {t("offlineAction")}
            </Link>
          </span>
        </Note>
      )}

      {allowance.locked ? (
        <Note tone="amber">
          {allowance.pendingReview ? t("allowance.pending") : t("allowance.locked", { min: formatUsdPrice(TOP_UP_MIN_USD_CENTS, locale, egpRate) })}{" "}
          {!allowance.pendingReview && (
            <Link href="/wallet" className="-my-2 inline-block py-2 underline underline-offset-2">
              {t("allowance.topUp")}
            </Link>
          )}
        </Note>
      ) : (
        allowance.live && <EmailAllowanceLine allowance={allowance} />
      )}

      {!editing && hasHistory && (
        <MiniStats
          className="min-[721px]:max-w-2xl"
          items={[
            { label: t("stats.sent"), value: formatNumber(sentTotal, locale) },
            { label: t("stats.unsubscribed"), value: formatNumber(data.unsubscribed, locale) },
            {
              label: t("stats.today"),
              value: t("stats.todayValue", {
                used: formatNumber(Math.min(data.queuedToday, limits.campaignsPerDay), locale),
                max: formatNumber(limits.campaignsPerDay, locale),
              }),
            },
          ]}
        />
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
        <SectionCard
          icon={Mail}
          title={t("list.title")}
          description={t("list.limits", { recipients: formatNumber(limits.maxRecipients, locale), perDay: formatNumber(limits.campaignsPerDay, locale) })}
          action={
            data.campaigns.length > 0 ? (
              <SellerButton type="button" size="sm" disabled={pending || locked} onClick={newCampaign}>
                {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
                {t("list.new")}
              </SellerButton>
            ) : undefined
          }
        >
          {data.campaigns.length === 0 ? (
            <EmptyState
              icon={Mail}
              title={t("list.emptyTitle")}
              description={
                <ol className="list-inside list-decimal">
                  <li>{t("list.emptyStep1")}</li>
                  <li>{t("list.emptyStep2")}</li>
                  <li>{t("list.emptyStep3")}</li>
                </ol>
              }
              action={
                <SellerButton type="button" disabled={pending || locked} onClick={newCampaign}>
                  {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
                  {t("list.emptyAction")}
                </SellerButton>
              }
            />
          ) : (
            <Rows>
              {data.campaigns.map((c) => (
                <Row
                  key={c.id}
                  title={
                    <>
                      <span className="min-w-0 truncate">{c.subject || t("list.untitled")}</span>
                      <StatusBadge tone={STATUS_TONE[c.status] ?? "muted"}>{t(`status.${c.status}`)}</StatusBadge>
                    </>
                  }
                  description={
                    <>
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
                      {c.status !== "draft" && (
                        <span className="block tabular-nums">
                          {[
                            t("list.countsSent", { sent: formatNumber(c.sentCount, locale), total: formatNumber(c.recipientCount, locale) }),
                            c.failedCount > 0 && t("list.countsFailed", { count: formatNumber(c.failedCount, locale) }),
                            c.skippedCount > 0 && t("list.countsSkipped", { count: formatNumber(c.skippedCount, locale) }),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </>
                  }
                  end={
                    <>
                      {c.status === "draft" && (
                        <>
                          <IconButton aria-label={t("actions.edit")} disabled={locked} onClick={() => setEditingId(c.id)}>
                            <Pencil aria-hidden />
                          </IconButton>
                          <IconButton aria-label={t("actions.delete")} onClick={() => setConfirm({ kind: "delete", id: c.id })}>
                            <Trash2 aria-hidden />
                          </IconButton>
                        </>
                      )}
                      {(c.status === "scheduled" || c.status === "sending") && (
                        <SellerButton type="button" size="xs" variant="mini" onClick={() => setConfirm({ kind: "cancel", id: c.id })}>
                          <Ban aria-hidden />
                          {t("actions.cancel")}
                        </SellerButton>
                      )}
                    </>
                  }
                />
              ))}
            </Rows>
          )}
        </SectionCard>
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

      <Modal open={preview !== null} onOpenChange={(open) => !open && setPreview(null)} title={preview?.subject ?? ""} width={672}>
        {preview && (
          // Rendered by the backend from escaped React text; sandboxed with no scripts.
          <iframe title={t("preview.title")} sandbox="" srcDoc={withInertLinks(preview.html)} className="h-[70vh] w-full rounded-2xl border border-(--s-line) bg-white" />
        )}
      </Modal>
    </>
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
    <div className="flex flex-col gap-4">
      <TextAction type="button" onClick={leave} className="min-h-10 self-start">
        <ArrowLeft className="rtl:rotate-180" aria-hidden />
        {t("composer.back")}
      </TextAction>

      <Segmented
        className="self-start xl:hidden max-[600px]:w-full"
        value={pane}
        onChange={setPane}
        options={[
          { value: "edit", label: <span className="inline-flex items-center gap-1.5"><Pencil className="size-3.5" aria-hidden />{t("composer.editTab")}</span> },
          { value: "preview", label: <span className="inline-flex items-center gap-1.5"><Eye className="size-3.5" aria-hidden />{t("composer.previewTab")}</span> },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] xl:items-start">
        <SectionCard
          icon={Pencil}
          className={cn(pane !== "edit" && "hidden xl:flex")}
          title={t("composer.title")}
          description={t("composer.description")}
        >
          <Field
            label={t("composer.subject")}
            htmlFor="campaign-subject"
            error={linkProblem === "subjectLink" ? t("errors.subjectLink") : undefined}
          >
            <TextInput
              id="campaign-subject"
              value={draft.subject}
              maxLength={CAMPAIGN_SUBJECT_MAX}
              onChange={(e) => set("subject", e.target.value)}
              placeholder={t("composer.subjectPlaceholder")}
              aria-invalid={linkProblem === "subjectLink"}
            />
          </Field>

          <Field
            label={t("composer.body")}
            htmlFor="campaign-body"
            note={t("composer.bodyHint")}
            error={linkProblem === "bodyLink" ? t("errors.bodyLink") : undefined}
          >
            <TextArea
              id="campaign-body"
              value={draft.body}
              maxLength={CAMPAIGN_BODY_MAX}
              rows={9}
              onChange={(e) => set("body", e.target.value)}
              placeholder={t("composer.bodyPlaceholder")}
              aria-invalid={linkProblem === "bodyLink"}
            />
          </Field>

          <Field
            label={t("composer.cta")}
            htmlFor="campaign-cta"
            note={t("composer.ctaHint")}
            error={linkProblem === "ctaLink" ? t("errors.ctaLink") : undefined}
          >
            <TextInput
              id="campaign-cta"
              value={draft.ctaLabel}
              maxLength={CAMPAIGN_CTA_MAX}
              onChange={(e) => set("ctaLabel", e.target.value)}
              placeholder={t("composer.ctaPlaceholder")}
              className="sm:max-w-xs"
              aria-invalid={linkProblem === "ctaLink"}
            />
          </Field>

          <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className="mb-2 text-[13.5px] font-bold text-(--s-text)">
              {t("composer.products", { count: draft.productIds.length, max: CAMPAIGN_PRODUCTS_MAX })}
            </legend>
            {selectedProducts.length > 0 && (
              <Chips>
                {selectedProducts.map((p) => (
                  <Chip key={p.id} pressed onClick={() => toggleProduct(p.id)} className="max-w-full">
                    <span className="truncate">{p.title}</span> ×
                  </Chip>
                ))}
              </Chips>
            )}
            {products.length === 0 ? (
              <p className="text-xs text-(--s-faint)">{t("composer.noProducts")}</p>
            ) : !pickerOpen ? (
              <SellerButton type="button" size="sm" variant="mini" className="self-start" onClick={() => setPickerOpen(true)}>
                <Plus aria-hidden />
                {t("composer.addProducts")}
              </SellerButton>
            ) : (
              <>
                <TextInput
                  type="search"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder={t("composer.productSearch")}
                  aria-label={t("composer.productSearch")}
                  className="sm:max-w-xs"
                />
                <ul className="grid max-h-60 gap-1 overflow-y-auto rounded-2xl border border-(--s-line) bg-(--s-surface) p-1 sm:grid-cols-2">
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
                            "flex min-h-11 w-full items-center gap-2 rounded-xl p-1.5 text-start text-[13px] text-(--s-text) hover:bg-(--s-hover) disabled:opacity-50",
                            on && "bg-(--s-focus-soft)",
                          )}
                        >
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt="" className="size-8 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <span className="size-8 shrink-0 rounded-lg bg-(--s-fill)" />
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

          <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className="mb-2 text-[13.5px] font-bold text-(--s-text)">{t("composer.audience")}</legend>
            <OptionCards>
              {CAMPAIGN_AUDIENCES.map((a) => (
                <OptionCard
                  key={a}
                  name="campaign-audience"
                  value={a}
                  title={t(`audience.${a}.label`)}
                  description={t(`audience.${a}.body`)}
                  checked={draft.audience === a}
                  onChange={() => set("audience", a)}
                />
              ))}
            </OptionCards>
            {draft.audience === "inactive" && (
              <Field label={t("composer.inactiveDays")} htmlFor="campaign-days">
                <DaysInput
                  id="campaign-days"
                  value={draft.inactiveDays}
                  onCommit={(days) => set("inactiveDays", days)}
                  range={{ min: INACTIVE_DAYS_MIN, max: INACTIVE_DAYS_MAX, fallback: INACTIVE_DAYS_DEFAULT }}
                />
              </Field>
            )}
            <p className="flex flex-wrap items-center gap-1.5 text-[13px] text-(--s-muted)" aria-live="polite">
              <Users className="size-4 text-(--s-subtle)" aria-hidden />
              {audience
                ? t("composer.recipients", {
                    count: audience.recipients,
                    formatted: formatNumber(audience.recipients, locale),
                  })
                : audienceFailed
                  ? t("composer.countFailed")
                  : t("composer.counting")}
              {audienceFailed && (
                <TextAction
                  type="button"
                  className="min-h-10"
                  onClick={() => {
                    setAudienceFailed(false);
                    setAudienceAttempt((n) => n + 1);
                  }}
                >
                  {t("preview.retry")}
                </TextAction>
              )}
              {audience && audience.overCap > 0 && (
                <span className="text-xs">{t("composer.overCap", { max: formatNumber(audience.max, locale) })}</span>
              )}
            </p>
            {audience && (audience.unsubscribed > 0 || audience.noEmail > 0) && (
              <p className="text-xs text-(--s-faint)">
                {t("composer.excluded", {
                  unsubscribed: formatNumber(audience.unsubscribed, locale),
                  noEmail: formatNumber(audience.noEmail, locale),
                })}
              </p>
            )}
          </fieldset>

          <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className="mb-2 text-[13.5px] font-bold text-(--s-text)">{t("composer.when")}</legend>
            <Segmented
              className="self-start max-[600px]:w-full"
              value={mode}
              onChange={pickMode}
              options={[
                { value: "now", label: t("composer.now") },
                { value: "schedule", label: t("composer.schedule") },
              ]}
            />
            {mode === "now" && <p className="text-xs text-(--s-faint)">{t("composer.nowHint")}</p>}
            {mode === "schedule" && (
              <div className="flex flex-col gap-1">
                <TextInput
                  type="datetime-local"
                  value={scheduleAt}
                  min={scheduleBounds.min}
                  max={scheduleBounds.max}
                  onChange={(e) => pickSchedule(e.target.value)}
                  aria-label={t("composer.scheduleAt")}
                  aria-invalid={schedule === "invalid"}
                  className="sm:max-w-xs"
                />
                <p className="text-xs text-(--s-faint)">{t("composer.scheduleHint")}</p>
              </div>
            )}
          </fieldset>

          <div className="flex flex-col gap-2 border-t border-(--s-line-soft) pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <SellerButton type="button" variant="outline" disabled={pending} onClick={() => save()}>
                {busy === "save" && <LoaderCircle className="animate-spin" aria-hidden />}
                {t("actions.saveDraft")}
              </SellerButton>
              <SellerButton type="button" variant="outline" disabled={pending || testsLeft === 0} onClick={test}>
                {busy === "test" ? <LoaderCircle className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
                {t("actions.test", { count: testsLeft })}
              </SellerButton>
              <SellerButton type="button" className="ms-auto max-[600px]:ms-0 max-[600px]:w-full" disabled={pending || stop !== null} onClick={() => setConfirmSend(true)}>
                {busy === "send" ? <LoaderCircle className="animate-spin" aria-hidden /> : <Send aria-hidden />}
                {mode === "schedule" ? t("actions.schedule") : t("actions.sendNow")}
              </SellerButton>
            </div>
            {stop && stop !== "recipientsUnknown" && (
              <p className="text-xs text-(--s-faint)" role="status">
                {t(`errors.${stop}`)}
              </p>
            )}
          </div>
        </SectionCard>

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
            <SellerButton type="button" variant="outline" onClick={onClose}>
              {t("leaveDialog.discard")}
            </SellerButton>
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
      <SectionCard
        icon={Undo2}
        title={t("winback.title")}
        description={t("winback.pausedBody")}
        action={<StatusBadge tone="muted">{t("winback.paused")}</StatusBadge>}
      />
    );
  }

  return (
    <SectionCard
      icon={Undo2}
      title={t("winback.title")}
      description={t("winback.description", { perDay: formatNumber(limits.winbackPerStorePerDay, locale) })}
      action={
        <Toggle
          id="winback-enabled"
          label={value.enabled ? t("winback.on") : t("winback.off")}
          checked={value.enabled}
          disabled={locked && !value.enabled}
          onCheckedChange={(on) => setValue((v) => ({ ...v, enabled: on }))}
        />
      }
    >
      {(value.enabled || winback.enabled) && (
        <>
          <p className="text-xs text-(--s-subtle)">
            {t("winback.stats", {
              sent: formatNumber(winback.sentLast30Days, locale),
              pending: formatNumber(winback.pending, locale),
            })}
          </p>
          <Field label={t("winback.days")} htmlFor="winback-days">
            <DaysInput
              id="winback-days"
              value={value.days}
              onCommit={(days) => setValue((v) => ({ ...v, days }))}
              range={{ min: WINBACK_DAYS_MIN, max: WINBACK_DAYS_MAX, fallback: WINBACK_DAYS_MIN }}
            />
          </Field>
          <Field label={t("winback.subject")} htmlFor="winback-subject">
            <TextInput
              id="winback-subject"
              value={value.subject}
              maxLength={CAMPAIGN_SUBJECT_MAX}
              onChange={(e) => setValue((v) => ({ ...v, subject: e.target.value }))}
              placeholder={t("winback.subjectPlaceholder")}
            />
          </Field>
          <Field label={t("winback.body")} htmlFor="winback-body" note={t("winback.hint")}>
            <TextArea
              id="winback-body"
              value={value.body}
              maxLength={CAMPAIGN_BODY_MAX}
              rows={5}
              onChange={(e) => setValue((v) => ({ ...v, body: e.target.value }))}
              placeholder={t("winback.bodyPlaceholder")}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <SellerButton
              type="button"
              variant="solid"
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
            </SellerButton>
            <SellerButton
              type="button"
              variant="outline"
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
            </SellerButton>
            <SellerButton
              type="button"
              variant="outline"
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
            </SellerButton>
          </div>
        </>
      )}
    </SectionCard>
  );
}

const STATUS_TONE: Partial<Record<StoreCampaign["status"], BadgeTone>> = {
  sent: "success",
  sending: "info",
  scheduled: "info",
};

/** A day count that accepts Arabic digits; it only ever commits an in-range number. */
function DaysInput({ id, value, onCommit, range }: { id: string; value: number; onCommit: (days: number) => void; range: WholeNumberRange }) {
  const input = useWholeNumberInput(value, onCommit, range);
  return <TextInput id={id} dir="ltr" {...input} className="w-28" />;
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <SellerCard>
      <EmptyState icon={Mail} title={title} description={body} />
    </SellerCard>
  );
}

/** What's left this month, and buying more from the wallet (ROADMAP.md F-69). */
function EmailAllowanceLine({ allowance }: { allowance: EmailAllowance }) {
  const t = useTranslations("emailCampaigns.allowance");
  const tErrors = useTranslations("emailCampaigns.errors");
  const egpRate = useEgpRate();
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const values = {
    emails: new Intl.NumberFormat(locale).format(EMAIL_PACK_EMAILS),
    // In EGP at the live rate (owner, 2026-11-09); the pack is still charged in USD.
    price: formatUsdPrice(EMAIL_PACK_USD_CENTS, locale, egpRate),
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-(--s-muted)">
      <p>
        {t("left", {
          left: new Intl.NumberFormat(locale).format(allowance.remaining),
          monthly: new Intl.NumberFormat(locale).format(allowance.monthly),
        })}
      </p>
      <TextAction type="button" className="min-h-10" onClick={() => setOpen(true)}>
        {t("buy", values)}
      </TextAction>
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
