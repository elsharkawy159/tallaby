"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Mail, MessageCircle, Phone, ShoppingCart } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  DEFAULT_LEAD_TEMPLATES,
  leadProductsText,
  leadWhatsAppUrl,
  renderLeadMessage,
} from "@workspace/lib/checkout-leads";
import type { StoreLeadSettings } from "@workspace/lib/checkout-leads/server";
import { formatDateTime, formatMoney, formatNumber, formatRelativeTime } from "@/lib/i18n/format";
import { Money } from "@/components/money";
import { ListPager } from "../list-pager.client";
import { linesForMessage, PENDING_CART_PAGE_SIZES } from "./pending-carts.lib";
import type { PendingCartRow, PendingCartsPage } from "./pending-carts.query";

/** Orders › Pending carts: the store's carts as cards, paged by the URL. */
export function PendingCartsView({
  list,
  store,
  storeName,
}: {
  list: PendingCartsPage;
  /** The store's WhatsApp message and link; null only when there is nothing to send. */
  store: StoreLeadSettings | null;
  /** Shown when the seller has several stores. */
  storeName: string | null;
}) {
  const t = useTranslations("pendingCarts");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const go = (patch: { page?: number; size?: number }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (patch.size) params.set("size", String(patch.size));
    if (patch.page && patch.page > 1) params.set("page", String(patch.page));
    else params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="space-y-4">
      {storeName && <p className="text-xs font-medium text-muted-foreground">{t("storeLabel", { name: storeName })}</p>}

      {list.carts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ShoppingCart className="size-6" aria-hidden />
            </span>
            <p className="font-semibold">{t("empty.title")}</p>
            <p className="max-w-md text-pretty text-sm text-muted-foreground">{t("empty.body")}</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {list.carts.map((cart) => (
            <li key={cart.id}>
              <PendingCartCard cart={cart} store={store} />
            </li>
          ))}
        </ul>
      )}

      {list.total > 0 && (
        <ListPager
          page={list.page}
          pages={list.pages}
          size={list.size}
          sizes={PENDING_CART_PAGE_SIZES}
          total={list.total}
          onPage={(page) => go({ page })}
          onSize={(size) => go({ size })}
        />
      )}
    </div>
  );
}

function PendingCartCard({ cart, store }: { cart: PendingCartRow; store: StoreLeadSettings | null }) {
  const t = useTranslations("pendingCarts");
  const locale = useLocale();
  const moreLines = cart.lineCount - cart.lines.length;

  const whatsappUrl = () => {
    if (!cart.whatsappPhone || !store) return null;
    const message = renderLeadMessage(store.template ?? DEFAULT_LEAD_TEMPLATES[store.locale], {
      name: cart.name?.split(/\s+/)[0] ?? "",
      products: leadProductsText(linesForMessage(cart.lines.map((line) => line.storeTitle), cart.lineCount), store.locale),
      total: formatMoney(cart.value, store.locale, cart),
      store: store.name,
      link: store.link,
    }).replace(/ {2,}/g, " ");
    return leadWhatsAppUrl(cart.whatsappPhone, message);
  };
  const whatsapp = whatsappUrl();

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{cart.name ?? t("guest")}</p>
            {cart.phone && (
              <p dir="ltr" className="text-start text-sm tabular-nums text-muted-foreground rtl:text-end">
                {cart.phone}
              </p>
            )}
            {cart.email && (
              <a
                href={`mailto:${cart.email}`}
                dir="ltr"
                className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:underline rtl:justify-end"
              >
                <Mail className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{cart.email}</span>
              </a>
            )}
          </div>
          <time
            dateTime={cart.lastActivity}
            title={formatDateTime(cart.lastActivity, locale)}
            className="shrink-0 text-xs text-muted-foreground"
          >
            {formatRelativeTime(cart.lastActivity, locale)}
          </time>
        </div>

        <ul className="space-y-1 text-sm">
          {cart.lines.map((line, index) => (
            <li key={index} className="flex items-baseline gap-2">
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">×{formatNumber(line.quantity, locale)}</span>
              <span className="min-w-0 truncate">
                {line.title ?? t("unnamedProduct")}
                {line.variant && <span className="text-muted-foreground"> · {line.variant}</span>}
              </span>
            </li>
          ))}
          {moreLines > 0 && <li className="text-xs text-muted-foreground">{t("moreLines", { count: moreLines })}</li>}
        </ul>

        <dl className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-2 text-xs">
          <div>
            <dt className="text-muted-foreground">{t("itemsLabel")}</dt>
            <dd className="font-medium tabular-nums">{t("items", { count: cart.itemCount })}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("value")}</dt>
            <dd className="font-semibold tabular-nums"><Money value={cart.value} locale={locale} unit={cart} /></dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {whatsapp && (
            <Button asChild size="sm">
              <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden />
                {t("whatsapp")}
              </a>
            </Button>
          )}
          {cart.callPhone && (
            <Button asChild size="sm" variant="neutral">
              <a href={`tel:${cart.callPhone}`}>
                <Phone aria-hidden />
                {t("call")}
              </a>
            </Button>
          )}
          {!cart.phone && !cart.email && <p className="text-xs text-muted-foreground">{t("noContact")}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
