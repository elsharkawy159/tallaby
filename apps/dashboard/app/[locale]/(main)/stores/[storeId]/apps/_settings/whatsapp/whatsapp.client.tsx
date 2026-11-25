"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Ban,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  History,
  LoaderCircle,
  MessageCircle,
  Send,
  ThumbsUp,
  Wallet,
  XCircle,
} from "lucide-react";

import { WHATSAPP_EVENTS, WHATSAPP_MESSAGE_STATUSES, type WhatsAppEvent, type WhatsAppLocale } from "@workspace/lib/whatsapp/events";
import type {
  StoreWhatsAppMessageRow,
  StoreWhatsAppMessagesPage,
  StoreWhatsAppOverview,
} from "@workspace/lib/whatsapp/store/server";
import { Link } from "@/i18n/navigation";
import {
  CheckRow,
  EmptyState,
  Note,
  NativeSelect,
  ResponsiveTable,
  SectionCard,
  SellerButton,
  SellerCard,
  StatItem,
  StatStrip,
  StatusBadge,
  Tag,
  Toggle,
  type BadgeTone,
  type Column,
} from "@/components/seller-ui";
import { formatDateTime, formatNumber, formatUsdPrice } from "@/lib/i18n/format";
import { loadWhatsAppMessages, saveWhatsAppSettings } from "./whatsapp.server";
import { whatsAppEventPreview } from "./whatsapp-preview.lib";

const STATUS_TONE: Record<string, BadgeTone> = {
  queued: "muted",
  sending: "info",
  sent: "info",
  delivered: "success",
  read: "success",
  failed: "danger",
  skipped: "muted",
  unknown: "warning",
};

/**
 * Store › Apps › WhatsApp notifications (ROADMAP.md F-109, docs/whatsapp.md §5).
 * The seller turns WhatsApp on for the store and picks the order updates; each
 * update shows the fixed Tallaby message with the store's name. While the admin
 * has WhatsApp off, everything is read-only with a "Coming soon" note.
 */
export function WhatsAppApp({
  storeId,
  storeName,
  readOnly,
  overview,
  initialMessages,
}: {
  storeId: string;
  storeName: string;
  readOnly: boolean;
  overview: StoreWhatsAppOverview;
  initialMessages: StoreWhatsAppMessagesPage;
}) {
  const t = useTranslations("whatsappApp");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const comingSoon = !overview.global.enabled;
  const locked = comingSoon || readOnly;
  const globalEvents = new Set<WhatsAppEvent>(overview.global.eventsEnabled);

  const [saved, setSaved] = useState(overview.store);
  const [events, setEvents] = useState<WhatsAppEvent[]>(overview.store.events);
  const [previewing, setPreviewing] = useState<WhatsAppEvent | null>(null);
  const dirty = events.length !== saved.events.length || events.some((event) => !saved.events.includes(event));
  const on = saved.enabled && !comingSoon;

  const save = (enabled: boolean, nextEvents: WhatsAppEvent[], message: string) => {
    startTransition(async () => {
      const result = await saveWhatsAppSettings(storeId, { enabled, events: nextEvents });
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setSaved(result.data);
      setEvents(result.data.events);
      toast.success(message);
    });
  };

  const toggleEvent = (event: WhatsAppEvent, checked: boolean) => {
    setEvents((current) => WHATSAPP_EVENTS.filter((e) => (e === event ? checked : current.includes(e))));
  };

  return (
    <div className="flex flex-col gap-5">
      <SellerCard className="flex flex-wrap items-center gap-4 px-6 py-5 max-[720px]:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-[15px] text-(--s-ink)">{t("switch.title")}</b>
            {comingSoon ? (
              <Tag tone="warning">{t("comingSoon.badge")}</Tag>
            ) : on ? (
              <StatusBadge tone="success">{t("switch.on")}</StatusBadge>
            ) : (
              <Tag>{t("switch.off")}</Tag>
            )}
            <Tag tone="info">{t("free")}</Tag>
          </div>
          <p className="mt-1 text-pretty text-[13px] text-(--s-subtle)">
            {comingSoon ? t("comingSoon.switchBody") : on ? t("switch.onBody") : t("switch.offBody")}
          </p>
          <p className="mt-1 text-pretty text-xs text-(--s-faint)">{t("switch.from")}</p>
        </div>
        <Toggle
          checked={on}
          disabled={pending || locked}
          onCheckedChange={(next) => save(next, events, next ? t("switch.turnedOn") : t("switch.turnedOff"))}
          label={<span className="sr-only">{t("switch.title")}</span>}
        />
        {pending && <LoaderCircle className="size-4 animate-spin text-(--s-subtle)" aria-hidden />}
      </SellerCard>

      {comingSoon && (
        <Note tone="amber" icon={Clock}>
          <b className="block text-(--s-ink)">{t("comingSoon.title")}</b>
          {t("comingSoon.body")}
        </Note>
      )}
      {readOnly && !comingSoon && <Note tone="amber">{t("readOnly")}</Note>}

      <SectionCard
        icon={MessageCircle}
        tone="success"
        title={t("events.title")}
        description={t("events.description")}
        action={
          !locked && dirty ? (
            <SellerButton size="sm" variant="solid" disabled={pending} onClick={() => save(saved.enabled, events, t("events.saved"))}>
              {t("events.save")}
            </SellerButton>
          ) : null
        }
      >
        <ul className="flex flex-col divide-y divide-(--s-line-soft)">
          {WHATSAPP_EVENTS.map((event) => {
            const pausedGlobally = !comingSoon && !globalEvents.has(event);
            const open = previewing === event;
            return (
              <li key={event} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <CheckRow
                    className="min-w-0 flex-1"
                    checked={events.includes(event)}
                    disabled={locked || pending}
                    onChange={(e) => toggleEvent(event, e.target.checked)}
                    label={
                      <span className="flex flex-wrap items-center gap-2 font-semibold text-(--s-ink)">
                        {t(`events.items.${event}.label`)}
                        {pausedGlobally && <Tag tone="muted">{t("events.pausedGlobally")}</Tag>}
                      </span>
                    }
                    description={t(`events.items.${event}.description`)}
                  />
                  <SellerButton
                    size="xs"
                    variant="mini"
                    aria-expanded={open}
                    onClick={() => setPreviewing(open ? null : event)}
                  >
                    <Eye aria-hidden />
                    {open ? t("events.hidePreview") : t("events.preview")}
                  </SellerButton>
                </div>
                {open && (
                  <div className="grid grid-cols-2 gap-3 max-[720px]:grid-cols-1">
                    {(["ar", "en"] as const satisfies readonly WhatsAppLocale[]).map((language) => (
                      <figure key={language} className="flex flex-col gap-1.5">
                        <figcaption className="text-xs font-semibold text-(--s-subtle)">{t(`events.previewLanguage.${language}`)}</figcaption>
                        <p
                          dir={language === "ar" ? "rtl" : "ltr"}
                          lang={language}
                          className="whitespace-pre-line rounded-2xl rounded-ss-sm bg-[#E7FFDB] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#111B21] shadow-[0_1px_1px_rgb(0_0_0/0.08)]"
                        >
                          {whatsAppEventPreview(event, language, storeName)}
                        </p>
                      </figure>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <section aria-label={t("stats.title", { days: overview.stats.days })} className="flex flex-col gap-2">
        <h2 className="px-1 text-[13px] font-semibold text-(--s-muted)">{t("stats.title", { days: overview.stats.days })}</h2>
        <StatStrip>
          <StatItem icon={Send} tone="info" label={t("stats.sent")} value={formatNumber(overview.stats.sent, locale)} />
          <StatItem icon={CheckCheck} tone="success" label={t("stats.delivered")} value={formatNumber(overview.stats.delivered, locale)} />
          <StatItem icon={Eye} tone="success" label={t("stats.read")} value={formatNumber(overview.stats.read, locale)} />
          <StatItem icon={XCircle} tone="danger" label={t("stats.failed")} value={formatNumber(overview.stats.failed, locale)} />
          <StatItem icon={ThumbsUp} tone="primary" label={t("stats.confirmed")} value={formatNumber(overview.stats.confirmedByButton, locale)} />
          <StatItem icon={Ban} tone="neutral" label={t("stats.cancelled")} value={formatNumber(overview.stats.cancelledByButton, locale)} />
          <StatItem
            icon={Wallet}
            tone="accent"
            label={t("stats.cost")}
            value={overview.stats.costUsdCents === 0 ? t("price.free") : formatUsdPrice(overview.stats.costUsdCents, locale, null)}
          />
        </StatStrip>
      </section>

      <MessageHistory storeId={storeId} initial={initialMessages} />
    </div>
  );
}

function MessageHistory({ storeId, initial }: { storeId: string; initial: StoreWhatsAppMessagesPage }) {
  const t = useTranslations("whatsappApp");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState<string>("");
  const [event, setEvent] = useState<string>("");
  const filtered = Boolean(status || event);

  const load = (next: { page: number; status: string; event: string }) => {
    startTransition(async () => {
      const result = await loadWhatsAppMessages(storeId, {
        page: next.page,
        status: next.status || null,
        event: next.event || null,
      });
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setData(result.data);
    });
  };

  const eventLabel = (value: string) =>
    (WHATSAPP_EVENTS as readonly string[]).includes(value) ? t(`events.items.${value}.label`) : t("history.reply");

  const columns: Column<StoreWhatsAppMessageRow>[] = [
    {
      key: "order",
      header: t("history.columns.order"),
      phone: "title",
      cell: (row) =>
        row.orderId && row.orderNumber ? (
          <Link href={`/orders?order=${encodeURIComponent(row.orderId)}`} className="font-semibold text-(--s-link) hover:underline">
            <bdi dir="ltr">{row.orderNumber}</bdi>
          </Link>
        ) : (
          <span className="text-(--s-faint)">—</span>
        ),
    },
    {
      key: "status",
      header: t("history.columns.status"),
      phone: "end",
      cell: (row) => <StatusBadge tone={STATUS_TONE[row.status] ?? "muted"}>{t(`history.status.${row.status}`)}</StatusBadge>,
    },
    { key: "event", header: t("history.columns.event"), phone: "sub", cell: (row) => eventLabel(row.event) },
    {
      key: "time",
      header: t("history.columns.time"),
      phone: "endSub",
      cell: (row) => <span className="whitespace-nowrap text-(--s-subtle)">{formatDateTime(row.createdAt, locale)}</span>,
    },
    {
      key: "phone",
      header: t("history.columns.phone"),
      cell: (row) => (
        <bdi dir="ltr" className="tabular-nums">
          {row.phone || "—"}
        </bdi>
      ),
    },
    {
      key: "price",
      header: t("history.columns.price"),
      wideOnly: true,
      cell: (row) => (row.priceUsdCents === 0 ? t("price.free") : formatUsdPrice(row.priceUsdCents, locale, null)),
    },
  ];

  return (
    <SectionCard
      icon={History}
      title={t("history.title")}
      description={t("history.description")}
      action={pending ? <LoaderCircle className="size-4 animate-spin text-(--s-subtle)" aria-hidden /> : null}
    >
      <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
        <NativeSelect
          aria-label={t("history.filters.status")}
          value={status}
          disabled={pending}
          onChange={(e) => {
            setStatus(e.target.value);
            load({ page: 1, status: e.target.value, event });
          }}
        >
          <option value="">{t("history.filters.allStatuses")}</option>
          {WHATSAPP_MESSAGE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`history.status.${value}`)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={t("history.filters.event")}
          value={event}
          disabled={pending}
          onChange={(e) => {
            setEvent(e.target.value);
            load({ page: 1, status, event: e.target.value });
          }}
        >
          <option value="">{t("history.filters.allEvents")}</option>
          {WHATSAPP_EVENTS.map((value) => (
            <option key={value} value={value}>
              {t(`events.items.${value}.label`)}
            </option>
          ))}
        </NativeSelect>
      </div>

      {data.rows.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title={filtered ? t("history.emptyFilteredTitle") : t("history.emptyTitle")}
          description={filtered ? t("history.emptyFilteredBody") : t("history.emptyBody")}
        />
      ) : (
        <div className="-mx-6 max-[720px]:-mx-4">
          <ResponsiveTable label={t("history.title")} columns={columns} rows={data.rows} rowKey={(row) => row.id} />
        </div>
      )}

      {data.pageCount > 1 && (
        <nav aria-label={t("history.pagination")} className="flex items-center justify-between gap-3">
          <SellerButton
            size="xs"
            variant="mini"
            disabled={pending || data.page <= 1}
            onClick={() => load({ page: data.page - 1, status, event })}
          >
            <ChevronRight aria-hidden className="ltr:rotate-180" />
            {t("history.previous")}
          </SellerButton>
          <span className="text-xs text-(--s-subtle)">
            {t("history.page", { page: formatNumber(data.page, locale), pages: formatNumber(data.pageCount, locale) })}
          </span>
          <SellerButton
            size="xs"
            variant="mini"
            disabled={pending || data.page >= data.pageCount}
            onClick={() => load({ page: data.page + 1, status, event })}
          >
            {t("history.next")}
            <ChevronLeft aria-hidden className="ltr:rotate-180" />
          </SellerButton>
        </nav>
      )}
    </SectionCard>
  );
}
