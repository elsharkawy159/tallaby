import { createElement } from "react";
import { db, eq, storeStockSubscriptions } from "@workspace/db";
import { BackInStockEmail, emailPathPrefix, getEmailMessages, interpolate, resolveEmailLocale } from "@workspace/emails";
import { formatVariantTitleFromCart, pickProductTitle } from "@workspace/lib/orders";
import { stockAlertUnsubscribeUrl } from "@workspace/lib/stock-alerts";
import { ORDERS_FROM_ADDRESS } from "../resend";
import { EMAIL_TYPES } from "../email-delivery";
import { joinUrl, resolveImageUrl } from "./format";
import { sendOnce, type SendOnceResult } from "./send-once";
import { loadStoreEmailContext } from "./store-brand";

const skipped = (reason: string): SendOnceResult => ({ status: "skipped", reason });

/**
 * Back-in-stock alert (0126, ROADMAP.md F-23a). The ecommerce stock-alerts
 * cron claims the subscription (notified_at) and calls this once per id; the
 * email_deliveries claim (type + subscription id) makes a repeat a no-op.
 * Store-branded, in the subscriber's locale, with a link to the product on
 * the store's own site and an unsubscribe link.
 */
export async function sendBackInStock(subscriptionId: string): Promise<SendOnceResult> {
  const sub = await db.query.storeStockSubscriptions.findFirst({
    where: eq(storeStockSubscriptions.id, subscriptionId),
    with: {
      product: {
        columns: { id: true, sellerId: true, sku: true, images: true },
        with: { productTranslations: { columns: { locale: true, title: true, slug: true } } },
      },
      variant: { columns: { title: true, option1: true, option2: true, option3: true, imageUrl: true } },
    },
  });
  if (!sub || !sub.product) return skipped("not_found");
  if (sub.cancelledAt) return skipped("cancelled");
  if (sub.product.sellerId !== sub.sellerId) return skipped("not_found");

  const locale = resolveEmailLocale(sub.locale);
  const store = await loadStoreEmailContext(sub.storeId, locale);
  if (!store || store.sellerId !== sub.sellerId) return skipped("no_store");

  const translations = sub.product.productTranslations ?? [];
  const name = pickProductTitle(
    translations.map((t) => ({ locale: t.locale, title: t.title ?? "" })).filter((t) => t.title),
    locale,
    sub.product.sku,
    sub.product.id,
  );
  const slug =
    translations.find((t) => t.locale === locale && t.slug)?.slug ?? translations.find((t) => t.slug)?.slug ?? null;
  const productPath = slug ? `/products/${encodeURIComponent(slug)}` : "/products";

  return sendOnce({
    emailType: EMAIL_TYPES.backInStock,
    referenceId: sub.id,
    recipient: sub.email,
    subject: interpolate(getEmailMessages(locale).backInStock.subject, { product: name }),
    content: createElement(BackInStockEmail, {
      locale,
      brand: store.brand,
      storeName: store.name,
      product: {
        name,
        variant: formatVariantTitleFromCart(sub.variant),
        imageUrl: resolveImageUrl(sub.variant?.imageUrl) ?? resolveImageUrl(sub.product.images),
      },
      links: {
        product: joinUrl(store.url, `${emailPathPrefix(locale)}${productPath}`),
        unsubscribe: stockAlertUnsubscribeUrl(store.url, sub.unsubscribeToken),
      },
    }),
    from: ORDERS_FROM_ADDRESS,
    fromName: store.name,
    metadata: { storeId: sub.storeId, productId: sub.productId },
  });
}
