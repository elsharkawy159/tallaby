"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Mail, MessageCircle, Pencil, Phone, PhoneMissed, Undo2 } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
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
import { formatDateTime, formatMoney, formatRelativeTime } from "@/lib/i18n/format";
import { saveLeadTemplate, setLeadContacted } from "./missed-orders.server";

type Props = {
  leads: CheckoutLeadRow[];
  stores: StoreLeadSettings[];
  storeId: string | null;
  range: LeadRange;
  status: LeadStatus;
};

/** Orders › Not completed: filters, the lead cards and the WhatsApp message editor. */
export function MissedOrdersView({ leads, stores, storeId, range, status }: Props) {
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

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {stores.length > 1 && (
          <nav aria-label={t("filters.store")} className="flex flex-wrap gap-1.5">
            <Link href={href({ store: null })} className={chip(!storeId)} scroll={false}>
              {t("filters.allStores")}
            </Link>
            {stores.map((s) => (
              <Link key={s.storeId} href={href({ store: s.storeId })} className={chip(storeId === s.storeId)} scroll={false}>
                {s.name}
              </Link>
            ))}
          </nav>
        )}
        <nav aria-label={t("filters.range")} className="flex flex-wrap gap-1.5">
          {LEAD_RANGES.map((r) => (
            <Link key={r} href={href({ range: r === "30d" ? null : r })} className={chip(range === r)} scroll={false}>
              {t(`filters.ranges.${r}`)}
            </Link>
          ))}
        </nav>
        <nav aria-label={t("filters.status")} className="flex flex-wrap gap-1.5">
          {LEAD_STATUSES.map((s) => (
            <Link key={s} href={href({ status: s === "all" ? null : s })} className={chip(status === s)} scroll={false}>
              {t(`filters.statuses.${s}`)}
            </Link>
          ))}
        </nav>
        <Button type="button" variant="neutral" size="sm" className="ms-auto" onClick={() => setEditing(true)}>
          <Pencil aria-hidden />
          {t("template.edit")}
        </Button>
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <PhoneMissed className="size-6" aria-hidden />
            </span>
            <p className="font-semibold">{t("empty.title")}</p>
            <p className="max-w-md text-pretty text-sm text-muted-foreground">{t("empty.body")}</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {leads.map((lead) => (
            <li key={lead.id}>
              <LeadCard lead={lead} showStore={stores.length > 1} />
            </li>
          ))}
        </ul>
      )}

      <TemplateDialog open={editing} onOpenChange={setEditing} stores={stores} initialStoreId={storeId} />
    </div>
  );
}

function LeadCard({ lead, showStore }: { lead: CheckoutLeadRow; showStore: boolean }) {
  const t = useTranslations("missedOrders");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const totalText = formatMoney(lead.total ?? lead.subtotal, lead.storeLocale);
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
    <Card className={cn("h-full", lead.contactedAt && "opacity-80")}>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{lead.fullName}</p>
            <p dir="ltr" className="text-start text-sm tabular-nums text-muted-foreground rtl:text-end">
              {lead.phone}
            </p>
            {(lead.governorate || lead.city) && (
              <p className="truncate text-xs text-muted-foreground">
                {[lead.city, lead.governorate].filter(Boolean).join("، ")}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
            <time dateTime={lead.updatedAt} title={formatDateTime(lead.updatedAt, locale)}>
              {t("leftAgo", { time: formatRelativeTime(lead.updatedAt, locale) })}
            </time>
            {showStore && <Badge variant="outline">{lead.storeName}</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 rtl:space-x-reverse">
            {lead.items.slice(0, 4).map((item) =>
              item.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote product photos of any host
                <img
                  key={item.productId}
                  src={item.image}
                  alt=""
                  className="size-10 rounded-lg border-2 border-background object-cover"
                />
              ) : (
                <span key={item.productId} className="size-10 rounded-lg border-2 border-background bg-muted" />
              ),
            )}
          </div>
          <p className="min-w-0 flex-1 truncate text-sm">
            {leadProductsText(lead.items, locale === "en" ? "en" : "ar")}
            <span className="text-muted-foreground"> · {t("items", { count: itemCount })}</span>
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2 text-xs">
          <div>
            <dt className="text-muted-foreground">{t("subtotal")}</dt>
            <dd className="font-medium tabular-nums">{formatMoney(lead.subtotal, locale)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("shipping")}</dt>
            <dd className="font-medium tabular-nums">{lead.shipping == null ? "—" : formatMoney(lead.shipping, locale)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("total")}</dt>
            <dd className="font-semibold tabular-nums">{lead.total == null ? "—" : formatMoney(lead.total, locale)}</dd>
          </div>
        </dl>

        {(lead.emailSentAt || lead.contactedAt) && (
          <div className="flex flex-wrap gap-1.5">
            {lead.emailSentAt && (
              <Badge variant="outline" className="gap-1">
                <Mail className="size-3" aria-hidden />
                {t("emailSent", { time: formatRelativeTime(lead.emailSentAt, locale) })}
              </Badge>
            )}
            {lead.contactedAt && (
              <Badge variant="outline" className="gap-1">
                <Check className="size-3" aria-hidden />
                {t("contacted", { time: formatRelativeTime(lead.contactedAt, locale) })}
              </Badge>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <Button asChild size="sm">
            <a href={leadWhatsAppUrl(lead.phone, message)} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden />
              {t("whatsapp")}
            </a>
          </Button>
          <Button asChild size="sm" variant="neutral">
            <a href={`tel:${lead.phone}`}>
              <Phone aria-hidden />
              {t("call")}
            </a>
          </Button>
          {lead.contactedAt ? (
            <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => toggleContacted(false)}>
              <Undo2 aria-hidden />
              {t("unmark")}
            </Button>
          ) : (
            <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => toggleContacted(true)}>
              <Check aria-hidden />
              {t("markContacted")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateDialog({
  open,
  onOpenChange,
  stores,
  initialStoreId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: StoreLeadSettings[];
  initialStoreId: string | null;
}) {
  const t = useTranslations("missedOrders.template");
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
            total: t("sample.total"),
            store: store.name,
            link: store.link,
          })
        : "",
    [store, text, t],
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {stores.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {stores.map((s) => (
              <Button
                key={s.storeId}
                type="button"
                size="sm"
                variant={s.storeId === storeId ? "default" : "neutral"}
                onClick={() => pickStore(s.storeId)}
              >
                {s.name}
              </Button>
            ))}
          </div>
        )}
        <div className="space-y-1.5">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, LEAD_TEMPLATE_MAX))}
            rows={6}
            aria-label={t("label")}
          />
          <p className="flex justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {t("placeholders")} <span dir="ltr">{LEAD_PLACEHOLDERS.join(" ")}</span>
            </span>
            <span className="tabular-nums">
              {text.length}/{LEAD_TEMPLATE_MAX}
            </span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{t("preview")}</p>
          <p className="whitespace-pre-wrap rounded-xl bg-success-soft p-3 text-sm">{preview}</p>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" disabled={saving} onClick={() => save(null)}>
            {t("useDefault")}
          </Button>
          <Button type="button" disabled={saving || !text.trim()} onClick={() => save(text)}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
