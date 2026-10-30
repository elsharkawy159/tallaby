import { redirect } from "@/i18n/navigation";
import { getOrderConfirmationData } from "./order-confirmation.server";
import { OrderConfirmationContent } from "./order-confirmation.chunks";
import { OrderRealtime } from "./order-realtime";
import { OrderPolling } from "./order-polling";
import { getAuthUser } from "@/lib/auth/current-user";
import { getLocale, getTranslations } from "next-intl/server";
import { verifyOrderAccess } from "@/lib/order-access-token";
import { getRequestStoreSubdomain, getStorefrontBySubdomain } from "@/lib/storefront.server";
import { CONTACT } from "@/lib/marketing/site.lib";
import { whatsappNumber } from "@/app/[locale]/(shop)/storefront/[subdomain]/_components/storefront-footer";
import { getStoreThankYouView } from "./store-thank-you.server";
import { StoreThankYou } from "./store-thank-you";
import { reorderAccess } from "@/lib/reorder/reorder.server";
import { OrderReorderButton } from "./order-reorder-button";

const FINAL_ORDER_STATUSES = new Set(["delivered", "cancelled", "refunded", "returned"]);

/** "Need help?" goes to the store on its own website, to Tallaby elsewhere. */
async function getSupportHref(): Promise<string | null> {
  const subdomain = await getRequestStoreSubdomain();
  if (!subdomain) return CONTACT.whatsapp;
  const store = await getStorefrontBySubdomain(subdomain);
  const whatsapp = store?.supportWhatsapp ? whatsappNumber(store.supportWhatsapp) : null;
  if (whatsapp) return `https://wa.me/${whatsapp}`;
  return store?.supportPhone ? `tel:${store.supportPhone.replace(/[^\d+]/g, "")}` : null;
}

interface OrderConfirmationDataProps {
  orderId: string;
  accessToken?: string;
  autoExpandReviewItemId?: string;
}

export async function OrderConfirmationData({
  orderId,
  accessToken,
  autoExpandReviewItemId,
}: OrderConfirmationDataProps) {
  const result = await getOrderConfirmationData(orderId, accessToken);
  const locale = await getLocale();
  const t = await getTranslations("orders");

  // Only a real Supabase session can join the order's private channel. Guests
  // (cookie or access-token) poll instead.
  const authUser = await getAuthUser();
  const canSubscribe = Boolean(authUser?.id);
  // A delivered, cancelled or refunded order does not change any more: no polling.
  const shouldPoll =
    !canSubscribe && Boolean(result.success && result.data) && !FINAL_ORDER_STATUSES.has(result.data?.order.status ?? "");

  if (!result.success || !result.data) {
    if (result.error === "Order not found" && authUser?.id) {
      redirect({ href: "/profile/orders", locale });
    }

    return (
      <div className="text-center py-8 md:py-16 max-w-4xl mx-auto">
        <div className="space-y-3 md:space-y-4">
          <div className="text-4xl md:text-6xl">❌</div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            {t("orderNotFound")}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            {result.error || t("orderNotFoundDescription")}
          </p>
        </div>
      </div>
    );
  }

  // The store's thank-you block (F-25b); null leaves the page as it was, and
  // a failure never breaks the order page.
  const thankYouView = await getStoreThankYouView({
    orderId,
    orderNumber: result.data.order.orderNumber,
    orderStatus: result.data.order.status,
    orderedProductIds: result.data.orderItems.map((item) => item.productId),
    locale,
  }).catch((error: unknown) => {
    console.error("[store-thank-you] failed", (error as Error)?.message);
    return null;
  });

  // "Order again" (F-01e): the order's owner, on the store it was placed on.
  const canReorder = await reorderAccess(orderId)
    .then(Boolean)
    .catch(() => false);

  return (
    <>
      {canSubscribe && <OrderRealtime orderId={orderId} />}
      {shouldPoll && <OrderPolling enabled />}
      <OrderConfirmationContent
        data={result.data}
        locale={locale}
        autoExpandReviewItemId={autoExpandReviewItemId}
        accessToken={accessToken && verifyOrderAccess(orderId, accessToken) ? accessToken : undefined}
        supportHref={await getSupportHref()}
        {...(thankYouView && { thankYou: <StoreThankYou view={thankYouView} locale={locale} /> })}
        {...(canReorder && { reorder: <OrderReorderButton orderId={orderId} /> })}
      />
    </>
  );
}
