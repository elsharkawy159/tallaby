"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Mail, MessageCircle, Pencil, Phone, PhoneMissed, Undo2 } from "lucide-react";
import {
  DEFAULT_LEAD_TEMPLATES,
  LEAD_PLACEHOLDERS,
  LEAD_RANGES,
  LEAD_STATUSES,
  LEAD_TEMPLATE_MAX,
  leadProductsText,
  leadWhatsAppUrl,
  renderLeadMessage,
  type LeadRange,
  type LeadStatus,
} from "@workspace/lib/checkout-leads";
import type { CheckoutLeadRow, StoreLeadSettings } from "@workspace/lib/checkout-leads/server";
import { Chip, Chips, EmptyState, Modal, SellerButton, SellerCard, Tag, TextArea } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { formatDateTime, formatMoney, formatRelativeTime, moneyParams, type MoneyUnit } from "@/lib/i18n/format";
import { Money } from "@/components/money";
import { ChipLink, PhoneText } from "../orders-ui";
import { saveLeadTemplate, setLeadContacted } from "./missed-orders.server";

type Props = {
  /** Store id → its currency. A lead has no currency of its own; its amounts are its store's. */
  storeMoney: Record<string, MoneyUnit>;
  leads: CheckoutLeadRow[];
  stores: StoreLeadSettings[];
  storeId: string | null;
  range: LeadRange;
  status: LeadStatus;
};

/** Orders › Not completed: filters, the lead cards and the WhatsApp message editor. */
export function MissedOrdersView({ storeMoney, leads, stores, storeId, range, status }: Props) {
  const t = useTranslations("missedOrders");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [editing, setEditing] = useState(false);

  const href = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {stores.length > 1 && (
          <nav aria-label={t("filters.store")} className="flex flex-wrap gap-1.5">
            <ChipLink href={href({ store: null })} active={!storeId}>
              {t("filters.allStores")}
            </ChipLink>
            {stores.map((s) => (
              <ChipLink key={s.storeId} href={href({ store: s.storeId })} active={storeId === s.storeId}>
                {s.name}
              </ChipLink>
            ))}
          </nav>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <nav aria-label={t("filters.range")} className="flex flex-wrap gap-1.5">
            {LEAD_RANGES.map((r) => (
              <ChipLink key={r} href={href({ range: r === "30d" ? null : r })} active={range === r}>
                {t(`filters.ranges.${r}`)}
              </ChipLink>
            ))}
          </nav>
          <nav aria-label={t("filters.status")} className="flex flex-wrap gap-1.5">
            {LEAD_STATUSES.map((s) => (
              <ChipLink key={s} href={href({ status: s === "all" ? null : s })} active={status === s}>
                {t(`filters.statuses.${s}`)}
              </ChipLink>
            ))}
          </nav>
          <SellerButton variant="outline" size="sm" className="ms-auto max-[720px]:ms-0 max-[720px]:w-full" onClick={() => setEditing(true)}>
            <Pencil aria-hidden />
            {t("template.edit")}
          </SellerButton>
        </div>
      </div>

      {leads.length === 0 ? (
        <SellerCard>
          <EmptyState icon={PhoneMissed} title={t("empty.title")} description={t("empty.body")} />
        </SellerCard>
      ) : (
        <ul className="grid grid-cols-2 gap-3.5 max-[1020px]:grid-cols-1 max-[600px]:gap-2.5">
          {leads.map((lead) => (
            <li key={lead.id} className="min-w-0">
              <LeadCard lead={lead} money={storeMoney[lead.storeId]} showStore={stores.length > 1} />
            </li>
          ))}
        </ul>
      )}

      <TemplateDialog storeMoney={storeMoney} open={editing} onOpenChange={setEditing} stores={stores} initialStoreId={storeId} />
    </>
  );
}

function LeadCard({ lead, money, showStore }: { lead: CheckoutLeadRow; money?: MoneyUnit; showStore: boolean }) {
  const t = useTranslations("missedOrders");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const totalText = formatMoney(lead.total ?? lead.subtotal, lead.storeLocale, money);
  const message = renderLeadMessage(lead.template ?? DEFAULT_LEAD_TEMPLATES[lead.storeLocale], {
    name: lead.fullName.split(/\s+/)[0] ?? lead.fullName,
    products: leadProductsText(lead.items, lead.storeLocale),
    total: totalText,
    store: lead.storeName,
    link: lead.storeLink,
  });
  const itemCount = lead.items.reduce((sum, item) => sum + item.quantity, 0);

  const toggleContacted = (contacted: boolean) =>
    startTransition(async () => {
      const result = await setLeadContacted({ storeId: lead.storeId, leadId: lead.id, contacted });
      if (result.success) {
        toast.success(contacted ? t("markedContacted") : t("unmarkedContacted"));
        router.refresh();
      } else toast.error(t(`errors.${result.error}`));
    });

  return (
    <SellerCard className={cn("flex h-full flex-col gap-3 p-[18px] max-[600px]:p-3.5", lead.contactedAt && "opacity-80")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-bold text-(--s-text)">{lead.fullName}</p>
          <p className="text-[13px] text-(--s-muted)">
            <PhoneText phone={lead.phone} />
          </p>
          {(lead.governorate || lead.city) && (
            <p className="break-words text-xs text-(--s-subtle)">{[lead.city, lead.governorate].filter(Boolean).join("، ")}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-(--s-subtle)">
          <time dateTime={lead.updatedAt} title={formatDateTime(lead.updatedAt, locale)} suppressHydrationWarning>
            {t("leftAgo", { time: formatRelativeTime(lead.updatedAt, locale) })}
          </time>
          {showStore && <Tag>{lead.storeName}</Tag>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex shrink-0 -space-x-2 rtl:space-x-reverse">
          {lead.items.slice(0, 4).map((item) =>
            item.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote product photos of any host
              <img
                key={item.productId}
                src={item.image}
                alt=""
                className="size-10 rounded-xl border-2 border-(--s-surface) object-cover"
              />
            ) : (
              <span key={item.productId} className="size-10 rounded-xl border-2 border-(--s-surface) bg-(--s-fill)" />
            ),
          )}
        </div>
        <p className="line-clamp-2 min-w-0 flex-1 break-words text-[13px] text-(--s-text)">
          {leadProductsText(lead.items, locale === "en" ? "en" : "ar")}
          <span className="text-(--s-subtle)"> ({t("items", { count: itemCount })})</span>
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-2 rounded-2xl bg-(--s-tint) p-3 text-xs">
        <div className="min-w-0">
          <dt className="text-(--s-subtle)">{t("subtotal")}</dt>
          <dd className="break-words font-montserrat font-semibold text-(--s-text) tabular-nums">
            <Money value={lead.subtotal} locale={locale} unit={money} />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-(--s-subtle)">{t("shipping")}</dt>
          <dd className="break-words font-montserrat font-semibold text-(--s-text) tabular-nums">
            {lead.shipping == null ? "—" : <Money value={lead.shipping} locale={locale} unit={money} />}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-(--s-subtle)">{t("total")}</dt>
          <dd className="break-words font-montserrat font-bold text-(--s-ink) tabular-nums">
            {lead.total == null ? "—" : <Money value={lead.total} locale={locale} unit={money} />}
          </dd>
        </div>
      </dl>

      {(lead.emailSentAt || lead.contactedAt) && (
        <div className="flex flex-wrap gap-1.5">
          {lead.emailSentAt && (
            <Tag tone="info">
              <Mail aria-hidden />
              {t("emailSent", { time: formatRelativeTime(lead.emailSentAt, locale) })}
            </Tag>
          )}
          {lead.contactedAt && (
            <Tag tone="success">
              <Check aria-hidden />
              {t("contacted", { time: formatRelativeTime(lead.contactedAt, locale) })}
            </Tag>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <SellerButton asChild variant="whatsapp" size="sm" className="flex-1">
          <a href={leadWhatsAppUrl(lead.phone, message)} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden />
            {t("whatsapp")}
          </a>
        </SellerButton>
        <SellerButton asChild variant="outline" size="sm" className="flex-1">
          <a href={`tel:${lead.phone}`}>
            <Phone aria-hidden />
            {t("call")}
          </a>
        </SellerButton>
        {lead.contactedAt ? (
          <SellerButton variant="mini" size="sm" className="flex-1" disabled={pending} onClick={() => toggleContacted(false)}>
            <Undo2 aria-hidden />
            {t("unmark")}
          </SellerButton>
        ) : (
          <SellerButton variant="mini" size="sm" className="flex-1" disabled={pending} onClick={() => toggleContacted(true)}>
            <Check aria-hidden />
            {t("markContacted")}
          </SellerButton>
        )}
      </div>
    </SellerCard>
  );
}

function TemplateDialog({
  open,
  onOpenChange,
  stores,
  initialStoreId,
  storeMoney,
}: {
  storeMoney: Record<string, MoneyUnit>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: StoreLeadSettings[];
  initialStoreId: string | null;
}) {
  const t = useTranslations("missedOrders.template");
  const locale = useLocale();
  const tErr = useTranslations("missedOrders.errors");
  const router = useRouter();
  const [storeId, setStoreId] = useState(initialStoreId ?? stores[0]?.storeId ?? "");
  const store = stores.find((s) => s.storeId === storeId) ?? null;
  const [text, setText] = useState(() => store?.template ?? (store ? DEFAULT_LEAD_TEMPLATES[store.locale] : ""));
  const [saving, startSaving] = useTransition();

  const pickStore = (id: string) => {
    setStoreId(id);
    const next = stores.find((s) => s.storeId === id);
    setText(next?.template ?? (next ? DEFAULT_LEAD_TEMPLATES[next.locale] : ""));
  };

  const preview = useMemo(
    () =>
      store
        ? renderLeadMessage(text, {
            name: t("sample.name"),
            products: t("sample.products"),
            total: t("sample.total", moneyParams(locale, storeMoney[store.storeId])),
            store: store.name,
            link: store.link,
          })
        : "",
    [store, text, t, locale, storeMoney],
  );

  const save = (template: string | null) =>
    startSaving(async () => {
      if (!store) return;
      const result = await saveLeadTemplate({ storeId: store.storeId, template });
      if (result.success) {
        toast.success(t("saved"));
        if (template === null) setText(DEFAULT_LEAD_TEMPLATES[store.locale]);
        router.refresh();
      } else toast.error(tErr(result.error));
    });

  if (!store) return null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      width={512}
      className="max-h-[90dvh] overflow-y-auto"
      title={t("title")}
      description={t("description")}
      footer={
        <>
          <SellerButton variant="outline" className="h-auto min-h-[42px] min-w-0 shrink whitespace-normal py-1.5 leading-tight" disabled={saving} onClick={() => save(null)}>
            {t("useDefault")}
          </SellerButton>
          <SellerButton variant="solid" className="h-auto min-h-[42px] min-w-0 shrink whitespace-normal py-1.5 leading-tight" disabled={saving || !text.trim()} onClick={() => save(text)}>
            {t("save")}
          </SellerButton>
        </>
      }
    >
      {stores.length > 1 && (
        <Chips>
          {stores.map((s) => (
            <Chip key={s.storeId} pressed={s.storeId === storeId} onClick={() => pickStore(s.storeId)}>
              {s.name}
            </Chip>
          ))}
        </Chips>
      )}
      <div className="flex flex-col gap-1.5">
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, LEAD_TEMPLATE_MAX))}
          rows={6}
          aria-label={t("label")}
        />
        <p className="flex flex-wrap justify-between gap-2 text-xs text-(--s-subtle)">
          <span className="min-w-0">
            {t("placeholders")} <bdi dir="ltr">{LEAD_PLACEHOLDERS.join(" ")}</bdi>
          </span>
          <span className="tabular-nums">
            {text.length}/{LEAD_TEMPLATE_MAX}
          </span>
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-(--s-subtle)">{t("preview")}</p>
        <p className="whitespace-pre-wrap break-words rounded-2xl bg-success-soft p-3 text-[13px] text-(--s-text)">{preview}</p>
      </div>
    </Modal>
  );
}
