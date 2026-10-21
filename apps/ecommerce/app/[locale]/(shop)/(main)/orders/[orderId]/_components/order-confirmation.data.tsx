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

/** "Need help?" goes to the store on its own website, to Tallaby elsewhere. */
async function getSupportHref(): Promise<string | null> {
  const subdomain = await getRequestStoreSubdomain();
  if (!subdomain) return CONTACT.whatsapp;
  const store = await getStorefrontBySubdomain(subdomain);
  const whatsapp = store?.supportWhatsapp ? whatsappNumber(store.supportWhatsapp) : null;
  if (whatsapp) return `https://wa.me/${whatsapp}`;
  return store?.supportPhone ? `tel:${store.supportPhone.replace(/[^d+]/g, "")}` : null;
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
  const shouldPoll = !canSubscribe && Boolean(result.success && result.data);

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
      />
    </>
  );
}
