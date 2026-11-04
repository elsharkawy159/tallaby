import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  Gem,
  Gift,
  HandCoins,
  MessageCircleQuestion,
  PackageX,
  ShoppingBag,
  Sparkles,
  Star,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import type { SellerNotificationType } from "@workspace/lib/notifications";
import type { Tone } from "@/components/seller-ui/layout";

/** Each notification's icon and colour in the bell. Exhaustive: a new type fails the build until it gets one. */
export const NOTIFICATION_LOOK: Record<SellerNotificationType, { icon: LucideIcon; tone: Tone }> = {
  order_created: { icon: ShoppingBag, tone: "primary" },
  top_up_approved: { icon: Wallet, tone: "success" },
  top_up_rejected: { icon: Wallet, tone: "danger" },
  question_received: { icon: MessageCircleQuestion, tone: "info" },
  review_received: { icon: Star, tone: "accent" },
  carrier_shipment_failed: { icon: PackageX, tone: "danger" },
  carrier_needs_attention: { icon: TriangleAlert, tone: "accent" },
  referral_commission_earned: { icon: HandCoins, tone: "success" },
  referral_payout_paid: { icon: HandCoins, tone: "success" },
  referral_payout_rejected: { icon: HandCoins, tone: "danger" },
  welcome_gift_granted: { icon: Gift, tone: "success" },
  welcome_gift_expiring: { icon: Gift, tone: "accent" },
  welcome_gift_expired: { icon: Gift, tone: "neutral" },
  low_stock: { icon: PackageX, tone: "accent" },
  admin_message: { icon: Sparkles, tone: "solid" },
  plan_renewed: { icon: Gem, tone: "success" },
  plan_renewal_failed: { icon: Gem, tone: "danger" },
  plan_ended: { icon: Gem, tone: "accent" },
  app_renewed: { icon: AppWindow, tone: "success" },
  app_renewal_failed: { icon: AppWindow, tone: "danger" },
  app_ended: { icon: AppWindow, tone: "accent" },
};

export type NotificationDay = "today" | "yesterday" | "older";

/** Which heading a notification falls under, by the viewer's own calendar day. */
export function notificationDay(createdAt: string, now: Date = new Date()): NotificationDay {
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(new Date(createdAt))) / 86_400_000);
  if (days <= 0) return "today";
  return days === 1 ? "yesterday" : "older";
}
