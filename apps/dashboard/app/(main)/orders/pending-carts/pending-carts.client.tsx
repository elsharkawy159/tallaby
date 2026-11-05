"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Mail, MessageCircle, Phone, ShoppingCart } from "lucide-react";
import {
  DEFAULT_LEAD_TEMPLATES,
  leadProductsText,
  leadWhatsAppUrl,
  renderLeadMessage,
} from "@workspace/lib/checkout-leads";
import type { StoreLeadSettings } from "@workspace/lib/checkout-leads/server";
import { EmptyState, SellerButton, SellerCard } from "@/components/seller-ui";
import { formatDateTime, formatMoney, formatNumber, formatRelativeTime } from "@/lib/i18n/format";
import { Money } from "@/components/money";
import { ListPager } from "../list-pager.client";
import { PhoneText } from "../orders-ui";
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
    <>
      {storeName && <p className="text-xs font-semibold text-(--s-subtle)">{t("storeLabel", { name: storeName })}</p>}

      {list.carts.length === 0 ? (
        <SellerCard>
          <EmptyState icon={ShoppingCart} title={t("empty.title")} description={t("empty.body")} />
        </SellerCard>
      ) : (
        <ul className="grid grid-cols-2 gap-3.5 max-[1020px]:grid-cols-1 max-[600px]:gap-2.5">
          {list.carts.map((cart) => (
            <li key={cart.id} className="min-w-0">
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
    </>
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
    <SellerCard className="flex h-full flex-col gap-3 p-[18px] max-[600px]:p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-bold text-(--s-text)">{cart.name ?? t("guest")}</p>
          {cart.phone && (
            <p className="text-[13px] text-(--s-muted)">
              <PhoneText phone={cart.phone} />
            </p>
          )}
          {cart.email && (
            <a
              href={`mailto:${cart.email}`}
              className="flex items-center gap-1 text-xs text-(--s-subtle) hover:underline max-[600px]:min-h-10"
            >
              <Mail className="size-3 shrink-0" aria-hidden />
              <bdi dir="ltr" className="min-w-0 break-all">
                {cart.email}
              </bdi>
            </a>
          )}
        </div>
        <time dateTime={cart.lastActivity} title={formatDateTime(cart.lastActivity, locale)} className="shrink-0 text-xs text-(--s-subtle)" suppressHydrationWarning>
          {formatRelativeTime(cart.lastActivity, locale)}
        </time>
      </div>

      <ul className="flex flex-col gap-1 text-[13px] text-(--s-text)">
        {cart.lines.map((line, index) => (
          <li key={index} className="flex items-baseline gap-2">
            <span className="shrink-0 font-montserrat text-xs text-(--s-subtle) tabular-nums">×{formatNumber(line.quantity, locale)}</span>
            <span className="min-w-0 break-words">
              {line.title ?? t("unnamedProduct")}
              {line.variant && <span className="text-(--s-subtle)"> ({line.variant})</span>}
            </span>
          </li>
        ))}
        {moreLines > 0 && <li className="text-xs text-(--s-subtle)">{t("moreLines", { count: moreLines })}</li>}
      </ul>

      <dl className="grid grid-cols-2 gap-2 rounded-2xl bg-(--s-tint) p-3 text-xs">
        <div className="min-w-0">
          <dt className="text-(--s-subtle)">{t("itemsLabel")}</dt>
          <dd className="font-semibold text-(--s-text)">{t("items", { count: cart.itemCount })}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-(--s-subtle)">{t("value")}</dt>
          <dd className="break-words font-montserrat font-bold text-(--s-ink) tabular-nums">
            <Money value={cart.value} locale={locale} unit={cart} />
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {whatsapp && (
          <SellerButton asChild variant="whatsapp" size="sm" className="flex-1">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden />
              {t("whatsapp")}
            </a>
          </SellerButton>
        )}
        {cart.callPhone && (
          <SellerButton asChild variant="outline" size="sm" className="flex-1">
            <a href={`tel:${cart.callPhone}`}>
              <Phone aria-hidden />
              {t("call")}
            </a>
          </SellerButton>
        )}
        {!cart.phone && !cart.email && <p className="text-xs text-(--s-subtle)">{t("noContact")}</p>}
      </div>
    </SellerCard>
  );
}
